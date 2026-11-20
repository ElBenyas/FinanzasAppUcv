import { getCategory } from "@/lib/finance";

export function CategoryDot({ id, className = "size-3" }: { id: string; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ background: getCategory(id).color }}
    />
  );
}

export function CategoryIcon({ id }: { id: string }) {
  const c = getCategory(id);
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-foreground"
      style={{ background: `color-mix(in oklab, ${c.color} 28%, transparent)` }}
    >
      {c.label.charAt(0)}
    </span>
  );
}
