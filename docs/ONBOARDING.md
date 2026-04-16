# Repo Onboarding for ZAI Pipeline

## Prerequisites

- `gh` CLI authenticated with access to target repo
- `jq` installed
- Target repo cloned locally
- `ZZV_DISPATCH_TOKEN` available (export as env var or paste when prompted)

## Usage

```bash
./scripts/onboard-repo.sh --repo zi007lin/<name> --local-path /path/to/<name>
```

## What it does

1. **Sets `ZZV_DISPATCH_TOKEN` secret** on the target GitHub repo via `gh secret set`
2. **Installs `zilin-queue.yml` workflow** — copies the stub from `scripts/zilin-queue-stub.yml` into the target repo's `.github/workflows/` and pushes
3. **Adds routing entry** to `env/runner-routing.json` so the self-hosted runner knows where to find the local checkout

## After onboarding

The repo is ready to receive `repository_dispatch` events of type `zilin_impl`. Trigger an impl run with:

```bash
gh api repos/zi007lin/<name>/dispatches \
  -f event_type=zilin_impl \
  -f 'client_payload[issue_number]=<N>'
```
