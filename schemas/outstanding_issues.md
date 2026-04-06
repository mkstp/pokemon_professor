# Schema: Outstanding Issues

Outstanding issues are managed via the Beads CLI (`bd`), not a markdown file. The Beads database is stored at `.beads/` in the project root.

## Key commands

| Operation | Command |
|-----------|---------|
| List unblocked issues | `bd ready` |
| Create an issue | `bd create "Title" -p <0–4>` |
| Add notes | `bd update <id> --notes "..."` |
| Update status | `bd update <id> -s in_progress\|deferred` |
| Add dependency | `bd dep add <child-id> <parent-id>` |
| Resolve | `bd close <id> "resolution note"` |
| Inspect | `bd show <id>` |

## Issue IDs

IDs take the form `meta_project-<hash>` (e.g., `meta_project-jkf`). Use these IDs — not sequential `#N` numbers — when referencing issues in the Change and Decision Log.

## Priority levels

| Level | Meaning |
|-------|---------|
| P0 | Critical |
| P1 | High |
| P2 | Medium |
| P3 | Low |
| P4 | Backlog |
