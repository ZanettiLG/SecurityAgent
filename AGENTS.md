---
agents:
  - name: main
    description: "Delegador puro — raiz da árvore de agentes. NUNCA faz trabalho, apenas decompõe e delega para subagentes especializados."
    files:
      - .github/agents/main.agent.md
    user-invocable: true

  - name: orchestrator
    description: "Master orchestrator que drive o pipeline completo (research → planning → implementation → review → test → PR) via GitHub Issues sub-issues."
    files:
      - .github/agents/orchestrator.agent.md
    user-invocable: true

  - name: researcher
    description: "Read-only agent para explorar o codebase antes da implementação. Mapeia arquivos, descobre constraints e produz Research Card."
    files:
      - .github/agents/researcher.agent.md
    user-invocable: true

  - name: planner
    description: "Use when planning features, breaking down specs, criando task lists, analyzing requirements. Read-only: analisa codebase e gera implementation plan."
    files:
      - .github/agents/planner.agent.md
    user-invocable: true

  - name: coder
    description: "Implementa código seguindo as convenções do Audiobooker. Autopilot: commita, pusha, e engata review automaticamente."
    files:
      - .github/agents/coder.agent.md
    user-invocable: true

  - name: code-reviewer
    description: "Use when reviewing code changes, PR review, checking conventions, validating patterns, security audit. Read-only agent."
    files:
      - .github/agents/code-reviewer.agent.md
    user-invocable: true

  - name: test-runner
    description: "Use when running tests, validating fixes, checking test coverage. Runs vitest nos workspaces backend e frontend."
    files:
      - .github/agents/test-runner.agent.md
    user-invocable: true

  - name: browser
    description: "Use when you need to navigate websites, inspect UI, interact with the built-in browser, or verify web flows in GitHub Copilot."
    files:
      - .github/agents/browser.agent.md
    user-invocable: true
---

# Agentes do Vigia / SecurityAgent

Este arquivo é o **registro central de agentes** do projeto. Cada agente listado acima possui um arquivo `.agent.md` em `.github/agents/` com instruções detalhadas.

## Pipeline de Handoff

O fluxo de trabalho completo segue esta cadeia:

```mermaid
main / orchestrator
  → researcher (explora codebase → Research Card)
    → planner (decompõe tarefas → Planning Card)
      → coder (implementa → auto-commit+push)
        → code-reviewer (revisa → append no card)
          → test-runner (roda testes → report)
```

### Agentes Utilitários

Agentes especializados que o orquestrador aciona conforme a necessidade da feature:

```mermaid
orchestrator
  → browser (navegação web, análise de layout, revisão visual, pesquisa online)
```

## Convenções

- Todos os agentes são definidos em `.github/agents/*.agent.md` com YAML frontmatter
- Skills em `.github/skills/*/SKILL.md`
- Instruções compartilhadas em `.github/instructions/*.instructions.md`
- Slash commands em `.github/prompts/*.prompt.md`
- MCP servers configurados em `.vscode/mcp.json`

## Modelos

| Agente        | Modelo                          |
| ------------- | ------------------------------- |
| main          | OpenCode Go / Deepseek V4 Pro   |
| orchestrator  | OpenCode Go / Deepseek V4 Pro   |
| researcher    | OpenCode Go / Deepseek V4 Flash |
| planner       | OpenCode Go / Deepseek V4 Pro   |
| coder         | mistral-nemo:12b (ollama)       |
| code-reviewer | OpenCode Go / Deepseek V4 Flash |
| test-runner   | OpenCode Go / Deepseek V4 Flash |
| browser       | OpenCode Go / Deepseek V4 Flash |
