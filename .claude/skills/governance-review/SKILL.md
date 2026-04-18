---
name: governance-review
description: Review the project framework for context efficiency and governance quality. Audits skills, agents, hooks, and schemas against three dimensions — artifact discipline, governance layer, work structure — then synthesizes findings into a prioritized recommendation report. Aliases: 'review the framework', 'audit the governance layer', 'framework review'.
---

# SKILL: Governance Layer Review

## Purpose

This skill audits the project framework itself — not the project's content, but the scaffolding that governs how human-AI collaboration is structured. It evaluates the framework against three dimensions drawn from the paper `structuring-knowledge-work-for-llms.md` and produces a durable, actionable report.

Run this skill periodically — after significant changes to the framework, or when sessions feel expensive or drift-prone.

---

## Evaluation Rubric

Every finding is assessed against one of three dimensions:

**1. Artifact Discipline**
Are the schemas tight and alignment-serving, or loose and generative? Are all artifact relationships explicit? Are any artifacts redundant, orphaned, or missing? Do schemas constrain outputs to what humans can actually verify at a checkpoint?

**2. Governance Layer**
Are checkpoints placed at the right granularity — not so frequent they interrupt flow, not so sparse they allow drift? Are confirmation gates clearly specified? Are compression rules (what to surface vs. elide) defined where decisions are made? Are hooks being used for side effects only, not for work that requires interpretation?

**3. Work Structure**
Are serial dependencies minimized to what is genuinely necessary? Are parallel paths bounded by convergence checks? Is the subagent delegation criterion clear and consistently applied? Are any skill phases doing work that could be pre-computed and stored as a stub?

---

## Procedure

### Phase 1: Load Framework Artifacts

Read all of the following — do not skip any:

| Artifact | Path |
|----------|------|
| Role and workflow | `claude.md` |
| SOS skill | `.claude/skills/sos/SKILL.md` |
| EOS skill | `.claude/skills/eos/SKILL.md` |
| Init-project skill | `.claude/skills/init-project/SKILL.md` |
| Code-scaffold skill | `.claude/skills/code-scaffold/SKILL.md` |
| Governance-review skill | `.claude/skills/governance-review/SKILL.md` |
| Hooks configuration | `.claude/settings.json` |
| Agent definitions | `.claude/agents/` (all files) |
| Schema index | `res/schemas.md` |

Also check whether `structuring-knowledge-work-for-llms.md` exists in the project root. If it does, read it — it is the theoretical grounding for the rubric.

---

### Phase 2: Audit Against Rubric

Evaluate each artifact against the three dimensions. For each finding, record:

- **Dimension**: Artifact Discipline / Governance Layer / Work Structure
- **Observation**: What the issue is, stated precisely
- **Affected file and section**: Exact location
- **Recommendation**: A specific, actionable change
- **Priority**: High (causes drift, waste, or misalignment) / Medium (inefficiency without immediate harm) / Low (polish)

Work through the rubric systematically. Do not stop at the first few findings — exhaust each dimension before moving on.

**Prompts for each dimension:**

*Artifact Discipline*
- Does every schema constrain output to what a human can verify in a single read?
- Are there artifacts that overlap in purpose or that reference each other redundantly?
- Are any schema fields so open-ended that the AI must invent content rather than populate structure?
- Are stub files complete and accurate, or do they contain outdated placeholders?

*Governance Layer*
- At each confirmation gate, is it clear exactly what the human is being asked to approve?
- Are there phases that proceed without a checkpoint where drift could silently accumulate?
- Are the EOS compression rules specific enough, or do they leave too much to Claude's discretion?
- Are hooks doing only side-effect work (recording, priming), or have they drifted into interpretation work?
- Is the session start/end lifecycle complete and leak-free (e.g., temp files always cleaned up)?

*Work Structure*
- Are there skill phases that are serialized but could be parallelized without correctness risk?
- Are there serial dependencies that exist by convention rather than necessity?
- Do all parallel phases have convergence checks before the next serial step?
- Is there work currently done by the AI at runtime that could be pre-computed and stored?

---

### Phase 3: Identify Research Questions

After the audit, identify any questions that cannot be answered from the existing artifacts alone — where external evidence would materially change a recommendation.

For each research question:
- State the question precisely
- Explain why existing artifacts are insufficient to answer it
- Estimate the value of answering it (high / medium / low)

Present the list to the user:

> "I identified [N] questions that would benefit from external research:
>
> 1. **[Question]** — Value: [high/medium/low]. Reason: [why existing artifacts don't answer it]
> 2. ...
>
> Should I spawn research agents for any of these? (List the numbers you want researched, or 'none' to skip)"

Wait for the user's response before proceeding.

---

### Phase 4: Research (Conditional)

For each question the user approves, spawn a research-assistant agent with a tightly scoped prompt:

- State the specific question
- Provide the relevant framework context (1–2 sentences)
- Specify the form of the answer needed (e.g., "a concrete pattern with tradeoffs", "evidence for or against X")
- Cap scope: "Do not return general LLM advice — focus on evidence directly applicable to this question"

If multiple questions are approved, spawn all research agents in parallel and wait for all to complete before synthesising. Collect all research reports before proceeding to Phase 5.

---

### Phase 5: Synthesize and Write Report

Combine audit findings and any research outputs into a single report. Follow the schema in `res/schemas/governance_review.md`. Write the report to `docs/reports/governance_review.md`, overwriting any prior version.

---

### Phase 6: Present to User

Summarize the report output:

> "Governance review complete. Report written to `docs/reports/governance_review.md`.
>
> **Top recommendations:**
> 1. [High-priority item]
> 2. [High-priority item]
> 3. [Next item]
>
> Want me to implement any of these now, or save them for a future session?"

Wait for the user's direction. Do not implement recommendations without explicit instruction.

---

## Notes

- This skill audits the framework, not the project content. It should not read `docs/project_charter.md`, `docs/background.md`, or other project-specific artifacts unless they are needed to evaluate a schema's fitness.
- Research spawning is opt-in and scoped. Do not spawn agents for questions that can be answered from existing framework artifacts.
- The report overwrites the prior version intentionally — governance reviews supersede each other. The change log is the record of what was acted on.
- This skill is itself subject to its own rubric. If running it feels expensive, that is a finding.
