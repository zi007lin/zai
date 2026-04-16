# 2026-04-16 feat: ZAI multi-repo runner routing

**Issue:** #37
**Branch:** `zai/zzv-dispatch-token-repo-onboarding`
**Status:** partial — public repo changes complete, private layer + infra pending

## What changed (this repo)

### `.github/workflows/zilin-queue.yml`
- Runner label changed from `[self-hosted, contabo, zilin, zai]` to `[self-hosted, contabo-zilin]` (org-level runner)
- Removed checkout + pull steps — the router handles repo state
- Passes `--repo ${{ github.repository }}` to `implw` so the router knows which repo to target
- Uses `$ROUTER_PATH` env var instead of hardcoded local paths (privacy rule compliance)

### `scripts/zilin-queue-stub.yml`
- Updated to match the same routing pattern as the live workflow
- This is the template copied to new repos during onboarding

### `scripts/onboard-repo.sh`
- Removed routing table management (belongs in streettt-private, not this public repo)
- Simplified to two steps: set secret + install stub workflow
- Prints remaining manual steps (add routing entry, verify runner registration)

## Remaining work (streettt-private / infra)

- [ ] Create `env/runner-routing.json` with repo-to-path mapping
- [ ] Update `implw` command to accept `--repo` flag and look up path in routing table
- [ ] Re-register `contabo-zilin` runner at org level (`zi007lin`) instead of per-repo
- [ ] Set `ROUTER_PATH` env var on the Contabo runner environment

## Open question

Does org-level runner registration require daniel-silvers to re-approve runner permissions?

## Privacy note

The spec's stub workflow hardcoded `/home/zilin/dev/streettt-private`. This was replaced
with `$ROUTER_PATH` env var to comply with the public repo privacy rule (no local
filesystem paths in public repos).
