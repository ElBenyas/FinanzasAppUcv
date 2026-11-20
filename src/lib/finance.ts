export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string | null;
  occurred_on: string; // YYYY-MM-DD
}

export interface CategoryDef {
  id: string;
  label: string;
  /** CSS variable holding the category color */
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: "comida", label: "Comida", color: "var(--cat-comida)" },
  { id: "transporte", label: "Transporte", color: "var(--cat-transporte)" },
  { id: "estudios", label: "Estudios y materiales", color: "var(--cat-estudios)" },
  { id: "vivienda", label: "Vivienda", color: "var(--cat-vivienda)" },
  { id: "servicios", label: "Internet y celular", color: "var(--cat-servicios)" },
  { id: "entretenimiento", label: "Entretenimiento", color: "var(--cat-entretenimiento)" },
  { id: "salud", label: "Salud", color: "var(--cat-salud)" },
  { id: "ropa", label: "Ropa", color: "var(--cat-ropa)" },
  { id: "otros", label: "Otros", color: "var(--cat-otros)" },
];

export const SAVINGS_CATEGORY: CategoryDef = {
  id: "ahorro",
  label: "Ahorro",
  color: "var(--cat-ahorro)",
};

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: "mesada", label: "Mesada / familia", color: "var(--cat-disponible)" },
  { id: "trabajo", label: "Trabajo", color: "var(--cat-disponible)" },
  { id: "beca", label: "Beca", color: "var(--cat-disponible)" },
  { id: "otros_ingresos", label: "Otros ingresos", color: "var(--cat-disponible)" },
];

export const AVAILABLE_SLICE: CategoryDef = {
  id: "disponible",
  label: "Disponible",
  color: "var(--cat-disponible)",
};

const ALL = [...EXPENSE_CATEGORIES, SAVINGS_CATEGORY, ...INCOME_CATEGORIES];

export function getCategory(id: string): CategoryDef {
  return ALL.find((c) => c.id === id) ?? { id, label: id, color: "var(--cat-otros)" };
}

export type Period = "month" | "all";

export function isInPeriod(date: string, period: Period, today: Date = new Date()): boolean {
  if (period === "all") return true;
  const [y = 0, m = 0] = date.split("-").map(Number);
  return y === today.getFullYear() && m === today.getMonth() + 1;
}

export interface Slice {
  id: string;
  label: string;
  color: string;
  value: number;
}

export interface Summary {
  income: number;
  expenses: number; // excludes savings
  savings: number;
  available: number; // income - expenses - savings (can be negative)
  expenseSlices: Slice[]; // per category incl. savings, sorted desc, only > 0
  chartSlices: Slice[]; // expenseSlices + "Disponible" when positive
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(
  txs: Transaction[],
  period: Period = "all",
  today: Date = new Date(),
): Summary {
  let income = 0;
  let expenses = 0;
  let savings = 0;
  const byCat = new Map<string, number>();

  for (const t of txs) {
    if (!isInPeriod(t.occurred_on, period, today)) continue;
    const amount = Number(t.amount);
    if (t.type === "income") {
      income += amount;
      continue;
    }
    if (t.category === SAVINGS_CATEGORY.id) savings += amount;
    else expenses += amount;
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + amount);
  }

  const expenseSlices: Slice[] = [...byCat.entries()]
    .filter(([, v]) => v > 0)
    .map(([id, value]) => {
      const c = getCategory(id);
      return { id, label: c.label, color: c.color, value: round2(value) };
    })
    .sort((a, b) => b.value - a.value);

  const available = round2(income - expenses - savings);
  const chartSlices =
    available > 0
      ? [{ ...AVAILABLE_SLICE, value: available }, ...expenseSlices]
      : expenseSlices;

  return {
    income: round2(income),
    expenses: round2(expenses),
    savings: round2(savings),
    available,
    expenseSlices,
    chartSlices,
  };
}

export function formatSoles(n: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(n);
}

export function todayISO(today: Date = new Date()): string {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole days from today until the due date (negative = overdue). */
export function daysUntil(dueDate: string, today: Date = new Date()): number {
  const [y = 0, m = 1, d = 1] = dueDate.split("-").map(Number);
  const due = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due - now) / 86_400_000);
}

export type ReminderStatus = "paid" | "overdue" | "soon" | "upcoming";

/** "soon" = due within the next 3 days (today included). */
export function reminderStatus(
  r: { due_date: string; is_paid: boolean },
  today: Date = new Date(),
): ReminderStatus {
  if (r.is_paid) return "paid";
  const days = daysUntil(r.due_date, today);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "upcoming";
}

export function goalProgress(saved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((saved / target) * 100));
}