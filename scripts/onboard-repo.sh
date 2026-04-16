#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STUB_FILE="$SCRIPT_DIR/zilin-queue-stub.yml"

usage() {
  echo "Usage: $0 --repo zi007lin/<name> --local-path /path/to/<name>"
  echo ""
  echo "Onboards a new HTU repo to the ZAI impl pipeline."
  echo "Requires: gh CLI authenticated, ZZV_DISPATCH_TOKEN in env or stdin."
  exit 1
}

REPO=""
LOCAL_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --local-path) LOCAL_PATH="$2"; shift 2 ;;
    *) usage ;;
  esac
done

if [[ -z "$REPO" || -z "$LOCAL_PATH" ]]; then
  usage
fi

echo "Onboarding $REPO ..."

# Step 1: Set ZZV_DISPATCH_TOKEN secret on the target repo
echo "  [1/2] Setting ZZV_DISPATCH_TOKEN secret on $REPO"
if [[ -n "${ZZV_DISPATCH_TOKEN:-}" ]]; then
  echo "$ZZV_DISPATCH_TOKEN" | gh secret set ZZV_DISPATCH_TOKEN --repo "$REPO"
  echo "    done — secret set from environment variable"
else
  echo "    Set ZZV_DISPATCH_TOKEN on $REPO manually or export ZZV_DISPATCH_TOKEN and re-run"
  echo "    Running: gh secret set ZZV_DISPATCH_TOKEN --repo $REPO"
  gh secret set ZZV_DISPATCH_TOKEN --repo "$REPO"
fi

# Step 2: Copy stub workflow to target repo and push
echo "  [2/2] Installing zilin-queue.yml in $REPO"
if [[ ! -d "$LOCAL_PATH" ]]; then
  echo "    Error: $LOCAL_PATH does not exist — clone the repo first"
  exit 1
fi

WORKFLOW_DIR="$LOCAL_PATH/.github/workflows"
mkdir -p "$WORKFLOW_DIR"
cp "$STUB_FILE" "$WORKFLOW_DIR/zilin-queue.yml"

pushd "$LOCAL_PATH" > /dev/null
git add .github/workflows/zilin-queue.yml
git commit -m "chore: add ZiLin queue listener workflow"
git push origin "$(git branch --show-current)"
popd > /dev/null
echo "    done — workflow pushed"

echo ""
echo "Onboarded $REPO"
echo ""
echo "Remaining manual steps:"
echo "  1. Add routing entry to runner-routing.json in streettt-private:"
echo "     \"$REPO\": \"$LOCAL_PATH\""
echo "  2. Ensure contabo-zilin runner is registered at org level (zi007lin)"
