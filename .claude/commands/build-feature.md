---
description: Implement one approved spec in small, verified steps
argument-hint: <spec number or name, e.g. 02-auth>
allowed-tools: Read, Write, Edit, Glob, Grep
---

Implement the spec: $ARGUMENTS

1. Read `CLAUDE.md`, `.claude/rules/`, `.claude/specs/01-foundation.md` (shared conventions; skip if this is spec 01), `.claude/specs/18-design-system.md` (visual patterns; read it for any page or component) and the matching spec in `.claude/specs/`. Skim the specs named in its "Depends on". If the spec is missing or unclear, stop and ask me.
2. When a backend rule is unclear, read the backend specs listed in the spec header from `docs/backend-specs/`. Never guess endpoints, fields or roles.
3. Build the pages marked P0 only. Ask me before building any P1 page.
4. Show a short plan and the list of files you will create or change. Wait for my OK.
5. Implement in small changes and follow the spec's acceptance checklist.
6. Run `npm run typecheck`, `npm run lint` and `npm run build`. Fix every error. If a check cannot run, say so. Never claim success if a check fails.
7. Report what changed, which checklist items pass, and which could not be verified. Propose one commit message in the form `type: summary`. Commit only if I say so.
