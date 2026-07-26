-- Baseline Observer D1 schema.
-- Source: zi007lin/htu-foundation governance/specs/zilin-observer-architecture.md
-- §4 "D1 schema (canonical)", as merged through htu-foundation PR #309
-- (FEAT #308). That document is the source-of-truth declaration; this
-- migration MUST stay byte-for-byte identical to its DDL.
--
-- Scope note (FEAT zi007lin/zai#117, decision D4): the `approval_contexts`
-- table and its two indexes (v1.2 addition, FEAT #308) were appended by
-- the separate CHORE zi007lin/zai#116 once this baseline existed — see
-- the DDL block below.

-- Every ingested structured record (CLARIFY_JSON, CLARIFY_RESPONSE_JSON,
-- HALT_JSON, RUN_DIGEST, APPROVAL_CONTEXT_JSON) lands in `records` first.
-- Specialized tables denormalize for query speed.
CREATE TABLE records (
  id TEXT PRIMARY KEY,                      -- the record's own id (clarify_id, halt_id, etc.)
  record_type TEXT NOT NULL,                -- 'CLARIFY' | 'CLARIFY_RESPONSE' | 'HALT' | 'RUN_DIGEST' | 'APPROVAL_CONTEXT'
  schema_version TEXT NOT NULL,             -- '1.0' etc.
  source_repo TEXT NOT NULL,                -- 'zi007lin/htu-foundation'
  source_issue INTEGER,                     -- issue/PR number
  source_comment_url TEXT NOT NULL,         -- canonical link
  ingested_at TEXT NOT NULL,                -- ISO-8601 UTC
  emitted_at TEXT NOT NULL,                 -- from the record's own timestamp field
  body_json TEXT NOT NULL,                  -- full record, for reprocessing if schema evolves
  expected_observable_surface TEXT,         -- v1.1+ field, populated when rubric v1.5+ produces it; null in v1
  lineage_parent_id TEXT,                   -- responds_to (for responses), supersedes, or related halt_id
  FOREIGN KEY (lineage_parent_id) REFERENCES records(id)
);

CREATE INDEX idx_records_source ON records(source_repo, source_issue);
CREATE INDEX idx_records_type_time ON records(record_type, emitted_at);
CREATE INDEX idx_records_lineage ON records(lineage_parent_id);

CREATE TABLE clarify_cycles (
  clarify_id TEXT PRIMARY KEY REFERENCES records(id),
  spec_repo TEXT NOT NULL,
  spec_issue INTEGER NOT NULL,
  step TEXT,
  agent_persona TEXT,
  agent_card_version TEXT,
  effective_mode TEXT,
  topics_json TEXT NOT NULL,
  awaiting TEXT,
  response_id TEXT REFERENCES records(id),  -- the matching CLARIFY_RESPONSE_JSON record id, if found
  response_form TEXT,                       -- 'structured' | 'transcribed'
  response_latency_seconds INTEGER          -- emitted_at delta from CLARIFY to CLARIFY_RESPONSE
);

CREATE TABLE halts (
  halt_id TEXT PRIMARY KEY REFERENCES records(id),
  spec_repo TEXT NOT NULL,
  spec_issue INTEGER NOT NULL,
  halt_class TEXT NOT NULL,                 -- 'gate-fired' | 'runtime-state'
  gate_id TEXT,                             -- 'gate-N' or 'spec-<slug>' or null
  gate_name TEXT,
  step TEXT,
  agent_persona TEXT,
  effective_mode TEXT,
  trigger_json TEXT,
  resolution_taken TEXT,                    -- 'override' | 'corrective-instruction' | 'abort' | null if unresolved
  resolution_latency_seconds INTEGER
);

CREATE TABLE digests (
  digest_id TEXT PRIMARY KEY REFERENCES records(id),
  pr_url TEXT,
  spec_repo TEXT NOT NULL,
  spec_issue INTEGER NOT NULL,
  effective_mode TEXT,
  agent_persona TEXT,
  duration_active_minutes REAL,
  duration_total_minutes REAL,
  files_changed INTEGER,
  lines_added INTEGER,
  lines_deleted INTEGER,
  commands_run INTEGER,
  decisions_made INTEGER,
  halts_count INTEGER,
  clarify_cycles_count INTEGER,
  anomalies_json TEXT,
  flagged_for_review_json TEXT
);

CREATE TABLE anomalies (
  anomaly_id TEXT PRIMARY KEY,              -- generated UUID
  detected_at TEXT NOT NULL,
  source_record_id TEXT REFERENCES records(id),
  anomaly_type TEXT NOT NULL,               -- see anomaly catalog below
  severity TEXT NOT NULL,                   -- 'info' | 'warn' | 'error' | 'critical'
  description TEXT NOT NULL,
  emitted_to_github_url TEXT,               -- if alert was posted as a GitHub comment
  resolved_at TEXT,
  resolution_notes TEXT
);

CREATE TABLE ingest_cursor (
  source_repo TEXT PRIMARY KEY,
  last_comment_id INTEGER NOT NULL,         -- highest GitHub comment id processed
  last_run_at TEXT NOT NULL
);

CREATE TABLE schema_violations (
  violation_id TEXT PRIMARY KEY,
  detected_at TEXT NOT NULL,
  source_comment_url TEXT NOT NULL,
  attempted_record_type TEXT,
  validation_errors_json TEXT NOT NULL,
  raw_body TEXT NOT NULL                    -- preserved for forensics
);

-- ───────────────────────────────────────────────────────────────────
-- v1.1 additions per CHORE #59 (three-tier customer model).
-- These columns and table land alongside the v1 schema in migration
-- 0001_initial.sql; they are not a separate migration file.
-- ───────────────────────────────────────────────────────────────────

-- Tier identification on every record:
ALTER TABLE records ADD COLUMN tier TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE records ADD COLUMN customer_id TEXT;  -- null for tier 1; populated for tier 2 and 3

-- Customer registry. Replaces the prior simpler external_workers sketch:
CREATE TABLE customer_tier_registrations (
  customer_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,                              -- 'internal' | 'white-label' | 'enterprise'
  customer_domain TEXT,                            -- customer's brand domain (tier 2/3); HTU domains for tier 1
  cloudflare_account_id TEXT,
  admin_email TEXT,                                -- htu-<slug>@pm.me for tier 2; customer's for tier 3
  deployment_shape TEXT,                           -- 'customer-own-infra' | 'shared-htu-infra' for tier 3
  d1_endpoint TEXT,                                -- where customer records land
  ingestion_endpoint TEXT,                         -- HTTP endpoint for tier 3a A2A-style ingestion
  status TEXT NOT NULL DEFAULT 'active',           -- 'active' | 'dormant' | 'offboarded'
  onboarded_at TEXT NOT NULL,
  dormant_at TEXT,
  offboarded_at TEXT,
  contract_terms_ref TEXT                          -- pointer to contract doc for billing/offboarding terms
);

CREATE INDEX idx_customer_tier ON customer_tier_registrations(tier, status);

-- ───────────────────────────────────────────────────────────────────
-- v1.2 addition per FEAT #308 (EPIC #277 Phase 4): APPROVAL_CONTEXT_JSON
-- ingestion. Mirrors the halts/clarify_cycles denormalized-projection
-- pattern. Lands alongside the v1 schema in migration 0001_initial.sql;
-- not a separate migration file. The zi007lin/zai Worker migration-file
-- parity update is tracked as a separate cross-repo companion issue
-- (D5 in FEAT #308) and is not landed in this PR.
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE approval_contexts (
  context_id TEXT PRIMARY KEY REFERENCES records(id),
  action TEXT NOT NULL,
  target_repo TEXT NOT NULL,
  target_number INTEGER NOT NULL,
  requester_identity TEXT NOT NULL,
  requester_github_user TEXT,
  approver_identity TEXT NOT NULL,
  approver_logto_roles_json TEXT,
  requested_at TEXT NOT NULL,
  minted_at TEXT,
  expires_at TEXT,
  used_at TEXT,
  result TEXT NOT NULL,
  idempotency_key TEXT,
  correlation_id TEXT
);

CREATE INDEX idx_approval_contexts_target ON approval_contexts(target_repo, target_number);
CREATE INDEX idx_approval_contexts_result ON approval_contexts(result);
