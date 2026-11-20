import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatSoles, type Slice } from "@/lib/finance";

export function BalanceDonut({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: Slice[];
  centerLabel: string;
  centerValue: number;
}) {
  const data = slices.length ? slices : [{ id: "empty", label: "Sin datos", color: "var(--muted)", value: 1 }];
  const empty = slices.length === 0;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="66%"
            outerRadius="100%"
            paddingAngle={empty ? 0 : 2}
            cornerRadius={8}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive
          >
            {data.map((s) => (
              <Cell key={s.id} fill={s.color} />
            ))}
          </Pie>
          {!empty && (
            <Tooltip
              formatter={(v: number, name: string) => [formatSoles(v), name]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 13,
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {centerLabel}
        </span>
        <span
          className={`tabular font-display text-2xl font-extrabold md:text-3xl ${centerValue < 0 ? "text-destructive" : "text-foreground"}`}
        >
          {formatSoles(centerValue)}
        </span>
      </div>
    </div>
  );
}