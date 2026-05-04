#!/usr/bin/env node
/**
 * htu-registrar — HTU Registrar CLI v1
 *
 * Wraps Cloudflare's Registrar API (beta, April 2026) for domain search,
 * availability check, and registration. Zero npm dependencies (Node.js
 * 20+ built-in fetch).
 *
 * Per htu-foundation#66 (FEAT spec). Phase 1 v1 only.
 *
 * Authority: API token in env. Operator runs the tool; ZiLin-Dev does NOT
 * have registrar capability in v1. v1.2 (tier-aware) and v1.3 (agent
 * capability) are deferred to separate SPECs.
 *
 * Safety rails: --confirm, budget cap with override, --accept-premium,
 * --dry-run, audit log appended to ./registrar-audit.log on every op.
 *
 * Audit log format: JSON-lines (one JSON object per line). Schema is
 * permissive; readers ignore unknown fields. Aligns with future event-log
 * SPEC for eventual migration / Observer integration (htu-foundation#57).
 *
 * NOTE: Cloudflare Registrar API endpoint paths below are best-effort
 * based on CF v4 API patterns. Verify against current CF docs at
 * https://developers.cloudflare.com/api/ (search "registrar") on first
 * use; adjust constants in the API_PATHS block if needed.
 */

import { appendFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

const CLI_NAME = 'htu-registrar';
const VERSION = '1.0.0';

const BUDGET_CAP_USD_DEFAULT = 50;

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

const API_PATHS = {
  // verify against current CF Registrar API docs on first use
  search: (accountId) => `/accounts/${accountId}/registrar/domains/search`,
  check: (accountId, domain) => `/accounts/${accountId}/registrar/domains/${domain}`,
  register: (accountId, domain) => `/accounts/${accountId}/registrar/domains/${domain}`,
  list: (accountId) => `/accounts/${accountId}/registrar/domains`,
};

const REQUIRED_ENV = ['CF_ACCOUNT_ID', 'CF_REGISTRAR_API_TOKEN'];

const USE_CASES = ['htu', 'streettt-club', 'streettt-venue', 'nyqex', 'other'];

const AUDIT_LOG_PATH = './registrar-audit.log';

// ─────────────────────────────────────────────────────────────────────
// .env loader (zero deps; falls back to shell env)
// ─────────────────────────────────────────────────────────────────────

async function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}

function validateEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    process.stderr.write(
      `error: missing required environment variables: ${missing.join(', ')}\n` +
      `       set them in .env (gitignored) or export from your shell\n` +
      `       see scripts/REGISTRAR.md for setup steps\n`
    );
    process.exit(2);
  }
}

function getBudgetCap() {
  const raw = process.env.BUDGET_CAP_USD;
  if (!raw) return BUDGET_CAP_USD_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    process.stderr.write(
      `error: BUDGET_CAP_USD must be a positive number; got ${JSON.stringify(raw)}\n`
    );
    process.exit(2);
  }
  return n;
}

// ─────────────────────────────────────────────────────────────────────
// Argument parser (zero deps)
// ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  // argv: [node, script, subcommand, ...rest]
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    return { subcommand: 'help' };
  }
  if (args[0] === '--version' || args[0] === '-v') {
    return { subcommand: 'version' };
  }
  const subcommand = args[0];
  const rest = args.slice(1);
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token.startsWith('--')) {
      const name = token.slice(2);
      const next = rest[i + 1];
      // Boolean flags vs flags-with-values: known boolean flags first
      if (['confirm', 'override-budget-cap', 'accept-premium', 'dry-run', 'help'].includes(name)) {
        flags[name] = true;
      } else if (next !== undefined && !next.startsWith('--')) {
        flags[name] = next;
        i += 1;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(token);
    }
  }
  return { subcommand, positional, flags };
}

function validateUseCase(flags) {
  const useCase = flags['use-case'];
  if (!useCase) {
    return { ok: false, error: 'missing required flag: --use-case <htu|streettt-club|streettt-venue|nyqex|other>' };
  }
  if (!USE_CASES.includes(useCase)) {
    return {
      ok: false,
      error: `invalid --use-case value ${JSON.stringify(useCase)}; expected one of: ${USE_CASES.join(', ')}`,
    };
  }
  if (useCase === 'other') {
    const note = flags['use-case-note'];
    if (!note || typeof note !== 'string' || note.trim() === '') {
      return {
        ok: false,
        error: '--use-case=other requires --use-case-note <free-text> to be set',
      };
    }
  }
  return { ok: true, useCase, useCaseNote: flags['use-case-note'] || null };
}

// ─────────────────────────────────────────────────────────────────────
// Audit log (JSON-lines, one record per line)
// ─────────────────────────────────────────────────────────────────────

async function writeAudit(record) {
  const enriched = {
    timestamp: new Date().toISOString(),
    ...record,
  };
  const line = JSON.stringify(enriched) + '\n';
  try {
    await appendFile(AUDIT_LOG_PATH, line, 'utf8');
  } catch (err) {
    process.stderr.write(`warning: could not write audit log: ${err.message}\n`);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cloudflare API client
// ─────────────────────────────────────────────────────────────────────

async function cfRequest(path, { method = 'GET', body = null, dryRun = false } = {}) {
  const url = `${CF_API_BASE}${path}`;
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_REGISTRAR_API_TOKEN;

  if (dryRun) {
    return {
      _dry_run: true,
      method,
      url,
      account_id: accountId,
      body: body ?? null,
    };
  }

  const init = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== null) init.body = JSON.stringify(body);

  const response = await fetch(url, init);
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, status: response.status, error: 'non-JSON response', body: text };
  }
  if (!response.ok || (json && json.success === false)) {
    return { ok: false, status: response.status, error: json.errors || json, body: json };
  }
  return { ok: true, status: response.status, body: json };
}

// ─────────────────────────────────────────────────────────────────────
// Command: search
// ─────────────────────────────────────────────────────────────────────

async function cmdSearch(positional, flags) {
  const useCaseResult = validateUseCase(flags);
  if (!useCaseResult.ok) {
    process.stderr.write(`error: ${useCaseResult.error}\n`);
    process.exit(2);
  }
  if (positional.length === 0) {
    process.stderr.write(`error: search requires at least one keyword\n`);
    process.exit(2);
  }
  const accountId = process.env.CF_ACCOUNT_ID;
  const dryRun = flags['dry-run'] === true;

  const result = await cfRequest(API_PATHS.search(accountId), {
    method: 'POST',
    body: { keywords: positional },
    dryRun,
  });

  await writeAudit({
    operation: 'search',
    keywords: positional,
    use_case: useCaseResult.useCase,
    use_case_note: useCaseResult.useCaseNote,
    dry_run: dryRun,
    result_status: dryRun ? 'dry-run' : result.ok ? 'success' : 'error',
    error_details: result.ok ? null : result.error,
  });

  if (dryRun) {
    process.stdout.write(`[dry-run] would POST ${API_PATHS.search(accountId)} with keywords=${JSON.stringify(positional)}\n`);
    return;
  }
  if (!result.ok) {
    process.stderr.write(`error: search failed: ${JSON.stringify(result.error)}\n`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
}

// ─────────────────────────────────────────────────────────────────────
// Command: check
// ─────────────────────────────────────────────────────────────────────

async function cmdCheck(positional, flags) {
  const useCaseResult = validateUseCase(flags);
  if (!useCaseResult.ok) {
    process.stderr.write(`error: ${useCaseResult.error}\n`);
    process.exit(2);
  }
  if (positional.length !== 1) {
    process.stderr.write(`error: check requires exactly one domain argument\n`);
    process.exit(2);
  }
  const domain = positional[0];
  const accountId = process.env.CF_ACCOUNT_ID;
  const dryRun = flags['dry-run'] === true;

  const result = await cfRequest(API_PATHS.check(accountId, domain), {
    method: 'GET',
    dryRun,
  });

  await writeAudit({
    operation: 'check',
    domain,
    use_case: useCaseResult.useCase,
    use_case_note: useCaseResult.useCaseNote,
    dry_run: dryRun,
    result_status: dryRun ? 'dry-run' : result.ok ? 'success' : 'error',
    error_details: result.ok ? null : result.error,
  });

  if (dryRun) {
    process.stdout.write(`[dry-run] would GET ${API_PATHS.check(accountId, domain)}\n`);
    return;
  }
  if (!result.ok) {
    process.stderr.write(`error: check failed: ${JSON.stringify(result.error)}\n`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
}

// ─────────────────────────────────────────────────────────────────────
// Command: register (with safety rails)
// ─────────────────────────────────────────────────────────────────────

async function cmdRegister(positional, flags) {
  const useCaseResult = validateUseCase(flags);
  if (!useCaseResult.ok) {
    process.stderr.write(`error: ${useCaseResult.error}\n`);
    process.exit(2);
  }
  if (positional.length !== 1) {
    process.stderr.write(`error: register requires exactly one domain argument\n`);
    process.exit(2);
  }
  const domain = positional[0];
  const dryRun = flags['dry-run'] === true;
  const accountId = process.env.CF_ACCOUNT_ID;

  // Safety rail #1: --confirm required
  if (!flags.confirm) {
    await writeAudit({
      operation: 'register',
      domain,
      use_case: useCaseResult.useCase,
      use_case_note: useCaseResult.useCaseNote,
      dry_run: dryRun,
      result_status: 'blocked-confirm',
      error_details: '--confirm flag not provided',
    });
    process.stderr.write(
      `error: register requires --confirm flag (registration is non-refundable)\n` +
      `       run with --dry-run first to verify intent\n`
    );
    process.exit(2);
  }

  // Pre-register: pricing check
  const checkResult = await cfRequest(API_PATHS.check(accountId, domain), {
    method: 'GET',
    dryRun: false, // always make this call even if the user requested --dry-run, to log pricing
  });
  if (!checkResult.ok && !dryRun) {
    await writeAudit({
      operation: 'register',
      domain,
      use_case: useCaseResult.useCase,
      use_case_note: useCaseResult.useCaseNote,
      dry_run: dryRun,
      result_status: 'error',
      error_details: `pre-register check failed: ${JSON.stringify(checkResult.error)}`,
    });
    process.stderr.write(`error: pre-register check failed: ${JSON.stringify(checkResult.error)}\n`);
    process.exit(1);
  }

  // Extract price + premium status from check response
  // Adjust these field paths if CF Registrar API uses different shape
  const checkBody = checkResult.body?.result || checkResult.body || {};
  const price = checkBody.price ?? checkBody.cost_usd ?? checkBody.registration_price ?? null;
  const isPremium = Boolean(checkBody.premium ?? checkBody.is_premium ?? false);

  // Safety rail #2: budget cap (with override)
  const budgetCap = getBudgetCap();
  if (typeof price === 'number' && price > budgetCap && !flags['override-budget-cap']) {
    await writeAudit({
      operation: 'register',
      domain,
      price,
      premium: isPremium,
      budget_cap_usd: budgetCap,
      use_case: useCaseResult.useCase,
      use_case_note: useCaseResult.useCaseNote,
      dry_run: dryRun,
      result_status: 'blocked-budget',
      error_details: `price ${price} exceeds budget cap ${budgetCap}; pass --override-budget-cap to proceed`,
    });
    process.stderr.write(
      `error: domain ${domain} price ${price} USD exceeds budget cap ${budgetCap} USD\n` +
      `       pass --override-budget-cap to proceed (audit-logged)\n`
    );
    process.exit(2);
  }

  // Safety rail #3: premium domain flag
  if (isPremium && !flags['accept-premium']) {
    await writeAudit({
      operation: 'register',
      domain,
      price,
      premium: isPremium,
      use_case: useCaseResult.useCase,
      use_case_note: useCaseResult.useCaseNote,
      dry_run: dryRun,
      result_status: 'blocked-premium',
      error_details: 'premium domain detected; --accept-premium not set',
    });
    process.stderr.write(
      `error: domain ${domain} is a premium registration (price ${price} USD)\n` +
      `       pass --accept-premium to proceed (audit-logged)\n`
    );
    process.exit(2);
  }

  // Proceed with registration
  const registerResult = await cfRequest(API_PATHS.register(accountId, domain), {
    method: 'POST',
    body: { confirm: true },
    dryRun,
  });

  await writeAudit({
    operation: 'register',
    domain,
    price,
    premium: isPremium,
    budget_cap_usd: budgetCap,
    override_budget_cap: Boolean(flags['override-budget-cap']),
    accept_premium: Boolean(flags['accept-premium']),
    use_case: useCaseResult.useCase,
    use_case_note: useCaseResult.useCaseNote,
    dry_run: dryRun,
    result_status: dryRun ? 'dry-run' : registerResult.ok ? 'success' : 'error',
    error_details: registerResult.ok ? null : registerResult.error,
  });

  if (dryRun) {
    process.stdout.write(
      `[dry-run] would POST ${API_PATHS.register(accountId, domain)}\n` +
      `[dry-run] price=${price} USD; premium=${isPremium}; budget=${budgetCap}\n`
    );
    return;
  }
  if (!registerResult.ok) {
    process.stderr.write(`error: registration failed: ${JSON.stringify(registerResult.error)}\n`);
    process.exit(1);
  }
  process.stdout.write(`✓ registered ${domain} (price ${price} USD)\n`);
  process.stdout.write(JSON.stringify(registerResult.body, null, 2) + '\n');
}

// ─────────────────────────────────────────────────────────────────────
// Command: list
// ─────────────────────────────────────────────────────────────────────

async function cmdList(positional, flags) {
  const useCaseResult = validateUseCase(flags);
  if (!useCaseResult.ok) {
    process.stderr.write(`error: ${useCaseResult.error}\n`);
    process.exit(2);
  }
  const accountId = process.env.CF_ACCOUNT_ID;
  const dryRun = flags['dry-run'] === true;

  const result = await cfRequest(API_PATHS.list(accountId), {
    method: 'GET',
    dryRun,
  });

  await writeAudit({
    operation: 'list',
    use_case: useCaseResult.useCase,
    use_case_note: useCaseResult.useCaseNote,
    dry_run: dryRun,
    result_status: dryRun ? 'dry-run' : result.ok ? 'success' : 'error',
    error_details: result.ok ? null : result.error,
  });

  if (dryRun) {
    process.stdout.write(`[dry-run] would GET ${API_PATHS.list(accountId)}\n`);
    return;
  }
  if (!result.ok) {
    process.stderr.write(`error: list failed: ${JSON.stringify(result.error)}\n`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
}

// ─────────────────────────────────────────────────────────────────────
// Help text
// ─────────────────────────────────────────────────────────────────────

function printHelp() {
  process.stdout.write(`${CLI_NAME} v${VERSION} — HTU Registrar CLI

USAGE
  ${CLI_NAME} <command> [arguments] [flags]

COMMANDS
  search <keywords...>         Search Cloudflare's domain registry for available names.
  check <domain>               Check availability + pricing for a specific domain.
  register <domain> --confirm  Register a domain (requires --confirm; safety rails apply).
  list                         List domains currently registered on HTU's CF account.

REQUIRED FLAGS (all commands)
  --use-case <vertical>        One of: ${USE_CASES.join(', ')}
                               If 'other', --use-case-note <text> is also required.

REGISTER-SPECIFIC FLAGS
  --confirm                    Required for register; registration is non-refundable.
  --override-budget-cap        Allow registration over BUDGET_CAP_USD (audit-logged).
  --accept-premium             Allow premium-domain registration (audit-logged).

UNIVERSAL FLAGS
  --dry-run                    Print intended action; do not call API.
  --help, -h                   Show this help.
  --version, -v                Show version.

ENVIRONMENT
  CF_ACCOUNT_ID                Cloudflare account ID (required).
  CF_REGISTRAR_API_TOKEN       CF API token with Registrar write permissions (required).
  BUDGET_CAP_USD               Override default budget cap (default: ${BUDGET_CAP_USD_DEFAULT}).

  Loaded from .env in cwd if present (gitignored); falls back to shell env.

AUDIT LOG
  ${AUDIT_LOG_PATH}             JSON-lines; appended on every operation.

DOCUMENTATION
  See scripts/REGISTRAR.md for setup steps + per-command examples.

AUTHORITY
  Operator runs the tool. ZiLin-Dev (agent) does NOT have registrar
  capability in v1. v1.2 (tier-aware) and v1.3 (agent capability) are
  deferred to separate SPECs.
`);
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main() {
  const parsed = parseArgs(process.argv);

  if (parsed.subcommand === 'help') {
    printHelp();
    return;
  }
  if (parsed.subcommand === 'version') {
    process.stdout.write(`${CLI_NAME} v${VERSION}\n`);
    return;
  }

  await loadDotEnv();
  validateEnv();

  const { subcommand, positional, flags } = parsed;

  try {
    switch (subcommand) {
      case 'search':
        await cmdSearch(positional, flags);
        break;
      case 'check':
        await cmdCheck(positional, flags);
        break;
      case 'register':
        await cmdRegister(positional, flags);
        break;
      case 'list':
        await cmdList(positional, flags);
        break;
      default:
        process.stderr.write(`error: unknown command ${JSON.stringify(subcommand)}\n`);
        printHelp();
        process.exit(2);
    }
  } catch (err) {
    await writeAudit({
      operation: 'error',
      subcommand,
      error_details: err.message || String(err),
      result_status: 'error',
    });
    process.stderr.write(`error: ${err.message || String(err)}\n`);
    process.exit(1);
  }
}

main();
