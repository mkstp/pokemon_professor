---
name: sos
description: Start of session — re-establishes project context via staged loading; suggests 1-3 session focus options based on open issues and recent history. Aliases: 'where were we', 'let's begin', 'resume'.
---

# SKILL: Start of Session (SOS)

## Trigger Conditions

Activate when the user: says "/sos," "start of session," "let's begin," "where were we," or opens a new conversation on a continuing project.

---

## Procedure

### Phase 1: Light Load

Load minimal context and record session start time:

| Artifact | What to Load |
|----------|--------------|
| Outstanding Issues | Run `bd ready` in the project root — lists all unblocked open issues |
| Project Charter | `project_context/project_charter.md` — objective only (use `limit`) |
| Change & Decision Log | Run the following command and read its output: `tail -1 reports/change_and_decision_log.jsonl \| jq '{session, date, title, context, decisions: [.decisions[].title], next_session_focus}'` |
| Session Start Time | Run `date +%s > .claude/session_start.tmp` — records epoch seconds for duration tracking at EOS |

After loading, Claude should know: what the project is trying to achieve, what's open, what happened last session.

### Phase 2: Assess & Suggest

If the log entry contains a `next_session_focus` array, display those items directly — EOS wrote them while context was fresh:

> "Suggested focus areas from last session:
>
> 1. **[title]** *(Issue [meta_project-<hash>])* — [rationale]
> 2. **[title]** — [rationale]
>
> What would you like to work on?"

### Phase 3: Confirm Direction

Ask the user what they would like to work on. Wait for them to select or propose a focus. Do not proceed to deep load until confirmed.

### Phase 4: Deep Load

Load artifacts relevant to confirmed task:

| Task Type | Load |
|-----------|------|
| Creating new artifact | `project_context/schemas.md` |
| Conceptual work | `project_context/project_charter.md`, `project_context/` section files (relevant only) |
| Procedural work (skills) | Existing skills, `project_context/schemas.md` + relevant file in `schemas/` |

If uncertain: "For this task, I'll load [list]. Anything else you want me to reference?"

### Phase 5: Begin Work

> "Loaded and ready. Working on: [confirmed focus]. Let's begin."

Track decisions and issues mentally for EOS.

---
