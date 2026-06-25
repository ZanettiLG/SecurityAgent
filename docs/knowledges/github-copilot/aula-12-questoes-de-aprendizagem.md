---
titulo: "Aula 12 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 12: SDK, Governança e Continual Harness"
data: 2026-06-20
---

# Aula 12 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o **checkpoint de domínio** da Aula 12 — a última do módulo. A pergunta central é: *"eu realmente domino o que aprendi nas 12 aulas?"*

Cada questão abaixo verifica um conceito-chave da aula. Você deve executar cada tarefa **sem consultar o conteúdo da aula** — se travar, anote onde travou e releia a seção indicada no campo **Conceito-chave** de cada questão.

**Como proceder:**

1. Crie a pasta `entregas-aula-12/` no diretório do seu Portal de Projetos Dev
2. Faça as questões em ordem (da mais simples para a mais complexa)
3. Para cada questão, copie o template de entrega e preencha com seus resultados
4. Ao final, revise o **Checklist Final** e marque apenas os itens que você consegue fazer sem consultar a aula
5. Complete todas as 8 questões por conta própria — esta é a última avaliação do módulo

---

## Questão 1: SDK vs Outros Mecanismos de Extensão

**Conceito-chave:** SDK agêntico como camada de extensão programática, distinção de instructions, skills, agents e MCP (Aula 12, Seção 1).

**Objetivo:** Demonstrar que você entende quando usar cada mecanismo de extensão — SDK, instructions, skills, agents e MCP — analisando cenários reais.

**Passos de Execução:**

1. Leia cada cenário na tabela abaixo e classifique qual mecanismo é mais adequado
2. Justifique sua escolha em 1-2 frases
3. Indique se o SDK poderia complementar o mecanismo escolhido

**Entrega:** crie `entregas-aula-12/01-sdk-vs-mecanismos.md`:

```markdown
# Questão 1 — SDK vs Outros Mecanismos

## Tabela de Classificação

| Cenário | Mecanismo Escolhido | Justificativa | SDK complementa? |
|---|---|---|---|
| "Sempre use camelCase para variáveis JavaScript" | | | |
| "Conecte uma API externa de previsão do tempo" | | | |
| "Crie um agente especializado em revisão de segurança" | | | |
| "Explique padrões de projeto GoF quando o usuário perguntar" | | | |
| "Calcule métricas complexas do repositório e retorne JSON estruturado" | | | |

## Reflexão

Em que cenário você usaria SDK E MCP juntos? Descreva um exemplo concreto.
```

---

## Questão 2: Anatomia de Custom Tool

**Conceito-chave:** Schema, handler e ciclo de vida de custom tools (Aula 12, Seção 2).

**Objetivo:** Analisar um código de custom tool real e identificar seus componentes: schema, handler e ciclo de vida.

**Passos de Execução:**

1. Leia o código da tool abaixo
2. Identifique cada elemento da anatomia no código
3. Preencha a tabela de análise
4. Responda às perguntas de reflexão

Código para análise:

```typescript
import { defineTool } from "@github/copilot-sdk/zod";
import { z } from "zod";
import * as fs from "fs/promises";

defineTool("listar-arquivos", {
  description: "Lista arquivos do diretório especificado com filtro opcional por extensão",
  parameters: z.object({
    diretorio: z.string().default(".").describe("Caminho do diretório"),
    extensao: z.string().optional().describe("Filtrar por extensão (ex: .ts)"),
    detalhado: z.boolean().default(false).describe("Incluir tamanho e data"),
  }),
  handler: async (params) => {
    const arquivos = await fs.readdir(params.diretorio);
    let filtrados = arquivos;
    if (params.extensao) {
      filtrados = arquivos.filter((f) => f.endsWith(params.extensao));
    }
    if (params.detalhado) {
      const detalhes = await Promise.all(
        filtrados.map(async (f) => {
          const stat = await fs.stat(`${params.diretorio}/${f}`);
          return `${f} (${stat.size} bytes, ${stat.mtime.toISOString()})`;
        })
      );
      return detalhes.join("\n");
    }
    return filtrados.join("\n");
  },
});
```

**Entrega:** crie `entregas-aula-12/02-anatomia-tool.md`:

```markdown
# Questão 2 — Anatomia de Custom Tool

## Identificação dos Componentes

| Componente | O que é no código | Linha(s) aproximada(s) |
|---|---|---|
| Nome da tool | | |
| Descrição | | |
| Schema (parâmetros) | | |
| Tipos de parâmetros | | |
| Handler | | |
| Lógica principal | | |
| Tratamento de erro implícito | | |

## Perguntas de Reflexão

1. O que acontece se o modelo chamar `listar-arquivos` sem passar nenhum parâmetro?

2. Em que etapa do ciclo de vida (registro→descoberta→chamada→resposta) o schema é validado?

3. Qual melhoria você faria no tratamento de erros desta tool?
```

---

## Questão 3: Primeira Custom Tool com `defineTool()`

**Conceito-chave:** Criação de custom tool funcional com Copilot SDK (Aula 12, Seções 5-6).

**Objetivo:** Criar sua primeira custom tool com `defineTool()`, schema Zod, handler assíncrono e testar no VS Code.

**Passos de Execução:**

1. Certifique-se de que o Copilot SDK está instalado no seu projeto
2. Crie a pasta `.github/tools/` se não existir
3. Crie a custom tool `buscador-arquivos` conforme especificação abaixo
4. Teste a tool no chat do Copilot com 2 perguntas diferentes
5. Documente os resultados

**Especificação da tool `buscador-arquivos`:**

- Nome: `buscador-arquivos`
- Descrição: "Busca arquivos no repositório por termo no nome, com filtro opcional por extensão e limite de resultados"
- Parâmetros:
  - `termo`: string, obrigatório — termo a buscar no nome do arquivo
  - `extensao`: string, opcional — filtrar por extensão (ex: ".ts")
  - `limite`: number, opcional, default 10 — máximo de resultados (max 50)
- Handler: lê o diretório raiz, filtra arquivos cujo nome contém o termo, aplica filtro de extensão e limite, retorna lista formatada

**Entrega:** crie `entregas-aula-12/03-primeira-tool.md`:

```markdown
# Questão 3 — Primeira Custom Tool

## Código da Tool

```typescript
Cole aqui o código completo da tool buscador-arquivos
```

## Testes

| Pergunta no Chat | Tool foi chamada? | Resultado |
|---|---|---|
| "Use buscador-arquivos para encontrar arquivos com 'style' no nome" | | |
| "Busque até 3 arquivos .html com 'index' no nome" | | |

## Análise

A tool se comportou como esperado? Descreva se o modelo entendeu corretamente quando chamá-la e se os parâmetros foram passados corretamente.
```

---

## Questão 4: Mapeamento SDK Hooks ↔ VS Code Hooks

**Conceito-chave:** Comparação entre os 7 hooks do SDK e os 8 hooks de lifecycle do VS Code (Aula 12, Seção 7; Aula 10, Seções 3-5).

**Objetivo:** Mapear cada hook do SDK para seu equivalente (ou ausência) nos hooks shell do VS Code, explicando diferenças de escopo, tipagem e estado.

**Passos de Execução:**

1. Liste os 7 hooks do SDK lado a lado com os 8 hooks do VS Code
2. Para cada hook do SDK, indique se existe equivalente no VS Code
3. Para cada diferença, explique por que ela existe (escopo, tipagem, estado)
4. Identifique qual hook do SDK NÃO tem equivalente no VS Code e explique sua utilidade

**Entrega:** crie `entregas-aula-12/04-hooks-sdk-vs-vscode.md`:

```markdown
# Questão 4 — SDK Hooks vs VS Code Hooks

## Tabela Comparativa

| # | Hook SDK | Equivalente VS Code? | Nome no VS Code | Diferenças |
|---|---|---|---|---|
| 1 | `onSessionStart` | | | |
| 2 | `onUserPromptSubmitted` | | | |
| 3 | `onPreToolUse` | | | |
| 4 | `onPostToolUse` | | | |
| 5 | `onPostToolUseFailure` | | | |
| 6 | `onSessionEnd` | | | |
| 7 | `onErrorOccurred` | | | |

## Perguntas

1. Qual hook do SDK não tem equivalente no VS Code? Por que ele é importante?

2. Em que cenário você usaria o hook do SDK em vez do hook shell do VS Code? Dê um exemplo concreto.

3. Se você pudesse adicionar um hook ao SDK que não existe, qual seria e para que?
```

---

## Questão 5: Diagnóstico de Governança

**Conceito-chave:** Métricas, content exclusion, riscos de segurança e princípio do menor privilégio (Aula 12, Seções 3 e 8).

**Objetivo:** Auditar o harness do Portal de Projetos Dev, identificando riscos de segurança, configurando content exclusion e avaliando permissões dos agentes.

**Passos de Execução:**

1. Crie ou revise o arquivo `.github/copilot-content-exclusion.yml` no seu repositório
2. Liste quais arquivos/diretórios devem ser excluídos do contexto do modelo
3. Revise cada arquivo em `.github/agents/` e verifique as tools permitidas
4. Verifique se há secrets expostos em arquivos versionados
5. Execute `gh copilot chat` e pergunte por conteúdo que deveria estar excluído
6. Documente os achados

**Entrega:** crie `entregas-aula-12/05-diagnostico-governanca.md`:

```markdown
# Questão 5 — Diagnóstico de Governança

## Content Exclusion

Conteúdo do arquivo `.github/copilot-content-exclusion.yml`:

```yaml
Cole aqui o conteúdo do seu arquivo
```

## Revisão de Arquivos Excluídos

| Arquivo/Diretório | Deve ser excluído? | Por quê? |
|---|---|---|
| | | |

## Permissões por Agente

| Agente | Tools Permitidas | Está no princípio do menor privilégio? | Ajuste necessário? |
|---|---|---|---|
| | | | |

## Riscos de Segurança Identificados

- [ ] Existem arquivos .env versionados?
- [ ] Há secrets em histórico do git?
- [ ] Algum agente tem permissão para ferramentas que não precisa?
- [ ] Content exclusion é respeitado no VS Code? E no CLI?

## Conclusão

Qual o principal risco de segurança no seu harness atualmente? O que você fará para mitigá-lo?
```

---

## Questão 6: Ciclo Continual Harness Documentado

**Conceito-chave:** Aplicação do ciclo ATUAR→OBSERVAR→REFINAR em sessão real (Aula 12, Seções 4 e 9).

**Objetivo:** Executar uma iteração completa do ciclo Continual Harness no seu harness — escolher uma feature, usar o harness, coletar métricas, aplicar refinamentos e documentar tudo.

**Passos de Execução:**

1. Escolha uma feature pequena para implementar no Portal (ex: busca textual, filtro por categoria, gráfico simples)
2. Use o Copilot com o harness atual para implementá-la — documente a sessão (tools chamadas, aderência a instructions, erros)
3. Colete pelo menos 4 métricas da sessão
4. Identifique 3 oportunidades de melhoria no harness
5. Aplique os refinamentos (arquivos alterados)
6. Crie `.github/continual-harness-log.md` com o registro completo

**Entrega:** crie `entregas-aula-12/06-ciclo-ch.md`:

```markdown
# Questão 6 — Ciclo Continual Harness

## ATUAR: Feature Implementada

Feature escolhida: [descrição]

Data: [data]
Duração da sessão: [minutos]

## OBSERVAR: Métricas Coletadas

| Métrica | Valor | Observação |
|---|---|---|
| Tools mais chamadas | | |
| Tools subutilizadas | | |
| Aderência a instructions (0-10) | | |
| Erros na sessão | | |
| Tempo médio por tool call | | |
| Skills ativadas automaticamente | | |

## REFINAR: Melhorias Aplicadas

| # | O quê | Onde (arquivo) | Por quê |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Link para o Log

[`.github/continual-harness-log.md`](caminho/para/o/arquivo)

## Reflexão

O ciclo Continual Harness mudou sua percepção sobre como manter o harness? O que você fará diferente daqui para frente?
```

---

## Questão 7: Custom Tool "analisar-portal" ⭐

**Conceito-chave:** Criação de custom tool completa integrada ao Portal de Projetos Dev (Aula 12, Seção 10).

**Objetivo:** Criar a tool `analisar-portal` (ou uma versão melhorada) com Copilot SDK, que analisa os dados do Portal e retorna métricas formatadas. Esta é a **peça central** do projeto progressivo desta aula.

**Passos de Execução:**

1. Crie `.github/tools/analisar-portal.ts` com `defineTool()`
2. A tool deve ler `dados.json`, calcular métricas (projetos por status, por categoria, total) e retornar relatório formatado
3. A tool deve ter schema com pelo menos 2 parâmetros com tipos diferentes
4. A tool deve tratar erros (arquivo não encontrado, JSON mal formatado)
5. Teste a tool com 3 perguntas diferentes no chat do Copilot
6. Verifique se o Copilot chama a tool corretamente em cada caso

**Entrega:** crie `entregas-aula-12/07-analisar-portal.md`:

```markdown
# Questão 7 — Custom Tool `analisar-portal`

## Código da Tool

```typescript
Cole aqui o código completo de `.github/tools/analisar-portal.ts`
```

## Testes Realizados

| Pergunta | Parâmetros Enviados | Resposta da Tool |
|---|---|---|
| "Quantos projetos estão ativos?" | | |
| "Mostre a distribuição por categoria" | | |
| "Dados completos em JSON" | | |

## Verificação

- [ ] A tool foi chamada em todas as 3 perguntas?
- [ ] Os parâmetros passados correspondem ao schema?
- [ ] A tool tratou corretamente os dados do seu `dados.json`?
- [ ] O modelo interpretou corretamente a resposta da tool?

## Melhorias Propostas

Que funcionalidade adicional você adicionaria à tool `analisar-portal`? Descreva pelo menos uma melhoria (ex: novo parâmetro, nova métrica, gráfico).
```

---

## Questão 8: Consolidação e Plano de Evolução

**Conceito-chave:** Celebração da conclusão do módulo, glossário pessoal e plano de evolução contínua do harness (Aula 12, Seção 11).

**Objetivo:** Consolidar seu aprendizado criando um glossário pessoal com os 10 termos mais importantes para você, revisando os artefatos construídos e estabelecendo um plano de evolução do harness.

**Passos de Execução:**

1. Reflita sobre os conceitos das 12 aulas e identifique os 10 termos mais relevantes para sua prática
2. Crie seu glossário pessoal com definições próprias
3. Revise o checklist de encerramento do módulo e verifique quais artefatos você completou
4. Estabeleça um plano de evolução contínua para seu harness (próximos 30, 60 e 90 dias)
5. Escreva uma reflexão final sobre sua jornada

**Entrega:** crie `entregas-aula-12/08-consolidacao.md`:

```markdown
# Questão 8 — Consolidação e Plano de Evolução

## Meu Glossário Pessoal (Top 10)

| # | Termo | Minha Definição (com minhas palavras) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
| 9 | | |
| 10 | | |

## Checklist de Encerramento do Módulo

- [ ] Portal de Projetos Dev funcional (index.html, styles.css, app.js, dados.json)
- [ ] `.github/copilot-instructions.md` com stack, estilo e convenções
- [ ] `.github/prompts/` com pelo menos 2 slash commands customizados
- [ ] `.github/skills/` com pelo menos 1 skill customizada
- [ ] `.github/agents/` com pelo menos 2 agentes customizados
- [ ] `.vscode/mcp.json` com pelo menos 1 MCP Server
- [ ] `.github/hooks/` com pelo menos 1 hook de lifecycle
- [ ] Plugin empacotado ou workflow CI/CD configurado
- [ ] `.github/tools/` com pelo menos 1 custom tool via SDK
- [ ] `.github/continual-harness-log.md` com ciclo documentado

## Plano de Evolução

### Próximos 30 dias
[O que você vai fazer no próximo mês para melhorar seu harness?]

### Próximos 60 dias
[Quais skills ou tools você quer criar?]

### Próximos 90 dias
[Como você quer que seu harness esteja daqui a 3 meses?]

## Reflexão Final

Em 2-3 parágrafos, reflita sobre:

- O que mudou na sua forma de programar depois de construir o harness?
- Qual foi o conceito mais transformador para você?
- O que você diria para alguém que está começando o módulo?
```

---

## Checklist Final: Conclusão do Módulo

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Explico** a diferença entre SDK, instructions, skills, agents e MCP, e identifico quando usar cada um (Objetivo 1)
- [ ] **Descrevo** a anatomia de uma custom tool: schema, handler e ciclo de vida (Objetivo 2)
- [ ] **Crio** uma custom tool com `defineTool()`, schema Zod e handler assíncrono (Objetivo 3)
- [ ] **Identifico** os 7 hooks do SDK e mapeio cada um para os hooks do VS Code (Objetivo 4)
- [ ] **Defino** métricas de governança: adoção, qualidade, segurança e custo (Objetivo 5)
- [ ] **Configuro** content exclusion e permissões de agentes no ecossistema Copilot (Objetivo 6)
- [ ] **Avalio** riscos de segurança no harness: secrets, injeção de prompt, ferramentas destrutivas (Objetivo 7)
- [ ] **Explico** o ciclo Continual Harness — ATUAR→OBSERVAR→REFINAR — e suas propriedades (Objetivo 8)
- [ ] **Aplico** o ciclo Continual Harness ao meu harness, coletando métricas e refinando com dados reais (Objetivo 9)
- [ ] **Celebro** a conclusão do módulo com glossário pessoal e plano de evolução (Objetivo 10)
- [ ] **Tenho** um harness completo versionado em repositório GitHub (Portal + instructions + prompts + skills + agents + MCP + hooks + tools SDK)
- [ ] **Sei** que o aprendizado não termina aqui — o ciclo Continual Harness é perpétuo

> *🎉 Você concluiu todas as 12 aulas do módulo "Harness do GitHub Copilot e Programação Agêntica com VS Code"! Você não apenas aprendeu conceitos — você construiu um harness completo que pode continuar evoluindo. Cada linha de código, cada instruction, cada skill, cada agente e cada custom tool que você criou é um degrau na sua jornada de programação agêntica. O ciclo Continual Harness nunca termina — porque seu harness nunca está "pronto". Continue atuando, observando e refinando. 🚀*
