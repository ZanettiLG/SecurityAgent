---
description: 'Start the agent handoff pipeline for a feature. Supports GitHub Issues mode (with #issue-number) or local filesystem mode (stores cards in .github/handoff-cards/). Triggers research → planning → implementation phases with audit trail.'
argument-hint: '[start | status | resume] [#issue-number | <feature-description>]'
---

# /handoff

Start, check, or resume the Agent Handoff Pipeline for a feature.

## Usage

```
/handoff start #123                  — Start pipeline for GitHub epic issue #123
/handoff start "Add narration preview" — Start pipeline in local mode (no GitHub issue)
/handoff status #123                 — Check current phase and sub-issues
/handoff status                      — Check all handoff cards in .github/handoff-cards/
/handoff resume #123                 — Resume from last completed phase
```

## What happens

1. Orchestrator detects storage backend (GitHub Issues vs Local Filesystem)
2. **GitHub Mode:** reads epic issue → creates sub-issues for each phase → runs agents
3. **Local Mode:** creates `.github/handoff-cards/<slug>-*.md` for each phase → runs agents
4. Both modes use `runSubagent` with **clean context** (only the handoff card)
5. Reports completion after each phase with card location and status

## Audit trail

**GitHub Mode:** Every phase creates a sub-issue:

- `agent:research` — codebase exploration output
- `agent:planning` — task decomposition
- `agent:implementation` — code changes + review summary

**Local Mode:** Every phase creates a Markdown file:

- `.github/handoff-cards/<slug>-research.md`
- `.github/handoff-cards/<slug>-planning.md`
- `.github/handoff-cards/<slug>-implementation.md`

Each card has a Handoff Contract showing exactly what the next agent receives.
