---
titulo: "Aula 18: CI/CD — Pipeline de Entrega Contínua"
tipo: "checkpoint-pratico"
modulo: "Engenharia de Software"
aula_referencia: "Aula 18: CI/CD — Pipeline de Entrega Contínua"
tags: [ci-cd, github-actions, pipeline, quality-gates, exercicios]
data: 2026-06-21
---

# Engenharia de Software — Aula 18

## CI/CD: Questões de Aprendizagem

---

## Como Usar Este Arquivo

Este arquivo contém 7 questões práticas que consolidam os conceitos da Aula 18. Cada questão exige que você escreva código, desenhe diagramas ou analise pipelines. Siga a ordem sugerida — as questões progridem do conceitual para o prático. Não há gabarito neste arquivo: ele é um checkpoint para você mesmo verificar seu progresso. Se travar em uma questão, revise a seção correspondente da aula antes de prosseguir.

---

## Questão 1: Desenhar Diagrama de Pipeline CI/CD com Quality Gates

**Conceito-chave:** Modelagem de pipeline com quality gates (Seções 1 e 2)

**Objetivo:** Representar visualmente o fluxo de um pipeline CI/CD identificando cada quality gate e o comportamento do pipeline em caso de falha.

**Passos de Execução:**

1. Desenhe um diagrama de fluxo (pode ser Mermaid, Lucidchart ou até papel) que represente um pipeline com os seguintes stages: commit, lint, typecheck, testes unitários com cobertura, build, deploy staging, aprovação manual, deploy produção
2. Identifique onde cada quality gate se encaixa (lint zero warnings, typecheck zero erros, cobertura >= 80%)
3. Para cada gate, indique o que acontece se ele falhar (bloqueio, notificação, rollback)
4. Destaque a diferença entre o fluxo de staging (automático) e produção (manual)

**Entrega:**

```markdown
### Diagrama de Pipeline

[Inserir diagrama Mermaid ou imagem]

### Legenda dos Gates

| Gate | Ferramenta | Threshold | Ação em falha |
|---|---|---|---|
| Lint | ESLint | Zero warnings | Pipeline bloqueado |
| ... | ... | ... | ... |
```

---

## Questão 2: Analisar YAML e Identificar Problemas

**Conceito-chave:** Leitura crítica de workflow YAML (Seção 4)

**Objetivo:** Identificar erros comuns em um arquivo YAML de pipeline e propor correções.

**Passos de Execução:**

1. Analise o YAML abaixo e liste pelo menos 4 problemas
2. Para cada problema, explique o impacto no pipeline
3. Escreva a versão corrigida completa

```yaml
name: Pipeline
on: [push]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npx eslint .
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy ok"
```

**Entrega:**

```markdown
### Problemas Encontrados

1. [Problema 1] — [Impacto]
2. [Problema 2] — [Impacto]
3. [Problema 3] — [Impacto]
4. [Problema 4] — [Impacto]

### YAML Corrigido

[YAML completo corrigido]
```

---

## Questão 3: Configurar Quality Gates

**Conceito-chave:** Configuração de gates de lint, typecheck e cobertura (Seção 5)

**Objetivo:** Configurar três quality gates em um job de CI e verificar se bloqueiam corretamente.

**Passos de Execução:**

1. Adicione um job de lint que use ESLint com `--max-warnings 0`
2. Adicione um job de typecheck que execute `tsc --noEmit` com strict mode
3. Adicione um job de teste que exija cobertura mínima de 80% de branches e 85% de linhas
4. Configure branch protection rule para exigir que todos os três jobs passem antes do merge
5. Explique como testar se cada gate está funcionando (ex.: forçar um warning de lint e ver se o pipeline falha)

**Entrega:**

```markdown
### Configuração dos Gates

[YAML dos três jobs]

### Branch Protection Rule

[Passos da configuração no GitHub ou comandos equivalentes]

### Teste dos Gates

- [Instrução para testar gate de lint]
- [Instrução para testar gate de typecheck]
- [Instrução para testar gate de cobertura]
```

---

## Questão 4: Adicionar Matrix Strategy a um Job Existente

**Conceito-chave:** Matrix strategy para testes multi-versão (Seção 6)

**Objetivo:** Modificar um job de testes para executar em múltiplas versões do Node.js usando matrix strategy.

**Passos de Execução:**

1. Parta de um job `test` simples que testa em Node.js 20
2. Adicione matrix strategy para testar em Node.js 18, 20, 22 e também em Windows (ubuntu-latest e windows-latest)
3. Garanta que o cache de `node_modules` funcione corretamente para cada combinação da matrix
4. Adicione um job `build` que depende de todos os jobs da matrix e use a variante mais recente (Node.js 22) para build

**Entrega:**

```markdown
### YAML com Matrix Strategy

[YAML completo com matrix]

### Combinações Geradas

| # | Node Version | OS | Cache key |
|---|---|---|---|
| 1 | 18 | ubuntu | [hash-lock-18] |
| 2 | 18 | windows | [hash-lock-18] |
| ... | ... | ... | ... |

### Observações

[Dificuldades encontradas, diferenças entre SOs, etc.]
```

---

## Questão 5: Configurar Cache de Dependências

**Conceito-chave:** Cache de dependências para acelerar o pipeline (Seções 4 e 6)

**Objetivo:** Implementar e verificar o cache de `node_modules` em múltiplos jobs, garantindo que a restauração funcione corretamente.

**Passos de Execução:**

1. Em um workflow com 3 jobs (lint, test, build), configure cache de npm em todos
2. Explique como o GitHub Actions gera a chave do cache e quando o cache é invalidado
3. Adicione um passo de fallback para quando o cache não existir (primeira execução)
4. Verifique se o cache está sendo restaurado corretamente observando os logs do GitHub Actions (mensagens "Cache restored" e "Cache saved")

**Entrega:**

```markdown
### Configuração de Cache

[YAML com cache configurado em cada job]

### Estratégia de Cache Key

[Explicação de como a chave é gerada e quando o cache expira]

### Evidência de Funcionamento

[Trechos de log ou prints mostrando cache restored/saved]
```

---

## Questão 6: Configurar Ambientes Staging + Production com Protection Rules

**Conceito-chave:** Ambientes multi-ambiente com approval gates (Seção 7)

**Objetivo:** Configurar dois ambientes no GitHub Actions com rules e secrets distintos.

**Passos de Execução:**

1. No repositório, crie os ambientes `staging` e `production` em Settings > Environments
2. Em `production`, configure "Required reviewers" para 2 pessoas e "Wait timer" de 5 minutos
3. Crie o secret `DATABASE_URL` com valores diferentes em cada ambiente
4. Escreva um workflow que faça deploy automático em staging e pause para aprovação antes do deploy em produção
5. Adicione health check automatizado em ambos os ambientes com rollback em caso de falha

**Entrega:**

```markdown
### Ambientes Criados

| Ambiente | Protection Rules | Secrets |
|---|---|---|
| staging | Nenhuma | DATABASE_URL=... |
| production | 2 reviewers + 5min timer | DATABASE_URL=... |

### Workflow Multi-Ambiente

[YAML completo do workflow]

### Health Check e Rollback

[Descrição da estratégia de health check e rollback]
```

---

## Questão 7: Configurar Notificação de Falha

**Conceito-chave:** Notificações com condicionais (Seção 8)

**Objetivo:** Adicionar notificação de falha ao pipeline usando webhook do Slack ou Discord.

**Passos de Execução:**

1. Crie um webhook no Slack ou Discord (siga a documentação da plataforma)
2. Armazene o URL do webhook como secret do repositório (`SLACK_WEBHOOK_URL` ou `DISCORD_WEBHOOK_URL`)
3. Adicione um job `notify-failure` que execute apenas se algum job anterior falhar
4. Adicione outro job `notify-success` que execute apenas se todos os jobs passarem
5. Inclua informações úteis na mensagem: nome do workflow, branch, autor do commit e link para os logs

**Entrega:**

```markdown
### Webhook Configurado

[Plataforma escolhida e URL do webhook (mascarado)]

### Secrets

| Secret Name | Valor |
|---|---|
| SLACK_WEBHOOK_URL | `***` |

### Workflow com Notificações

[YAML completo com os jobs de notificação]

### Exemplo de Mensagem

```
✅ Pipeline CI/CD concluído com sucesso
  Workflow: Pipeline Multi-Ambiente
  Branch: main
  Autor: maria@exemplo.com
  Logs: https://github.com/.../actions/runs/123
```
```

---

## Checklist Final: Pronto para a Aula 19?

- [ ] Eu consigo explicar a diferença entre CI, CDelivery e CDeployment para um colega
- [ ] Eu sei o papel de cada quality gate e como configurá-lo no YAML
- [ ] Eu entendo a diferença entre staging e produção no pipeline
- [ ] Eu escrevi um workflow YAML com jobs paralelos e encadeados do zero
- [ ] Eu configurei matrix strategy em um job sem consultar material
- [ ] Eu criei ambientes no GitHub com protection rules e secrets distintos
- [ ] Eu adicionei notificação de falha via webhook no meu pipeline
- [ ] Eu resolvi a Questão 3 (quality gates) sem ajuda
- [ ] Eu resolvi a Questão 6 (ambientes multi-ambiente) sem ajuda
- [ ] Eu me sinto confiante para projetar um pipeline completo para um novo projeto
