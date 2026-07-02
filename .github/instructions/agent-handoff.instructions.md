---
description: "This file describes the agent handoff protocol for the project monorepo. It defines how agents communicate, delegate tasks, and maintain a clean context across research, planning, implementation, code review, and testing phases."
---

# Agent Handoff Protocol

> **Applies to:** All agents in the handoff pipeline (`orchestrator`, `researcher`, `planner`, `coder`, `code-reviewer`, `test-runner`)
> **Protocol:** Structured handoff cards with context isolation — GitHub Issues sub-issues (preferred) or local Markdown files (fallback)
> **Hierarchical delegation:** See [delegation.instructions.md](./delegation.instructions.md) for the full tree architecture.

## Core Principle: Clean Context

Each phase of the handoff pipeline receives a **clean, curated card** — not the raw conversation or exploration logs. This is achieved via `runSubagent` with `send: true` for context isolation.

```
Feature Request → Researcher (reads codebase) → Research Card
                                                   ↓ (clean context handoff)
                                               Planner (reads ONLY research card) → Planning Card
                                                                                      ↓ (clean context handoff)
                                                                                  Coder (reads ONLY planning card) → Implementation Card
                                                                                                                       ↓ (clean context handoff)
                                                                                                               Code-reviewer (reads ONLY impl card) → Review findings
                                                                                                                       ↓ (clean context handoff)
                                                                                                               Test-runner (reads ONLY impl card) → Test results
```

### Hierarchical Delegation (Agent Tree)

Subagentes podem delegar para outros subagentes em árvore, NÃO apenas pipeline linear:

```
Main (delegador puro)
├── researcher → Research Card
├── planner → Planning Card
├── coder → Implementation
│   ├── code-reviewer → Review (volta pro coder se issues)
│   └── test-runner → Tests (volta pro coder se falhas)
└── [próximo ciclo...]
```

Cada nível da árvore recebe APENAS o cartão de handoff do nível anterior. Contexto NUNCA vaza entre níveis.

## Storage Backend: GitHub Issues (Primary) + Local (Fallback)

**Primary backend: GitHub Issues sub-issues.** When GitHub MCP is available, ALL cards go to sub-issues.

**Fallback: local files (`/handoff-cards/`).** When GitHub MCP is unavailable (no `mcp_github_mcp_se_*` tools), cards are written to `.github/handoff-cards/<slug>-<phase>.md`.

- Centralized audit trail across all sessions
- Full transparency (devs, reviewers, CI/CD can inspect any phase)
- Rich content support (Markdown, images, screenshots, code blocks)
- Automatic linking (sub-issues → parent epic → PR)

| Backend           | Card location                             | Tool                                      |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| **GitHub Issues** | Sub-issues of the parent epic             | `mcp_github_mcp_se_issue_write`           |
| **GitHub Files**  | Images/screenshots in `docs/screenshots/` | `mcp_github_mcp_se_create_or_update_file` |

### Auto-Epic Creation (No Existing Issue)

If NO GitHub issue exists yet when the pipeline starts, the orchestrator MUST create one:

1. Create the epic issue via `mcp_github_mcp_se_issue_write` (method: `create`)
   - Labels: `type:epic`
   - Title: descriptive feature name
   - Body: feature description + acceptance criteria from user prompt
2. Create sub-issues for each phase as the pipeline progresses
3. This ensures the pipeline NEVER blocks — it creates its own infrastructure

### Detection Logic (ALL agents MUST do this first)

1. If the prompt contains a GitHub issue number (`#123`) or sub-issue reference → use that issue
2. If NO issue reference exists → **the orchestrator creates an epic automatically** via `mcp_github_mcp_se_issue_write`
3. If GitHub MCP is unavailable, **fall back to local files** in `.github/handoff-cards/<slug>-<phase>.md`

## Labels

| Label                  | Meaning                                 | Who sets it           |
| ---------------------- | --------------------------------------- | --------------------- |
| `type:epic`            | Parent issue — the feature request      | Human or Orchestrator |
| `agent:research`       | Sub-issue — research phase              | Orchestrator          |
| `agent:planning`       | Sub-issue — planning phase              | Orchestrator          |
| `agent:implementation` | Sub-issue — implementation phase        | Orchestrator          |
| `status:in-progress`   | Agent is actively working on this phase | Orchestrator          |
| `status:needs-review`  | Phase completed — card ready for audit  | Orchestrator          |
| `status:approved`      | Human reviewed and approved this phase  | Human                 |
| `status:rejected`      | Human found issues — agent must refine  | Human                 |

## Images & Screenshots in Handoff Cards

Handoff cards support embedded images and screenshots. This is critical for visual evidence (architecture diagrams, UI screenshots, browser automation results).

### Upload Workflow

1. **Capture** the image/screenshot (via Playwright MCP, manual screenshot, or generated diagram)
2. **Save to repo** using `mcp_github_mcp_se_create_or_update_file`:
   - Path: `docs/screenshots/<slug>-<phase>-<description>.png`
   - Branch: current working branch (e.g., `feat/my-feature`)
   - Content: base64-encoded image data
3. **Get raw URL**: `https://raw.githubusercontent.com/ZanettiLG/project/<branch>/docs/screenshots/<filename>`
4. **Embed in issue body**: `![description](<raw_url>)`

### Example: Embedding a Screenshot in a Research Card

```markdown
## UI Screenshot (Current State)

![current-editor](https://raw.githubusercontent.com/ZanettiLG/project/feat/my-feature/docs/screenshots/my-feature-research-editor.png)

The editor page currently lacks the batch upload area.
```

### Image Conventions

- **Format**: PNG (preferred) or JPEG for photos
- **Max size**: Keep under 2MB per image (GitHub raw URL limit)
- **Naming**: `<slug>-<phase>-<description>.png` (e.g., `narration-preview-research-current-ui.png`)
- **Alt text**: Always provide descriptive alt text for accessibility
- **Branch**: Use the feature branch, not `master`, so images stay scoped to the feature

### Playwright Screenshot → GitHub MCP Pipeline

When the researcher or planner needs browser screenshots:

```
1. open_browser_page(url) → pageId
2. screenshot_page(pageId, element="...") → base64 image
3. mcp_github_mcp_se_create_or_update_file(
     owner="ZanettiLG", repo="project",
     branch="feat/my-feature",
     path="docs/screenshots/my-feature-research-ui.png",
     content="<base64-encoded-png>",
     message="docs: add research screenshot for my-feature"
   )
4. Embed in issue body: ![UI Screenshot](https://raw.githubusercontent.com/ZanettiLG/project/feat/my-feature/docs/screenshots/my-feature-research-ui.png)
```

## Handoff Contract Rules

Every handoff card (research, planning, implementation) MUST end with a **Handoff Contract** section:

```markdown
## 🤖 Handoff Contract

**To:** [next agent name]
**You receive:** [list of sections the next agent should read]
**You DO NOT receive:** [what was deliberately excluded — raw logs, conversation, etc.]
**Your job:** [one sentence — what the next agent should DO, not explore]
```

### Golden Rules

1. **The card IS the context.** The receiving agent reads ONLY the card body. Never inject conversation history or intermediate results.
2. **No re-exploration.** The planner trusts the research card — it does NOT re-read codebase files. The coder trusts the planning card — it does NOT re-plan.
3. **Self-contained cards.** If the next agent needs to know something, it goes in the card. No "see conversation above" or "as we discussed."
4. **Structured output.** Every card follows its template exactly. Loose prose gets lost.
5. **Audit trail.** Every card is tracked: either as a GitHub sub-issue (`Epic #5 → Research #6 → Planning #7 → Implementation #8 → PR #9`) or as local files (`.github/handoff-cards/5-research.md → 5-planning.md → 5-implementation.md`).

## How to Trigger the Pipeline

### Standard Flow (Epic Already Exists)

1. **Create an Epic** using the issue template `🎯 Feature Epic`
2. **Invoke the orchestrator**: `/handoff start #N` or ask Copilot: "run the handoff pipeline for issue #N"
3. **Orchestrator runs**: reads epic → creates research sub-issue → runs `researcher` agent → populates research card → reports done
4. **Dev audits**: reviews research card → says "approved" (or gives feedback)
5. **Orchestrator continues**: reads research card → creates planning sub-issue → runs `planner` agent → populates planning card
6. **Repeat for implementation**
7. **Final**: coder creates PR → code-reviewer reviews → CI/CD gates → dev merges

### Auto-Epic Flow (No Existing Issue — Orchestrator Creates Everything)

1. **Describe the feature** to Copilot: "I want to build X that does Y"
2. **Orchestrator detects no issue** → creates an epic via `mcp_github_mcp_se_issue_write`:
   ```
   mcp_github_mcp_se_issue_write(
     method: "create",
     owner: "ZanettiLG", repo: "project",
     title: "[Feature] X",
     body: "Feature description + acceptance criteria",
     labels: ["type:epic"]
   )
   ```
3. **Pipeline proceeds** exactly as the standard flow — all phases tracked as sub-issues
4. **Dev audits** at any phase via the GitHub issue URL reported by the orchestrator

## Phase Execution Detail

### Phase 0: Detection (ALL agents MUST do this first)

Before executing any phase, determine the GitHub issue context:

```
if (prompt contains issue number like #123 or sub-issue reference):
  → Use that issue. Card goes to sub-issue body via mcp_github_mcp_se_issue_write.
  → Card reference: "sub-issue #N"
else:
  → Orchestrator creates an epic automatically via mcp_github_mcp_se_issue_write.
  → Then creates sub-issues for each phase.
  → NEVER proceed without a GitHub issue to write to.
```

### Phase 1: Research

```
runSubagent(
  agentName = "researcher",
  prompt = <epic body only — description + acceptance criteria + constraints>,
  description = "Research phase for <feature name>"
)
```

Output: Research Card (sub-issue, `agent:research`, `status:needs-review`)

### Phase 2: Planning

```
runSubagent(
  agentName = "planner",
  prompt = <research card body only — the ENTIRE research card, nothing else>,
  description = "Planning phase for <feature name>"
)
```

Output: Planning Card (sub-issue, `agent:planning`, `status:needs-review`)

### Phase 3: Implementation

```
runSubagent(
  agentName = "coder",
  prompt = <planning card body only — the Tasks list + Architecture Notes + Acceptance Criteria>,
  description = "Implementation phase for <feature name>"
)
```

Output: Implementation Card (sub-issue, `agent:implementation`, `status:in-progress`)

### Phase 4: Code Review (Auto-triggered by Coder)

The coder auto-delegates to code-reviewer via `handoffs` (`send: true`):

```
runSubagent(
  agentName = "code-reviewer",
  prompt = "Read the Implementation Card at .github/handoff-cards/<slug>-implementation.md. Review the changes against project conventions. Append review findings to the same card.",
  description = "Code review for <feature name>"
)
```

**If issues found:** code-reviewer auto-delegates back to coder for fixes (`send: true`). Max 3 iterations.

Output: Updated Implementation Card with `## Code Review Summary` section.

### Phase 5: Tests (Auto-triggered by Coder after Review)

The coder auto-delegates to test-runner via `handoffs` (`send: true`):

```
runSubagent(
  agentName = "test-runner",
  prompt = "Run the test suite for the changed files identified in .github/handoff-cards/<slug>-implementation.md. Report results.",
  description = "Test validation for <feature name>"
)
```

**If failures:** test-runner auto-delegates back to coder for fixes (`send: true`). Max 3 iterations.

Output: Updated Implementation Card with `## Test Results` section.

### Phase 6: Git & PR (Auto-triggered after Tests Pass)

The coder handles Git AUTOMATICALLY. NO questions about commits or pushes. The ONLY question is PR creation via `vscode_askQuestions`.

#### Git Autopilot (NO USER INTERACTION)

```
1. Create branch     → git checkout -b feature/<slug>
2. Commit per task   → git add <files> && git commit -m "<type>: <description>"
3. Push per commit   → git push -u origin feature/<slug>
```

**Commit message format (Conventional Commits):**

- `feat: adiciona <feature>`
- `fix: corrige <bug>`
- `refactor: reorganiza <module>`
- `test: adiciona testes para <feature>`
- `docs: atualiza documentação de <feature>`

#### PR Creation (ONLY user interaction in this phase)

After review passes AND tests pass, use `vscode_askQuestions`:

```
vscode_askQuestions({
  questions: [
    {
      header: "Criar Pull Request?",
      question: "Código revisado e testado. Criar PR para merge?",
      options: [
        { label: "Sim, criar PR", recommended: true },
        { label: "Não, manter na branch" }
      ]
    },
    {
      header: "Branch base",
      question: "Para qual branch o PR deve ser aberto?",
      options: [
        { label: "master", recommended: true },
        { label: "develop" }
      ]
    }
  ]
})
```

Then create the PR via `mcp_github_mcp_se_create_pull_request`:

```
mcp_github_mcp_se_create_pull_request(
  owner: "ZanettiLG", repo: "project",
  title: "feat: <feature description>",
  head: "feature/<slug>",
  base: "master"  // or "develop" from user choice
)
```

#### What the Coder NEVER Asks

```
❌ "Quer que eu crie uma branch?"
❌ "Quer que eu faça commit?"
❌ "Quer que eu faça push?"
❌ "Devo rodar os testes?"
❌ "Quer que eu continue?"

✅ Apenas age. Branch → code → commit → push → review → test → PR.
```

## Anti-patterns

| ❌ Don't                                                | ✅ Do                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| Pass raw file contents to planner                       | Pass Research Card with file references                     |
| Inject conversation history into subagent prompt        | Build prompt from card body only                            |
| Skip creating sub-issue (invisible audit trail)         | Always create sub-issue BEFORE running agent                |
| Planner re-explores codebase                            | Planner trusts Research Card, decomposes tasks              |
| Coder reads research card                               | Coder reads ONLY Planning Card                              |
| Handoff without structured card                         | Every handoff has exact template                            |
| Wait indefinitely for a GitHub issue that doesn't exist | Orchestrator creates epic automatically via MCP             |
| Write output only to conversation (no issue)            | Always persist the card via `mcp_github_mcp_se_issue_write` |
| Fall back to local filesystem                           | GitHub Issues via MCP is the ONLY backend                   |
| Skip screenshots when visual evidence would help        | Embed screenshots via `docs/screenshots/` + raw URL         |

## Persisting Output

All agents use `mcp_github_mcp_se_issue_write` to write/update sub-issues:

```
mcp_github_mcp_se_issue_write(
  method: "update",  // or "create" for new sub-issues
  owner: "ZanettiLG", repo: "project",
  issue_number: <sub-issue number>,
  body: "<full card body in Markdown>",
  labels: ["agent:<phase>", "status:needs-review"]
)
```

## Embedding Screenshots in Phase Output

Agents can include screenshots captured via Playwright MCP:

1. Capture via `screenshot_page(pageId)` or `browser_snapshot`
2. Upload via `mcp_github_mcp_se_create_or_update_file` to `docs/screenshots/`
3. Embed in issue body: `![description](https://raw.githubusercontent.com/ZanettiLG/project/<branch>/docs/screenshots/<file>.png)`

## Handoff Card Templates

### Research Card Template

```markdown
# Research: [Feature Name]

## Context

[Brief: what problem does this feature solve? From the epic]

## Screenshots / Visual Evidence

<!-- Embed screenshots captured during research -->

![current-state](https://raw.githubusercontent.com/ZanettiLG/project/<branch>/docs/screenshots/<slug>-research-<desc>.png)

## Codebase Exploration

### Relevant Files

| File | Path              | Relevance             |
| ---- | ----------------- | --------------------- |
|      | `backend/src/...` | Why this file matters |

### Existing Patterns to Follow

- [Pattern name]: [where it's used in the codebase]

### Constraints Discovered

- [Constraint]: [why it matters]

### Dependencies

| Dependency | Type         | Status            |
| ---------- | ------------ | ----------------- |
|            | existing/new | available/blocked |

### Risks

| Risk | Likelihood   | Mitigation |
| ---- | ------------ | ---------- |
|      | low/med/high |            |

### Definition of Done for Planning

- [ ] All relevant files identified
- [ ] Constraints documented
- [ ] Dependencies mapped
- [ ] No open questions blocking planning

## 🤖 Handoff Contract

**To:** planner
**You receive:** Context, Screenshots, Relevant Files, Constraints, Dependencies
**You DO NOT receive:** raw exploration logs, file contents, agent conversation
**Your job:** Decompose this research into atomic implementation tasks — do NOT re-explore the codebase.
```

### Planning Card Template

```markdown
# Plan: [Feature Name]

## Objective

[One sentence: what we're building]

## Architecture Notes

[Design decisions: layers touched, patterns to use, DI considerations]

<!-- Optional: architecture diagram -->

![architecture](https://raw.githubusercontent.com/ZanettiLG/project/<branch>/docs/screenshots/<slug>-planning-arch.png)

## Tasks (ordered by dependency)

### Task 1: [Name] (complexity: low/medium/high)

- **Files to create**:
  - `path/to/file.ts` — [what this file does]
- **Files to edit**:
  - `path/to/existing.ts` — [what changes]
- **Dependencies**: None / Task X
- **Conventions**: [specific AGENTS.md conventions that apply]
- **Test strategy**: [unit/integration, what to test]

### Task 2: [Name] (complexity: ...)

...

## Acceptance Criteria

- [ ] Criterion from the epic
- [ ] ...

## Definition of Done for Implementation

- [ ] All tasks completed
- [ ] Tests passing (baseline: 330 backend + 2 frontend)
- [ ] Lint and typecheck passing
- [ ] Code review passed

## 🤖 Handoff Contract

**To:** coder
**You receive:** Objective, Architecture Notes, Tasks list, Acceptance Criteria
**You DO NOT receive:** research exploration, planning rationale, agent conversation
**Your job:** Implement each task in order — one task, one commit — do NOT re-plan.
```

### Implementation Card Template

```markdown
# Implementation: [Feature Name]

## Status

- [x] Task 1: [Name] — done
- [ ] Task 2: [Name] — in progress
      ...

## Files Changed

| File               | Action  | Notes           |
| ------------------ | ------- | --------------- |
| `path/to/file.ts`  | created | [what was done] |
| `path/to/other.ts` | edited  | [what changed]  |

## Screenshots / Visual Evidence

<!-- Embed before/after screenshots if UI changes -->

![after-change](https://raw.githubusercontent.com/ZanettiLG/project/<branch>/docs/screenshots/<slug>-implementation-<desc>.png)

## Tests Added

| Test file                   | Tests   | Coverage         |
| --------------------------- | ------- | ---------------- |
| `__tests__/feature.test.ts` | N tests | scenario covered |

## Code Review Summary

[Populated by code-reviewer handoff]

- 🔴 Critical: N issues
- 🟡 High: N issues
- 🔵 Medium: N issues
- ⚪ Low: N issues

## Test Results

[Populated by test-runner handoff]

### Backend (N/N passing)

- ✓ file.test.ts (N tests)
- ✗ file.test.ts > test name — [error]

### Frontend (N/N passing)

- ✓ component.test.tsx

### Summary

All passing ✓ | X failures ✗

## Final Checklist

- [ ] All tasks complete
- [ ] Tests passing (backend: 330/330, frontend: 2/2)
- [ ] Lint: 0 warnings
- [ ] Typecheck: 0 errors
- [ ] Code review: 0 critical issues
- [ ] PR created

## 🤖 Handoff Contract

**To:** code-reviewer (or test-runner)
**You receive:** Files Changed, Tests Added, Planning Objective
**You DO NOT receive:** implementation conversation, debugging logs
**Your job:** Review changes against the 6 criteria (Correction, Tests, Naming, Duplication, Architecture, Security) — OR — Run the test suite and report results.
```

## Rules

1. **NEVER pass raw conversation context** to a subagent. Only the handoff card body.
2. **Always create sub-issues** before invoking the subagent — the sub-issue number is the audit identifier.
3. **Always report phase completion** with sub-issue number and status for the dev to audit.
4. **If GitHub MCP is unavailable**, report the error and stop. Do NOT fall back to local files.
5. **If a phase fails** (agent error, incomplete output), set sub-issue to `status:rejected` and report.
6. **Screenshots are encouraged** — embed visual evidence whenever it clarifies the card (UI state, architecture, flow).
