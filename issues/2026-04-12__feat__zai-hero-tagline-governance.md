# 2026-04-12__feat__zai-hero-tagline-governance

## Intent

Replace the "Coming soon" placeholder title on the ZAI hero section with the governance positioning tagline. This change transitions ZAI's public framing from a feature-announcement stance to a product-philosophy statement: governance over guardrails, full auditability from intent to code.

---

## Spec Validation Score

| Section | Status | Notes |
|---|---|---|
| Intent | ✅ PASS | One paragraph, clear, unambiguous |
| Decision Tree | ✅ PASS | Four options, criteria, trigger for change |
| Draft-of-thoughts | ⏭ SKIP | Waivable — trivial copy change |
| Final Spec | ✅ PASS | Rendering rules, target element, exclusions |
| Game Theory Review | ✅ PASS | Claim risk identified; pre-deploy gate enforced |
| Subject Migration Summary | ✅ PASS | Open questions listed |
| Files list | ✅ PASS | Path + confirm command included |

**Score: 7 / 7 — cleared to ship**

> ⚠️ Pre-deploy gate: confirm ZZV Chain anchoring status before merge. If not live in prod, remove chain-specific subtext. "Complete" must mean complete.

---

## Decision Tree

**Question:** What copy should the ZAI hero headline carry?

| Option | Claim scope | Accurate today? | Risk | Decision |
|---|---|---|---|---|
| Keep "Coming soon" | No claim | ✅ | Dead — no positioning signal | ❌ Reject |
| K's full tagline verbatim | End-to-end incl. ZZV Chain | ⚠️ Partial — chain not live in prod | Overclaims if chain absent | ⚠️ Conditional |
| Scoped tagline: "…from spec to deployed code" | Spec→PR layer only | ✅ Fully true today | Safe; loses chain positioning | ❌ Fallback only |
| Two-part: headline + fine print caveat | Full claim + qualifier | ✅ Honest | Slightly complex | ✅ Preferred if chain not live |

**Decision:** Ship K's tagline verbatim **if** chain anchoring is verifiable in prod at deploy time. If not, remove chain-specific subtext until chain ships.

**Trigger for change:** When ZZV Chain anchoring goes live in prod, update subtext to explicitly name it.

---

## Draft-of-thoughts

The risk is the word "complete." The spec→PR audit trail IS complete today (intent → decision tree → spec → branch → impl → tests → PR → dual-control merge). ZZV Chain adds cryptographic finality — not yet live in prod. Shipping "complete" without that being true is marketing copy, not product truth. K's framing is correct as vision. This spec flags the delta so it doesn't get buried at deploy time.

---

## Final Spec

### Target element
The `<h1>` or hero heading currently rendering:
> "Coming soon. The ZAI spec generator and translation round-trip are in active development."

### New primary heading
> Most AI tools give you guardrails. ZAI gives you governance — a complete audit trail from human intent to deployed code, with nothing lost in translation.

### Rendering rules
- Single `<h1>` hero heading
- Font: Space Grotesk, display weight (match existing ZAI brand)
- Optional: visually differentiate "governance" in brand accent color — confirm with ZiLin before applying
- "Coming soon" removed or demoted to `<p>` subtitle — must not compete with headline
- Responsive: `clamp(1.5rem, 4vw, 2.5rem)` font size, no truncation on mobile
- Text legible against dynamic background from PR #12 (white text + dark overlay already in place)

### What does NOT change
- Sliders / ambiguity viz widget
- Any other page copy
- Route / URL

---

## Game Theory Review

**Who benefits:** ZAI sharpens positioning toward enterprise/infra buyers who distinguish governance from guardrails. Stronger signal for K's audience and Track 2 framing.

**Abuse vector:** The tagline makes a verifiability claim. If ZZV Chain anchoring is not live, "complete" is aspirational. A technically sophisticated reader (e.g., at a hackathon) may probe the claim — credibility cost exceeds the marketing gain.

**Mitigation:** Scope claim to what is provably true at deploy time. The spec→PR layer is fully auditable today. Add chain language only when chain is live. "Complete" means complete, not roadmap.

**Governance record:** This spec + PR review by daniel-silvers + merge timestamp = audit trail for this copy change. Consistent with ZiLin Command.

---

## Acceptance Criteria

- [ ] New tagline renders as primary `<h1>` on ZAI landing
- [ ] "Coming soon" removed or demoted (non-competing)
- [ ] Font ≥ 40px desktop, no truncation mobile
- [ ] Contrast ≥ 4.5:1 against dynamic background
- [ ] No layout shift on any breakpoint
- [ ] "governance" accent color confirmed or left plain before merge
- [ ] **Pre-deploy gate:** confirm ZZV Chain anchoring status; scope or unscope claim accordingly

---

## PR Body Template

> Claude Code: when opening the PR, use this exact body:

```
## ZAI Hero — Governance Tagline

Replaces "Coming soon" placeholder with governance positioning headline.

### Spec validation score: 7 / 7 ✅

| Section | Status |
|---|---|
| Intent | ✅ PASS |
| Decision Tree | ✅ PASS |
| Draft-of-thoughts | ⏭ SKIP (trivial copy) |
| Final Spec | ✅ PASS |
| Game Theory Review | ✅ PASS |
| Subject Migration Summary | ✅ PASS |
| Files list | ✅ PASS |

### Changes
- Hero `<h1>` updated to governance tagline
- "Coming soon" removed or demoted to subtitle
- Font size clamped for responsive rendering

### Pre-deploy gate (reviewer must confirm before merge)
- [ ] ZZV Chain anchoring live in prod? If NO → remove chain-specific subtext before deploy
- [ ] "governance" accent color: apply / leave plain (circle one)

### Spec
`issues/2026-04-12__feat__zai-hero-tagline-governance.md`

Reviewer: daniel-silvers
```

---

## Subject Migration Summary

| | |
|---|---|
| What | ZAI hero: governance positioning tagline |
| State | Spec complete — 7/7; not yet implemented |
| Open questions | (1) ZZV Chain anchoring live in prod at deploy time? (2) Accent "governance" in brand color? (3) Confirm component path before impl |
| Next action | `impl i 2026-04-12__feat__zai-hero-tagline-governance.md` |

---

## Files

- `issues/2026-04-12__feat__zai-hero-tagline-governance.md` — this spec
- `apps/zai/src/components/ZaiHero.tsx` — implementation target (confirm path first)

```bash
find . -type f -name "*.tsx" | xargs grep -l "Coming soon\|coming-soon\|hero" 2>/dev/null
```
