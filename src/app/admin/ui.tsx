"use client";

import { useActionState, useState } from "react";
import { changeStatusAction, issueLinkAction, loginAction, logoutAction, revokeLinksAction, type ActionState } from "./actions";

const initial: ActionState = {};

function Feedback({ state }: { state: ActionState }) {
  return (
    <div aria-live="polite">
      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="mt-3 text-sm text-ok">{state.ok}</p>}
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="field-label">
          Parolă
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="field" required />
      </div>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Se verifică…" : "Intră"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="btn btn-ghost !min-h-10 text-sm">Ieșire</button>
    </form>
  );
}

export function StatusForm({ id, options }: { id: string; options: string[] }) {
  const [state, action, pending] = useActionState(changeStatusAction, initial);
  if (options.length === 0) return <p className="text-sm text-muted">Statusul este gestionat automat (plată / activare).</p>;
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="status" className="field-label">
          Schimbă statusul
        </label>
        <select id="status" name="status" className="field !w-auto" defaultValue={options[0]}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <button className="btn btn-ghost" disabled={pending}>
        Salvează
      </button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function IssueLinkForm({ id, plans, defaultPlan }: { id: string; plans: { id: string; label: string; ready: boolean }[]; defaultPlan: string }) {
  const [state, action, pending] = useActionState(issueLinkAction, initial);
  const [copied, setCopied] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="planId" className="field-label">
            Plan
          </label>
          <select id="planId" name="planId" className="field !w-auto" defaultValue={defaultPlan}>
            {plans.map((p) => (
              <option key={p.id} value={p.id} disabled={!p.ready}>
                {p.label}
                {p.ready ? "" : " — neconfigurat"}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Se generează…" : "Generează link de plată"}
        </button>
      </div>
      <Feedback state={state} />
      {state.link && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-volt/40 p-3">
          <code className="break-all text-xs">{state.link}</code>
          <button
            type="button"
            className="btn btn-ghost !min-h-9 !px-3 text-xs"
            onClick={() => navigator.clipboard.writeText(state.link!).then(() => setCopied(true))}
          >
            {copied ? "Copiat" : "Copiază"}
          </button>
        </div>
      )}
    </form>
  );
}

export function RevokeLinksForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeLinksAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost !min-h-10 text-sm" disabled={pending}>
        Revocă linkurile active
      </button>
      <Feedback state={state} />
    </form>
  );
}
