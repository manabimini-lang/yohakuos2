const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_CONFIG = {
  host: "db.gubxjsbxolcfecyhtjzn.supabase.co",
  port: 6543,
  database: "postgres",
  user: "postgres",
  password: "xZUtN1EAyFmh7RVq",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
};

// Get current DB schema as DDL
async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log("✅ DB接続成功\n");

  // Get all table DDLs using pg_dump-like approach
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tableNames = tables.rows.map(r => r.table_name);
  const ddlParts = [];

  // Build CREATE TABLE statements
  for (const tableName of tableNames) {
    const cols = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const colDefs = cols.rows.map(c => {
      let def = `    "${c.column_name}" `;
      if (c.data_type === "character varying") {
        def += `VARCHAR(${c.character_maximum_length || 255})`;
      } else if (c.data_type === "text") {
        def += "TEXT";
      } else if (c.data_type === "integer") {
        def += "INTEGER";
      } else if (c.data_type === "boolean") {
        def += "BOOLEAN";
      } else if (c.data_type === "timestamp without time zone") {
        def += "TIMESTAMP";
      } else if (c.data_type === "ARRAY") {
        def += "TEXT[]";
      } else if (c.data_type === "bigint") {
        def += "BIGINT";
      } else if (c.data_type === "double precision") {
        def += "DOUBLE PRECISION";
      } else if (c.data_type === "jsonb") {
        def += "JSONB";
      } else if (c.data_type === "uuid") {
        def += "UUID";
      } else {
        def += c.data_type.toUpperCase();
      }
      if (c.is_nullable === "NO") def += " NOT NULL";
      if (c.column_default) {
        def += ` DEFAULT ${c.column_default}`;
      }
      return def;
    });

    // Get primary key
    const pk = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY kcu.ordinal_position
    `, [tableName]);

    if (pk.rows.length > 0) {
      const pkCols = pk.rows.map(r => `"${r.column_name}"`).join(", ");
      colDefs.push(`    PRIMARY KEY (${pkCols})`);
    }

    ddlParts.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (\n${colDefs.join(",\n")}\n);`);
  }

  // Get unique constraints
  const uqs = await client.query(`
    SELECT tc.table_name, tc.constraint_name,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as cols
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'UNIQUE'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  for (const uq of uqs.rows) {
    const cols = uq.cols.split(", ").map(c => `"${c.trim()}"`).join(", ");
    ddlParts.push(`CREATE UNIQUE INDEX IF NOT EXISTS "${uq.constraint_name}" ON "${uq.table_name}" (${cols});`);
  }

  const sql = `-- Prisma Baseline Migration (P3.5)
-- Generated from actual DB state on ${new Date().toISOString()}
-- This migration represents the existing DB schema and is applied as a baseline.

${ddlParts.join("\n\n")}
`;

  const outPath = path.join(process.cwd(), "prisma/migrations/0_init/migration.sql");
  fs.writeFileSync(outPath, sql);
  console.log(`✅ migration.sql 生成完了: ${outPath}`);
  console.log(`  テーブル数: ${tableNames.length}`);

  await client.end();
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
