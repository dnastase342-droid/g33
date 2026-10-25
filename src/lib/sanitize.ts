/**
 * Spreadsheet formula-injection protection (OWASP "CSV injection").
 *
 * Values are already written with valueInputOption=RAW, so Google Sheets
 * stores them as plain text. This additional step protects people who later
 * export the sheet to CSV/XLSX and open it in another program: any value
 * starting with a formula trigger is prefixed with an apostrophe.
 */
const FORMULA_TRIGGERS = /^[=+\-@\t\r＝＋－＠]/;

export function neutralizeFormula(value: string): string {
  // Also strip control characters that have no place in a cell.
  const clean = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return FORMULA_TRIGGERS.test(clean) ? `'${clean}` : clean;
}
