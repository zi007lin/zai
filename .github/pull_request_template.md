## Summary

<!-- Brief description of what this PR does and why. -->

## Changes

<!-- List the key files changed and the reason. -->

## Deployment

<!--
Exactly one ## Deployment section is required (CHORE #351, canonical
across all governed HTU repos — docs/IMPLW_FLOW.md §9). Render it with
renderDeploymentSection() (src/lib/implwDeployment.js) rather than
hand-writing it, so the format never drifts. Delete this comment block and
replace it with ONE of the four rendered shapes below.

STATUS "automated" — an existing deploy workflow/tool handles it:

## Deployment

### Development

`deploy #<issue-number> dev`

### Production

`deploy #<issue-number> prod`

### Verification

- Verify deployment workflow succeeds.
- Verify smoke checks pass.
- Verify target URL or service version reflects the merged change.

---

STATUS "manual" — no existing tool; an operator must act:

## Deployment

Manual operator action required.

1. <step>
2. <step>

### Verification

- <check>

---

STATUS "none" — nothing to deploy:

## Deployment

None required.

Reason: <why — e.g. docs-only change, test-only change, non-runtime artifact>

---

STATUS "blocked" — deployment target/credentials/connector access could
not be determined:

## Deployment

Blocked.

Reason: <what is missing>
-->

## ZAI Spec Score

<!-- Paste the ## ZAI Spec Score block here for scored specs. Leave blank for unscored work. -->

Closes #<!-- issue number -->
