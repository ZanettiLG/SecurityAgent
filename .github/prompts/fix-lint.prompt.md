---
description: 'Auto-fix ESLint and Prettier issues on modified files. Use when lint or format errors are reported.'
agent: coder
tools: ['execute', 'read']
---

# Fix Lint

Fix all ESLint and Prettier issues on modified files.

## Procedure

1. Get modified files: `git diff --name-only HEAD`
2. For each `.ts`/`.tsx` file: `npx eslint --fix <file>`
3. For each `.ts`/`.tsx`/`.json`/`.md` file: `npx prettier --write <file>`
4. Verify: `npx tsc --noEmit` in workspace with errors
5. Report any remaining issues that couldn't be auto-fixed
