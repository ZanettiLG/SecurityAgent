---
titulo: "Aula 09 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 09: MCP — Model Context Protocol no Copilot"
data: 2026-06-20
---

# Aula 09 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o seu **checkpoint de domínio** da Aula 09. A pergunta central é: *"eu realmente entendi MCP — Model Context Protocol?"*

Cada questão a seguir testa um conceito-chave da aula. Você deve:

1. Fazer as questões **na ordem** — elas seguem a progressão dos tópicos
2. Para cada questão, leia o **Objetivo**, execute os **Passos de Execução** e preencha o template de **Entrega**
3. Crie uma pasta `entregas-aula09/` na raiz do seu projeto para salvar as entregas
4. Só consulte a aula principal se travar em um conceito — mas tente fazer primeiro de memória

Ao final, o **Checklist Final** confirma se você está pronto para a Aula 10.

---

## Questão 1: Arquitetura MCP — Diagrama e Explicação

**Conceito-chave:** Problema resolvido pelo MCP e arquitetura cliente-servidor (Aula 09, Seções 1-2).

**Objetivo:** Demonstrar que você compreende o problema que o MCP resolve e sabe descrever os três atores da arquitetura (Host, Client, Server) com suas responsabilidades.

**Passos de Execução:**

1. Desenhe (em texto ou diagrama Mermaid) o cenário "antes do MCP" — um agente isolado que só acessa o sistema de arquivos local
2. Desenhe o cenário "com MCP" — os três atores (Host, Client, Server) e como se comunicam
3. Escreva 2-3 frases explicando por que um protocolo padrão é superior a integrações customizadas

**Entrega:** crie `entregas-aula09/q01-arquitetura-mcp.md`:

```markdown
# Questão 1 — Arquitetura MCP

## Cenário 1: Antes do MCP

[Diagrama ou descrição textual do agente isolado]

## Cenário 2: Com MCP

[Diagrama Mermaid sequence ou flowchart com Host, Client e Server]

## Por que um Protocolo Padrão?

Explique em 2-3 frases por que o MCP como padrão aberto é melhor que integrações customizadas ponto a ponto:

```

---

## Questão 2: Transporte — Decisão para Cenários

**Conceito-chave:** Mecanismos de transporte stdio vs HTTP/SSE (Aula 09, Seção 3).

**Objetivo:** Demonstrar que você sabe comparar os dois mecanismos de transporte e decidir qual usar em cenários específicos.

**Passos de Execução:**

1. Crie uma tabela comparativa com 5 critérios de diferença entre stdio e HTTP/SSE
2. Para cada cenário abaixo, decida qual transporte usar e justifique em 1-2 frases

**Cenários:**

a) Servidor MCP que controla um navegador local para testes visuais
b) Servidor MCP que acessa a API de issues de um serviço cloud de versionamento
c) Servidor MCP que processa dados sensíveis que não podem sair da máquina do desenvolvedor
d) Servidor MCP que precisa ser compartilhado por 10 desenvolvedores do time sem instalação local

**Entrega:** crie `entregas-aula09/q02-transporte.md`:

```markdown
# Questão 2 — Transporte stdio vs HTTP/SSE

## Tabela Comparativa

| Critério | stdio | HTTP/SSE |
|---|---|---|
| Latência | | |
| Instalação | | |
| Isolamento | | |
| Autenticação | | |
| Ideal para | | |

## Decisão para Cenários

| Cenário | Transporte | Justificativa |
|---|---|---|
| a) Navegador local | | |
| b) API de issues cloud | | |
| c) Dados sensíveis locais | | |
| d) Compartilhado pelo time | | |

## Conclusão
Em uma frase: qual o principal critério para escolher entre stdio e HTTP/SSE?
```

---

## Questão 3: Ciclo de Vida MCP Anotado

**Conceito-chave:** Ciclo de vida de uma interação MCP (Aula 09, Seção 4).

**Objetivo:** Demonstrar que você conhece as 5 etapas do ciclo de vida MCP e consegue explicar o que acontece em cada uma.

**Passos de Execução:**

1. Crie um diagrama de sequência Mermaid com as 5 etapas: Initialize, List Tools, Call Tool, Read Resource, Response
2. Para cada etapa, escreva 1-2 frases explicando o que acontece e o que pode dar errado

**Entrega:** crie `entregas-aula09/q03-ciclo-vida.md`:

```markdown
# Questão 3 — Ciclo de Vida MCP

## Diagrama de Sequência

```mermaid
[Insira aqui seu diagrama com as 5 etapas]
```

## Etapas Anotadas

**1. Initialize**
O que acontece:
O que pode dar errado:

**2. List Tools**
O que acontece:
O que pode dar errado:

**3. Call Tool**
O que acontece:
O que pode dar errado:

**4. Read Resource**
O que acontece:
O que pode dar errado:

**5. Response**
O que acontece:
O que pode dar errado:
```

---

## Questão 4: Configuração `.vscode/mcp.json`

**Conceito-chave:** Configuração de servidores MCP no Copilot (Aula 09, Seção 5).

**Objetivo:** Demonstrar que você sabe criar e configurar o arquivo `.vscode/mcp.json` com servidores MCP.

**Passos de Execução:**

1. Crie o arquivo `.vscode/mcp.json` no diretório do seu Portal de Projetos Dev com a configuração abaixo
2. Verifique que o JSON é válido
3. Explique em 1-2 frases o que cada campo significa

**Configuração necessária:** Um servidor chamado `meu-servidor` do tipo `stdio` que executa `npx` com argumentos `["@exemplo/servidor@latest"]`

**Entrega:** salve o arquivo real no seu projeto + crie `entregas-aula09/q04-configuracao.md`:

```markdown
# Questão 4 — Configuração MCP

## Arquivo `.vscode/mcp.json`

```json
[Insira aqui o conteúdo do seu .vscode/mcp.json]
```

## Explicação dos Campos

- **servers:** o que este campo define?
- **type:** qual a diferença entre "stdio" e "http"?
- **command + args:** o que estes campos fazem juntos?
- **Por que o `url` não é necessário quando type é "stdio"?**

## Hot Reload
Explique o que acontece quando você salva o arquivo com o VS Code aberto:
```

---

## Questão 5: Mapeamento de Toolsets para Cenários

**Conceito-chave:** GitHub MCP Server — 20 toolsets (Aula 09, Seção 6).

**Objetivo:** Demonstrar que você conhece os toolsets do GitHub MCP Server e sabe mapeá-los para cenários de uso.

**Passos de Execução:**

1. Liste pelo menos 8 toolsets do GitHub MCP Server com uma breve descrição de cada
2. Para cada cenário abaixo, identifique qual(is) toolset(s) seriam necessários
3. Explique como limitar o GitHub MCP Server para usar apenas os toolsets necessários

**Cenários:**

a) Um agente que só precisa listar issues e comentar em PRs
b) Um agente que monitora workflows do Actions e alertas de segurança
c) Um agente que gerencia repositórios, labels e projetos

**Entrega:** crie `entregas-aula09/q05-toolsets.md`:

```markdown
# Questão 5 — Mapeamento de Toolsets

## Toolsets do GitHub MCP Server

| Toolset | Descrição |
|---|---|
| | |
| | |
| ... (pelo menos 8) | |

## Cenários

**a) Issues e PRs**
Toolsets necessários:
Como limitar no `.vscode/mcp.json`:

**b) Actions e Segurança**
Toolsets necessários:
Como limitar no `.vscode/mcp.json`:

**c) Repositórios e Projetos**
Toolsets necessários:
Como limitar no `.vscode/mcp.json`:
```

---

## Questão 6: Automação com Playwright MCP

**Conceito-chave:** Playwright MCP para automação de browser (Aula 09, Seção 7).

**Objetivo:** Demonstrar que você sabe usar o Playwright MCP para navegar, inspecionar e capturar screenshots.

**Passos de Execução:**

1. Certifique-se de que o Playwright MCP está configurado no `.vscode/mcp.json`
2. Abra o chat do Copilot e peça: "Use o Playwright para navegar até um site de sua escolha, tire um screenshot, e descreva os 3 principais elementos visíveis"
3. Documente o resultado (screenshot descrito + lista de elementos)

**Entrega:** crie `entregas-aula09/q06-playwright.md`:

```markdown
# Questão 6 — Automação com Playwright MCP

## Comando Utilizado

[Copie aqui exatamente o que você digitou no chat]

## Resultado

**Site acessado:**
**Screenshot:** [Descrição do que o screenshot mostrava]
**3 principais elementos visíveis:**

1. [Elemento 1]
2. [Elemento 2]
3. [Elemento 3]

## Reflexão

Que outras tarefas de desenvolvimento você poderia automatizar com o Playwright MCP? Dê 2 exemplos práticos para o seu dia a dia.
```

---

## Questão 7: Descoberta no MCP Registry

**Conceito-chave:** MCP Registry — ecossistema de servidores (Aula 09, Seção 8).

**Objetivo:** Demonstrar que você sabe navegar pelo MCP Registry, encontrar servidores e avaliar sua qualidade.

**Passos de Execução:**

1. Acesse github.com/mcp e explore a lista de servidores
2. Escolha 2 servidores que você não conhecia e que seriam úteis no seu desenvolvimento
3. Para cada servidor, avalie: stars, frequência de commits, qualidade da documentação, licença
4. Escreva um parágrafo explicando para que você usaria cada servidor

**Entrega:** crie `entregas-aula09/q07-registry.md`:

```markdown
# Questão 7 — Descoberta no MCP Registry

## Servidor 1: [Nome]

**URL:** 
**Stars:** 
**Publisher:** 
**Categoria:** 
**Para que eu usaria:**
[Parágrafo explicando o caso de uso]

## Servidor 2: [Nome]

**URL:** 
**Stars:** 
**Publisher:** 
**Categoria:** 
**Para que eu usaria:**
[Parágrafo explicando o caso de uso]

## Critérios de Avaliação

Quais critérios você usou para decidir que esses servidores são confiáveis?
```

---

## Questão 8: Segurança + Integração Final

**Conceito-chave:** Segurança no MCP e integração no projeto progressivo (Aula 09, Seções 9-10).

**Objetivo:** Demonstrar que você sabe avaliar riscos de segurança e consegue executar o workflow integrado multi-MCP (Playwright testa → GitHub cria issue).

**Passos de Execução:**

1. Execute o workflow integrado da Seção 10: Peça ao Copilot para usar o Playwright e verificar o Portal de Projetos Dev, e se encontrar problema, criar uma issue
2. Documente o resultado do workflow
3. Analise os riscos de segurança: liste 3 riscos e como você mitigaria cada um
4. Explique como você protegeria tokens de API no `.vscode/mcp.json`

**Entrega:** crie `entregas-aula09/q08-seguranca-integracao.md`:

```markdown
# Questão 8 — Segurança e Integração Final

## Workflow Integrado

**Comando executado no Copilot:**
[O prompt que você usou]

**Resultado do workflow:**
- Playwright navegou para: [URL]
- Cards encontrados: [N]
- Problemas detectados: [Sim/Não — descreva]
- Issue criada: [URL da issue / "Não foi necessário"]

## Análise de Segurança

| Risco | Mitigação |
|---|---|
| 1. | |
| 2. | |
| 3. | |

## Proteção de Tokens

Explique como você configuraria tokens de API no `.vscode/mcp.json` sem versioná-los:

## Conclusão

Em 3-5 frases: o que o MCP adicionou ao seu harness que não era possível antes desta aula?
```

---

## Checklist Final: Pronto para a Aula 10?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Explicar** o problema que o MCP resolve e descrever a arquitetura Host → Client → Server
- [ ] **Comparar** os mecanismos stdio e HTTP/SSE, decidindo qual usar em cada cenário
- [ ] **Traçar** as 5 etapas do ciclo de vida MCP (Initialize, List Tools, Call Tool, Read Resource, Response)
- [ ] **Configurar** servidores MCP no `.vscode/mcp.json` com type, url, command, args e env
- [ ] **Mapear** pelo menos 8 dos 20 toolsets do GitHub MCP Server com seus casos de uso
- [ ] **Conectar** e testar o Playwright MCP para automação de browser
- [ ] **Explorar** o MCP Registry e avaliar servidores por critérios objetivos
- [ ] **Avaliar** riscos de segurança e aplicar boas práticas de mitigação
- [ ] **Integrar** GitHub MCP Server + Playwright MCP em um workflow funcional no Portal de Projetos Dev
- [ ] **Executar** o workflow multi-MCP completo (Playwright testa → GitHub cria issue)

> *Acertou todos? Você está pronto para a Aula 10, onde vai criar hooks de lifecycle e empacotar todo o seu harness como um Agent Plugin. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
