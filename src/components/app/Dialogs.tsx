import { useState, type FormEvent, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "./CategoryBadge";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, todayISO, type TxType } from "@/lib/finance";
import { useAddGoal, useAddReminder, useAddTransaction } from "@/lib/queries";
import { toast } from "sonner";

function parseAmount(v: string): number | null {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function CategorySelect({
  value,
  onChange,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  type: TxType;
}) {
  const options = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 rounded-xl">
        <SelectValue placeholder="Elige una categoría" />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              {type === "expense" && <CategoryDot id={c.id} />}
              {c.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TransactionDialog({
  trigger,
  defaultType = "expense",
}: {
  trigger: ReactNode;
  defaultType?: TxType;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const add = useAddTransaction();

  function reset() {
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(todayISO());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = parseAmount(amount);
    if (!n) { toast.error("Ingresa un monto válido"); return; }
    if (!category) { toast.error("Elige una categoría"); return; }
    await add.mutateAsync({
      type,
      amount: n,
      category,
      description: description.trim() || null,
      occurred_on: date,
    });
    toast.success(type === "income" ? "Ingreso registrado" : "Gasto registrado");
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setType(defaultType);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nuevo movimiento</DialogTitle>
          <DialogDescription>Registra lo que gastaste o recibiste.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setType(t);
                  setCategory("");
                }}
                className={`rounded-full py-2 text-sm font-semibold transition ${type === t ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}
              >
                {t === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>
          <Field label="Monto (S/)">
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tabular h-12 rounded-xl font-display text-2xl font-bold"
              autoFocus
            />
          </Field>
          <Field label="Categoría">
            <CategorySelect value={category} onChange={setCategory} type={type} />
          </Field>
          <Field label="Descripción (opcional)">
            <Input
              placeholder={type === "expense" ? "Ej. Menú del comedor" : "Ej. Mesada de noviembre"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 rounded-xl"
              maxLength={120}
            />
          </Field>
          <Field label="Fecha">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
          </Field>
          <Button type="submit" size="lg" disabled={add.isPending}>
            {add.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const add = useAddGoal();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = parseAmount(target);
    if (!name.trim()) { toast.error("Ponle un nombre a tu meta"); return; }
    if (!n) { toast.error("Ingresa un monto objetivo válido"); return; }
    await add.mutateAsync({ name: name.trim(), target_amount: n, deadline: deadline || null });
    toast.success("Meta creada");
    setName("");
    setTarget("");
    setDeadline("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nueva meta de ahorro</DialogTitle>
          <DialogDescription>¿Para qué estás ahorrando?</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Nombre">
            <Input
              placeholder="Ej. Laptop nueva, viaje de fin de ciclo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
              maxLength={80}
            />
          </Field>
          <Field label="Monto objetivo (S/)">
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="tabular h-11 rounded-xl"
            />
          </Field>
          <Field label="Fecha límite (opcional)">
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
          <Button type="submit" size="lg" disabled={add.isPending}>
            {add.isPending ? "Guardando…" : "Crear meta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReminderDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [due, setDue] = useState(todayISO());
  const add = useAddReminder();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = parseAmount(amount);
    if (!title.trim()) { toast.error("Escribe qué tienes que pagar"); return; }
    if (!n) { toast.error("Ingresa un monto válido"); return; }
    if (!category) { toast.error("Elige una categoría"); return; }
    await add.mutateAsync({ title: title.trim(), amount: n, category, due_date: due });
    toast.success("Recordatorio creado");
    setTitle("");
    setAmount("");
    setCategory("");
    setDue(todayISO());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nuevo recordatorio</DialogTitle>
          <DialogDescription>Te avisaremos cuando se acerque la fecha.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="¿Qué tienes que pagar?">
            <Input
              placeholder="Ej. Pensión de la universidad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl"
              maxLength={80}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto (S/)">
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular h-11 rounded-xl"
              />
            </Field>
            <Field label="Vence el">
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </Field>
          </div>
          <Field label="Categoría">
            <CategorySelect value={category} onChange={setCategory} type="expense" />
          </Field>
          <Button type="submit" size="lg" disabled={add.isPending}>
            {add.isPending ? "Guardando…" : "Crear recordatorio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
