import type { PlanId } from "@/config/plans";

export const OPEN_APPLY_EVENT = "g33-open-apply";
export const SELECT_PLAN_EVENT = "g33-select-plan";

/** Opens the application pop-up from anywhere (optionally preselecting a plan). */
export function openApplyDialog(planId?: PlanId) {
  // Always dispatch so a generic "Aplică" clears a plan chosen earlier.
  window.dispatchEvent(new CustomEvent<PlanId | undefined>(SELECT_PLAN_EVENT, { detail: planId }));
  window.dispatchEvent(new Event(OPEN_APPLY_EVENT));
}
