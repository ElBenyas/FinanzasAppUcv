import { describe, expect, it } from "vitest";
import { goalProgress, reminderStatus, summarize, type Transaction } from "./finance";

const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  type: "expense",
  amount: 0,
  category: "otros",
  description: null,
  occurred_on: "2026-11-05",
  ...p,
});

const today = new Date(2026, 10, 13); // 13 Nov 2026

describe("summarize", () => {
  const txs = [
    tx({ type: "income", amount: 1000, category: "mesada" }),
    tx({ amount: 200, category: "comida" }),
    tx({ amount: 50, category: "comida" }),
    tx({ amount: 100, category: "transporte" }),
    tx({ amount: 150, category: "ahorro" }),
    tx({ amount: 999, category: "comida", occurred_on: "2026-10-20" }),
  ];

  it("available balance is income minus expenses minus savings", () => {
    const s = summarize(txs, "month", today);
    expect(s.income).toBe(1000);
    expect(s.expenses).toBe(350);
    expect(s.savings).toBe(150);
    expect(s.available).toBe(500);
  });

  it("groups expenses by category for the chart, with a Disponible slice", () => {
    const s = summarize(txs, "month", today);
    expect(s.chartSlices.map((x) => [x.id, x.value])).toEqual([
      ["disponible", 500],
      ["comida", 250],
      ["ahorro", 150],
      ["transporte", 100],
    ]);
  });

  it("'month' only counts the current month, 'all' counts everything", () => {
    expect(summarize(txs, "all", today).expenses).toBe(1349);
  });

  it("omits the Disponible slice when spending exceeds income", () => {
    const s = summarize([tx({ type: "income", amount: 10 }), tx({ amount: 30 })], "all", today);
    expect(s.available).toBe(-20);
    expect(s.chartSlices.find((x) => x.id === "disponible")).toBeUndefined();
  });
});

describe("reminderStatus", () => {
  it("marks unpaid reminders due within 3 days as soon", () => {
    expect(reminderStatus({ due_date: "2026-11-16", is_paid: false }, today)).toBe("soon");
    expect(reminderStatus({ due_date: "2026-11-17", is_paid: false }, today)).toBe("upcoming");
  });
  it("marks past-due unpaid reminders as overdue", () => {
    expect(reminderStatus({ due_date: "2026-11-12", is_paid: false }, today)).toBe("overdue");
  });
  it("paid wins over any date", () => {
    expect(reminderStatus({ due_date: "2026-11-01", is_paid: true }, today)).toBe("paid");
  });
});

describe("goalProgress", () => {
  it("caps at 100%", () => {
    expect(goalProgress(50, 200)).toBe(25);
    expect(goalProgress(300, 200)).toBe(100);
  });
});