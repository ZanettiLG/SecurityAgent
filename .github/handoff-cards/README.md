# Handoff Cards

> ⚠️ **GitHub Issues é o backend primário.** Cards locais são fallback APENAS quando o GitHub MCP está indisponível. Veja [agent-handoff.instructions.md](../instructions/agent-handoff.instructions.md).

## Primary: GitHub Issues (Sub-Issues)

The handoff pipeline persists cards as **GitHub sub-issues** under the parent epic:

```
🎯 Epic #N (type:epic)
├── 🔍 #N+1 research (agent:research)
├── 🗂️ #N+2 planning (agent:planning)
└── ⚙️ #N+3 implementation (agent:implementation)
```

Each phase receives only the card body from the previous phase — clean context handoff via `runSubagent`.

## Fallback: Local Files

When GitHub MCP is unavailable, cards are stored here as Markdown files.

## File Naming Convention

```
<issue-number>-<phase>.md
```

Examples:

- `30-research.md` — Research card for epic #30
- `30-planning.md` — Planning card for epic #30

## Workflow

1. Orchestrator creates epic + sub-issues via GitHub MCP
2. `runSubagent` spawns researcher → writes to sub-issue body
3. Planner reads research sub-issue → creates planning sub-issue
4. Coder reads planning → implements → opens PR
5. Code-reviewer + test-runner validate → PR ready
