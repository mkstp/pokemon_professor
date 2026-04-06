---
name: init-project
description: Initialize a new project — creates Project Charter and project_context/ folder. Aliases: 'start new project', 'begin project'.
---

# SKILL: Initialize Project

## Trigger Conditions

Activate when the user: says "/init-project," "init project," "start new project," "initialize project," or asks to set up project documentation from scratch.

---

## Output Actions

Use the relevant file in `schemas/` as the authoritative format reference for each artifact (see `project_context/schemas.md` for the index).

### 1. Create `project_context/project_charter.md`
Refer to **Project Charter** schema.

### 2. Create `project_context/deliverables.md`

Refer to the **Deliverables** schema (`schemas/deliverables.md`). Scaffold the file with the header and a placeholder — no entries at init. Deliverables are defined in collaboration with the user as the project scope becomes clear.

### 3. Initialize Beads issue tracker

Run `bd init --stealth` in the project root to create the Beads database at `.beads/`. Refer to the **Outstanding Issues** schema (`schemas/outstanding_issues.md`) for CLI usage and conventions.

After init, run `bd setup claude` to configure Beads for Claude Code workflows.

### 4. Create standard Beads issues

These issues are open at the start of every project. Create them immediately after Beads is initialized:

```
bd create "Conceptual grounding" -p 1
bd update <id> --notes "conduct required research to populate background.md and project_charter.md, were scaffolded with placeholders at init. Populate incrementally as the project develops."

bd create "Define success criteria" -p 2
bd update <id> --notes " Define project-specific validation conditions as success criteria become clear."

bd create "Define project deliverables" -p 3
bd update <id> --notes "Enumerate discrete outputs the project must produce. For each deliverable added, create a corresponding Beads issue and record its ID in the Issue: field."
```

### 5. Confirm and Handoff

- **Suggested next steps**: begin Conceptual Grounding — populate `project_context/` section files incrementally as the project encounters relevant territory; no upfront population required

---
