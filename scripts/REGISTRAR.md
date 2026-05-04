# REGISTRAR — HTU Registrar CLI

Setup, usage, and operator reference for `scripts/htu-registrar.mjs` (v1).

Wraps Cloudflare's Registrar API (beta, April 2026) for domain search,
availability check, and registration. Zero npm dependencies; runs on
Node.js 20+ with built-in `fetch`.

**Authority:** operator-driven only. ZiLin-Dev (the agent) does NOT have
registrar capability in v1. Tier-aware operation (v1.2) and agent
capability (v1.3) are deferred to separate SPECs. See htu-foundation#66
for the full SPEC and authority rationale.

---

## Beta API caveats — operator validation required on first use

Cloudflare's Registrar API launched in beta in April 2026. Field names
and endpoint paths may shift before GA. The script's API call shapes
are best-effort against current CF v4 API patterns; verify them on
first use.

### Three best-effort assumptions

| # | Location | What it assumes | If beta differs |
|---|----------|-----------------|-----------------|
| 1 | `htu-registrar.mjs` L44-50 (`API_PATHS` block) | Endpoint paths follow `/accounts/:id/registrar/domains[/:domain]` | Edit the four `API_PATHS` constants to match current beta. No structural change needed. |
| 2 | `htu-registrar.mjs` L370 (pricing extraction) | Check response exposes `price` / `cost_usd` / `registration_price` | Adjust the field-name fallback chain to whichever field name CF uses. |
| 3 | `htu-registrar.mjs` L371 (premium flag) | Check response exposes `premium` / `is_premium` boolean | Adjust the field-name fallback chain. |

### First-use validation checklist

Run these in order before depending on the CLI for real registrations:

1. `node scripts/htu-registrar.mjs --help` — confirm CLI loads, prints help with all four commands.
2. `node scripts/htu-registrar.mjs --version` — confirm version string prints.
3. `node scripts/htu-registrar.mjs check <known-domain> --use-case htu --dry-run` — replace `<known-domain>` with a domain you've already registered through the dashboard. Dry-run does not call API; confirms argument parsing.
4. Drop `--dry-run`: `node scripts/htu-registrar.mjs check <known-domain> --use-case htu`. Compare returned fields against expected. If pricing is `null` / `undefined` or premium flag is missing, the field-name extraction (L370/L371) needs adjustment.
5. `node scripts/htu-registrar.mjs list --use-case htu` — should return your existing CF-registered domains. If endpoint 404s, the `API_PATHS.list` constant (L49) needs adjustment.

### Failure mode

If endpoints differ from the constants, every command errors at first
run with `API error 404` or similar (the script's `cfRequest` returns
`ok: false` and the command dispatcher prints the error and exits 1).
Edit `API_PATHS` (L44-50) and retry. The audit log records every
failed attempt — useful for debugging mismatched paths.

---

## Phase 2 — Setup and onboarding

One-time setup before the CLI works. Steps mirror htu-foundation#66
§Phase-2-Setup-and-onboarding (canonical source).

### 1. Create API token at Cloudflare dashboard

Dashboard → My Profile → API Tokens → Create Token → Custom token.

Permissions:
- Account → Registrar → Edit
- Account → Registrar → Read

Account Resources: include the HTU account only.

Save the token value — Cloudflare displays it once. Store in `.env`
(see step 5).

### 2. Configure default registrant contact in dashboard

Dashboard → Domain Registration → Manage Domains → Registrant Contact
(or per-domain contact if HTU prefers per-domain). Required because the
API uses the dashboard-configured contact for new registrations; the
CLI does not pass contact details per call.

### 3. Verify billing profile

Dashboard → Billing → Payment methods. Confirm a valid payment method
is attached to the HTU account. Registrations bill this method
immediately on successful registration; there is no follow-up
authorization step.

### 4. Accept Domain Registration Agreement

Dashboard → Domain Registration → Domain Registration Agreement.
One-time acceptance. The API will return `agreement_not_accepted` (or
similar) until this is done.

### 5. Set environment variables

Either in a `.env` file at the repo root (gitignored) or exported in
your shell. The script prefers `.env` if present, falls back to shell
environment.

```bash
# .env (gitignored)
CF_ACCOUNT_ID=<your HTU CF account ID>
CF_REGISTRAR_API_TOKEN=<token from step 1>

# optional override (default: 50)
BUDGET_CAP_USD=50
```

Find the account ID at Dashboard → top-right account selector → URL
contains `/accounts/<account-id>` once you click into the account.

### 6. Smoke-test

Run the first-use validation checklist above (Beta API caveats §First-use
validation checklist).

---

## Usage

CLI surface mirrors `node scripts/htu-registrar.mjs --help` output.

### Commands

```
htu-registrar <command> [arguments] [flags]

COMMANDS
  search <keywords...>         Search Cloudflare's domain registry for available names.
  check <domain>               Check availability + pricing for a specific domain.
  register <domain> --confirm  Register a domain (requires --confirm; safety rails apply).
  list                         List domains currently registered on HTU's CF account.
```

### Required flags (all commands)

```
  --use-case <vertical>        One of: htu, streettt-club, streettt-venue, nyqex, other
                               If 'other', --use-case-note <text> is also required.
```

### Register-specific flags

```
  --confirm                    Required for register; registration is non-refundable.
  --override-budget-cap        Allow registration over BUDGET_CAP_USD (audit-logged).
  --accept-premium             Allow premium-domain registration (audit-logged).
```

### Universal flags

```
  --dry-run                    Print intended action; do not call API.
  --help, -h                   Show this help.
  --version, -v                Show version.
```

### Examples

Search for available domains matching keywords:

```bash
node scripts/htu-registrar.mjs search ping pong club --use-case streettt-club
```

Check availability and pricing for a specific domain:

```bash
node scripts/htu-registrar.mjs check streettt-canal-essex.com --use-case streettt-venue
```

Register a domain with safety rails:

```bash
node scripts/htu-registrar.mjs register high-tech-united.com --confirm --use-case htu
```

Register with budget override (audit-logged):

```bash
node scripts/htu-registrar.mjs register premium-domain.com --confirm --override-budget-cap --accept-premium --use-case htu
```

Dry-run (prints intended action; no API call):

```bash
node scripts/htu-registrar.mjs register example-test.com --confirm --use-case htu --dry-run
```

List currently registered HTU domains:

```bash
node scripts/htu-registrar.mjs list --use-case htu
```

Use-case `other` with note:

```bash
node scripts/htu-registrar.mjs check experimental.io --use-case other --use-case-note "exploring acquisition for unrelated project"
```

### See also

For environment variable setup, see §Phase 2 — Setup and onboarding.
For audit log format, see §Audit log format. For authority model and
operator-only invariant, see §Authority model. For Cloudflare beta-API
caveats and operator validation checklist, see §Beta API caveats.

---

## Safety rails

Five layered defenses (see htu-foundation#66 §Models-Applied #8 Swiss
Cheese for the design rationale):

| # | Rail | Trigger | Bypass | Audit field |
|---|------|---------|--------|-------------|
| 1 | `--confirm` required | `register` without flag | None — must add flag | `result_status: blocked-confirm` |
| 2 | Budget cap | Price > BUDGET_CAP_USD (default 50) | `--override-budget-cap` | `result_status: blocked-budget`; logs `price`, `budget_cap_usd`, `override_budget_cap: true` on bypass |
| 3 | Premium domain block | Check returns `premium: true` | `--accept-premium` | `result_status: blocked-premium`; logs `premium: true`, `accept_premium: true` on bypass |
| 4 | `--dry-run` | Universal flag | N/A — does not call API | `result_status: dry-run` |
| 5 | Audit log on every operation | Always, including blocks and dry-runs | Cannot disable | All rails write to `./registrar-audit.log` |

The agent (ZiLin-Dev) is excluded from registrar capability entirely in
v1 — that's the sixth defense layer (per Game Theory Cooperative
authority gradient in spec §Game-Theory).

---

## Audit log format

`./registrar-audit.log` — JSON-lines (one JSON object per line, newline-
delimited). Schema is permissive; readers should ignore unknown fields.
Aligns with the future event-log SPEC for eventual Observer integration
(per htu-foundation#57).

### Minimum fields per record

| Field | Type | Always present | Notes |
|-------|------|----------------|-------|
| `timestamp` | string (ISO-8601 UTC) | Yes | Set by `writeAudit()` |
| `operation` | string | Yes | `search`/`check`/`register`/`list`/`error` |
| `use_case` | string | Yes | One of vocabulary; tagged on every audit record |
| `use_case_note` | string \| null | Yes (null when not `other`) | Free-text when `use_case=other` |
| `dry_run` | boolean | Yes | True if `--dry-run` was set |
| `result_status` | string | Yes | `success`/`error`/`dry-run`/`blocked-confirm`/`blocked-budget`/`blocked-premium` |
| `error_details` | object \| string \| null | Yes (null on success) | CF error payload or local message |

### Operation-specific fields

| Operation | Additional fields |
|-----------|-------------------|
| `search` | `keywords` (array of strings) |
| `check` | `domain` |
| `register` | `domain`, `price`, `premium`, `budget_cap_usd`, `override_budget_cap`, `accept_premium` |
| `list` | (none beyond minimum) |
| `error` (catch-all) | `subcommand` (which command threw) |

### Reading the log

```bash
# pretty-print last 5 entries
tail -n 5 registrar-audit.log | python3 -c "import sys,json; [print(json.dumps(json.loads(l), indent=2)) for l in sys.stdin]"

# all blocked operations
grep -E '"result_status":"blocked-' registrar-audit.log

# all registrations (including dry-runs)
grep '"operation":"register"' registrar-audit.log
```

### Log lifetime and rotation

V1 does not implement rotation. At expected volume (< 100 operations/
month per spec §Assumptions) the file stays small for years. If it
grows past practicality, archive manually:

```bash
mv registrar-audit.log registrar-audit-$(date +%Y%m%d).log
```

V1.1 (Worker) is expected to ingest into D1 + Observer; local file
becomes a fallback only.

---

## Legal triggers

Domain registration is a financial transaction with non-refundable
consequences. Operator responsibility before every `register --confirm`:

- **Domain Registration Agreement** — accepted in dashboard (Phase 2
  step 4); applies to every registration via the API.
- **Trademark exposure** — registering domains that conflict with
  existing trademarks creates legal risk. Tool does NOT check
  trademarks. Operator does due diligence before `--confirm`.
- **Privacy / WHOIS** — Cloudflare Registrar uses redacted WHOIS by
  default (`privacy_mode='redaction'`). Confirm in audit that registered
  domains have privacy enabled.
- **Cost authorization** — registrations bill the account's payment
  method without further authorization once API call succeeds. Budget
  cap is the operator-side safeguard; the CLI does not insert a
  payment-method confirmation step.
- **Tier-2 customer billing (v1.2 — deferred)** — when registering on
  a customer's CF account via HTU-managed admin token, the
  registration bills the customer's account. The customer contract
  must explicitly authorize HTU to register domains on their behalf.
  Out of scope for v1.
- **Agent capability (v1.3 — deferred)** — giving an agent the ability
  to spend money creates novel liability questions. v1.3 SPEC requires
  legal review.

See htu-foundation#66 §Legal-triggers for the canonical list.

---

## Authority model

| Actor | v1 capability | Forward |
|-------|---------------|---------|
| Operator (zi007lin) | Full registrar capability — runs CLI with token | Same |
| ZiLin-Dev (agent) | NONE — does not have token, does not invoke CLI | v1.3 SPEC introduces bounded agent capability with per-run budget cap + spec-body authorization requirement |
| Customer (downstream) | NONE — never has direct API access | v1.2 SPEC enables tier-2 onboarding flows where customer requests route through HTU-managed admin token |

The agent's exclusion from financial transactions in v1 is intentional
per spec §Game-Theory authority gradient and §Models-Applied #1 (Game
Theory Cooperative). Each tier's capability is bounded by deliberate
design rather than goodwill.

---

## Failure modes / troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `error: missing required environment variables: CF_ACCOUNT_ID, CF_REGISTRAR_API_TOKEN` | `.env` missing or vars not set | Add to `.env` per Phase 2 step 5 |
| `error: BUDGET_CAP_USD must be a positive number` | Env var set to non-numeric or negative value | Set to a positive number, or unset to use default 50 |
| `API error 404` on every command | Beta API endpoint paths drifted | Edit `API_PATHS` constants in `htu-registrar.mjs` L44-50 per Beta API caveats above |
| Pricing is `null` in check output | Beta response field renamed | Adjust pricing field extraction in `htu-registrar.mjs` L370 |
| `agreement_not_accepted` on register | Phase 2 step 4 not done | Accept Domain Registration Agreement in dashboard |
| `unauthorized` on every command | Token lacks Registrar permissions | Recreate token per Phase 2 step 1 with both Edit and Read |
| `extension_not_supported_via_api` | TLD not yet covered by beta | Use dashboard for that TLD; revisit when CF expands API |
| Premium domain blocks register and operator wants to proceed | Safety rail working as designed | Add `--accept-premium` (audit-logged) |

---

## Forward roadmap

Per spec §Final-Spec progressive disclosure (Models-Applied #11):

- **v1.1 — Worker endpoint** (deferred): `registrar.htu.io` Worker exposes
  `/search`, `/check`, `/register` with HTU-issued auth tokens; CF token
  stored as Wrangler secret; audit log moves to D1 + Observer.
- **v1.2 — Tier-aware operation** (deferred): per-customer CF account
  targeting via cross-account token; `customer_id` field in audit log;
  customer-tier-registrations table integration per three-tier customer
  model. Will be authored as a separate FEAT spec in htu-foundation
  post-v1-merge.
- **v1.3 — ZiLin-Dev tool capability** (deferred, separate SPEC + legal
  review): agent gets registrar capability via MCP; per-run budget cap
  (lower than overall cap, e.g., $25/run); spec body must explicitly
  authorize specific domain names; agent halts rather than improvising
  on registration decisions.

---

## References

- htu-foundation#66 — full FEAT SPEC (decision tree, game theory, legal
  triggers, work estimate)
- htu-foundation#57 — Observer SPEC v2 (future audit log destination)
- htu-foundation#60 — three-tier customer model (v1.2 dependency)
- Cloudflare Registrar API docs — https://developers.cloudflare.com/api/
  (verify endpoint paths on first use; see Beta API caveats above)
