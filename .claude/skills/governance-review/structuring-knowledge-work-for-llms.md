# Structuring Knowledge Work for LLMs: Artifacts, Governance, and the Parallelization Problem

## The Problem

LLMs possess extraordinary scale. They can ingest thousands of documents in seconds and synthesize novel outputs from them — reading and writing at volumes no human could match. But this capacity creates a fundamental tension in knowledge work:

**Autonomy enables scale, but risks drift.** The more independently an LLM operates, the more it can accomplish — but the further its outputs may stray from human intent.

Improving model capability does not resolve this tension. It improves the quality of outputs under given conditions but does not determine what information should be present, how work should be organised, or whether outputs are correct. Four characteristic failure modes persist regardless of model quality:

1. **Context window degradation** — Performance declines as context fills, well before any hard limit is reached.
2. **Continuity loss** — LLMs retain no memory between sessions. Working context must be deliberately reconstructed at each session start, or prior decisions and constraints are lost. Base models score F1 between 13.9–32.1 on cross-session tasks against a human ceiling of 87.9.
3. **Verification failure** — LLMs produce fluent, plausible outputs regardless of correctness. Self-correction doesn't work: the same weights that produced the error govern the check. Adequate verification requires an external standard independent of the model's judgment.
4. **Unstructured planning** — Prompting directly for implementation without prior specification consistently produces inferior outcomes. Explicit intermediate steps yield measurable improvements — up to 25.4% in some benchmarks.

---

## Why Artifacts? Cross-Field Evidence

Four unrelated fields — mediation, project management, academic research, and software engineering — independently developed artifact disciplines that share four structural properties:

- **Persistence across sessions** — documents outlast the interactions that produced them
- **Constraint encoding** — documents represent boundaries that bind future decisions
- **Decision traceability** — decisions recorded alongside rationale in stable, retrievable form
- **Independence from individual memory** — the document, not recollection, is ground truth

Examples: Fisher & Ury's BATNA, the PMBOK Project Charter, academic pre-registration, and software engineering's `CLAUDE.md` / Architecture Decision Records all instantiate this structure. The convergence is evidence of a shared underlying problem — context transfer — not mere analogy. Each failure mode listed above has a structural counterpart in these artifact traditions.

---

## The Framework

Effective LLM-assisted knowledge work requires designing three things in concert.

### 1. Artifact Discipline

Within any field of knowledge work, there exists a characteristic set of artifacts — documents, analyses, models, reports — that facilitate that work. An *artifact discipline* is the taxonomy of these outputs: what they are, what functions they serve, and how they relate to one another.

Each artifact has a schema: the functional requirements for its components. A research synthesis might require a methodology section, a findings summary, and a gap analysis. A strategic brief might require situational context, options, and recommendations. Schemas are not merely format guides — they constrain what can be produced at each step and make outputs human-verifiable at checkpoints.

### 2. Governance Layer

The *governance layer* is the protocol determining how humans and LLMs interact throughout the work. It specifies:

- When checkpoints occur
- What form intermediate outputs take
- How humans evaluate and redirect
- What autonomy the LLM has between checkpoints

What the governance layer provides is an **audit trail**: errors surface against external standards rather than propagating silently across sessions. Reliability becomes a controlled property of the collaboration system, not an emergent property of model capability.

This layer is tool-specific — optimized for the particular interface being used. The governance layer itself is portable; its richest implementation is not.

### 3. Work Structure: Serial vs. Parallel

Knowledge work can be decomposed into subtasks. Some are **serial**: their outputs feed into subsequent tasks. Others are **parallelizable**: they can be executed independently and combined later. This pattern is fractal — it applies at the level of documents within a project, sections within a document, and down to the smallest observable unit of work.

Given a specific artifact discipline, a key design question is: **to what degree are its subcomponents parallelizable vs. serial?**

- **Parallel work** enables scale, but autonomous agents risk diverging from human intent.
- **Serial work** creates natural checkpoint opportunities, but bottlenecks throughput.

Serial structure does not *necessitate* human checkpoints — it merely permits them. Parallel structure does not preclude oversight — it requires different verification mechanisms: convergence checks, consistency audits, sampling. The design question is whether serial dependencies can be restructured into parallel workstreams with well-defined merge points.

---

## The Compression Problem

Human checkpoints require **lossy compression**. An LLM might process millions of tokens between checkpoints, but humans can only interpret a fraction of that volume. The intermediate output must be rendered into a human-interpretable form — a summary, a decision tree, a set of options.

This compression is where alignment risk concentrates. If compression obscures drift, the checkpoint fails. If it is too aggressive, the human loses necessary context. Designing these intermediate representations — what to surface, what to elide — is a critical governance challenge.

---

## Limitations

- **Adoption cost** — Constructing and maintaining the artifact system requires upfront time and ongoing discipline. It is not warranted for single-session tasks.
- **Governance quality** — A stale or inconsistent artifact system actively misleads. The framework is only as reliable as the discipline applied to maintaining it.
- **Platform dependency** — Some implementations (hooks, subagents) are tool-specific. The governance layer is portable; its richest instantiation is not.

---

## Key Implication

The practitioner skill that matters is not prompting ability but **governance design**: the capacity to construct and maintain the information environment in which LLMs operate well. That skill is currently rare and largely tacit. Making it explicit is the first condition for its deliberate development.

---

## Open Questions

- What is the optimal checkpoint granularity for different artifact types?
- How do we design intermediate representations that surface drift without overwhelming the human?
- Can we develop reusable governance patterns across artifact disciplines?
- What does a case study look like — mapping a real knowledge workflow to this framework?

---

## About This Template

This repository instantiates the framework above. The artifact discipline is enforced through schemas, the governance layer is implemented through session skills and hooks, and the work structure is supported by parallel and serial agents.

### Artifact Discipline — `docs/` and `res/schemas/`

The `docs/` directory holds the core project artifacts: charter, background, deliverables, and a change & decision log. Each artifact has a corresponding schema in `res/schemas/` that defines its required components.

| Artifact | Purpose |
|---|---|
| `project_charter.md` | Project scope, goals, invariants |
| `background.md` | Grounding references and landscape |
| `deliverables.md` | Outputs and acceptance criteria |
| `change_and_decision_log.jsonl` | Persistent record of decisions |
| `technical_design_document.md` | Code-level specification (for software projects) |

### Governance Layer — Skills and Hooks

The governance layer is implemented as Claude Code skills (`.claude/skills/`) and session hooks (`.claude/settings.json`).

| Skill | Role |
|---|---|
| `/sos` | Start-of-session: loads context, surfaces open issues, proposes focus |
| `/eos` | End-of-session: logs decisions, updates issues, hands off to next session |
| `/init-project` | Scaffolds charter, background, and deliverables from scratch |
| `/code-scaffold` | Translates planning documents into a TDD and test framework |
| `/governance-review` | Audits the framework itself against the three-dimension model |

Hooks automate context injection at session boundaries — issue tracker state is loaded at `SessionStart` and `PreCompact`, ensuring current task context is always available without manual re-establishment.

### Work Structure — Agents

Parallel workstreams are handled by dedicated subagents (`.claude/agents/`), each scoped to a specific verification role:

| Agent | Role |
|---|---|
| `peer-reviewer` | Academic-standard critique of any artifact or document |
| `research-assistant` | Source investigation and grounding reference drafting |
| `code-reviewer` | Code review against TDD and test manifest as ground truth |

### Issue Tracking — Beads (`bd`)

In-session task tracking uses **Beads** (`bd`), a lightweight CLI issue tracker. Issues are filed as work surfaces, claimed, and closed — giving the governance layer a persistent record of outstanding work that survives across sessions and informs each `/sos`.
