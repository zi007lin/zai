# feat: example feature for score_spec demo

**Repo:** `zi007lin/zai`
**Branch:** `feat/example-demo`
**Reviewer:** daniel-silvers

## Intent

A worked example of a passing FEAT spec, used by `@htu/zai-mcp`'s README and DEMO transcripts. Adds a single new feature with all 9 FEAT rubric sections present and structurally valid. Not intended to be implemented — exists purely to demonstrate the scoring tool's behavior on a clean input.

## Decision Tree

| Question | Options | Chosen | Why |
|---|---|---|---|
| Where to host the example | repo / external gist / docs site | repo | Co-located with the README that references it; rebases survive the move |
| Length | minimal / typical / exhaustive | minimal | Short enough to read in 30s during a demo; long enough that all 9 rubric sections are non-empty |
| Real or fictional feature | real / fictional | fictional | Avoids implying a roadmap commitment; avoids stale references when real features ship |

### Trigger for change

Replace this example if:

- The rubric introduces or removes a section — re-cut the example to match
- A demo viewer asks "what does a passing FEAT actually look like" and this one doesn't make the structure obvious — rewrite for clarity

## Draft-of-thoughts

The temptation was to use a real in-flight FEAT as the example, since it would be more authentic. Rejected: real specs reference internal context (run numbers, branch names, prior decisions) that distracts a demo viewer. A fictional minimal spec keeps focus on the rubric structure itself.

## Final Spec

The example feature: a no-op `/api/echo` endpoint that returns the request body unchanged. Used solely as a structural demonstration. No implementation required by this spec.

### Endpoint

`POST /api/echo` — request body returned verbatim with content-type preserved. Public, anonymous, rate-limited per existing infra.

## Acceptance Criteria

- [ ] `/api/echo` returns 200 with the request body unchanged
- [ ] Content-type header preserved on the response
- [ ] Rate limits applied (per existing infra; no new code)
- [ ] Vitest unit test confirms round-trip on JSON, text, and binary payloads
- [ ] README links the endpoint under "Diagnostics"

## Game Theory Cooperative Model review

Three parties: the operator, the demo viewer, and the LLM agent driving the score_spec tool. All three benefit from a clean reference example. Operator gets a reliable demo asset; viewer sees the rubric concretely; agent gets a known-passing input for tool-use parser tuning.

### Who benefits

1. **Operator** — has a stable example that doesn't drift with real feature work.
2. **Demo viewer** — sees the rubric's shape on a single screen.
3. **LLM agent** — exercises the tool against known-good input during integration tests.

### Abuse vector

1. Adversary submits this exact file expecting different scores across versions. Mitigated by `rubric_version` in the output — caller sees when the rubric has shifted.
2. Adversary modifies the file to drop sections and ships it as "passing". Mitigated by re-scoring at the gate; the tool is the source of truth, not the file's history.

## Subject Migration Summary

| Topic | State |
|---|---|
| What this establishes | A reference example of a passing FEAT spec for `@htu/zai-mcp` consumers |
| Where it lives | `packages/zai-mcp/examples/sample-feat.md` |
| Scope | Documentation only; no runtime code |
| Dependencies | None |
| Non-goals | Implementing `/api/echo`; this is a structural example only |
| Open questions | None |

## Files created / updated

```
packages/zai-mcp/examples/sample-feat.md    (new)
packages/zai-mcp/README.md                  (link to this file)
packages/zai-mcp/DEMO.md                    (reference in transcript 1)
```

## Models Applied

- #1 Game Theory Cooperative — see `## Game Theory Cooperative Model review`
- #2 Decision Tree — see `## Decision Tree`
- #11 Progressive Disclosure — minimal example first; richer examples can be added on demand
- #15 Inversion / Premortem — `### Abuse vector` enumerates failure modes

## Legal triggers

None.

This is a documentation artifact. No PII, no contract clauses, no third-party data, no liability exposure.
