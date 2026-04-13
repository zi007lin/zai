# 2026-04-12__research__zai-app-scorer-prereqs

**Repo:** `zi007lin/zai`
**Label:** `research`
**Branch:** `zai/research-app-scorer-prereqs`
**Reviewer:** daniel-silvers
**Blocks:** `2026-04-12__feat__zai-app-spec-scorer-page.md`

---

## Intent

Audit the ZAI repo to answer the two open questions that block impl of the spec scorer page. Produce a report saved to `issues/reports/2026-04-12__research__zai-app-scorer-prereqs.md` with exact answers and the recommended one-line fixes where applicable. ZiLin-Dev must not start the feat impl until this report is merged.

---

## Research Questions

### Q1 — Routing mechanism

**Question:** Does ZAI use React Router (`<Route path="/app">`) or file-based routing (Vite plugin, TanStack Router, or similar)?

**Why it matters:** The feat impl modifies `AppPage.tsx`. If routing is file-based, the file path IS the route — no additional registration needed. If React Router, a `<Route>` entry must be confirmed present or added. Getting this wrong means the page renders but the route 404s, or vice versa.

**Commands to run:**
```bash
# Find routing entrypoint
find src -name "AppPage*" 2>/dev/null
find src -name "router*" -o -name "routes*" 2>/dev/null
find src -name "main.tsx" -o -name "App.tsx" 2>/dev/null

# Check for React Router
grep -r "react-router" package.json 2>/dev/null
grep -r "BrowserRouter\|createBrowserRouter\|Route path" src/ 2>/dev/null | head -20

# Check for TanStack Router
grep -r "tanstack/router\|createFileRoute\|createRootRoute" src/ 2>/dev/null | head -10

# Check for Vite file-based routing plugins
grep -r "vite-plugin-pages\|vite-plugin-file-based\|generouted" package.json vite.config* 2>/dev/null
```

**Expected answer format:**
```
Routing: React Router v6
Route registration: src/App.tsx line 42
AppPage.tsx path: src/pages/AppPage.tsx
Action required: none — route already registered
```

---

### Q2 — Google Fonts CSP + font availability

**Question:** Are `DM Mono` and `Sora` loadable from Google Fonts on `zai.htu.io`, or is the CSP too restrictive?

**Why it matters:** The design spec requires `DM Mono` (monospace metrics/scores) and `Sora` (sans headings). If `fonts.googleapis.com` and `fonts.gstatic.com` are blocked by CSP, the impl must use fallback fonts defined in `zai-tokens.css` instead. Using the wrong fonts either breaks the visual design or triggers CSP errors in the browser console.

**Commands to run:**
```bash
# Check existing font imports
grep -r "googleapis\|gstatic\|font-face\|@import.*font" index.html src/ public/ 2>/dev/null | head -20

# Check CSP headers (wrangler config or _headers file)
find . -name "_headers" -o -name "wrangler*.toml" -o -name "wrangler*.jsonc" 2>/dev/null | xargs grep -l "Content-Security-Policy\|font-src" 2>/dev/null
cat _headers 2>/dev/null || echo "no _headers file"

# Check if any Google Fonts already load successfully in the project
grep -r "DM Mono\|Sora\|font-family" src/ public/ index.html 2>/dev/null | head -20

# Check Cloudflare Pages config for CSP
find . -name "*.toml" | xargs grep -l "header\|csp" 2>/dev/null
```

**Expected answer format:**
```
Google Fonts: ALLOWED — fonts.googleapis.com in font-src
DM Mono: not yet loaded — needs import added to index.html
Sora: not yet loaded — needs import added to index.html
Action required: add <link> to index.html (safe, no CSP changes needed)
```
OR:
```
Google Fonts: BLOCKED — font-src 'self' only in _headers
DM Mono fallback: 'Courier New', monospace
Sora fallback: system-ui, -apple-system, sans-serif
Action required: use fallback stack in zai-tokens.css, no index.html change
```

---

### Q3 — Existing test selectors that will break

**Question:** Do any existing e2e tests select against the `/app` route content (e.g., "Coming soon", "ZAI App" h1, or `AppPage` text)? If so, list the exact files and line numbers.

**Why it matters:** The feat impl replaces all `/app` content. Any hardcoded text selector on the old copy will fail. These must be updated in the same PR — not discovered post-merge.

**Commands to run:**
```bash
# Find all e2e tests referencing /app route
grep -rn "\/app\|AppPage\|Coming soon\|ZAI App\|spec generator" e2e/ 2>/dev/null

# Find component tests referencing AppPage
grep -rn "AppPage\|Coming soon" src/ 2>/dev/null
```

**Expected answer format:**
```
Affected files:
  e2e/responsive.spec.ts:34 — getByText('Coming soon')  → UPDATE to new h1
  e2e/navigation.spec.ts:18 — expect(page).toHaveTitle('ZAI App') → VERIFY still valid
No component tests affected.
```

---

### Q4 — Tailwind version and arbitrary value support

**Question:** Is ZAI using Tailwind v3 or v4? Does it support arbitrary CSS values (`text-[#1D9E75]`, `bg-[#111]`)?

**Why it matters:** The design uses specific hex values for the ZAI dark theme. If Tailwind v4 is in use (known issues with some arbitrary value syntaxes) or if the project uses a strict content config, the impl may need to use CSS custom properties via `zai-tokens.css` instead of Tailwind arbitrary values.

**Commands to run:**
```bash
# Tailwind version
grep "tailwindcss" package.json

# Config file
cat tailwind.config.* 2>/dev/null | head -40

# Check if arbitrary values are already used in codebase
grep -r "\[#" src/ 2>/dev/null | head -5
```

**Expected answer format:**
```
Tailwind: v4.0.14
Arbitrary values: supported — already used in src/
Action required: none
```

---

## Report Format

Claude Code must save the completed report to:
```
issues/reports/2026-04-12__research__zai-app-scorer-prereqs.md
```

Report structure:
```markdown
# Research Report: ZAI App Scorer Prereqs
**Date:** YYYY-MM-DD
**Repo:** zi007lin/zai
**Commit:** {HEAD SHA}

## Q1 — Routing
{exact answer + action required}

## Q2 — Fonts / CSP  
{exact answer + action required}

## Q3 — Broken test selectors
{exact answer — list file:line for each affected selector}

## Q4 — Tailwind
{exact answer + action required}

## Impl Amendment Required
{YES/NO}
{If YES: list exact changes needed in 2026-04-12__feat__zai-app-spec-scorer-page.md before impl runs}

## Cleared to impl
{YES/NO}
```

---

## Acceptance Criteria

- [ ] All 4 questions answered with exact file paths and line numbers where relevant
- [ ] Report saved to `issues/reports/2026-04-12__research__zai-app-scorer-prereqs.md`
- [ ] "Cleared to impl: YES/NO" stated explicitly at end of report
- [ ] If any amendment is required to the feat spec, the exact amendment is stated
- [ ] PR opened for daniel-silvers review
- [ ] No implementation code written — research only

---

## Subject Migration Summary

| | |
|---|---|
| What | Pre-impl audit for ZAI app scorer page — routing, fonts, tests, Tailwind |
| Blocks | `2026-04-12__feat__zai-app-spec-scorer-page.md` |
| State | Spec complete; not yet executed |
| Next action | `impl i 2026-04-12__research__zai-app-scorer-prereqs.md` → read report → run feat impl |
| Repo | `zi007lin/zai` |

---

## Files

```
issues/reports/2026-04-12__research__zai-app-scorer-prereqs.md  ← created by this research
```
