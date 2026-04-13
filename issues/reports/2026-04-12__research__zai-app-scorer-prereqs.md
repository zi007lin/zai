# Research Report: ZAI App Scorer Prereqs
**Date:** 2026-04-12
**Repo:** zi007lin/zai
**Commit:** 1ffdeb2e15d9d5065ba7c4eaec4f0fd2f0b01dc6 (main at time of research)
**Research branch:** zai/research-app-scorer-prereqs

---

## Q1 — Routing

**Answer:**

```
Routing: Custom hand-rolled state router (no library)
Route registration: src/App.tsx lines 5, 11, 32 + src/components/TopBar.tsx lines 53, 140
AppPage.tsx path: src/pages/AppPage.tsx
Action required: none — /app already registered and linked from nav
```

**Evidence:**

- `package.json` has **no** router dependency — `react-router`, `@tanstack/router`, `vite-plugin-pages`, `generouted` all absent.
- `src/App.tsx` implements routing by hand:
  - Line 5: `import AppPage from "./pages/AppPage";`
  - Lines 9–13: `routeFromPath()` maps `pathname.startsWith("/app")` → `"app"`
  - Line 17: `useState<Route>` seeded from `window.location.pathname`
  - Line 22: `navigate()` uses `window.history.pushState`
  - Line 32: `{route === "app" && <AppPage />}`
- `src/components/TopBar.tsx:53,140`: desktop + mobile nav links to `/app`, wired to `onNavigate("app")`.

**Implication for feat impl:** Replacing content inside `src/pages/AppPage.tsx` is sufficient. The file has no route-table registration to update. If the feat impl needs sub-routes under `/app` (e.g., `/app/scorer`, `/app/history`), it must extend `routeFromPath()` and the router switch in `App.tsx:31-35` — there is **no dynamic route matcher**, only literal prefix checks.

---

## Q2 — Fonts / CSP

**Answer:**

```
Google Fonts: ALLOWED — no CSP configured at all
_headers file: ABSENT (only public/_redirects exists)
Wrangler CSP: NONE — wrangler.dev.toml / wrangler.demo.toml / wrangler.jsonc carry only [vars], no headers block
DM Mono: not loaded — needs import added to index.html
Sora: not loaded — needs import added to index.html
Existing font stack: src/styles.css:13 — ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
Action required: add <link rel="preconnect"> + Google Fonts <link> to index.html (safe, no CSP change)
```

**Evidence:**

- `public/` contains only `_redirects`. No `_headers` file anywhere in the repo (verified via `ls public/` and `find . -name _headers`).
- Cloudflare Pages serves no CSP by default when there's no `_headers` file — `font-src` is effectively unrestricted.
- `index.html` has zero `<link>` tags (just the Vite module entry).
- `src/styles.css:13` is the only font-family declaration in the repo.
- Grep for `googleapis|gstatic|@font-face|DM Mono|Sora` across `src/`, `public/`, `index.html` → **no hits** (all spec file hits excluded).

**Implication for feat impl:** The impl can add DM Mono + Sora via standard Google Fonts `<link>` tags in `index.html` without any CSP work. Recommended snippet for the impl:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
```

Then extend `src/styles.css` `@theme` (Tailwind v4) or raw CSS with `--font-sans: "Sora", ...;` / `--font-mono: "DM Mono", ...;`.

---

## Q3 — Broken test selectors

**Answer:**

```
Affected files: none
```

**Evidence:**

- Grep for `AppPage|Coming soon|ZAI App|spec generator|/app` across `e2e/`:
  - `e2e/responsive.spec.ts` does **not** reference any `/app` content. It only hits `/` and selects `main h1` (generic), plus `ZAI` logo link and `htu.io` link.
- Grep across `src/` for `AppPage|Coming soon`: only the source files themselves:
  - `src/App.tsx` — router import/switch (structural, not copy)
  - `src/pages/AppPage.tsx` — the page being replaced
  - `src/components/TopBar.tsx` — `href="/app"` link (structural)
  - `src/locales/en.json:21-22` — `app.title` / `app.coming_soon` keys used only by `AppPage.tsx`

**Implication for feat impl:** No e2e test needs updating. The impl should delete or repurpose the `app.title` / `app.coming_soon` i18n keys if they're no longer referenced, and add new keys for the scorer UI. TopBar's `/app` link continues to work unchanged.

---

## Q4 — Tailwind

**Answer:**

```
Tailwind: v4.2.2 (installed) via @tailwindcss/vite plugin
Config file: none — Tailwind v4 uses CSS-based @theme (not currently declared)
Arbitrary values: supported (core Tailwind v4 feature)
Existing usage of arbitrary hex in src/: none yet
Action required: none — arbitrary hex classes like text-[#1D9E75] and bg-[#111] work out of the box
```

**Evidence:**

- `package.json` declares `"tailwindcss": "^4.0.0"` and `"@tailwindcss/vite": "^4.0.0"`.
- `node -p "require('./node_modules/tailwindcss/package.json').version"` → `4.2.2`.
- `ls tailwind.config.*` → no config file exists. Tailwind v4 defaults apply.
- `vite.config.ts` registers `tailwindcss()` plugin; `src/styles.css` starts with `@import "tailwindcss";`.
- Grep for `\[#` in `src/` → zero hits; feat impl will be the first to introduce arbitrary hex classes.

**Implication for feat impl:** Arbitrary values are safe to use. Optionally the impl can centralize palette via a Tailwind v4 `@theme` block in `src/styles.css`:

```css
@theme {
  --color-zai-green: #1D9E75;
  --color-zai-bg:    #111;
}
```

…then use `text-zai-green` / `bg-zai-bg` instead of arbitrary brackets. Either approach works; `@theme` is cleaner if the palette is reused across ≥3 components.

---

## Impl Amendment Required

**YES** — two small amendments to `2026-04-12__feat__zai-app-spec-scorer-page.md` before it runs:

1. **Routing note**: Replace any language assuming React Router or file-based routing with:
   > "Routing is a hand-rolled state router in `src/App.tsx`. The `/app` route is already wired (line 32). Replacing `src/pages/AppPage.tsx` content is sufficient. If sub-routes are needed, extend `routeFromPath()` and the switch in `App.tsx`."

2. **Font loading instruction**: Add a concrete step to the feat spec:
   > "Add to `index.html` inside `<head>`:
   > ```html
   > <link rel="preconnect" href="https://fonts.googleapis.com" />
   > <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   > <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
   > ```
   > Then declare `--font-sans` and `--font-mono` in `src/styles.css`. No CSP change needed — `_headers` does not exist and CF Pages serves no default CSP."

No test-selector amendment is needed (Q3 is clear).
No Tailwind amendment is needed (Q4 is clear); feat impl is free to use arbitrary brackets or add a `@theme` palette block — reviewer discretion.

---

## Cleared to impl

**YES** — once the two amendments above are applied to `2026-04-12__feat__zai-app-spec-scorer-page.md`, the feat impl can run. No blocking unknowns remain.
