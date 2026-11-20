import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { CategoryIcon } from "@/components/app/CategoryBadge";
import { TransactionDialog } from "@/components/app/Dialogs";
import {
  EXPENSE_CATEGORIES,
  SAVINGS_CATEGORY,
  formatSoles,
  getCategory,
  summarize,
} from "@/lib/finance";
import { transactionsQuery, useDeleteTransaction } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/movimientos")({
  head: () => ({
    meta: [
      { title: "Gastos e ingresos — Alcancía" },
      { name: "description", content: "Registra y revisa tus gastos por categoría." },
      { property: "og:title", content: "Gastos e ingresos — Alcancía" },
      { property: "og:description", content: "Registra y revisa tus gastos por categoría." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery),
  component: Movimientos,
});

type Filter = "all" | "income" | "expense" | string;

function Movimientos() {
  const { data: txs } = useSuspenseQuery(transactionsQuery);
  const del = useDeleteTransaction();
  const [filter, setFilter] = useState<Filter>("all");

  const monthSummary = useMemo(() => summarize(txs, "month"), [txs]);
  const filtered = txs.filter((t) => {
    if (filter === "all") return true;
    if (filter === "income" || filter === "expense") return t.type === filter;
    return t.type === "expense" && t.category === filter;
  });

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const list = map.get(t.occurred_on) ?? [];
      list.push(t);
      map.set(t.occurred_on, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const maxCat = Math.max(1, ...monthSummary.expenseSlices.map((s) => s.value));

  return (
    <div className="animate-rise">
      <PageHeader
        title="Gastos e ingresos"
        subtitle="Todo lo que entra y sale, ordenado por categoría."
        action={
          <TransactionDialog
            trigger={
              <Button size="lg" variant="lime">
                <Plus /> Nuevo movimiento
              </Button>
            }
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
          <h2 className="text-lg font-bold">Este mes por categoría</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Total gastado:{" "}
            <span className="tabular font-semibold text-foreground">
              {formatSoles(monthSummary.expenses + monthSummary.savings)}
            </span>
          </p>
          {monthSummary.expenseSlices.length === 0 ? (
            <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              Aún no registras gastos este mes.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {monthSummary.expenseSlices.map((s) => (
                <li key={s.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="tabular font-semibold">{formatSoles(s.value)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(s.value / maxCat) * 100}%`, background: s.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 lg:col-span-2">
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {[
              { id: "all", label: "Todos" },
              { id: "expense", label: "Gastos" },
              { id: "income", label: "Ingresos" },
              ...[...EXPENSE_CATEGORIES, SAVINGS_CATEGORY].map((c) => ({ id: c.id, label: c.label })),
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}
              >
                {!["all", "expense", "income"].includes(f.id) && (
                  <span className="size-2.5 rounded-full" style={{ background: getCategory(f.id).color }} />
                )}
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-2 shadow-soft md:p-4">
            {groups.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No hay movimientos para mostrar.
              </p>
            ) : (
              groups.map(([date, items]) => (
                <div key={date} className="mb-2">
                  <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <ul>
                    {items.map((t) => (
                      <li
                        key={t.id}
                        className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-muted/60"
                      >
                        <CategoryIcon id={t.category} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {t.description || getCategory(t.category).label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getCategory(t.category).label}
                          </p>
                        </div>
                        <span
                          className={`tabular text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}
                        >
                          {t.type === "income" ? "+" : "−"}
                          {formatSoles(t.amount)}
                        </span>
                        <button
                          onClick={() => del.mutate(t.id)}
                          aria-label="Eliminar movimiento"
                          className="grid size-8 place-items-center rounded-lg text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}