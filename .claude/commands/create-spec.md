---
description: Write a frontend spec for one feature, then stop for review
argument-hint: <feature>
allowed-tools: Read, Write, Glob, Grep
---

Create a frontend spec for: $ARGUMENTS

1. Read `CLAUDE.md` and `.claude/specs/_template.md`.
2. Read the relevant `docs/backend-specs/*.md` as the primary reference for backend behavior.
3. If `docs/api-contract.md` exists, read it. If the backend specs and the contract do not cover an endpoint, field or role, ask me for the backend route and validation files. Never guess endpoints, fields or roles.
4. Read the existing `.claude/specs/NN-*.md` files to avoid duplication.
5. Number the new spec NN: count the existing `NN-*.md` files (ignore `_template.md`), add 1, start at 01, two digits.
6. Write `.claude/specs/NN-<slug>.md` from the template. Use a kebab-case slug.
7. Write the spec only. Do not write application code and do not create git branches.
8. Stop and wait for my review.
