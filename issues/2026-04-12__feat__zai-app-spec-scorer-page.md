# 2026-04-12__feat__zai-app-spec-scorer-page

**Repo:** `zai` (zi007lin/zai)
**Label:** `feat`
**Branch:** `zai/app-spec-scorer-page`
**Reviewer:** daniel-silvers
**Route:** `/app`

---

## Spec Validation Score

| Section | Status |
|---|---|
| Intent | ✅ PASS |
| Decision Tree | ✅ PASS |
| Draft-of-thoughts | ✅ PASS |
| Final Spec | ✅ PASS |
| Game Theory Review | ✅ PASS |
| Subject Migration Summary | ✅ PASS |
| Files list | ✅ PASS |

**Score: 7 / 7 — cleared to ship**

---

## Intent

Replace the "Coming soon" placeholder on `/app` with a fully functional spec scoring page. Users upload a `.md` spec file, get a deterministic 7-section score rendered with animated breakdown bars, see pre-deploy gates extracted from the spec, and can download the scored spec or proceed to impl. The page also includes a worked example, a downloadable template, and a pipeline explainer. No backend required for v1 — all scoring runs client-side via the rubric logic ported to TypeScript.

---

## Decision Tree

**Question:** Where does the scoring run in v1?

| Option | Runtime | Backend needed | Latency | Decision |
|---|---|---|---|---|
| Client-side TS rubric parser | Browser | ❌ None | Instant | ✅ Chosen — ships fast, zero infra |
| API call to ZiLin-BS on Contabo | Server | ✅ Yes | 200–600ms | ❌ Defer to v2 — blocked on BS deploy |
| Cloudflare Worker | Edge | ✅ Yes | ~50ms | ❌ Defer to v2 |

**Decision:** Client-side for v1. Port `classify-spec.ts` rubric checks to a browser-safe `scoreSpec(markdown: string)` function in `src/lib/scoreSpec.ts`. When ZiLin-BS API ships, swap the scoring call — UI does not change.

**Trigger for change:** ZiLin-BS classify API ships → replace `scoreSpec()` call with `fetch('/api/classify')`. UI layer unchanged.

---

## Draft-of-thoughts

The upload flow is the first impression. It must feel like a real tool, not a demo. Key detail: the score bars animate sequentially section by section (200ms stagger), mimicking a real evaluation running. The big score counter increments as each section passes — creates a sense of the tool actually working through the file.

Client-side parsing is completely sufficient. The rubric checks are structural (heading presence, table presence, string matching, checkbox count). A ~200-line TS function covers all 7 sections. The result is indistinguishable from a server call.

Download template: generate a pre-filled `.md` template blob in the browser — no CDN needed. This is the primary growth hook for new users who don't have a spec yet.

Dark theme: the page inherits the existing ZAI dark bg (`#0a0a0a`). All components use CSS custom properties already in the ZAI design system. No new color tokens needed.

Font pairing: `DM Mono` for scores/metrics/code, `Sora` for headings/body. Both available on Google Fonts. The mono accent on section names and the score number is the visual anchor.

---

## Final Spec

### 1. Route

`/app` — replaces `AppPage.tsx` content entirely. Keep the existing page shell (navbar, footer).

> **Amendment (research PR #14 · edf1174):** ZAI uses a hand-rolled state router in `src/App.tsx` — not React Router or TanStack. The `/app` route is already registered. No `<Route>` changes needed. Modify `AppPage.tsx` only.

### 2. Page sections (top to bottom)

#### A. Header
```
[eyebrow] ZAI · spec scorer
[h1] Score your spec before it ships
[subtitle] Upload a spec file to get a deterministic 7-section score.
           No LLM judgment — pure structural analysis.
```

#### B. Main action area (two-column grid, collapses to single on mobile)

**Left — Upload zone:**
- Dashed border box, full height
- Drag-and-drop target (`dragover`, `drop` events)
- Click to open file picker (accept `.md` only)
- States: empty | dragging | loaded
- Two CTAs: "Score a spec" (primary) | "Download template ↓" (outline)
- After upload: shows filename + "Scored · {ISO timestamp} · rubric v1.0.0"

**Right — Score panel** (hidden until file loaded, animates in):
- Large score counter `N/7` in DM Mono, teal color
- Sub-label: "evaluating…" → "cleared to ship" or "N sections failed"
- Status badge: "RUNNING" → "7/7 PASS" (green) or "N/7 FAIL" (red)
- 7 section rows: name | animated bar | PASS/SKIP/FAIL pill
  - Bars fill sequentially, 200ms stagger per section
  - Score counter increments as each PASS lands
- Pre-deploy gates section (if `gates[]` non-empty): amber dot list
- Action buttons: "Download scored spec ↓" | "Run impl →" (sendPrompt equivalent — copies impl command to clipboard)

#### C. Example section

Two-column: spec file preview (monospace, syntax-highlighted with color classes) | score result card.

The example uses the real `2026-04-12__feat__zai-hero-tagline-governance.md` scored output as data — hardcoded, not dynamic.

#### D. Pipeline explainer

Three-step horizontal flow (responsive → vertical on mobile):
```
[01 Write spec] → [02 classify spec] → [03 impl runs]
```
Each step: number | name | 2-line description. Middle step accented with teal border.

#### E. Footer stamp
```
ZAI · Zero Ambiguity Intelligence · HTU Foundation · zzv.io
```
DM Mono, small, muted. Consistent with existing footer.

### 3. `src/lib/scoreSpec.ts` — client-side rubric

```typescript
export type SectionStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface ScoreResult {
  rubric_version: string;
  score: string;
  passed: boolean;
  evaluated_at: string;
  sections: Record<string, SectionStatus>;
  gates: string[];
}

export function scoreSpec(markdown: string): ScoreResult {
  const checks = {
    intent: checkIntent(markdown),
    decision_tree: checkDecisionTree(markdown),
    draft_of_thoughts: checkDraftOfThoughts(markdown),
    final_spec: checkFinalSpec(markdown),
    game_theory: checkGameTheory(markdown),
    migration_summary: checkMigrationSummary(markdown),
    files_list: checkFilesList(markdown),
  };
  const gates = extractGates(markdown);
  const passCount = Object.values(checks).filter(s => s === 'PASS').length;
  const skipCount = Object.values(checks).filter(s => s === 'SKIP').length;
  const required = 7 - skipCount;
  const passed = Object.values(checks).every(s => s !== 'FAIL');
  return {
    rubric_version: '1.0.0',
    score: `${passCount + skipCount}/7`,
    passed,
    evaluated_at: new Date().toISOString(),
    sections: checks,
    gates,
  };
}
```

Each `checkX()` function uses regex against the markdown string. No external dependencies.

**Section check rules (implement exactly):**

| Section | Check | Method |
|---|---|---|
| intent | `## Intent` heading exists + word count ≤ 150 below it | regex + split |
| decision_tree | heading exists + markdown table present + "Trigger for change" string exists | regex |
| draft_of_thoughts | heading exists → PASS; absent → SKIP (never FAIL) | regex |
| final_spec | heading exists + `## Acceptance Criteria` exists + ≥ 3 `- [ ]` lines below it | regex + count |
| game_theory | heading exists + "Who benefits", "Abuse vector", "Mitigation" all present | string search |
| migration_summary | heading exists + table with "Open questions" row + value not empty | regex |
| files_list | heading exists + ``` code block present after it | regex |

**Gate extraction:**
```
Find lines matching: /- \[ \] \*\*Pre-deploy gate/i
Extract the text after the pattern
Return as string[]
```

### 4. Fonts

> **Amendment (research PR #14 · edf1174):** No `_headers` file exists → no CSP. Google Fonts loadable via plain `<link>`. `DM Mono` and `Sora` not yet loaded — add the following.

Add to `index.html` `<head>` (before existing `<link>` tags):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@300;400;600;700&display=swap" rel="stylesheet">
```

Add to `src/styles.css` (or global CSS file — confirm path with `find src -name "*.css" | head -5`):
```css
:root {
  --font-mono-zai: 'DM Mono', 'Courier New', monospace;
  --font-sans-zai: 'Sora', system-ui, -apple-system, sans-serif;
}
```

### 5. Color tokens (add to ZAI design system)

```css
--zai-teal: #1D9E75;
--zai-purple: #7F77DD;
--zai-amber: #EF9F27;
--zai-muted: #666;
--zai-border: #222;
--zai-card: #111;
```

### 6. Template download

Blob-based client download (no CDN, no API):
```typescript
const template = `# YYYY-MM-DD__feat__title\n\n## Intent\n\n...\n`;
const blob = new Blob([template], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
// trigger anchor click, revoke after
```

Template content: the full 7-section skeleton from `spec-rubric.yaml`, pre-filled with inline guidance comments.

### 7. Animation spec

- Score panel: `opacity: 0 → 1`, `transform: translateY(8px) → 0`, duration 300ms, easing `cubic-bezier(0.4, 0, 0.2, 1)`
- Bar fills: each bar `width: 0 → 100%`, 600ms, stagger 200ms per section
- Score counter: increments integer by integer as each PASS section's bar completes
- All animations: respect `prefers-reduced-motion` — skip transitions, show final state instantly

---

## Game Theory Review

**Who benefits:** ZAI users get immediate, trustworthy spec quality feedback before wasting an impl run. The page demonstrates ZAI's core value prop (Zero Ambiguity) in the product itself — the tool eats its own dog food.

**Abuse vector:** User edits spec to pass structural checks without meaningful content ("Who benefits: yes"). Client-side scoring cannot catch semantic emptiness. Mitigation: scoring is a floor, not a ceiling. The page copy should make this explicit: "Structural checks. Human review still required."

**Abuse vector 2:** User submits a non-spec `.md` file (e.g., README). The rubric will likely score 0–2/7. This is correct behavior — no special handling needed.

**Adoption incentive:** The "Download template" button is the primary growth hook. A user who downloads the template is primed to return with a spec. The template includes inline guidance that reinforces the ZiLin Command methodology.

---

## Acceptance Criteria

- [ ] `/app` route renders the spec scorer page with all 4 sections
- [ ] Drag-and-drop file upload works, accepts `.md` only
- [ ] Click-to-upload via file picker works
- [ ] Score panel is hidden on load, animates in after file is selected
- [ ] Bars animate sequentially with 200ms stagger
- [ ] Score counter increments as each PASS lands
- [ ] Pre-deploy gates appear as amber dot list when present in spec
- [ ] "Download template" generates and downloads `spec-template.md`
- [ ] "Download scored spec" downloads the original markdown + appended score block
- [ ] "Run impl →" copies `impl i <filename>` to clipboard, shows "Copied!" toast
- [ ] Example section renders with hardcoded `zai-hero` spec data
- [ ] Pipeline explainer renders 3 steps, collapses to vertical on mobile ≤ 560px
- [ ] DM Mono + Sora fonts load correctly
- [ ] All colors match ZAI dark theme (`#0a0a0a` bg)
- [ ] `prefers-reduced-motion` respected — no animation
- [ ] `src/lib/scoreSpec.ts` has unit tests for all 7 section checks
- [ ] 15/15 e2e tests pass (existing suite + new upload flow tests)
- [ ] "Coming soon" text is gone from `/app`

---

## Subject Migration Summary

| | |
|---|---|
| What | ZAI `/app` — full spec scorer page replacing "Coming soon" |
| State | Spec complete 7/7; **2 amendments applied** (research PR #14 · edf1174); cleared to impl |
| Open questions | (1) Does ZAI use React Router or file-based routing? Confirm before modifying `AppPage.tsx`. (2) Existing e2e selector `locator("main h1").first()` — update after h1 copy changes. |
| Next action | `impl i 2026-04-12__feat__zai-app-spec-scorer-page.md` |
| Repo | `zi007lin/zai` |

---

## Files

```
src/pages/AppPage.tsx              ← replace content entirely
src/lib/scoreSpec.ts               ← new (client-side rubric parser)
src/lib/scoreSpec.test.ts          ← new (unit tests, 7 section checks)
src/components/UploadZone.tsx      ← new
src/components/ScorePanel.tsx      ← new
src/components/ScoreExample.tsx    ← new
src/components/PipelineSteps.tsx   ← new
index.html                         ← add Google Fonts import
src/styles/zai-tokens.css          ← add font + color tokens (or globals.css)
e2e/app-scorer.spec.ts             ← new e2e tests
```

Confirm component file locations:
```bash
find src -name "AppPage*" -o -name "pages" -type d 2>/dev/null
```
