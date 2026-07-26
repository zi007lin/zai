import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
// @ts-expect-error -- sql.js ships untyped ESM entry
import initSqlJs from "sql.js";

const migrationPath = fileURLToPath(
  new URL("../migrations/0001_initial.sql", import.meta.url)
);
const migrationSql = readFileSync(migrationPath, "utf-8");

type SqlJsDatabase = {
  run(sql: string): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
};

let db: SqlJsDatabase;

beforeAll(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(migrationSql);
});

function tableNames(): string[] {
  const rows = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  return rows.length ? rows[0].values.map((v) => String(v[0])) : [];
}

function indexNames(): string[] {
  const rows = db.exec(
    "SELECT name FROM sqlite_master WHERE type='index' ORDER BY name"
  );
  return rows.length ? rows[0].values.map((v) => String(v[0])) : [];
}

function columnNames(table: string): string[] {
  const rows = db.exec(`PRAGMA table_info(${table})`);
  if (!rows.length) return [];
  const nameIdx = rows[0].columns.indexOf("name");
  return rows[0].values.map((v) => String(v[nameIdx]));
}

describe("0001_initial.sql — clean-database migration", () => {
  it("applies without error", () => {
    expect(db).toBeDefined();
  });

  it("creates every baseline table from architecture §4", () => {
    const tables = tableNames();
    expect(tables).toEqual(
      expect.arrayContaining([
        "records",
        "clarify_cycles",
        "halts",
        "digests",
        "anomalies",
        "ingest_cursor",
        "schema_violations",
        "customer_tier_registrations",
        "approval_contexts",
      ])
    );
  });

  it("approval_contexts has the v1.2 columns (zai#116)", () => {
    const columns = columnNames("approval_contexts");
    expect(columns).toEqual(
      expect.arrayContaining([
        "context_id",
        "action",
        "target_repo",
        "target_number",
        "requester_identity",
        "requester_github_user",
        "approver_identity",
        "approver_logto_roles_json",
        "requested_at",
        "minted_at",
        "expires_at",
        "used_at",
        "result",
        "idempotency_key",
        "correlation_id",
      ])
    );
  });

  it("creates the critical indexes", () => {
    const indexes = indexNames();
    expect(indexes).toEqual(
      expect.arrayContaining([
        "idx_records_source",
        "idx_records_type_time",
        "idx_records_lineage",
        "idx_customer_tier",
        "idx_approval_contexts_target",
        "idx_approval_contexts_result",
      ])
    );
  });

  it("records table has the v1 + v1.1 columns (including tier/customer_id)", () => {
    const columns = columnNames("records");
    expect(columns).toEqual(
      expect.arrayContaining([
        "id",
        "record_type",
        "schema_version",
        "source_repo",
        "source_issue",
        "source_comment_url",
        "ingested_at",
        "emitted_at",
        "body_json",
        "expected_observable_surface",
        "lineage_parent_id",
        "tier",
        "customer_id",
      ])
    );
  });

  it("records.tier defaults to 'internal'", () => {
    db.run(
      `INSERT INTO records (id, record_type, schema_version, source_repo, source_comment_url, ingested_at, emitted_at, body_json)
       VALUES ('r1', 'HALT', '1.0', 'zi007lin/htu-foundation', 'https://example.test/c/1', '2026-07-26T00:00:00Z', '2026-07-26T00:00:00Z', '{}')`
    );
    const rows = db.exec("SELECT tier FROM records WHERE id = 'r1'");
    expect(rows[0].values[0][0]).toBe("internal");
  });

  it("customer_tier_registrations has the tier/status columns", () => {
    const columns = columnNames("customer_tier_registrations");
    expect(columns).toEqual(
      expect.arrayContaining(["customer_id", "tier", "status", "onboarded_at"])
    );
  });
});
