---
name: sos
description: Start of session — re-establishes project context via staged loading; suggests 1-3 session focus options based on open issues and recent history. Aliases: 'where were we', 'let's begin', 'resume'.
---

# SKILL: Start of Session (SOS)

## Trigger Conditions

Activate when the user: says "/sos," "start of session," "let's begin," "where were we," or opens a new conversation on a continuing project.

---

## Procedure

### Pre-Check: Is the Project Initialized?

Before any loading, check whether the `.beads/` directory exists in the project root. This directory is created by `bd init` during `/init-project` and is the definitive signal that a project has been initialized.

**If `.beads/` does not exist:**

> "This looks like an empty project template — no project has been initialized yet. Would you like to run `/init-project` to set one up?"

Wait for the user to confirm before taking any action. Do not run `/init-project` automatically. Stop here and do not proceed to Phase 1.

**If `.beads/` exists**, continue to Phase 1.

---

### Phase 1: Light Load

Load minimal context:

| Artifact | What to Load |
|----------|--------------|
| Outstanding Issues | Run `bd ready` in the project root — lists all unblocked open issues |
| Project Charter | `docs/project_charter.md` — first 20 lines only (covers the Overarching Objective section) |
| Change & Decision Log | Run: `tail -1 docs/reports/change_and_decision_log.jsonl \| jq '{session, date, title, context, decisions: [.decisions[].title], next_session_focus}'` — if the file is empty or missing, note "No prior sessions recorded" and continue |

> **Note:** These three loads are independent — execute in parallel.

> **Note:** Session start time is recorded automatically by the `SessionStart` hook — no action needed here.

After loading, Claude should know: what the project is trying to achieve, what's open, and what happened last session.

### Phase 2: Assess & Suggest

If the log entry contains a `next_session_focus` array, display those items directly — EOS wrote them while context was fresh:

> "Suggested focus areas from last session:
>
> 1. **[title]** *(Issue [meta_project-<hash>])* — [rationale]
> 2. **[title]** — [rationale]
>
> What would you like to work on?"

If there are no prior log entries (first session after init), display open issues from `bd ready` instead and ask:

> "Project initialized. Here are the open issues to start from — what would you like to work on?"

### Phase 3: Confirm Direction

Ask the user what they would like to work on. Wait for them to select or propose a focus. Do not proceed to deep load until confirmed.

### Phase 4: Deep Load

Load artifacts relevant to confirmed task:

| Task Type | Load |
|-----------|------|
| Creating new artifact | `res/schemas.md` |
| Conceptual work | `docs/project_charter.md`, `docs/` section files (relevant only) |
| Procedural work (skills) | Existing skills, `res/schemas.md` + relevant file in `schemas/` |

If uncertain: "For this task, I'll load [list]. Anything else you want me to reference?"

### Phase 5: Begin Work

> "Loaded and ready. Working on: [confirmed focus]. Let's begin."

Track decisions and issues mentally for EOS.

---
