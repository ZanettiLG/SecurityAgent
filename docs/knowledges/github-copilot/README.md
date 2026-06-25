# Plano do Curso: Harness do GitHub Copilot e Programação Agêntica com VS Code (12 aulas)

Este arquivo é a **fonte única da verdade** sobre a sequência, numeração e escopo das 12 aulas deste módulo.

## Público-alvo e ponto de partida

**Público**: desenvolvedores com experiência intermediária em programação. O aluno já programa, usa Git, e tem familiaridade com VS Code ou outro editor moderno.

**O que o aluno já sabe**: Git, GitHub, HTML, CSS, JavaScript básico, linha de comando. Já usou editores de código (VS Code ou similar).

**O que o curso cobre do zero**: GitHub Copilot (todas as features), programação agêntica, design de harness, MCP, hooks, plugins, CLI, Cloud Agent, SDK.

**Pré-requisito técnico**: VS Code instalado, conta GitHub, Git configurado. Node.js para as aulas de SDK (Aula 12).

**Compromisso do curso**: toda aula que introduzir um conceito de agente ou Copilot deve explicá-lo do zero. O foco está SEMPRE no harness — o código do projeto de teste é apenas o pretexto.

## Filosofia: cada aula é concreta e treinável

Cada aula entrega:

1. **Conteúdo principal** (`aula-NN-<slug>.md`): explicação conceitual + demonstração guiada + exercícios resolvidos (Mão na Massa, Quick Check, Exercícios Graduados, Quiz).
2. **Questões de Aprendizagem** (`aula-NN-questoes-de-aprendizagem.md`): arquivo **separado** com tarefas práticas que funcionam como checkpoint — *"eu realmente entendi a matéria?"*. Cada questão tem **Objetivo → Passos de Execução → Entrega**.

O arquivo de questões é um guia: *"isto é importante — você entendeu? Então tente fazer."* O aluno só avança quando consegue completar as questões por conta própria.

## Projeto Progressivo: Seu Portal de Projetos Dev

A cada aula (a partir da 02), o aluno adiciona uma peça ao seu harness Copilot — um conjunto de instruções, skills, agentes e ferramentas que cresce ao longo do curso. O harness opera sobre um **Portal de Projetos Dev**: um dashboard web simples (HTML + CSS + JavaScript vanilla) que exibe projetos, status e métricas. O foco está SEMPRE no harness — o portal é apenas o pretexto.

| Aula | Peça adicionada ao harness | O que o aluno faz |
|---|---|---|
| 01 | Modelo mental (sem artefato) | Constrói a base conceitual: ecossistema Copilot, paradigma agêntico, as 8 dimensões |
| 02 | Semente do harness | Instala Copilot no VS Code, cria `.github/copilot-instructions.md` mínimo, autentica, testa autocomplete e chat |
| 03 | Instruções refinadas | Aprofunda `copilot-instructions.md` com stack, estilo e convenções; cria `.instructions.md` condicionais com `applyTo` glob |
| 04 | Prompts e contexto | Cria `.github/prompts/` com slash commands customizados; domina @workspace, @file, @folder, @web |
| 05 | Agent Mode | Primeira tarefa autônoma: Copilot edita múltiplos arquivos, executa terminal, detecta e corrige erros no ciclo Understand→Act→Validate |
| 06 | Workflows e comandos | Domina /plan, /fix, /tests, /doc; pratica Copilot Edits com working set; usa checkpoints para rollback |
| 07 | Agent Skills | Cria skills customizadas em `.github/skills/` com SKILL.md + scripts; entende ciclo de vida: listada→carregada→ativa→descartada |
| 08 | Custom Agents e subagentes | Cria agentes especializados em `.github/agents/*.agent.md`; configura tools, modelo e instruções; pratica delegação com runSubagent |
| 09 | MCP — Model Context Protocol | Conecta servidores MCP (GitHub, Playwright) via `.vscode/mcp.json`; explora MCP Registry; entende stdio vs HTTP/SSE |
| 10 | Hooks, Plugins e extensões | Cria hooks de lifecycle (PostToolUse, PreToolUse); empacota skills+agents+hooks como Agent Plugin; explora marketplace |
| 11 | CLI, Cloud Agent e Code Review | Usa Copilot CLI (`gh copilot`) para automação; configura Cloud Agent (GitHub Actions + issues); pratica code review automatizado |
| 12 | SDK, governança e Continual Harness | Cria custom tool com Copilot SDK; aplica métricas de governança; fecha o ciclo: atuar→observar→refinar o próprio harness |

**Projeto de teste**: um dashboard "Portal de Projetos Dev" (HTML, CSS, JavaScript vanilla) que lista projetos com cards, filtra por status, e persiste dados em JSON. Não se ensina HTML, CSS ou JavaScript neste curso — o foco é o harness.

## O mecanismo central (eixo transversal)

O fio condutor de todas as aulas é o **ciclo fundamental de execução do Copilot**:

```
[System Prompt do Copilot]
    + [Custom Instructions: copilot-instructions.md + .instructions.md]
    + [Definições das tools disponíveis (built-in + MCPs + agent skills)]
    + [Contexto do workspace (@mentions, arquivos abertos, seleção)]
    + [Histórico da conversa]
    = Contexto enviado ao modelo
```

A cada iteração, o modelo decide entre: responder em texto, chamar uma ferramenta, ou pedir esclarecimento. O Agent Mode adiciona o loop Understand→Act→Validate, onde o Copilot itera autonomamente até concluir a tarefa.

## Sequência das 12 aulas

### Aula 01: Ecossistema GitHub Copilot e o Paradigma Agêntico

Os tijolos conceituais: o que é GitHub Copilot (além do autocomplete), o ecossistema de produtos (IDE, CLI, Cloud, App), planos e modelos disponíveis. Depois, o paradigma agêntico: a diferença entre copiloto e agente autônomo, as 8 dimensões que separam os paradigmas (iniciativa, escopo, persistência, ferramentas, aprovação, memória, planejamento, execução), e onde o Copilot se posiciona nesse espectro. **Sem instalação ainda — é a aula dos fundamentos.**

### Aula 02: Setup, Instalação e Primeiros Passos no VS Code

Prática: instalar a extensão Copilot no VS Code, autenticar com GitHub, escolher entre planos (Free, Pro, Pro+, Max), testar autocomplete inline, Next Edit Suggestions e Chat. **Destaque do harness**: o aluno planta a semente — cria `.github/copilot-instructions.md` mínimo e estrutura inicial do projeto Portal de Projetos Dev.

### Aula 03: Custom Instructions — O Coração do Harness

Mergulho profundo em `.github/copilot-instructions.md`: categorias de regras (stack, estilo, convenções, restrições), o que colocar e o que NÃO colocar, anti-padrões comuns. Instructions condicionais com `.instructions.md` e `applyTo` glob. Níveis de escopo: usuário (`~/.copilot/instructions/`) vs repositório vs organização. Compatibilidade com AGENTS.md e CLAUDE.md. **Destaque do harness**: o aluno refina seu `copilot-instructions.md` com regras detalhadas e cria instructions condicionais por tipo de arquivo.

### Aula 04: Contexto, @mentions e Prompt Files

Como o Copilot monta o contexto: system prompt + instructions + tools + histórico. O poder das @mentions: @workspace (busca semântica no repo), @file (arquivo específico), @folder (diretório inteiro), @web (busca na internet), @terminal (último comando), #symbols (classes, funções). Prompt files como slash commands: `.github/prompts/*.prompt.md` → `/comando`. **Destaque do harness**: o aluno cria prompts customizados para tarefas recorrentes do portal (gerar cards, estilizar componentes, validar dados).

### Aula 05: Agent Mode — O Copilot como Agente Autônomo

O loop Understand→Act→Validate: como o Copilot lê o codebase, decide o que editar, executa mudanças e valida o resultado. Níveis de permissão: Default Approvals → Bypass Approvals → Autopilot. Os 9 tool sets built-in (#edit, #read, #search, #execute, #terminal, #web, #vscode, #todos, #browser). **Destaque do harness**: primeira tarefa totalmente autônoma — o aluno pede ao Copilot para criar um novo componente do portal, e observa o ciclo completo de planejamento, execução e correção.

### Aula 06: Slash Commands e Workflows de Desenvolvimento

Domínio dos slash commands built-in: /explain, /fix, /fixTestFailure, /tests, /setupTests, /doc, /plan, /new, /newNotebook, /init, /clear, /compact, /fork, /debug, /troubleshoot, /search, /startDebugging. Copilot Edits: edição multi-arquivo com working set, inline diffs, Keep/Undo. Checkpoints e rollback. **Destaque do harness**: o aluno usa /plan para planejar uma feature, /tests para gerar cobertura, /fix para corrigir bugs — tudo no contexto do portal.

### Aula 07: Agent Skills — Conhecimento Sob Demanda

Skills como conhecimento injetável: diferente de instructions (sempre carregadas), skills só consomem tokens quando ativadas. Anatomia de uma skill: `SKILL.md` + `scripts/` + `resources/`. Ciclo de vida: listada (disponível) → carregada (/skill ou automático) → ativa (no contexto) → descartada (fora da janela). Skills do awesome-copilot (349+ catalogadas). **Destaque do harness**: o aluno cria skills para tarefas recorrentes (gerar teste, revisar acessibilidade, validar HTML semântico).

### Aula 08: Custom Agents e Subagentes

Custom Agents definidos em `.github/agents/*.agent.md`: cada agente tem tools permitidas, modelo e instruções próprias. Criação via `/create-agent` ou manual. Subagentes e delegação: `runSubagent` tool, contexto isolado, paralelismo. Fleet mode para orquestração multi-agente. **Destaque do harness**: o aluno cria um agente especialista em revisão de código e outro em geração de documentação, cada um com tools e instruções específicas.

### Aula 09: MCP — Model Context Protocol no Copilot

O protocolo MCP como padrão aberto: arquitetura cliente-servidor, transporte (stdio vs HTTP/SSE), ciclo de vida (conexão→descoberta→chamada→resposta). Configuração no Copilot: `.vscode/mcp.json`. GitHub MCP Server (19 toolsets: repos, issues, PRs, actions, etc.). Playwright MCP para testes de browser. MCP Registry: 98 servidores curados. **Destaque do harness**: o aluno conecta GitHub MCP Server e Playwright MCP ao seu harness, expandindo o alcance do Copilot além do sistema de arquivos local.

### Aula 10: Hooks, Plugins e Extensões

Hooks de lifecycle: 8 eventos (sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse, agentStop, subagentStop, errorOccurred) — scripts shell que interceptam momentos-chave. Agent Plugins: bundles de skills + agents + MCP + hooks distribuíveis. Agent Apps no GitHub Marketplace. **Destaque do harness**: o aluno cria hooks (ex: lint automático após cada tool use) e empacota tudo como plugin.

### Aula 11: Copilot CLI, Cloud Agent e Code Review

Copilot CLI (`gh copilot`): modos interativo e programático, autopilot, /fleet. Cloud Agent: agente remoto via GitHub Actions, atribuível a issues, cria branch+PR automaticamente. Code Review: low/medium effort, sugestões aplicáveis com 1 clique. Browser Agent (experimental): automação web integrada ao VS Code. **Destaque do harness**: o aluno configura um workflow de CI/CD onde o Cloud Agent revisa PRs automaticamente.

### Aula 12: SDK, Governança e Continual Harness

Copilot SDK multi-linguagem (6 linguagens): `defineTool()` com schema e handler, 7 hooks de ciclo de vida. Governança: métricas de adoção, políticas de uso, content exclusion, segurança. **Destaque do harness**: o aluno cria uma custom tool com SDK e aplica o ciclo Completo do Continual Harness — atuar (usar o harness) → observar (coletar métricas e feedback) → refinar (melhorar instructions, skills, agents) — fechando o ciclo de melhoria contínua.

## Arquitetura de pastas de cada aula

```

modules/harness-github-copilot-vscode/aulaNN/
├── aula-NN-<slug>.md                       # Conteúdo principal
├── aula-NN-questoes-de-aprendizagem.md     # Tarefas/checkpoint prático (arquivo separado)
├── aula-NN-<slug>.pdf                       # PDF para distribuição (gerado ao final)
└── images/                                  # Diagramas Mermaid renderizados como PNG
```

## Regras para Manutenção de Coerência

1. **Este README é alterado primeiro.** Se uma aula for mesclada, dividida, reordenada ou renomeada, o README é atualizado **antes** de qualquer arquivo de aula.
2. **Referências nas aulas seguem o README.** O campo "Próxima Aula", menções como "Na Aula 05...", e a "Recapitulação" devem corresponder exatamente a este plano.
3. **Títulos consistentes.** O `titulo` no frontmatter de cada aula deve ser idêntico ao título no plano acima.
4. **A aula N nunca referencia conceitos ou ferramentas da aula N+1.**
5. **O projeto Portal de Projetos Dev é construído incrementalmente.** A aula 02 cria a estrutura inicial; cada aula subsequente adiciona features. A aula N nunca assume features que só serão implementadas na aula N+1.

## Fontes consultadas

- [Documentação oficial do GitHub Copilot](https://docs.github.com/en/copilot) — features, plans, custom instructions, agents, MCP
- [VS Code Docs — Agents Overview](https://code.visualstudio.com/docs/agents/overview) — agent mode, context, custom instructions
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk) — multi-language SDK
- [GitHub MCP Server](https://github.com/github/github-mcp-server) — 19 toolsets
- [MCP Registry](https://github.com/mcp) — 98 servidores curados
- [awesome-copilot](https://github.com/github/awesome-copilot) — 500+ recursos
- [AlphaLessons — github-copilot-ecosystem.md](../../docs/knowledges/github-copilot-ecosystem.md) — pesquisa profunda do ecossistema
- [AlphaLessons — curso-programacao-agentica](../../curso-programacao-agentica/README.md) — modelo de estrutura de módulo
