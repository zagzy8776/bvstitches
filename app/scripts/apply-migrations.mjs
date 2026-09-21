#!/usr/bin/env node
/**
 * Applies every SQL file in db/migrations/ (lexical order) to the Neon database
 * in DATABASE_URL. Additive-only, so re-running it is safe.
 *
 *   node --env-file=.env scripts/apply-migrations.mjs
 *
 * The Neon HTTP driver runs ONE statement per request, so each migration file is
 * split on `;` before being sent. Keep migration files free of semicolons inside
 * string literals or function bodies, or the split will cut them in half.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "..", "db", "migrations");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Run: node --env-file=.env scripts/apply-migrations.mjs",
  );
  process.exit(1);
}

/** Drop `--` comment lines, then split the file into single statements. */
function splitStatements(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function describe(statement) {
  return statement.replace(/\s+/g, " ").slice(0, 72);
}

const sql = neon(databaseUrl);

const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
if (files.length === 0) {
  console.log(`No .sql migrations found in ${migrationsDir}`);
  process.exit(0);
}

let applied = 0;

for (const file of files) {
  const source = await readFile(path.join(migrationsDir, file), "utf8");
  const statements = splitStatements(source);
  console.log(`\n${file}  (${statements.length} statement${statements.length === 1 ? "" : "s"})`);

  for (const [index, statement] of statements.entries()) {
    const label = `  ${index + 1}/${statements.length}  ${describe(statement)}`;
    try {
      await sql.query(statement);
      console.log(`ok   ${label}`);
      applied += 1;
    } catch (error) {
      console.error(`FAIL ${label}`);
      console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  }
}

const tables = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;

console.log(`\nApplied ${applied} statement(s).`);
console.log(
  `Public tables: ${tables.map((row) => row.table_name).join(", ") || "(none)"}`,
);
