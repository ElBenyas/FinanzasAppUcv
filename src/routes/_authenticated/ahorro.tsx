import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, PiggyBank, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/app/AppShell";
import { GoalDialog } from "@/components/app/Dialogs";
import { daysUntil, formatSoles, goalProgress } from "@/lib/finance";
import {
  goalsQuery,
  useContributeToGoal,
  useDeleteGoal,
  type SavingsGoal,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ahorro")({
  head: () => ({
    meta: [
      { title: "Metas de ahorro — Alcancía" },
      { name: "description", content: "Ahorra para lo que más quieres con metas claras." },
      { property: "og:title", content: "Metas de ahorro — Alcancía" },
      { property: "og:description", content: "Ahorra para lo que más quieres con metas claras." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(goalsQuery),
  component: Ahorro,
});

function Ahorro() {
  const { data: goals } = useSuspenseQuery(goalsQuery);
  const totalSaved = goals.reduce((a, g) => a + g.saved_amount, 0);
  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Metas de ahorro"
        subtitle="Pon un objetivo y ve llenando tu alcancía."
        action={
          <GoalDialog
            trigger={
              <Button size="lg" variant="lime">
                <Plus /> Nueva meta
              </Button>
            }
          />
        }
      />

      <section className="mb-6 flex flex-col gap-4 rounded-3xl bg-hero p-6 text-primary-foreground shadow-lift md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest opacity-75">Total ahorrado</p>
          <p className="tabular font-display text-4xl font-extrabold md:text-5xl">
            {formatSoles(totalSaved)}
          </p>
        </div>
        {totalTarget > 0 && (
          <div className="w-full md:max-w-xs">
            <div className="mb-2 flex justify-between text-sm opacity-90">
              <span>Progreso general</span>
              <span className="font-bold">{goalProgress(totalSaved, totalTarget)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-primary-foreground/15">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: `${goalProgress(totalSaved, totalTarget)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {goals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <PiggyBank className="mx-auto size-12 text-primary" />
          <h2 className="mt-3 text-xl font-bold">Aún no tienes metas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Una laptop, un viaje, el fondo de emergencia… ¡empieza hoy!
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const [amount, setAmount] = useState("");
  const contribute = useContributeToGoal();
  const del = useDeleteGoal();
  const pct = goalProgress(goal.saved_amount, goal.target_amount);
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const days = goal.deadline ? daysUntil(goal.deadline) : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) { toast.error("Ingresa un monto válido"); return; }
    await contribute.mutateAsync({ goal, amount: Math.round(n * 100) / 100 });
    toast.success(`Abonaste ${formatSoles(n)} a ${goal.name}`);
    setAmount("");
  }

  return (
    <li className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{goal.name}</h3>
          {goal.deadline && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {format(parseISO(goal.deadline), "d MMM yyyy", { locale: es })}
              {days !== null && days >= 0 && pct < 100 && ` · faltan ${days} días`}
            </p>
          )}
        </div>
        <button
          onClick={() => del.mutate(goal.id)}
          aria-label="Eliminar meta"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <p className="tabular font-display text-2xl font-extrabold">{formatSoles(goal.saved_amount)}</p>
        <p className="font-display text-xl font-bold text-primary">{pct}%</p>
      </div>
      <Progress value={pct} className="mt-2 h-3 bg-secondary" />
      <p className="tabular mt-2 text-xs text-muted-foreground">
        {pct >= 100 ? "¡Meta cumplida! 🎉" : `Te faltan ${formatSoles(remaining)} de ${formatSoles(goal.target_amount)}`}
      </p>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <Input
          inputMode="decimal"
          placeholder="Monto a abonar"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="tabular h-10 rounded-full"
        />
        <Button type="submit" variant="default" disabled={contribute.isPending}>
          Abonar
        </Button>
      </form>
    </li>
  );
}
