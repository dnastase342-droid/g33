// Usage: npm run admin:hash -- "a-strong-password"
import { hashPassword } from "../src/lib/admin/password";

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error("Provide a password of at least 12 characters: npm run admin:hash -- \"...\"");
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(pw)}`);
