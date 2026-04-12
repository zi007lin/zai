Scaffold ZAI as a full React + Vite + Tailwind + CF Workers + Hono app — same stack as htu.io and streettt.com.

## Intent

Set up zi007lin/zai with the same foundation as htu.io and streettt:
- React 18 + Vite + Tailwind v4
- CF Workers (Hono) for API
- CF Pages for hosting
- Three environments: dev.zai.htu.io / demo.zai.htu.io / zai.htu.io
- wrangler.dev.toml / wrangler.demo.toml / wrangler.jsonc
- deploy scripts matching htu.io pattern
- i18n via i18next (same 9 languages as streettt)
- HTU Foundation base components

## Reference repos

Use these as the pattern:
```bash
# Check htu-foundation structure
ls ~/dev/htu-foundation/src/
cat ~/dev/htu-foundation/package.json
cat ~/dev/htu-foundation/vite.config.js 2>/dev/null || cat ~/dev/htu-foundation/vite.config.ts 2>/dev/null

# Check streettt structure for CF Workers pattern
cat ~/dev/streettt/package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(list(d.get('scripts',{}).items()))"
cat ~/dev/streettt/wrangler.dev.toml | head -30
```

## Tasks

### Step 1 — Init React + Vite project

```bash
cd ~/dev/zai
npm create vite@latest . -- --template react-ts --force
npm install
npm install tailwindcss @tailwindcss/vite
npm install hono
npm install i18next react-i18next
npm install -D wrangler
```

### Step 2 — Create wrangler configs

**wrangler.dev.toml:**
```toml
name = "zai-dev"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"

[vars]
APP_ENV = "dev"
APP_URL = "https://dev.zai.htu.io"
HTU_ENV = "dev"

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
run_worker_first = true
```

**wrangler.demo.toml:**
```toml
name = "zai-demo"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"

[vars]
APP_ENV = "demo"
APP_URL = "https://demo.zai.htu.io"
HTU_ENV = "demo"

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
run_worker_first = true
```

**wrangler.jsonc:**
```jsonc
{
  "name": "zai",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "vars": {
    "APP_ENV": "prod",
    "APP_URL": "https://zai.htu.io",
    "HTU_ENV": "prod"
  },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": true
  }
}
```

### Step 3 — Add deploy scripts to package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy:dev": "npm run build && npx wrangler pages deploy dist/ --project-name zai --branch dev",
    "deploy:demo": "npm run build && npx wrangler pages deploy dist/ --project-name zai --branch demo",
    "deploy:full": "npm run build && npx wrangler pages deploy dist/ --project-name zai --branch main"
  }
}
```

### Step 4 — Create basic app structure

```
src/
  main.tsx          — React entry point
  App.tsx           — Router + layout
  pages/
    HomePage.tsx    — ZAI landing (SDD pitch + RGB demo placeholder)
    AppPage.tsx     — ZAI tool (placeholder — build at hackathon)
    PricingPage.tsx — Editions table (Free/Pro/Pro+/Enterprise)
  components/
    TopBar.tsx      — HTU logo + nav
    Footer.tsx      — "Built on HTU Foundation"
  worker/
    index.ts        — Hono CF Worker
  locales/
    en.json         — English base strings
```

### Step 5 — HomePage content

The landing page should display:
- ZAI hero: "Zero Ambiguity Intelligence"
- Tagline: "The engine of Spec Driven Development"
- By: High Tech United (linked to htu.io)
- HTU shield logo (from existing README)
- RGB color demo: two sliders (ambiguity level) → live color preview
- CTA: "Try ZAI" → /app (coming soon)
- Link to zzv.io

### Step 6 — CF Pages build config

Update CF Pages project to use build command:
```bash
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/6afb21798ddfb21825ff5b1541b66297/pages/projects/zai" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"build_config":{"build_command":"npm run build","destination_dir":"dist","root_dir":""}}'
```

### Step 7 — Deploy to dev

```bash
npm run deploy:dev
```

Verify `dev.zai.htu.io` returns 200 and shows the ZAI landing page.

### Step 8 — Commit and PR

```bash
git add .
git commit -m "feat: ZAI React + Vite + Tailwind + CF Workers scaffold — same stack as htu.io"
git push origin dev
```

PR: `zai/scaffold-react-app` → base: `main`
Reviewer: daniel-silvers

## Acceptance Criteria

- [ ] `npm run dev` starts local dev server
- [ ] `npm run build` produces `dist/`
- [ ] `npm run deploy:dev` deploys to dev.zai.htu.io
- [ ] `dev.zai.htu.io` returns 200 (no more 522)
- [ ] ZAI landing page renders with hero + RGB demo placeholder
- [ ] wrangler.dev.toml, wrangler.demo.toml, wrangler.jsonc all present
- [ ] Same `run_worker_first = true` pattern as streettt
- [ ] i18next wired (en base strings)
- [ ] PR opened for daniel-silvers
- [ ] deploy:dev, deploy:demo, deploy:full scripts all work

## Run Instruction

On WSL:
```bash
cp /mnt/c/Users/zilin/Downloads/2026-04-12__feat__zai-react-scaffold.md \
   ~/dev/zai/issues/

gh issue create \
  --title "feat: ZAI React + Vite + CF Workers scaffold — same stack as htu.io" \
  --body-file ~/dev/zai/issues/2026-04-12__feat__zai-react-scaffold.md \
  --repo zi007lin/zai

cd ~/dev/streettt && claude
# implw zi007lin/zai#<number>
```

## Subject Migration Summary

**What this builds:** Full React + Vite + Tailwind + CF Workers foundation for
ZAI. Same stack as htu.io and streettt. Fixes the 522 error on dev.zai.htu.io.

**Current state:** zai repo has only README and branch structure. No app code.

**Next after this:**
- Issue C: GitHub OAuth with repo scope
- Issue D: ZAI spec generator core
- Issue E: Translation round-trip + RGB score
