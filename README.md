# ZAI — Zero Ambiguity Intelligence

**The engine of Spec Driven Development (SDD) by [High Tech United](https://htu.io).**

[![High Tech United](https://htu.io/logo.png)](https://htu.io)

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

Every merged PR, every deploy, every spec revision is anchored to the **ZZV Chain** — an append-only record that makes the SDD pipeline auditable end-to-end. When a regulator, a reviewer, or a future-you asks *"why does this code exist?"*, the chain has the answer: the spec, the eval, the reviewer, the deploy, the intent.

Learn more at [zzv.io](https://zzv.io).

---

## Hackathon Memorabilia

🗽 **vibeFORWARD NYC — April 12, 2026**

ZAI shipped its Layer 2 command library live at vibeFORWARD NYC. First public demo of the full SDD pipeline running autopilot across a dual-PR governance model. Thanks to the HTU crew and everyone who vibed forward with us.

---

## License & Governance

Repo: [`zi007lin/zai`](https://github.com/zi007lin/zai) · Reviewer: `daniel-silvers` · Branch convention: `zai/<issue-slug>` · Deploy target: `dev`

High Tech United — building the engine of Spec Driven Development.
