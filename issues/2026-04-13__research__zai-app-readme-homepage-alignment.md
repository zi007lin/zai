# 2026-04-13__research__zai-app-readme-homepage-alignment

**Repo:** `zi007lin/zai`
**Label:** `research`
**Branch:** `zai/research-app-readme-homepage-alignment`
**Reviewer:** daniel-silvers
**Context:** `/app` spec scorer page shipped as PR #15 (5678dc8). Validate alignment with README.md and Home page before promoting to demo.

---

## Intent

Audit three surfaces — the live `/app` page, `README.md`, and the `/` Home page — for copy, positioning, and feature alignment. Identify any contradictions, stale claims, or gaps where one surface says something the others don't support. Produce a report with a prioritized action list. No code changes in this PR.

---

## Research Questions

### Q1 — README.md vs `/app` feature claims

**Question:** Does `README.md` describe the app accurately given what `/app` now does? Specifically:
- Does README mention spec scoring, the 7-section rubric, or the classify command?
- Does it describe the upload flow, score breakdown, or template download?
- Are there any claims in README that are now false or outdated (e.g., "coming soon", "in development", feature lists that don't match what shipped)?

**Commands to run:**
```bash
cat README.md
```

**Expected answer format:**
```
README status: STALE / CURRENT / MISSING
Stale claims:
  - Line 14: "spec generator in active development" → now live at /app
  - Line 28: no mention of scoring, rubric, or classify
Missing sections:
  - No "Getting started" / how to score a spec
  - No link to /app
Accurate claims:
  - Line 5: ZAI = Zero Ambiguity Intelligence ✅
  - Line 8: governance over guardrails ✅
```

---

### Q2 — Home page (`/`) vs `/app` positioning

**Question:** Is the Home page copy consistent with what `/app` now delivers? Check:
- Does the hero tagline on `/` align with the scorer page's "Score your spec before it ships" framing?
- Does the Home page CTA ("Try ZAI", "See pricing") land users on `/app` correctly?
- Does the ambiguity viz widget on `/` connect conceptually to the 7-section scoring on `/app`? Is there a narrative thread or a jarring disconnect?
- Any copy on `/` that references "coming soon" or promises features not yet on `/app`?

**Commands to run:**
```bash
# Find Home page component
find src -name "HomePage*" -o -name "home*" 2>/dev/null
cat src/pages/HomePage.tsx 2>/dev/null || cat src/pages/home.tsx 2>/dev/null

# Check nav links and CTAs
grep -r "href.*app\|to.*app\|Try ZAI\|Get started" src/ 2>/dev/null | head -20

# Check for any remaining "coming soon" copy
grep -rn "coming soon\|Coming soon\|in development\|in active" src/ public/ index.html 2>/dev/null
```

**Expected answer format:**
```
Home → /app CTA: WORKS / BROKEN / MISSING
Hero tagline: "Most AI tools give you guardrails..." ✅ consistent with /app framing
Ambiguity viz → scorer narrative: CONNECTED / DISCONNECTED
  - viz shows ambiguity as a color signal
  - /app shows ambiguity as a 7-section score
  - bridge copy needed / not needed
Stale copy on Home:
  - none found / [list]
```

---

### Q3 — README.md vs Home page consistency

**Question:** Does README describe the product the same way the Home page does? Check:
- Tagline match: does README use the governance tagline ("guardrails vs governance") or an older description?
- Product name: consistent use of "ZAI" and "Zero Ambiguity Intelligence"?
- HTU Foundation attribution: present in both?
- Any features described in README that don't exist on Home or vice versa?

**Commands to run:**
```bash
cat README.md
grep -n "ZAI\|Zero Ambiguity\|governance\|guardrail\|HTU\|htu" README.md
```

**Expected answer format:**
```
Tagline in README: MATCHES / STALE / MISSING
Product name: CONSISTENT / INCONSISTENT
HTU attribution: PRESENT / MISSING in README
Gaps:
  - README mentions X, Home does not
  - Home mentions Y, README does not
```

---

### Q4 — Navigation completeness

**Question:** Can a user discover `/app` from the Home page without knowing the URL? Check:
- Is there a nav link or CTA that routes to `/app`?
- What does "Try ZAI" or the primary CTA on Home currently link to?
- Is `/app` reachable from the navbar on the Home page?

**Commands to run:**
```bash
grep -rn "Try ZAI\|href.*\/app\|to.*\/app\|navigate.*app" src/ 2>/dev/null
grep -rn "nav\|Nav\|TopBar\|Header" src/ 2>/dev/null | grep -i "app\|scorer" | head -10
cat src/components/TopBar.tsx 2>/dev/null || find src -name "TopBar*" -o -name "Nav*" | head -5
```

**Expected answer format:**
```
"Try ZAI" CTA: links to /app ✅ / links to /pricing ❌ / missing ❌
Navbar "App" link: present ✅ / missing ❌
/app discoverable from Home: YES / NO
Action required: [none / add CTA / fix link]
```

---

### Q5 — Scoring rubric version in README

**Question:** Is the rubric version (`v1.0.0`) and the 7-section format documented anywhere public-facing (README, docs, or Home)? A developer integrating ZAI needs to know what a valid spec looks like.

**Commands to run:**
```bash
grep -n "rubric\|7.*section\|section.*7\|classify\|scoreSpec\|spec.*format" README.md 2>/dev/null
find . -name "*.md" | xargs grep -l "rubric\|classify" 2>/dev/null | grep -v node_modules | grep -v issues/
```

**Expected answer format:**
```
Rubric documented in README: YES / NO
7-section format explained: YES / NO
classify command documented: YES / NO
Action required: add "How scoring works" section to README
```

---

## Report Format

Save to:
```
issues/reports/2026-04-13__research__zai-app-readme-homepage-alignment.md
```

Structure:
```markdown
# Research Report: /app · README · Home alignment
**Date:** YYYY-MM-DD
**Repo:** zi007lin/zai
**Commit:** {HEAD SHA}

## Q1 — README vs /app
{findings}

## Q2 — Home vs /app
{findings}

## Q3 — README vs Home
{findings}

## Q4 — Navigation
{findings}

## Q5 — Rubric documentation
{findings}

## Priority action list
P0 (blocks demo promotion): [list or "none"]
P1 (should fix before demo): [list]
P2 (nice to have): [list]

## Cleared for demo promotion
YES / NO / YES with P0 fixes
```

---

## Acceptance Criteria

- [ ] All 5 questions answered with exact file paths, line numbers, and copy quotes where relevant
- [ ] Any "coming soon" or stale copy identified with exact location
- [ ] Navigation flow from Home → /app confirmed working or flagged
- [ ] Priority action list present with P0/P1/P2 classification
- [ ] "Cleared for demo promotion" stated explicitly
- [ ] Report saved to `issues/reports/2026-04-13__research__zai-app-readme-homepage-alignment.md`
- [ ] PR opened for daniel-silvers review
- [ ] No code changes — research only

---

## Subject Migration Summary

| | |
|---|---|
| What | Alignment audit: /app scorer vs README vs Home page |
| Blocks | demo promotion of PR #15 |
| State | Spec complete; not yet executed |
| Open questions | None — all questions are structural/textual, no ambiguity |
| Next action | `impl i 2026-04-13__research__zai-app-readme-homepage-alignment.md` → read report → gen fix specs for any P0/P1 items |
| Repo | `zi007lin/zai` |

---

## Files

```
issues/reports/2026-04-13__research__zai-app-readme-homepage-alignment.md  ← created by this research
```
