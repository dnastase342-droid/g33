import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { applicationsOpen } from "@/lib/capacity";
import { ApplyDialog } from "./ApplyDialog";

/**
 * Server wrapper for the application pop-up: checks capacity per request and
 * renders the dialog in "closed" mode when the community is full.
 * Rendered from the root layout inside <Suspense>.
 */
export async function ApplyDialogWithCapacity() {
  await connection();
  let open = true;
  try {
    open = await applicationsOpen(await getDb());
  } catch {
    // DB unreachable: the API refuses safely; keep the form available.
    open = true;
  }
  return <ApplyDialog applicationsOpen={open} />;
}
