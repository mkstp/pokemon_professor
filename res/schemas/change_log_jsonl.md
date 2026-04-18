# Schema: Change and Decision Log Entry (JSONL)

File: `change_and_decision_log.jsonl`. One JSON object per line. Append-only. Written by EOS skill. Session number increments from the last entry.

```json
{"date":"YYYY-MM-DD","session":<int>,"phase":"<phase name>","duration_minutes":<int>,"title":"<session title>","context":"<1–2 sentence prose summary>","decisions":[{"title":"...","description":"...","rationale":"..."}],"artifacts_created":[{"artifact":"<path>","summary":"..."}],"artifacts_modified":[{"artifact":"<path>","summary":"..."}],"artifacts_deleted":["<path>"],"resolved_issues":[{"id":"meta_project-<hash>","title":"...","resolution":"..."}],"next_session_focus":[{"priority":<int>,"issue":"meta_project-<hash> or null","title":"...","rationale":"..."}]}
```

**Field notes:**
- `phase` — optional string; names the project phase this session belongs to. Captured by EOS; defaults to the previous session's phase. Conventional bookends: `"Initialization & Conceptual Grounding"` for early sessions, `"Reporting"` for final sessions. Middle phases are project-specific free-form strings. Omit for sessions predating this field.
- `duration_minutes` — optional integer; total working time for the session in minutes. Computed automatically from `.claude/session_start.tmp` (written by SOS) and confirmed or corrected by the user at EOS. Omit for sessions predating this field.
- `artifacts_created`, `artifacts_modified`, `artifacts_deleted` — omit the key entirely if nothing to record in that category
- `resolved_issues` — optional array; issues closed during this session. Each item: `id` (Beads issue ID, e.g. `meta_project-jkf`), `title` (issue title), `resolution` (one sentence). Omit the key if no issues were closed.
- `next_session_focus` — ordered array of 1–3 suggested focus items for the next session, written by EOS while context is fresh; read by SOS to avoid re-deriving suggestions cold. Each item: `priority` (1-indexed), `issue` (Beads issue ID in the form `meta_project-<hash>`, e.g. `meta_project-jkf`, or null if not tied to a specific issue), `title` (short label), `rationale` (one sentence)
- The entire entry must be a single line with no embedded newlines
