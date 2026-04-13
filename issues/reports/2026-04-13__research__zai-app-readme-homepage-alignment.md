# Research Report: /app · README · Home alignment
**Date:** 2026-04-13
**Repo:** zi007lin/zai
**Commit:** 69b190ff78f7c3ef09cb0dde45c5d0e693f25a08 (main, PR #16 merged)
**Research branch:** zai/research-app-readme-homepage-alignment

---

## Q1 — README vs /app

**Answer:**
```
README status: MISSING COVERAGE (not stale-contradictory)
Stale claims: none
  - No "coming soon" / "in development" / "in active" anywhere in README
  - grep coming|development|active in README.md → 0 hits
Missing sections:
  - No mention of /app, spec scoring, upload flow, template download,
    score breakdown, rubric, rubric version, 7-section format,
    classify command, scoreSpec
  - grep rubric|classify|scoreSpec|section in README.md → 0 hits
  - No link to /app, no "Try the scorer" surface, no screenshot
Accurate claims:
  - Line 1: "ZAI — Zero Ambiguity Intelligence" ✅
  - Line 9: "turns natural-language intent into verifiable, auditable
    software" ✅ (matches /app framing)
  - Lines 64–89: "ZAI vs Guardrails" section shipped via PR #11,
    still current
  - Lines 97–103: RGB Color System — matches visual language on /app
    (pass=green, fail=red, etc.)
```

**Why this matters:** README describes ZAI as a full "traffic controller" routing work across `spec` / `eval` / `impl` / `review` / `deploy` / `autopilot` subagents (lines 31, 46–50). What actually shipped on the public surface is **one** piece of that vision: a client-side spec scorer at `/app` that does the `eval` stage only. README doesn't reveal this gap, so a reader lands on `/app` expecting a full agentic pipeline and gets a file-upload rubric.

---

## Q2 — Home vs /app

**Answer:**
```
Home → /app CTA: WORKS
  - src/pages/HomePage.tsx:53 — <button onClick={() => onNavigate("app")}>
  - onNavigate from src/App.tsx:22 pushes /app via history.pushState
  - Confirmed wired end-to-end

Hero tagline on /:
  "Most AI tools give you guardrails. ZAI gives you governance —
   a complete audit trail from human intent to deployed code,
   with nothing lost in translation."
  (src/locales/en.json → hero.title, shipped in PR #13)

/app header copy:
  "ZAI · spec scorer"
  "Score your spec before it ships"
  "Upload a spec file to get a deterministic 7-section score.
   No LLM judgment — pure structural analysis. Structural checks.
   Human review still required."
  (src/pages/AppPage.tsx — inlined after PR #15)

Consistency: ✅ positional alignment
  - Both frame ZAI as governance-forward, audit-trail-centric
  - /app delivers one specific checkpoint on the audit trail Home
    promises ("from human intent to deployed code")
  - No contradiction between the two surfaces

Ambiguity viz → scorer narrative: WEAKLY CONNECTED
  - Home /: RGB slider widget labelled "From ambiguity to spec —
    in color" (en.json → demo.title). Two sliders + a dark-overlay
    background that recolors as ambiguity/spec-coverage change.
    Framed as a qualitative color signal.
  - /app: 7-section rubric → PASS / SKIP / FAIL per section → /N score
    with type badge. Framed as structural, discrete.
  - Both map the "ambiguity → spec coverage" idea but use completely
    different visual vocabularies. A user scrolling the Home demo
    then clicking "Try ZAI" lands on the scorer with no bridging copy.
  - Not jarring, but not a strong thread. See P2 list.

Stale copy on Home:
  - grep coming|development|active in src/ public/ index.html → 0 hits
  - No "coming soon" copy anywhere — all landing surfaces are current.
```

---

## Q3 — README vs Home consistency

**Answer:**
```
Tagline in README: STALE (mismatch with Home)
  - README.md:3 — "The engine of Spec Driven Development (SDD) by
    High Tech United."
  - Home h1 via en.json:hero.title — "Most AI tools give you
    guardrails. ZAI gives you governance — a complete audit trail…"
  - README still uses the PRE-PR-#13 tagline. Home moved on,
    README did not.
  - README:9 subhead also frames ZAI around "verifiable, auditable
    software" which is closer to the new framing but not the exact
    governance phrasing.

Product name: CONSISTENT
  - README.md:1 — "ZAI — Zero Ambiguity Intelligence"
  - src/locales/en.json → hero.brand — "Zero Ambiguity Intelligence"
  - src/components/ScoreExample.tsx and elsewhere — consistent "ZAI"
  - No drift, no alternate spellings.

HTU attribution: CONSISTENT
  - README.md:3 — "[High Tech United](https://htu.io)"
  - README.md:138 — "High Tech United — building the engine of SDD."
  - HomePage.tsx:46 — "High Tech United" link to htu.io
  - TopBar.tsx:73,85 — "htu.io ↗" external link
  - Footer.tsx — "Built on HTU Foundation" link
  - README Footer line "Built on" stamp also present on /app
    (AppPage.tsx "ZAI · Zero Ambiguity Intelligence · HTU Foundation ·
    zzv.io")

Gaps:
  - README describes a 6-command CLI (spec/eval/impl/review/deploy/
    autopilot, README:31) — Home does not surface any CLI and neither
    does /app. The only user-facing feature is the web scorer.
  - Home mentions the web scorer (implicitly, via CTA to /app);
    README does not mention the web scorer at all.
  - README:118–122 claims "Every merged PR, every deploy, every
    spec revision is anchored to the ZZV Chain." Per the governance-
    tagline spec (PR #13) pre-deploy gate, chain anchoring is NOT
    yet live in prod. README overclaims vs Home.
```

---

## Q4 — Navigation

**Answer:**
```
"Try ZAI" CTA: ✅ links to /app
  - src/pages/HomePage.tsx:53 → onNavigate("app")
  - Renders as primary white button on Home hero

Navbar "App" link: ✅ present on every viewport
  - Desktop: src/components/TopBar.tsx:53 — <a href="/app"> Home·App·Pricing
  - Mobile: TopBar.tsx:140 — hamburger dropdown carries the same link
  - "Active" styling switches via current === "app"

/app discoverable from Home: YES
  - Two independent paths: primary CTA + persistent navbar link.
  - A user can reach /app without knowing the URL.

Action required: none for navigation.
```

---

## Q5 — Rubric / scoring documentation

**Answer:**
```
Rubric documented in README: NO
  - grep rubric|classify|scoreSpec|7.section|section.*7|spec.*format
    in README.md → 0 hits

7-section format explained: NO
  - No public-facing doc explains: Intent, Decision Tree,
    Draft-of-thoughts, Final Spec, Game Theory Review,
    Subject Migration Summary, Files list
  - No doc explains the 5 spec types (feat / research / bug / chore
    / hotfix) introduced in PR #16 and live in rubric v1.1.0.
  - No doc explains SKIP semantics or the dynamic denominator per type.

classify command documented: NO
  - The spec for the future tools/zilin-bs/classify-spec.ts CLI
    exists in issues/2026-04-13__feat__zilin-bs-rubric-spec-types.md
    but the CLI is not built and is not public-facing.
  - README has no entry on a "classify" command.
  - The web scorer at /app is the closest user-facing equivalent
    but is not referenced from README.

Other docs/:
  - No docs/ directory in the repo covering scoring.
  - Only contentful references are inside issues/ (spec files) and
    src/lib/scoreSpec.ts (source).
  - A new contributor or integrator has no path to "what is a valid
    ZAI spec?" without reading source.

Action required: README needs a "How scoring works" (or
"Spec format") section documenting:
  1. The 7-section feat rubric (with brief per-section rule)
  2. The 5 spec types and which sections each requires
  3. Rubric version (v1.1.0) and how version bumps work
  4. Link to https://dev.zai.htu.io/app as the live scorer
```

---

## Priority action list

### P0 (blocks demo promotion)
**None.** Nothing on any surface is factually wrong or broken. Navigation works, the primary CTA works, fonts load, the scorer scores, tests pass. No blocker.

### P1 (should fix before demo)

1. **README.md:3 tagline drift.** Update the subtitle from "The engine of Spec Driven Development (SDD) by [High Tech United]" to something that matches the governance-tagline framing shipped to Home in PR #13. Suggested: "ZAI gives you governance, not guardrails — a complete audit trail from human intent to deployed code. By [High Tech United]." Keeps README and Home synchronized for any demo attendee who reads both.

2. **README missing `/app` surface.** Add a short "Try the scorer" (or "Quick start") section — probably between "What is SDD?" and "ZAI Architecture" — linking to `https://dev.zai.htu.io/app` with a two-sentence how-to: drop a `.md` spec, see a structural score. Currently a README reader has no idea the web scorer exists.

3. **README:120 overclaim on ZZV Chain.** "Every merged PR, every deploy, every spec revision is anchored to the **ZZV Chain**" is written in present tense. Per the governance-tagline PR #13's pre-deploy gate, chain anchoring is **not yet live in prod**. The same game-theory risk called out in that spec applies here — a sophisticated reader (hackathon judge, enterprise evaluator) will probe the claim and find nothing to verify. Either soften to future tense ("will be anchored when the chain ships") or scope to the spec-→-PR audit trail which *is* live today via ZiLin Command.

### P2 (nice to have)

1. **Narrative bridge on Home between ambiguity viz and `/app` scorer.** One line of copy or a small "See how we score this structurally →" link under the RGB slider demo. Currently the viz and the scorer are the same concept in two visual vocabularies, but a user scrolling Home has no signal that clicking "Try ZAI" will show them the structural form of the thing they just played with.

2. **"How scoring works" section in README.** Document the 7-section feat rubric, the 5 spec types from PR #16 (feat 7/7, research 6/6, bug 5/5, chore 2/2, hotfix 3/3), and the rubric version (v1.1.0). An integrator should not have to read source to know what a valid spec looks like. Follow-up spec material.

3. **README:111 Editions table** lists "`spec`, `eval`, `impl` commands" under the Free tier. These commands exist as Layer 2 Claude Code slash commands but are private (not public-facing CLI) and the Free-tier user only gets the web scorer. Clarify: "web spec scorer at `/app`" as the Free-tier surface, Layer 2 commands as a Pro/Pro+ bundle. Otherwise the table promises something a Free user cannot access.

4. **README:128 Hackathon Memorabilia** says "April 12, 2026" — one day in the past. Fine historically, but adding a "what shipped" line tying it to PR #6/#15/#16 grounds the claim and turns the section from a stub into evidence.

---

## Cleared for demo promotion

**YES, with P1 fixes** (tagline sync, README link to `/app`, soften or scope the chain claim).

The three P1 items are all copy changes in a single file. No code, no tests, no infra. Probably a 20-minute follow-up PR.

P0 is empty — the app/home/README triad is internally coherent, the scorer works live at https://dev.zai.htu.io/app, and there is no false copy on the public surfaces. The only concrete risk is the README chain claim (P1 item 3) if a demo attendee goes probing, which is the same pre-deploy gate PR #13 called out but did not enforce on README.
