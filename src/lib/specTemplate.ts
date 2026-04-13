export const SPEC_TEMPLATE = `# YYYY-MM-DD__feat__short-title

## Intent

<!-- One paragraph, ≤ 150 words. State the change and the motivation. -->

---

## Decision Tree

<!-- The question you considered, options in a table, and the trigger for change. -->

**Question:** <!-- the decision you made -->

| Option | Risk | Decision |
|---|---|---|
| Option A | low | ✅ Chosen |
| Option B | high | ❌ Rejected |

**Trigger for change:** <!-- what new info would flip this decision -->

---

## Draft-of-thoughts

<!-- Reasoning scratch. Waivable on trivial copy changes. -->

---

## Final Spec

<!-- Concrete rendering rules, target elements, what is and isn't in scope. -->

## Acceptance Criteria

- [ ] First concrete outcome
- [ ] Second concrete outcome
- [ ] Third concrete outcome

---

## Game Theory Review

**Who benefits:** <!-- who wins from this change -->

**Abuse vector:** <!-- how a bad actor or lazy user could break or game it -->

**Mitigation:** <!-- what prevents the abuse or caps the damage -->

---

## Subject Migration Summary

| | |
|---|---|
| What | <!-- one-line description --> |
| State | Spec complete; not yet implemented |
| Open questions | <!-- list anything to confirm before impl --> |
| Next action | \`impl i YYYY-MM-DD__feat__short-title.md\` |

---

## Files

\`\`\`
path/to/file-to-change.ts
path/to/new-file.ts
\`\`\`
`;
