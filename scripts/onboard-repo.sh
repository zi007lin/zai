#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROUTING_FILE="$SCRIPT_DIR/../env/runner-routing.json"
STUB_FILE="$SCRIPT_DIR/zilin-queue-stub.yml"

usage() {
  echo "Usage: $0 --repo zi007lin/<name> --local-path /path/to/<name>"
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

REPO_NAME="${REPO#*/}"

echo "Onboarding $REPO ..."

# Step 1: Set ZZV_DISPATCH_TOKEN secret on the target repo
echo "  [1/3] Setting ZZV_DISPATCH_TOKEN secret on $REPO"
gh secret set ZZV_DISPATCH_TOKEN --repo "$REPO" < <(gh secret list --repo zi007lin/zai --json name -q '.[] | select(.name=="ZZV_DISPATCH_TOKEN")' >/dev/null && \
  echo "Secret will be read from stdin — paste the token value:")

# If the token is already available locally, pipe it in; otherwise prompt
if [[ -n "${ZZV_DISPATCH_TOKEN:-}" ]]; then
  echo "$ZZV_DISPATCH_TOKEN" | gh secret set ZZV_DISPATCH_TOKEN --repo "$REPO"
  echo "    ✓ Secret set from environment variable"
else
  echo "    → Set ZZV_DISPATCH_TOKEN on $REPO manually or export ZZV_DISPATCH_TOKEN and re-run"
  echo "    Running: gh secret set ZZV_DISPATCH_TOKEN --repo $REPO"
  gh secret set ZZV_DISPATCH_TOKEN --repo "$REPO"
fi

# Step 2: Copy stub workflow to target repo and push
echo "  [2/3] Installing zilin-queue.yml in $REPO"
if [[ ! -d "$LOCAL_PATH" ]]; then
  echo "    ✗ Local path $LOCAL_PATH does not exist — clone the repo first"
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
echo "    ✓ Workflow pushed"

# Step 3: Add entry to runner-routing.json
echo "  [3/3] Adding $REPO to runner-routing.json"
if [[ ! -f "$ROUTING_FILE" ]]; then
  echo "{}" > "$ROUTING_FILE"
fi

TMP_FILE="$(mktemp)"
jq --arg repo "$REPO" --arg path "$LOCAL_PATH" \
  '. + {($repo): $path}' "$ROUTING_FILE" > "$TMP_FILE"
mv "$TMP_FILE" "$ROUTING_FILE"
echo "    ✓ Routing entry added"

echo ""
echo "✅ $REPO onboarded — ready for ZAI impl pipeline"
