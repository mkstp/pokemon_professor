---
name: eos
description: End of session — summarizes decisions and issues, checks charter alignment, confirms with user, then updates Change & Decision Log and Outstanding Issues Tracker. Aliases: 'wrap up', 'close out'.
---

# SKILL: End of Session (EOS)

## Trigger Conditions

**User-initiated:** "/eos," "end of session," "let's wrap up," "close out," or similar.

---

## Procedure

### Phase 1: Session Summary

Review the conversation and identify:

1. **Decisions made** — what was resolved, rationale, artifacts created/modified
2. **Issues surfaced** — new questions, deferrals, blockers
3. **Artifact changes** — documents updated, plans revised

### Phase 1b: Capture Session Duration

Run the following to compute elapsed time since SOS:

```bash
start=$(cat .claude/session_start.tmp 2>/dev/null); [ -n "$start" ] && echo $(( ($(date +%s) - start) / 60 ))
```

If the file exists and returns a number, present it to the user:

> "Computed session duration: ~Xh Ym."

If the file does not exist (SOS was not run, or a prior session left no file), prompt:

> "No session start time found. Enter duration in minutes"

Once confirmed, delete the temp file:

```bash
rm -f .claude/session_start.tmp
```

Hold the confirmed `duration_minutes` integer (or `null` if skipped) for use in Phase 4.

### Phase 1c: Capture Session Phase

Read the last line of `reports/change_and_decision_log.jsonl` and extract the `phase` field (if present). Present it to the user:

> "Current phase: *[phase name]* — say 'continue' to keep, or type a new phase name."

If no prior entry has a `phase` field, prompt fresh:

> "What phase should this session be logged under? (e.g., 'Initialization & Conceptual Grounding', 'Framework Development', 'Reporting')"

Hold the confirmed phase value for use in Phase 4.

### Phase 2: Charter Alignment Check

Read `project_context/project_charter.md`. Check session activities against it:

- Did work contribute to the overarching objective?
- Were decisions consistent with operative principles?
- Did any work fall outside scope commitments?
- Did the session advance success criteria?

**If misalignments found:** flag each as a new issue with context "Charter alignment: [description]." Note whether the charter needs updating or the work needs correcting. Surface during Phase 3.

### Phase 3: Confirm with User

Present summary:

> "Here's what I captured from this session:
> - **Decisions:** [list]
> - **New issues:** [list]
> - **Artifacts created/modified:** [list]
> - **Charter alignment:** [concerns or "No misalignments identified"]
>
> Anything to add or correct before I log this?"

Wait for confirmation or amendments.

### Phase 4: Update Artifacts

**Change and Decision Log (JSONL)** — append one JSON line to `reports/change_and_decision_log.jsonl`. To determine the session number, read the last line of the JSONL file and increment `.session` by 1. Use this schema exactly:

```json
{"date":"YYYY-MM-DD","session":<int>,"phase":"<confirmed phase>","duration_minutes":<int>,"title":"<session title>","context":"<1–2 sentence prose summary>","decisions":[{"title":"...","description":"...","rationale":"..."}],"artifacts_created":[{"artifact":"<path>","summary":"..."}],"artifacts_modified":[{"artifact":"<path>","summary":"..."}],"artifacts_deleted":["<path>"],"resolved_issues":[{"id":"meta_project-<hash>","title":"...","resolution":"..."}],"next_session_focus":[{"priority":<int>,"issue":"meta_project-<hash> or null","title":"...","rationale":"..."}]}
```

Omit `artifacts_created`, `artifacts_modified`, or `artifacts_deleted` keys if there is nothing to record in that category. The entire entry must be a single line with no embedded newlines.

`next_session_focus` is always included: 1–3 items ordered by priority, written while session context is fresh. SOS will read and display this field instead of re-deriving suggestions cold.

**Outstanding Issues Tracker (Beads)** — use the `bd` CLI (run from the project root) to manage issues:

- **New issues:** `bd create "Title" -p <0–4>` — use `--notes "..."` for context
- **Update status:** `bd update <id> -s in_progress` / `-s deferred`
- **Add dependency:** `bd dep add <child-id> <parent-id>`
- **Resolve:** `bd close <id> "brief resolution note"`

Issue IDs take the form `meta_project-<hash>` (e.g., `meta_project-jkf`). Reference these IDs in the JSONL log entry instead of `#N` numbers.

**Resolved issues go in the log entry**, not the tracker. Add a "Resolved Issues" subsection to the Change and Decision Log entry: issue ID, brief description, resolution summary.

**Export issues snapshot** — after updating the log, regenerate the report's issues file:

```bash
bd export --no-memories -o reports/issues.jsonl
```

### Phase 5: Handoff

Confirm updates were made. Note what to pick up next session, highest-priority open issues, and any time-sensitive items. This content is what you wrote into `next_session_focus` — surface it to the user as a brief handoff note.

---