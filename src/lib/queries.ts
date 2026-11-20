import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, TxType } from "./finance";
import { todayISO } from "./finance";

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
}

export interface PaymentReminder {
  id: string;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  is_paid: boolean;
}

export const transactionsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,type,amount,category,description,occurred_on")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount), type: t.type as TxType }));
  },
});

export const goalsQuery = queryOptions({
  queryKey: ["savings_goals"],
  queryFn: async (): Promise<SavingsGoal[]> => {
    const { data, error } = await supabase
      .from("savings_goals")
      .select("id,name,target_amount,saved_amount,deadline")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((g) => ({
      ...g,
      target_amount: Number(g.target_amount),
      saved_amount: Number(g.saved_amount),
    }));
  },
});

export const remindersQuery = queryOptions({
  queryKey: ["payment_reminders"],
  queryFn: async (): Promise<PaymentReminder[]> => {
    const { data, error } = await supabase
      .from("payment_reminders")
      .select("id,title,amount,category,due_date,is_paid")
      .order("is_paid", { ascending: true })
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", auth.user.id)
      .maybeSingle();
    return {
      email: auth.user.email ?? "",
      name: data?.display_name || auth.user.email?.split("@")[0] || "Estudiante",
    };
  },
});

function onError(e: unknown) {
  toast.error("No se pudo guardar", {
    description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      type: TxType;
      amount: number;
      category: string;
      description: string | null;
      occurred_on: string;
    }) => {
      const { error } = await supabase.from("transactions").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    onError,
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    onError,
  });
}

export function useAddGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; target_amount: number; deadline: string | null }) => {
      const { error } = await supabase.from("savings_goals").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals"] }),
    onError,
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals"] }),
    onError,
  });
}

/** Adds money to a goal and records it as an "ahorro" movement so the balance reflects it. */
export function useContributeToGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goal, amount }: { goal: SavingsGoal; amount: number }) => {
      const { error } = await supabase
        .from("savings_goals")
        .update({ saved_amount: goal.saved_amount + amount })
        .eq("id", goal.id);
      if (error) throw error;
      const { error: txError } = await supabase.from("transactions").insert({
        type: "expense",
        amount,
        category: "ahorro",
        description: `Ahorro: ${goal.name}`,
        occurred_on: todayISO(),
      });
      if (txError) throw txError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError,
  });
}

export function useAddReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      amount: number;
      category: string;
      due_date: string;
    }) => {
      const { error } = await supabase.from("payment_reminders").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment_reminders"] }),
    onError,
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment_reminders"] }),
    onError,
  });
}

/** Marks a reminder as paid and records the payment as an expense in its category. */
export function usePayReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: PaymentReminder) => {
      const { error } = await supabase
        .from("payment_reminders")
        .update({ is_paid: true })
        .eq("id", r.id);
      if (error) throw error;
      const { error: txError } = await supabase.from("transactions").insert({
        type: "expense",
        amount: r.amount,
        category: r.category,
        description: r.title,
        occurred_on: todayISO(),
      });
      if (txError) throw txError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_reminders"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Pago registrado como gasto");
    },
    onError,
  });
}