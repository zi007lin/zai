# 2026-04-13__feat__zai-score-signing-cf-worker

**Repo:** `zi007lin/zai`
**Label:** `feat`
**Branch:** `zai/score-signing-cf-worker`
**Reviewer:** daniel-silvers
**Status:** PARKED — depends on CF Worker scaffold (not yet built)
**Supersedes:** Option B (CLAUDE.md re-run check) once deployed

---

## Intent

Move spec scoring server-side and sign every score block with a private key stored in Cloudflare secrets. ZiLin-Dev verifies the signature before impl runs. A hand-typed or manually altered score block has no valid signature and fails the gate cryptographically. This is the ZZV Chain anchor at the spec layer — every spec decision is signed, timestamped, and independently verifiable.

---

## Decision Tree

**Question:** How do we make the score block tamper-proof?

| Option | Integrity | Infrastructure needed | Decision |
|---|---|---|---|
| Client-side score block (current) | None — string presence only | None | ❌ Hand-typeable |
| CLAUDE.md re-run check (Option B) | Behavioral — catches accidents | None | ✅ Interim |
| CF Worker HMAC signature | Cryptographic — catches all tampering | CF Worker + secret key | ✅ Target state |
| ZZV Chain on-chain receipt | Maximum — immutable ledger | ZZV Chain node | ⏳ Future |

**Decision:** CF Worker HMAC for now. ZZV Chain anchoring when chain nodes are operational.

**Trigger for change:** Option B ships → this spec becomes the next priority. CF Worker scaffold must exist before this impl runs.

---

## Draft-of-thoughts

The signing model: when the CF Worker scores a spec, it computes `HMAC-SHA256(score_block_json, SCORE_SIGNING_KEY)` where `SCORE_SIGNING_KEY` is a Cloudflare secret never exposed in the repo or bundle. The signature is appended to the score block:

```json
{
  "rubric_version": "1.1.0",
  "spec_type": "feat",
  "score": "7/7",
  "passed": true,
  "evaluated_at": "2026-04-13T06:00:00.000Z",
  "sections": { ... },
  "gates": [],
  "sig": "a3f8c2...d94e"
}
```

ZiLin-Dev verification: re-compute the HMAC over the score block JSON (excluding the `sig` field) using the same key (available as `SCORE_SIGNING_KEY` env var on the Contabo runner). If `computed === stored_sig` → proceed. If mismatch → `needs_input: score block signature invalid`.

The key rotation plan: SCORE_SIGNING_KEY rotates every 90 days. Old signatures remain valid for 30 days after rotation (grace period). Score blocks older than 120 days require re-scoring.

The CF Worker also replaces the client-side `scoreSpec.ts` — the `/app` page sends the spec file to the Worker, receives the signed score block, appends it to the file for download. The client-side rubric becomes a preview-only tool (no signature issued).

---

## Final Spec

### 1. CF Worker endpoint

```
POST /api/score
Content-Type: multipart/form-data
Body: { file: <spec.md> }

Response 200:
{
  "score_block": "<!-- zilin-bs:score\n{...json with sig...}\n-->",
  "passed": true,
  "score": "7/7",
  "spec_type": "feat"
}

Response 422:
{
  "passed": false,
  "score": "4/7",
  "failing": ["decision_tree", "game_theory"]
}
```

### 2. Signing implementation

```typescript
// CF Worker — score.ts
const encoder = new TextEncoder();

async function signScoreBlock(
  payload: object,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(JSON.stringify(payload))
  );
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 3. ZiLin-Dev verification (CLAUDE.md addition)

```typescript
// Verification pseudocode for CLAUDE.md instruction
async function verifyScoreBlock(block: ScoreBlock, secret: string): boolean {
  const { sig, ...payload } = block;
  const computed = await hmacSha256(JSON.stringify(payload), secret);
  return computed === sig;
}
```

CLAUDE.md rule addition (appended after Option B rule):
```
When SCORE_SIGNING_KEY is available in the environment:
- Extract score block JSON from spec file
- Separate `sig` field from payload
- Recompute HMAC-SHA256 over payload using SCORE_SIGNING_KEY
- If signature does not match → STOP:
  needs_input: score block signature invalid — re-score at zai.htu.io/app
- If signature matches → proceed (Option B re-run check is skipped)

When SCORE_SIGNING_KEY is not available → fall back to Option B re-run check.
```

### 4. `/app` page update

- Remove client-side `scoreSpec()` call for final scoring
- Replace with `fetch('/api/score', { method: 'POST', body: formData })`
- Keep client-side `scoreSpec()` as a live preview while typing/uploading (no signature — labeled "preview")
- Signed result only comes from the Worker response

### 5. Secret management

```
CF Secret name: SCORE_SIGNING_KEY
Rotation: every 90 days
Grace period: 30 days (old sigs still valid)
Never committed to repo
Set via: npx wrangler secret put SCORE_SIGNING_KEY --env demo
```

---

## Game Theory Review

**Who benefits:** Every stakeholder in the impl pipeline. daniel-silvers can verify any PR's score block is genuine by checking the signature. The audit trail is cryptographically sound — not just process-controlled.

**Abuse vector:** Attacker obtains `SCORE_SIGNING_KEY` and forges signatures. Mitigation: key lives only in CF secrets and Contabo runner env — never in code, never in logs. Key rotation every 90 days limits exposure window.

**Abuse vector 2:** Attacker re-scores a failing spec with modified content to get a passing signature. Mitigation: the signature covers the full spec content hash (not just the score JSON). A modified spec produces a different payload and a different signature.

**Abuse vector 3:** Replay attack — copy a valid signature from one spec to another. Mitigation: the payload includes `evaluated_at` ISO timestamp and the spec filename. A signature from spec A does not validate against spec B.

---

## Acceptance Criteria

- [ ] `POST /api/score` CF Worker endpoint exists and returns signed score block
- [ ] `SCORE_SIGNING_KEY` set in CF secrets for dev, demo, prod environments
- [ ] `/app` page calls Worker for final score, keeps client-side as preview only
- [ ] ZiLin-Dev CLAUDE.md updated with signature verification step
- [ ] `SCORE_SIGNING_KEY` available on Contabo runner as env var
- [ ] Verification rejects hand-typed score block (no valid sig)
- [ ] Verification rejects score block with modified JSON (sig mismatch)
- [ ] Verification rejects score block from different spec (filename mismatch)
- [ ] Falls back to Option B re-run check when key not available
- [ ] Key rotation procedure documented in `docs/ops/score-key-rotation.md`

---

## Subject Migration Summary

| | |
|---|---|
| What | CF Worker score signing — cryptographic tamper-proof guarantee |
| State | PARKED — CF Worker scaffold required first |
| Open questions | (1) Does `zai` already have a CF Worker or is it Pages-only? Check `wrangler.jsonc`. (2) Key distribution to Contabo runner — manual secret or pulled from CF API? |
| Next action | Build CF Worker scaffold → then impl this spec |
| Repo | `zi007lin/zai` |
