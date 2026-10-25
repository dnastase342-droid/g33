import Link from "next/link";
import { Suspense } from "react";
import { isAdmin, isAdminConfigured } from "@/lib/admin/auth";
import { listApplications } from "@/lib/admin/service";
import { getCapacity } from "@/lib/capacity";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { isSheetsConfigured } from "@/lib/sheets";
import { isStripeConfigured } from "@/lib/stripe";
import { APPLICATION_STATUSES } from "@/lib/status";
import { getPlan } from "@/config/plans";
import { missingInformation } from "@/config/site";
import { LoginForm, LogoutButton } from "./ui";

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-muted">Se încarcă…</p>}>
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}

const fmt = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "short", timeStyle: "short" }) : "—";

async function AdminContent({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-3xl font-bold">Administrare G33</h1>
        {!isAdminConfigured() && (
          <p className="mt-4 rounded-xl border border-volt/40 p-3 text-sm text-volt-soft">
            Setează ADMIN_PASSWORD_HASH și ADMIN_SESSION_SECRET (vezi README).
          </p>
        )}
        <LoginForm />
      </div>
    );
  }

  const sp = await searchParams;
  const filter = typeof sp.status === "string" && (APPLICATION_STATUSES as readonly string[]).includes(sp.status) ? sp.status : null;
  const db = await getDb();
  const [apps, cap] = await Promise.all([listApplications(filter, db), getCapacity(db)]);

  const checks = [
    { label: "Bază de date", ok: isDatabaseConfigured() && Boolean(process.env.DATABASE_URL), note: process.env.DATABASE_URL ? "" : "bază locală (doar dezvoltare)" },
    { label: "Google Sheets", ok: isSheetsConfigured() },
    { label: "Stripe", ok: isStripeConfigured() },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Administrare G33</h1>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat label="Membri confirmați" value={`${cap.confirmed} / ${cap.max}`} />
        <Stat label="Locuri rezervate (link activ)" value={String(cap.reserved)} />
        <Stat label="Locuri disponibile" value={String(cap.available)} />
        <div className="card p-5 text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-subtle">Integrări</p>
          <ul className="mt-2 space-y-1">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "text-ok" : "text-danger"}>
                {c.ok ? "●" : "○"} {c.label} {c.note && <span className="text-subtle">({c.note})</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <nav aria-label="Filtru status" className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/admin" className={`rounded-full border px-3 py-1 ${!filter ? "border-volt text-volt" : "border-line-2 text-muted"}`}>
          Toate
        </Link>
        {APPLICATION_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${encodeURIComponent(s)}`}
            className={`rounded-full border px-3 py-1 ${filter === s ? "border-volt text-volt" : "border-line-2 text-muted"}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-ink-2 text-xs uppercase tracking-wider text-subtle">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Trimisă</th>
              <th className="p-3">Nume</th>
              <th className="p-3">Plan preferat</th>
              <th className="p-3">Aplicație</th>
              <th className="p-3">Plată</th>
              <th className="p-3">Membru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {apps.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted">
                  Nicio aplicație.
                </td>
              </tr>
            )}
            {apps.map((a) => (
              <tr key={a.id} className="hover:bg-ink-2">
                <td className="p-3 font-mono text-xs">
                  <Link href={`/admin/aplicatii/${a.id}`} className="text-volt underline-offset-4 hover:underline">
                    {a.id}
                  </Link>
                  {!a.sheets_synced_at && <span className="ml-2 text-danger">nesincronizată</span>}
                </td>
                <td className="p-3 text-muted">{fmt(a.submitted_at)}</td>
                <td className="p-3">{a.full_name}</td>
                <td className="p-3 text-muted">{getPlan(a.preferred_plan)?.name ?? "—"}</td>
                <td className="p-3">{a.status}</td>
                <td className="p-3 text-muted">{a.payment_status ?? "—"}</td>
                <td className="p-3 text-muted">{a.membership_status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-10 rounded-2xl border border-line p-5 text-sm">
        <summary className="cursor-pointer font-semibold">Informații care trebuie încă furnizate ({missingInformation.length})</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          {missingInformation.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
