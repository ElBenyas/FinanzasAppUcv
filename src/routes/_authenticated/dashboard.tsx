import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Bell, Plus, Target, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BalanceDonut } from "@/components/app/BalanceDonut";
import { CategoryDot, CategoryIcon } from "@/components/app/CategoryBadge";
import { TransactionDialog } from "@/components/app/Dialogs";
import { PageHeader } from "@/components/app/AppShell";
import {
  daysUntil,
  formatSoles,
  getCategory,
  goalProgress,
  reminderStatus,
  summarize,
  type Period,
} from "@/lib/finance";
import { goalsQuery, profileQuery, remindersQuery, transactionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Inicio — Alcancía" },
      { name: "description", content: "Tu balance, gastos por categoría y próximos pagos." },
      { property: "og:title", content: "Inicio — Alcancía" },
      { property: "og:description", content: "Tu balance, gastos por categoría y próximos pagos." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(transactionsQuery),
      context.queryClient.ensureQueryData(remindersQuery),
      context.queryClient.ensureQueryData(goalsQuery),
      context.queryClient.ensureQueryData(profileQuery),
    ]),
  component: Dashboard,
});

function dueLabel(days: number) {
  if (days < 0) return `Venció hace ${-days} ${-days === 1 ? "día" : "días"}`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `En ${days} días`;
}

function Dashboard() {
  const { data: txs } = useSuspenseQuery(transactionsQuery);
  const { data: reminders } = useSuspenseQuery(remindersQuery);
  const { data: goals } = useSuspenseQuery(goalsQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const [period, setPeriod] = useState<Period>("month");

  const summary = useMemo(() => summarize(txs, period), [txs, period]);
  const totalBalance = useMemo(() => summarize(txs, "all").available, [txs]);
  const pending = reminders.filter((r) => !r.is_paid).slice(0, 4);
  const totalOut = summary.expenses + summary.savings;

  useEffect(() => {
    const urgent = reminders.filter((r) => {
      const s = reminderStatus(r);
      return s === "overdue" || s === "soon";
    });
    if (!urgent.length || sessionStorage.getItem("alcancia-reminded")) return;
    sessionStorage.setItem("alcancia-reminded", "1");
    toast.warning(
      urgent.length === 1
        ? `Tienes un pago próximo: ${urgent[0]?.title}`
        : `Tienes ${urgent.length} pagos próximos o vencidos`,
      { description: "Revísalos en Recordatorios.", duration: 6000 },
    );
  }, [reminders]);

  return (
    <div className="animate-rise">
      <PageHeader
        title={`Hola, ${profile?.name ?? "estudiante"} 👋`}
        subtitle="Así van tus finanzas."
        action={
          <TransactionDialog
            trigger={
              <Button size="lg" variant="lime">
                <Plus /> Registrar movimiento
              </Button>
            }
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Balance donut */}
        <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-7 lg:col-span-3">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Tu balance</h2>
              <p className="text-sm text-muted-foreground">
                Saldo total en cuenta:{" "}
                <span className={`tabular font-semibold ${totalBalance < 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatSoles(totalBalance)}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm">
              {(
                [
                  ["month", "Este mes"],
                  ["all", "Todo"],
                ] as const
              ).map(([p, label]) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-4 py-1.5 font-semibold transition ${period === p ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-center gap-6 md:grid-cols-2">
            <BalanceDonut
              slices={summary.chartSlices}
              centerLabel="Disponible"
              centerValue={summary.available}
            />
            <ul className="space-y-2.5">
              {summary.chartSlices.length === 0 && (
                <li className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                  Aún no hay movimientos en este periodo. Registra tu primer ingreso para empezar.
                </li>
              )}
              {summary.chartSlices.map((s) => {
                const pct = summary.income > 0 ? Math.round((s.value / summary.income) * 100) : null;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="size-3.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 truncate text-sm font-medium">{s.label}</span>
                    {pct !== null && (
                      <span className="text-xs text-muted-foreground tabular">{pct}%</span>
                    )}
                    <span className="tabular w-24 text-right text-sm font-semibold">
                      {formatSoles(s.value)}
                    </span>
                  </li>
                );
              })}
              {summary.available < 0 && (
                <li className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  Gastaste {formatSoles(-summary.available)} más de lo que ingresó.
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
          <StatCard
            icon={<ArrowUpRight />}
            label="Ingresos"
            value={summary.income}
            tone="bg-hero text-primary-foreground"
          />
          <StatCard
            icon={<ArrowDownRight />}
            label="Gastos"
            value={summary.expenses}
            tone="bg-card text-foreground border border-border"
          />
          <StatCard
            icon={<Wallet />}
            label="Ahorrado"
            value={summary.savings}
            tone="bg-lime text-accent-foreground"
          />
        </section>

        {/* Reminders */}
        <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Bell className="size-5" /> Próximos pagos
            </h2>
            <Link to="/recordatorios" className="text-sm font-semibold text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              No tienes pagos pendientes. 🎉
            </p>
          ) : (
            <ul className="space-y-2">
              {pending.map((r) => {
                const status = reminderStatus(r);
                const days = daysUntil(r.due_date);
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                    <CategoryDot id={r.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p
                        className={`text-xs font-medium ${status === "overdue" ? "text-destructive" : status === "soon" ? "text-warning-foreground" : "text-muted-foreground"}`}
                      >
                        {dueLabel(days)}
                      </p>
                    </div>
                    <span className="tabular text-sm font-bold">{formatSoles(r.amount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Goals + recent */}
        <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Target className="size-5" /> Metas de ahorro
            </h2>
            <Link to="/ahorro" className="text-sm font-semibold text-primary hover:underline">
              Ver metas
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              Crea una meta para empezar a ahorrar con propósito.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {goals.slice(0, 4).map((g) => {
                const pct = goalProgress(g.saved_amount, g.target_amount);
                return (
                  <li key={g.id} className="rounded-2xl bg-muted/60 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold">{g.name}</p>
                      <span className="text-sm font-bold text-primary">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-3 h-2.5 bg-secondary" />
                    <p className="tabular mt-2 text-xs text-muted-foreground">
                      {formatSoles(g.saved_amount)} de {formatSoles(g.target_amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="mt-7 mb-3 text-base font-bold">Últimos movimientos</h3>
          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
          ) : (
            <ul className="divide-y divide-border">
              {txs.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <CategoryIcon id={t.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {t.description || getCategory(t.category).label}
                    </p>
                    <p className="text-xs text-muted-foreground">{getCategory(t.category).label}</p>
                  </div>
                  <span
                    className={`tabular text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatSoles(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {totalOut > 0 && summary.expenseSlices[0] && (
            <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
              Tu mayor gasto {period === "month" ? "este mes" : ""} es{" "}
              <strong>{summary.expenseSlices[0].label}</strong> (
              {Math.round((summary.expenseSlices[0].value / totalOut) * 100)}% de lo que salió).
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-3xl p-5 shadow-soft ${tone}`}>
      <span className="grid size-11 place-items-center rounded-2xl bg-background/20 [&_svg]:size-5">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium opacity-80">{label}</p>
        <p className="tabular font-display text-2xl font-extrabold">{formatSoles(value)}</p>
      </div>
    </div>
  );
}
