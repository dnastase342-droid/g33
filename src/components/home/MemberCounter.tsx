import { connection } from "next/server";
import { getPublicCapacity } from "@/lib/capacity";

/** Confirmed members vs. capacity. Rendered per request (inside <Suspense>). */
export async function MemberCounter() {
  await connection();
  const c = await getPublicCapacity();
  return <CounterView confirmed={c.confirmed} max={c.max} />;
}

export function CounterView({ confirmed, max, pending = false }: { confirmed: number; max: number; pending?: boolean }) {
  const clamped = Math.min(confirmed, max);
  const pct = max > 0 ? Math.round((clamped / max) * 100) : 0;
  const left = Math.max(0, max - clamped);
  return (
    <div className="card w-full max-w-md p-5 text-left" aria-busy={pending}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Membri confirmați</p>
        <p className="font-display text-sm font-bold text-volt">{pct}%</p>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        {clamped} <span className="text-muted">/ {max}</span>
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-label={`${clamped} din ${max} locuri ocupate`}
      >
        <div
          className="h-full rounded-full bg-volt shadow-[0_0_16px_rgba(245,228,0,0.7)] transition-[width] duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        {left > 0 ? `Mai sunt ${left} locuri disponibile. Capacitatea comunității este limitată la ${max} de membri.` : "Comunitatea a atins capacitatea maximă."}
      </p>
    </div>
  );
}
