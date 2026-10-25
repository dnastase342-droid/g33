import "server-only";
import type { Queryable } from "./db";

/**
 * Records a workflow event. `details` must never contain answers, contact
 * data or secrets — only identifiers and status values.
 */
export async function audit(
  db: Queryable,
  actor: string,
  action: string,
  applicationId: string | null,
  details?: Record<string, string | number | boolean | null>,
) {
  await db.query(
    "INSERT INTO audit_log (actor, action, application_id, details) VALUES ($1, $2, $3, $4)",
    [actor, action, applicationId, details ? JSON.stringify(details) : null],
  );
}
