# 2026-04-16__feat__zai-multi-repo-runner-routing

## Intent

The Contabo self-hosted runner currently requires a separate `zilin-queue.yml` workflow file per repo, with the local dev path hardcoded inside each workflow. As HTU grows to include `zai`, `streettt`, `nyqex`, `medicshare`, `shoplement`, and future projects, this pattern creates duplication and maintenance overhead. Replace per-repo hardcoded paths with a single ZAI routing table on Contabo that maps any repo to its local dev path — one runner, all HTU repos, zero duplication.

---

## Decision Tree

**Question:** Where should the repo-to-path routing table live?

| Option | Risk | Decision |
|---|---|---|
| Routing table in `streettt-private` env config | low — already secured | ✅ Chosen |
| Routing table hardcoded in each workflow file | high — duplication, drift | ❌ Current broken state |
| Routing table in ZAI CF Worker | medium — network dependency | ❌ Rejected |
| Routing table as GitHub Actions env variable | medium — visible in logs | ❌ Rejected |

**Trigger for change:** If routing needs dynamic registration (new repos auto-discovered), promote to a ZAI registry API.

---

## Draft-of-thoughts

- The Contabo runner is registered at repo level currently — needs to be registered at org level (`zi007lin`) to serve all repos
- The `zilin-queue.yml` workflow in each repo can be a thin stub that passes `github.repository` in the dispatch payload
- The actual routing happens in `streettt-private` Layer 2 impl command which already runs on Contabo
- Routing table: `REPO → local_dev_path` stored in `streettt-private/env/runner-routing.json`
- The impl command reads `github.repository` from the dispatch payload and looks up the path
- New repos just need: (1) the stub workflow file, (2) one line added to the routing table
- Future: ZAI `Run impl →` button passes `repo` in dispatch payload automatically — no manual workflow needed per repo

---

## Final Spec

### Routing table location

```json
// streettt-private/env/runner-routing.json
{
  "zi007lin/zai":            "/home/zilin/dev/zai",
  "zi007lin/streettt":       "/home/zilin/dev/streettt",
  "zi007lin/nyqex":          "/home/zilin/dev/nyqex",
  "zi007lin/htu-foundation": "/home/zilin/dev/htu-foundation",
  "zi007lin/medicshare":     "/home/zilin/dev/medicshare",
  "zi007lin/shoplement":     "/home/zilin/dev/shoplement"
}
```

### Stub workflow (same file for every repo)

```yaml
# .github/workflows/zilin-queue.yml
name: ZiLin Queue Listener

on:
  repository_dispatch:
    types: [zilin_impl]

jobs:
  impl:
    runs-on: [self-hosted, contabo-zilin]
    steps:
      - name: Dispatch to ZAI router
        run: |
          cd /home/zilin/dev/streettt-private
          claude -p "implw ${{ github.event.client_payload.issue_number }} --repo ${{ github.repository }}"
```

### Layer 2 impl command update

The `implw` command reads `--repo` flag, looks up path in `runner-routing.json`, changes to that directory before running impl:

```typescript
const repo = args.repo ?? 'zi007lin/streettt'
const routing = JSON.parse(fs.readFileSync('env/runner-routing.json', 'utf8'))
const devPath = routing[repo]
if (!devPath) throw new Error(`Unknown repo: ${repo}. Add to env/runner-routing.json.`)
process.chdir(devPath)
// ... rest of impl
```

### Runner registration

Register `contabo-zilin` runner at **org level** (`zi007lin`) instead of per-repo:

```bash
# On Contabo — re-register runner at org level
./config.sh --url https://github.com/zi007lin \
  --token <ORG_RUNNER_TOKEN> \
  --name contabo-zilin \
  --labels contabo-zilin
```

### Adding a new HTU repo (future workflow)

1. Add one line to `runner-routing.json`
2. Copy stub `zilin-queue.yml` to new repo's `.github/workflows/`
3. Done — no other changes needed

---

## Acceptance Criteria

- [ ] `runner-routing.json` created in `streettt-private/env/` with all current HTU repos
- [ ] `implw` command reads `--repo` flag and routes to correct local dev path
- [ ] Stub `zilin-queue.yml` passes `github.repository` in dispatch payload
- [ ] Contabo runner registered at org level (`zi007lin`) not per-repo
- [ ] Adding a new repo requires only routing table entry + stub workflow file
- [ ] Report saved to `issues/2026-04-16__feat__zai-multi-repo-runner-routing.md`

---

## Game Theory Review

**Who benefits:** Every HTU project gets the full ZAI impl pipeline automatically — ZiLin adds a new repo and it works in minutes.

**Abuse vector:** A compromised repo could dispatch impl to run arbitrary commands on Contabo via the routing table.

**Mitigation:** Routing table is read-only from `streettt-private/env/` which requires STREETTT_PRIVATE_TOKEN. Only repos in the explicit allowlist can route — unknown repos throw and halt immediately.

---

## Subject Migration Summary

| | |
|---|---|
| What | ZAI multi-repo routing table — one Contabo runner serves all HTU repos |
| State | Spec complete; not yet implemented |
| Open questions | Does org-level runner registration require daniel-silvers to re-approve runner permissions? |
| Next action | `impl i 2026-04-16__feat__zai-multi-repo-runner-routing.scored.md` |

---

## Files

```
streettt-private/env/runner-routing.json
streettt-private/src/commands/implw.ts
zi007lin/zai/.github/workflows/zilin-queue.yml
zi007lin/streettt/.github/workflows/zilin-queue.yml
```

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** feat
- **Evaluated at:** 2026-04-16T05:28:49.891Z
- **Score:** 7/7
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| decision_tree | PASS |
| draft_of_thoughts | PASS |
| final_spec | PASS |
| game_theory | PASS |
| migration_summary | PASS |
| files_list | PASS |

_Source: 2026-04-16__feat__zai-multi-repo-runner-routing.md_
