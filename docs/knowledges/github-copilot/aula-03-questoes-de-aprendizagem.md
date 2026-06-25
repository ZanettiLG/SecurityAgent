---
titulo: "Aula 03 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 03: Custom Instructions — O Coração do Harness"
data: 2026-06-20
---

# Aula 03 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de domínio**. A pergunta central é: "eu realmente entendi a matéria?" Diferente dos Quick Checks e exercícios da aula principal — que você faz com o material ao lado — estas questões você faz **por conta própria**, sem consultar a aula.

Cada questão verifica um conceito-chave diferente. Siga a ordem: Q1 → Q7. Leia o **Objetivo**, execute os **Passos** e preencha o template de **Entrega**. Crie a pasta `entregas-aula-03/` na raiz do seu projeto para salvar cada arquivo de entrega. Se travar em uma questão, o **Conceito-chave** indica exatamente qual seção da aula revisar.

Só avance para a Aula 04 quando completar todas as 7 questões com confiança.

---

## Questão 1: Classificação de Regras nas 6 Categorias

**Conceito-chave:** Categorias de Regras (Aula 03, Seção 2).

**Objetivo:** Classificar 8 regras soltas nas 6 categorias (Stack, Estilo, Convenções, Restrições, Comunicação, Segurança) e justificar cada decisão.

**Passos de Execução:**

1. Leia cada regra da lista abaixo e identifique a categoria correta
2. Para cada regra, escreva uma justificativa de 1-2 frases explicando por que ela pertence àquela categoria
3. Identifique se alguma regra poderia se encaixar em mais de uma categoria e explique qual critério de desempate você usou

**Entrega:** crie `entregas-aula-03/01-classificacao-regras.md`:

```markdown
# Questão 1 — Classificação de Regras

## Tabela de Classificação

| # | Regra | Categoria | Justificativa |
|---|-------|-----------|---------------|
| 1 | "Runtime Node.js 20 LTS. TypeScript 5.x." | | |
| 2 | "Nunca armazenar senhas em plain text no código." | | |
| 3 | "Indentação de 2 espaços. Aspas simples." | | |
| 4 | "Um componente por arquivo. Imports no topo agrupados por tipo." | | |
| 5 | "NÃO usar `eval()` ou `Function()`." | | |
| 6 | "Responda em português. Explique decisões em 1-2 frases." | | |
| 7 | "Prefira CSS Grid para layouts de página, Flexbox para componentes de linha." | | |
| 8 | "NUNCA sugerir deploy para produção sem validação." | | |

## Regras com Categoria Múltipla (se houver)

[Liste aqui regras que poderiam se encaixar em mais de uma categoria, explicando seu critério de desempate]

## Conclusão

Em 2-3 frases: qual categoria você considera a mais negligenciada em projetos reais e por quê?
```

---

## Questão 2: Diagnóstico e Correção de Anti-padrões

**Conceito-chave:** Anti-padrões e Princípios de Design (Aula 03, Seções 3 e 4).

**Objetivo:** Identificar anti-padrões em 4 instruções problemáticas e reescrevê-las aplicando os 5 princípios de design eficaz.

**Passos de Execução:**

1. Leia cada instrução abaixo e identifique qual(is) anti-padrão(ões) ela contém (da lista: Genérico demais, Contraditório, Extenso demais, Micro-management, Assume conhecimento, Desatualizado)
2. Reescreva cada instrução aplicando especificidade, clareza, não-contradição, exemplificação e/ou priorização (MUST/SHOULD/MAY)
3. Para cada reescrita, destaque qual princípio de design foi mais crítico para a correção

**Entrega:** crie `entregas-aula-03/02-correcao-anti-padroes.md`:

```markdown
# Questão 2 — Diagnóstico e Correção de Anti-padrões

## Instrução A: "Escreva código limpo e bem organizado. Siga as boas práticas."

**Anti-padrão(ões) identificado(s):**

**Reescrita:**

**Princípio de design mais crítico:**

## Instrução B: "Use const para variáveis. Mas se precisar reatribuir, use let. Mas evite let. Var não é recomendado."

**Anti-padrão(ões) identificado(s):**

**Reescrita:**

**Princípio de design mais crítico:**

## Instrução C: "Ao criar uma função, primeiro pense no nome. Depois defina os parâmetros. Depois escreva o corpo. Depois teste. Depois documente. Use 2 espaços. Coloque chaves na mesma linha. Use ponto-e-vírgula. Não esqueça de exportar..."

**Anti-padrão(ões) identificado(s):**

**Reescrita:**

**Princípio de design mais crítico:**

## Instrução D: "Siga o padrão de componentes que usamos no sistema legado. Você sabe como é."

**Anti-padrão(ões) identificado(s):**

**Reescrita:**

**Princípio de design mais crítico:**

## Conclusão

Em 2-3 frases: qual anti-padrão você considera o mais prejudicial para um harness de coding agent e por quê?
```

---

## Questão 3: Decisões de Escopo e Precedência

**Conceito-chave:** Escopo e Precedência de Regras (Aula 03, Seção 5).

**Objetivo:** Decidir o nível de escopo correto para 5 regras de um cenário de time e explicar herança e precedência.

**Passos de Execução:**

1. Para cada regra abaixo, decida se deve ficar no nível de **Organização**, **Projeto/Repositório** ou **Usuário**
2. Justifique cada decisão considerando o alcance da regra e quem ela afeta
3. Explique o que acontece se houver conflito entre níveis diferentes (ex: Organização diz X, mas Usuário diz Y)
4. Para 2 das regras, descreva um cenário de conflito realista e como a precedência resolveria

**Entrega:** crie `entregas-aula-03/03-decisoes-escopo.md`:

```markdown
# Questão 3 — Decisões de Escopo e Precedência

## Tabela de Decisões

| # | Regra | Nível de Escopo | Justificativa |
|---|-------|-----------------|---------------|
| 1 | "Stack padrão: Node.js + React para todos os projetos da empresa." | | |
| 2 | "Prefira arrow functions a function declarations." | | |
| 3 | "CSS Grid para layouts, Mobile-first. Testes com Vitest." | | |
| 4 | "Responda em português com tom didático." | | |
| 5 | "Proibido gerar secrets em código — válido para TODOS os repositórios." | | |

## Cenários de Conflito

**Cenário 1:** [Descreva um conflito realista entre dois níveis para uma das regras acima]

**Resolução pela precedência:** [Explique qual regra vence e por quê]

**Cenário 2:** [Descreva outro conflito realista]

**Resolução pela precedência:** [Explique qual regra vence e por quê]

## Conclusão

Em 2-3 frases: explique por que o mecanismo de merge (concatenação, não sobrescrita) é importante para o funcionamento do sistema de instruções.
```

---

## Questão 4: Criação de Instrução Condicional para Markdown

**Conceito-chave:** Instruções Condicionais com `.instructions.md` e `applyTo` (Aula 03, Seção 7).

**Objetivo:** Criar um arquivo `.instructions.md` condicional para documentação Markdown, com frontmatter `applyTo` e 4-5 regras específicas.

**Passos de Execução:**

1. Crie o arquivo `docs.instructions.md` dentro da pasta `.github/instructions/` do seu projeto
2. Configure o frontmatter YAML com `applyTo: "docs/**/*.md"` — para que ele seja carregado apenas quando você editar Markdown dentro da pasta `docs/`
3. Escreva 4-5 regras específicas para documentação Markdown, distribuídas em pelo menos 2 categorias (Estilo, Convenções, etc.)
4. Inclua pelo menos 1 exemplo concreto (bom e ruim) em uma das regras
5. Verifique: o glob `docs/**/*.md` corresponde a arquivos .md dentro de docs/ e subpastas, mas NÃO a arquivos .md na raiz

**Entrega:** crie `entregas-aula-03/04-instruction-condicional.md` com:

```markdown
# Questão 4 — Instrução Condicional para Markdown

## Conteúdo do `docs.instructions.md`

```markdown
--- (coloque aqui o frontmatter YAML com applyTo)
--- (fim do frontmatter)

# Instruções para Documentação Markdown
[ conteúdo completo do arquivo ]
```

## Justificativa das Regras

| Regra | Categoria | Por que esta regra é importante para documentação? |
|-------|-----------|-----------------------------------------------------|

## Teste de Carregamento

Descreva como você verificaria se este arquivo está sendo carregado corretamente pelo Copilot:

## Conclusão

Em 2-3 frases: qual a principal vantagem de usar instruções condicionais em vez de colocar todas as regras no `copilot-instructions.md`?
```

---

## Questão 5: Pipeline de Teste de Instruções

**Conceito-chave:** Pipeline de Teste e Refinamento (Aula 03, Seção 9).

**Objetivo:** Executar o pipeline completo (Criar → Aplicar → Observar → Ajustar) para 2 regras do harness e documentar os resultados.

**Passos de Execução:**

1. Escolha 2 regras do seu `copilot-instructions.md` ou de um `.instructions.md` condicional
2. Para cada regra, execute as 4 fases do pipeline:
   - **Criar:** a regra já existe (você a refinou nas atividades da aula)
   - **Aplicar:** salve o arquivo (o Copilot carrega automaticamente)
   - **Observar:** peça ao Copilot (Chat, modo Ask) para gerar código que deveria seguir a regra. Ex: "Com base nas instruções do projeto, como você faria X?"
   - **Ajustar:** se a regra NÃO foi seguida, identifique a causa e reescreva
3. Documente os resultados em uma tabela

**Entrega:** crie `entregas-aula-03/05-pipeline-teste.md`:

```markdown
# Questão 5 — Pipeline de Teste de Instruções

## Regra 1: [Copie a regra aqui]

**Onde está:** [copilot-instructions.md ou qual .instructions.md?]

**Resultado do teste (Observar):**
- A regra foi seguida? ✅ / ⚠️ / ❌
- [Se não]: Qual foi o output do Copilot? (cole trecho relevante)

**Análise (se falhou):**

| Causa possível | Investigação |
|----------------|-------------|
| Instrução ambígua? | |
| Conflito com outra regra? | |
| Glob incorreto? | |
| Saturação de contexto? | |

**Ajuste aplicado (se necessário):** [Nova versão da regra]

## Regra 2: [Copie a regra aqui]

**Onde está:**

**Resultado do teste (Observar):**
- A regra foi seguida? ✅ / ⚠️ / ❌

**Análise (se falhou):** [mesma estrutura]

**Ajuste aplicado (se necessário):**

## Conclusão

Em 2-3 frases: o que o pipeline de teste revelou sobre a qualidade das suas instruções? Alguma regra precisou de ajuste?
```

---

## Questão 6: Estratégia Multi-ferramenta de Instruções

**Conceito-chave:** Ecossistema de Arquivos de Instrução (Aula 03, Seção 8).

**Objetivo:** Projetar a estratégia de arquivos de instrução para um time que usa GitHub Copilot + OpenCode, incluindo a decisão de onde colocar cada regra e como evitar duplicação.

**Passos de Execução:**

1. Considere o seguinte cenário: um time de 5 devs usa GitHub Copilot no VS Code e OpenCode (que lê AGENTS.md). O repositório tem 3 projetos (frontend, backend, docs)
2. Decida qual arquivo será a "fonte única" das regras e justifique
3. Posicione cada tipo de regra no formato correto: `copilot-instructions.md`, `.instructions.md`, `AGENTS.md`, `~/.copilot/instructions/`
4. Explique como garantir que regras de segurança não sejam perdidas na tradução entre formatos

**Entrega:** crie `entregas-aula-03/06-estrategia-multi-ferramenta.md`:

```markdown
# Questão 6 — Estratégia Multi-ferramenta

## Arquitetura de Instruções

**Fonte única escolhida:** [AGENTS.md / copilot-instructions.md / outro]

**Justificativa:**

## Mapa de Regras para Arquivos

| Tipo de Regra | Onde fica | Formato | Por que aqui? |
|---------------|-----------|---------|---------------|
| Stack do projeto (Node.js, React) | | | |
| Segurança (nunca gerar secrets) | | | |
| Estilo de código (indentação, naming) | | | |
| Preferências pessoais (idioma, tom) | | | |
| Regras condicionais de CSS | | | |
| Arquitetura do backend | | | |

## Garantia de Regras de Segurança

Explique como você garante que regras de segurança (ex: "nunca gerar secrets") sejam respeitadas por AMBAS as ferramentas:

## Conclusão

Em 2-3 frases: qual a maior vantagem e o maior risco da estratégia de fonte única com referência cruzada?
```

---

## Questão 7: Refinamento Completo do Harness (Projeto Progressivo)

**Conceito-chave:** Anatomia do `copilot-instructions.md`, Instruções Condicionais e Projeto Progressivo (Aula 03, Seções 6 e 7).

**Objetivo:** A partir do harness da Aula 02, refinar o `copilot-instructions.md` para 6 seções detalhadas E criar 3 `.instructions.md` condicionais (CSS, JS, HTML), documentando cada decisão de design.

**Passos de Execução:**

1. No seu Portal de Projetos Dev, refine o `.github/copilot-instructions.md`:
   - Expanda para 6 seções: Stack, Estilo, Convenções, Restrições, Comunicação, Segurança
   - Cada seção com 3-5 regras específicas com exemplos
   - Use MUST/SHOULD/MAY para priorizar
   - Total aproximado: 50-70 linhas
2. Crie 3 arquivos `.instructions.md` condicionais em `.github/instructions/`:
   - `css.instructions.md` com `applyTo: "*.css"`
   - `js.instructions.md` com `applyTo: "*.js"`
   - `html.instructions.md` com `applyTo: "*.html"`
   - Cada um com 3-5 regras específicas do tipo de arquivo
3. Documente as decisões de design: para cada regra principal, justifique por que está naquele nível de escopo e naquela categoria
4. Execute o pipeline de teste para pelo menos 1 regra de cada arquivo

**Entrega:** crie `entregas-aula-03/07-refinamento-harness.md`:

```markdown
# Questão 7 — Refinamento Completo do Harness

## 1. `copilot-instructions.md` Refinado

Cole aqui o conteúdo completo do seu `.github/copilot-instructions.md` após o refinamento:

```markdown
[ conteúdo completo ]
```

## 2. Instruções Condicionais

### `css.instructions.md`

```markdown
[ conteúdo completo ]
```

### `js.instructions.md`

```markdown
[ conteúdo completo ]
```

### `html.instructions.md`

```markdown
[ conteúdo completo ]
```

## 3. Decisões de Design

| Regra | Nível de Escopo | Categoria | Justificativa |
|-------|-----------------|-----------|---------------|
| [ex: "CSS Grid para layouts"] | Repositório (css.instructions.md) | Convenções | Regra técnica do projeto que todos os devs devem seguir |
| [sua regra] | | | |
| [sua regra] | | | |
| [sua regra] | | | |
| [sua regra] | | | |

## 4. Pipeline de Teste — Resultados

| Arquivo | Regra testada | Seguiu? | Ajuste necessário? |
|---------|---------------|---------|-------------------|
| `copilot-instructions.md` | | ✅/❌ | |
| `css.instructions.md` | | ✅/❌ | |
| `js.instructions.md` | | ✅/❌ | |

## Conclusão

Em 3-5 frases: compare seu harness final com a versão da Aula 02. O que mudou? O que você aprendeu sobre design de instruções ao fazer este refinamento?
```

---

## Checklist Final: Pronto para a Aula 04?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Classificar regras:** dado um conjunto de regras soltas, consigo classificar cada uma nas 6 categorias e justificar (Q1)
- [ ] **Aplicar princípios:** consigo identificar quando uma instrução viola um dos 5 princípios de design e reescrevê-la corretamente (Q2)
- [ ] **Identificar anti-padrões:** reconheço os 6 anti-padrões em instruções reais e sei como corrigi-los (Q2)
- [ ] **Decidir escopo:** dado um conjunto de regras, decido o nível de escopo correto (Organização/Projeto/Usuário) e explico herança e precedência (Q3)
- [ ] **Criar instruções condicionais:** crio arquivos `.instructions.md` com `applyTo` e padrões glob para tipos específicos de arquivo (Q4)
- [ ] **Executar pipeline de teste:** executo o ciclo Criar → Aplicar → Observar → Ajustar e documento os resultados (Q5)
- [ ] **Projetar estratégia multi-ferramenta:** decido onde colocar cada regra quando o time usa Copilot + outra ferramenta que lê AGENTS.md (Q6)
- [ ] **Refinar o harness completo:** transformo um `copilot-instructions.md` simples (~20 linhas) em um sistema de 6 seções + 3 condicionais (Q7)
- [ ] **Posicionar regras no nível correto:** justifico por que uma regra está no escopo de usuário vs repositório vs organização (Q3, Q7)
- [ ] **Explicar compatibilidade Copilot × AGENTS.md:** explico o que o Copilot lê automaticamente e qual estratégia usar quando múltiplas ferramentas estão envolvidas (Q6)

> *Acertou todos? Você está pronto para a Aula 04: Contexto, @mentions e Prompt Files — onde você vai aprender como o Copilot monta o contexto completo e como turbinar suas interações com @workspace, @file e comandos personalizados. Travou em algum? Releia a seção indicada no **Conceito-chave** da questão correspondente antes de avançar.*
