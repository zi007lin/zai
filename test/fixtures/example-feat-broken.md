# FEAT: Pre-trade compliance check API for derivative trades

**Repo:** zi007lin/streettt-private

## Intent

Adds a synchronous pre-trade compliance check endpoint so the order-entry
flow can short-circuit before a derivative leg reaches the venue gateway.
Pulls jurisdiction rules from the existing rules registry; emits a
structured verdict (allow / block / require-attestation) the OMS already
understands. Scope is intentionally narrow: one endpoint, one verdict
shape, no rule authoring or attestation capture in this FEAT. Cuts the
ad-hoc "compliance liaison ping" loop from the trade lifecycle; the
liaison still owns rule authoring out-of-band.

## Decision Tree

| Question                              | If yes                                | If no                                       |
|---------------------------------------|---------------------------------------|---------------------------------------------|
| Is the trade in a regulated venue?    | Run jurisdiction rules                | Skip                                        |
| Does the rule require attestation?    | Return `require-attestation`          | Return `allow` or `block`                   |
| Did any rule return `block`?          | Short-circuit and return `block`      | Aggregate verdicts                          |

Trigger for change: when a new jurisdiction is onboarded, add a rule
module without touching the API surface.

## Final Spec

The endpoint is `POST /api/v1/pre-trade-check` accepting the OMS
order-snapshot envelope and returning a verdict object.

## Acceptance Criteria

- [ ] Endpoint returns a verdict within 50ms p95 for one-leg trades.
- [ ] Rules registry hot-reloads without an endpoint restart.
- [ ] Block reasons are surfaced as structured codes (not free text).
- [ ] Attestation verdicts carry the attestation-template ID.

## Game Theory Cooperative Model review

Cooperative payoffs: the trader gets a near-instant verdict; the
compliance liaison stops being the synchronous bottleneck. Both sides
prefer the rules-registry path over the ad-hoc Slack ping.

### Abuse vector

A trader could spam the endpoint with synthetic envelopes to probe rule
boundaries. Mitigation: the endpoint is rate-limited per principal and
audit-logged.

### Mitigation

Audit log entries are non-repudiable (signed by the gateway) and the
liaison reviews anomalies daily.

## Subject Migration Summary

| Subject          | Before                                | After                              |
|------------------|---------------------------------------|------------------------------------|
| Pre-trade check  | Slack ping to compliance liaison      | Synchronous API call               |
| Verdict shape    | Free-text Slack reply                 | Structured verdict object          |
| Rule reload      | Liaison restart                       | Hot-reload from rules registry     |
| Open questions   | Attestation capture surface (out of scope here) |                          |

## Files created / updated

```
src/api/preTradeCheck.ts          (NEW)
src/api/preTradeCheck.test.ts     (NEW)
src/rules/registry.ts             (UPDATED)
```

## Models Applied

- Game Theory Cooperative Model — trader/liaison cooperative path.
- Decision Tree — rule-aggregation logic.

## Legal triggers

None. The endpoint is internal-only and does not change how the firm
classifies orders for regulatory reporting.

## Work Estimate

### Active operator time

| Phase                         | Wait dependency       | Estimate |
|-------------------------------|-----------------------|----------|
| Endpoint scaffold + tests     | None                  | 2 h      |
| Rules-registry hot reload     | Endpoint scaffold     | 2 h      |
| OMS integration               | Endpoint live in dev  | 1 h      |
| Total                         |                       | 5 h      |

### Wall-clock time

| Phase             | Wait dependency       | Estimate |
|-------------------|-----------------------|----------|
| Endpoint + tests  | None                  | 1 day    |
| Integration       | Endpoint merged       | 1 day    |
| Total             |                       | 2 days   |

### Assumptions

- Rules registry exists and is hot-reloadable.
- OMS already speaks the order-snapshot envelope shape.

### Actuals (filled post-execution)

| Phase             | Estimate | Actual | Delta |
|-------------------|----------|--------|-------|
| Endpoint + tests  | 1 day    | TBD    | TBD   |
| Integration       | 1 day    | TBD    | TBD   |
| Total             | 2 days   | TBD    | TBD   |
