// Verifies the Google Sheets configuration and writes the header row if the tab is empty.
// Usage: npm run sheets:setup   (reads .env.local)
import { ensureHeaderRow, getSheetsConfig } from "../src/lib/sheets";

const cfg = getSheetsConfig();
console.log(`Spreadsheet: ${cfg.spreadsheetId} · tab: "${cfg.sheetName}" · account: ${cfg.clientEmail}`);
const result = await ensureHeaderRow();
if (result === "created") console.log("✔ Header row written.");
else if (result === "exists") console.log("✔ Header row already present and correct.");
else {
  console.error("✖ Row 1 contains different headers. Fix the tab manually (see README) and rerun.");
  process.exit(1);
}
