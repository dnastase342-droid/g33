"use client";

import type { PlanId } from "@/config/plans";
import { openApplyDialog } from "@/components/apply/events";

/** Opens the application pop-up with the plan preselected. */
export function PlanCta({ planId, className, children }: { planId: PlanId; className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => openApplyDialog(planId)}>
      {children}
    </button>
  );
}
