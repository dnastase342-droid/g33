// Applies the (idempotent) schema to DATABASE_URL. Usage: npm run db:migrate
import { getDb } from "../src/lib/db";

await getDb();
console.log(process.env.DATABASE_URL ? "✔ Schema applied to DATABASE_URL" : "✔ Schema applied to local embedded database (.data/pglite)");
process.exit(0);
