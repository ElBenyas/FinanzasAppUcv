import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlarmClock, BellRing, Check, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { CategoryIcon } from "@/components/app/CategoryBadge";
import { ReminderDialog } from "@/components/app/Dialogs";
import { daysUntil, formatSoles, getCategory, reminderStatus, type ReminderStatus } from "@/lib/finance";
import {
  remindersQuery,
  useDeleteReminder,
  usePayReminder,
  type PaymentReminder,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/recordatorios")({
  head: () => ({
    meta: [
      { title: "Recordatorios de pago — Alcancía" },
      { name: "description", content: "No vuelvas a olvidar la pensión, el alquiler o el celular." },
      { property: "og:title", content: "Recordatorios de pago — Alcancía" },
      { property: "og:description", content: "No vuelvas a olvidar la pensión, el alquiler o el celular." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(remindersQuery),
  component: Recordatorios,
});

const STATUS_STYLE: Record<ReminderStatus, { label: string; cls: string }> = {
  overdue: { label: "Vencido", cls: "bg-destructive/12 text-destructive" },
  soon: { label: "Pronto", cls: "bg-warning/30 text-warning-foreground" },
  upcoming: { label: "Pendiente", cls: "bg-muted text-muted-foreground" },
  paid: { label: "Pagado", cls: "bg-success/15 text-success" },
};

function Recordatorios() {
  const { data: reminders } = useSuspenseQuery(remindersQuery);
  const pending = reminders.filter((r) => !r.is_paid);
  const paid = reminders.filter((r) => r.is_paid);
  const pendingTotal = pending.reduce((a, r) => a + r.amount, 0);
  const urgent = pending.filter((r) => reminderStatus(r) !== "upcoming").length;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Recordatorios"
        subtitle="Tus pagos pendientes, ordenados por fecha."
        action={
          <ReminderDialog
            trigger={
              <Button size="lg" variant="lime">
                <Plus /> Nuevo recordatorio
              </Button>
            }
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-hero p-5 text-primary-foreground shadow-lift">
          <p className="text-sm font-semibold opacity-80">Por pagar</p>
          <p className="tabular font-display text-3xl font-extrabold">{formatSoles(pendingTotal)}</p>
          <p className="text-sm opacity-75">{pending.length} pagos pendientes</p>
        </div>
        <div
          className={`flex items-center gap-4 rounded-3xl p-5 shadow-soft ${urgent ? "bg-warning text-warning-foreground" : "border border-border bg-card"}`}
        >
          <BellRing className="size-8 shrink-0" />
          <p className="font-semibold">
            {urgent
              ? `${urgent} ${urgent === 1 ? "pago vence" : "pagos vencen"} en los próximos 3 días o ya ${urgent === 1 ? "venció" : "vencieron"}.`
              : "Todo en orden. No tienes pagos urgentes."}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-2 shadow-soft md:p-4">
        {pending.length === 0 ? (
          <div className="p-8 text-center">
            <AlarmClock className="mx-auto size-10 text-primary" />
            <p className="mt-2 font-semibold">Sin pagos pendientes</p>
            <p className="text-sm text-muted-foreground">
              Agrega la pensión, el alquiler o el plan del celular para no olvidarlos.
            </p>
          </div>
        ) : (
          <ul>
            {pending.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      {paid.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Pagados</h2>
          <ul className="rounded-3xl border border-border bg-card p-2 opacity-80 md:p-4">
            {paid.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReminderRow({ r }: { r: PaymentReminder }) {
  const pay = usePayReminder();
  const del = useDeleteReminder();
  const status = reminderStatus(r);
  const days = daysUntil(r.due_date);
  const s = STATUS_STYLE[status];

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted/50 sm:flex-nowrap">
      <CategoryIcon id={r.category} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${r.is_paid ? "line-through" : ""}`}>{r.title}</p>
        <p className="text-xs text-muted-foreground">
          {getCategory(r.category).label} · {format(parseISO(r.due_date), "d 'de' MMMM", { locale: es })}
          {!r.is_paid && days >= 0 && ` · ${days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`}`}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
      <span className="tabular w-24 text-right font-bold">{formatSoles(r.amount)}</span>
      <div className="flex gap-1">
        {!r.is_paid && (
          <Button size="sm" variant="soft" onClick={() => pay.mutate(r)} disabled={pay.isPending}>
            <Check /> Pagado
          </Button>
        )}
        <button
          onClick={() => del.mutate(r.id)}
          aria-label="Eliminar recordatorio"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
