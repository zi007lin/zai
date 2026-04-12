Add "AI Governance Layer" section to ZAI README — differentiate from guardrails/Zapier thinking.

## Add this section to README.md after "ZAI Architecture"

Insert between "ZAI Architecture" and "How it works":

---

## ZAI vs "Guardrails"

Most AI teams are building guardrails. ZAI is building governance.

| Guardrails Thinking | ZAI Governance |
|---------------------|----------------|
| Zapier workflows | Kafka + Cloudflare event streams |
| Manual approvals | Programmatic governance (SDD) |
| Monitoring | Observability + event logs + replay |
| Prototype-first | Production-grade architecture from day 1 |
| Safety | Anti-fragile system design |

**Guardrails treat AI like a tool that needs limits.**
**ZAI treats AI like a system that needs governance + incentives + auditability.**

### The governance stack

```
Event sourcing    — every spec, every decision, every deploy is logged
CQRS              — read and write paths are separated
Identity          — every action is tied to a verified actor
ZZV Chain         — immutable audit trail, append-only
SDD               — the spec is the contract, not the chat
```

Simple interface. Production-grade architecture underneath.

---

## Tasks

1. Read current README.md
2. Insert the section above between "ZAI Architecture" and "How it works"
3. Commit: `docs: Add ZAI governance layer section — differentiate from guardrails`
4. Push to main

## Acceptance Criteria

- [ ] "ZAI vs Guardrails" comparison table in README
- [ ] Governance stack listed
- [ ] "Simple interface. Production-grade architecture underneath." tagline present
- [ ] Committed and pushed to main
