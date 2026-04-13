# ZAI — Zero Ambiguity Intelligence

**ZAI gives you governance, not guardrails — a complete audit trail from human intent to deployed code, with nothing lost in translation. By [High Tech United](https://htu.io).**

<div align="center">
  <a href="https://htu.io"><img src="https://htu.io/logo.png" width="600" alt="ZAI by High Tech United"/></a>
</div>

ZAI turns natural-language intent into verifiable, auditable software. Every spec, every commit, every deploy is anchored — no ambiguity, no drift, no ghosts in the pipeline.

---

## What is SDD?

**Spec Driven Development** is a workflow where the spec is the source of truth — not the code, not the ticket, not the conversation. Code exists to satisfy the spec; the spec exists to satisfy intent. ZAI is the agentic engine that drives the pipeline end-to-end.

### The SDD Pipeline

```
Intent  →  Spec  →  Eval  →  Impl  →  Review  →  Deploy  →  ZZV Chain anchor
  │        │       │        │         │          │              │
  │        │       │        │         │          │              └─ immutable audit record
  │        │       │        │         │          └─ dev → staging → prod
  │        │       │        │         └─ dual-PR governance, AI + human gates
  │        │       │        └─ branch, code, tests, lint, build
  │        │       └─ complexity + risk scoring, reviewer routing
  │        └─ machine-readable frontmatter + acceptance criteria
  └─ human goal, business ask, or incident
```

Each stage has a command: `spec`, `eval`, `impl`, `review`, `deploy`, `autopilot`. Outputs from one stage feed cleanly into the next. Nothing is lost between brain and branch.

---

## Try the scorer

The first piece of the SDD pipeline is live as a web scorer at **[dev.zai.htu.io/app](https://dev.zai.htu.io/app)**. Drop any `.md` spec file into the upload zone and you'll get a deterministic, type-aware score — `feat` 7/7, `research` 6/6, `bug` 5/5, `chore` 2/2, or `hotfix` 3/3 — with a per-section breakdown and any pre-deploy gates the spec declares. Pure structural analysis, no LLM judgment; human review still required.

---

## ZAI Architecture — Agentic Traffic Controller

ZAI is not a single agent. It is a **traffic controller** that routes work across specialized subagents, each with bounded authority and a clear handoff protocol.

```
                          ┌──────────────┐
                          │     ZAI      │
                          │  controller  │
                          └──────┬───────┘
                                 │
         ┌───────────────┬───────┼───────┬───────────────┐
         ▼               ▼       ▼       ▼               ▼
    ┌─────────┐    ┌─────────┐ ┌────┐ ┌────────┐   ┌──────────┐
    │  spec   │    │  eval   │ │impl│ │ review │   │  deploy  │
    │ author  │    │ scorer  │ │ dev│ │ critic │   │  runner  │
    └─────────┘    └─────────┘ └────┘ └────────┘   └──────────┘
         │               │       │        │             │
         └───────────────┴───────┼────────┴─────────────┘
                                 ▼
                        ┌────────────────┐
                        │  ZZV Chain     │
                        │  anchor layer  │
                        └────────────────┘
```

The controller decides: *which agent, which model, which repo, which gate.* Subagents never talk to each other directly — all traffic flows through ZAI, and every hop is logged.

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

## RGB Color System

ZAI uses a three-channel signal convention across logs, dashboards, and PR checks:

| Channel | Meaning                           | Triggers                                  |
|---------|-----------------------------------|-------------------------------------------|
| 🔴 **Red**   | Blocked / failed / needs human  | Test failure, lint error, merge conflict  |
| 🟢 **Green** | Passing / safe to advance       | All gates green, ready for next stage     |
| 🔵 **Blue**  | In-flight / agent working       | Spec being authored, impl in progress     |

RGB is the universal status language — humans and agents read the same signals.

---

## Editions

| Edition        | For                           | Includes                                                                 |
|----------------|-------------------------------|--------------------------------------------------------------------------|
| **Free**       | Indie devs, students          | `spec`, `eval`, `impl` commands · single repo · community support         |
| **Pro**        | Small teams                   | Free + `review`, `deploy` · multi-repo · dual-PR governance               |
| **Pro+**       | Scale-ups                     | Pro + `autopilot` · custom agents · private command library              |
| **Enterprise** | Regulated / compliance        | Pro+ + ZZV Chain anchoring · audit export · SSO · dedicated reviewer SLA |

---

## ZZV Chain

Every merged PR, every deploy, every spec revision is *designed* to be anchored to the **ZZV Chain** — an append-only record that makes the SDD pipeline auditable end-to-end. Today, the spec→PR audit trail is live and verifiable via the ZiLin Command workflow (branch → impl → tests → PR → dual-control merge), and every artifact is recoverable from git. On-chain cryptographic anchoring ships with the Enterprise edition. When a regulator, a reviewer, or a future-you asks *"why does this code exist?"*, the chain will have the answer: the spec, the eval, the reviewer, the deploy, the intent.

Learn more at [zzv.io](https://zzv.io).

---

## Hackathon Memorabilia

🗽 **vibeFORWARD NYC — April 12, 2026**

ZAI shipped its Layer 2 command library live at vibeFORWARD NYC. First public demo of the full SDD pipeline running autopilot across a dual-PR governance model. Thanks to the HTU crew and everyone who vibed forward with us.

---

## License & Governance

Repo: [`zi007lin/zai`](https://github.com/zi007lin/zai) · Reviewer: `daniel-silvers` · Branch convention: `zai/<issue-slug>` · Deploy target: `dev`

High Tech United — building the engine of Spec Driven Development.
