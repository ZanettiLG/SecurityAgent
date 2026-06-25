---
titulo: "Aula 18: CI/CD — Pipeline de Entrega Contínua"
modulo: "Engenharia de Software"
aula: 18
slug: "cicd-pipeline"
duracao_estimada: "90 minutos"
nivel: "intermediario"
tags: [ci-cd, github-actions, pipeline, quality-gates, continuous-integration, continuous-delivery, devops, automacao]
data: 2026-06-21
---

# Engenharia de Software — Aula 18

## CI/CD — Pipeline de Entrega Contínua

**Duração:** 90 minutos | **Nível:** Intermediário | **Pré-requisitos:** Aula 17 (Pirâmide de Testes & Testes Avançados), familiaridade com JavaScript/TypeScript e GitHub

---

## Objetivos de Aprendizagem

- [ ] **Diferenciar** Continuous Integration, Continuous Delivery e Continuous Deployment
- [ ] **Explicar** o papel de quality gates como barreiras de qualidade no pipeline
- [ ] **Modelar** os ambientes de staging e produção com approval gates
- [ ] **Estruturar** um workflow YAML com jobs paralelos e encadeados no GitHub Actions
- [ ] **Configurar** ferramentas de lint, typecheck e cobertura de testes como quality gates
- [ ] **Aplicar** matrix strategy para testar múltiplas versões do runtime
- [ ] **Gerenciar** segredos e variáveis por ambiente com GitHub Environments
- [ ] **Implementar** notificações de sucesso e falha via webhook
- [ ] **Analisar** um pipeline real identificando gargalos e riscos de segurança
- [ ] **Projetar** um pipeline multi-ambiente com deploy automático e approval manual

---

## Como Usar Esta Aula

Esta aula tem duas partes bem definidas. A Parte 1 apresenta os conceitos universais de CI/CD — entenda cada um antes de passar para a Parte 2, que mostra a implementação prática com GitHub Actions. Os Quick Checks ao final de cada seção servem como autoavaliação. Os exercícios no final consolidam o aprendizado. Não pule o glossário: os termos em inglês são usados com frequência no mercado.

---

## Mapa Mental

```mermaid
mindmap
  root((CI/CD Pipeline))
    Integração Contínua
      Commit frequente
      Lint e Typecheck
      Testes unitários
      Feedback rápido
    Quality Gates
      Cobertura mínima
      Zero warnings
      Segurança
      Branch protection
    Entrega Contínua
      Artefato pronto
      Deploy manual
      Staging
    Deploy Contínuo
      Automático
      Approval gates
      Produção
    GitHub Actions
      Workflow YAML
      Jobs paralelos
      Matrix strategy
      Ambientes
      Notificações
```

![Mapa mental do pipeline CI/CD](images/aula-18-mindmap.png)

---

## Recapitulação da Aula 17

| Conceito | Descrição |
|---|---|
| Git workflow | Fluxo de branches (feature → develop → main) para organizar o desenvolvimento |
| Pull Request | Mecanismo de revisão de código antes do merge |
| Merge vs Rebase | Merge preserva histórico; rebase lineariza e evita commits de merge |
| Conflitos | Ocorrem quando dois branches modificam a mesma linha; resolução manual |
| Git Hooks | Scripts executados em eventos do Git (pre-commit, pre-push) |
| GitHub Flow | Estratégia simplificada: branch por funcionalidade, PR direto para main |

> *Os hooks de pre-push da aula anterior são o embrião de um pipeline de CI. Nesta aula, você vai substituir hooks locais por um pipeline remoto e mais robusto.*

---

> **FUNDAMENTOS:** Integração, Entrega e Deploy Contínuos

> *Esta seção cobre os conceitos universais de CI/CD que valem para qualquer ferramenta de pipeline. Na segunda parte, você verá como o GitHub Actions implementa cada um.*

---

## 1. O que é CI/CD

CI/CD é a sigla para três práticas que formam a espinha dorsal da entrega moderna de software:

**Continuous Integration (CI)** é a prática de integrar código ao repositório compartilhado com frequência — várias vezes ao dia. Cada integração dispara uma build automatizada e uma bateria de testes. O objetivo é detectar problemas horas ou minutos depois de introduzidos, não dias. A regra de ouro: se o pipeline falhar, a equipe para tudo e corrige.

**Continuous Delivery (CDelivery)** estende a CI: além de integrar e testar, o pipeline produz um artefato pronto para deploy (um container Docker, um pacote NPM, um binário compilado). O deploy em produção ainda é uma decisão manual — a equipe aperta o botão quando julgar seguro.

**Continuous Deployment (CDeployment)** vai além: se todos os quality gates passarem, o deploy em produção é automático. Nenhum humano precisa aprovar. Isso exige confiança absoluta nos gates e costuma ser adotado por equipes maduras com testes robustos.

```mermaid
flowchart LR
  A[Commit/Push] --> B[CI: Lint + Test + Build]
  B --> C{Quality Gates}
  C -->|Passou| D[CDelivery: Artefato pronto]
  D --> E[Deploy manual?]
  E -->|Sim| F[Staging]
  F --> G[Aprovação manual]
  G --> H[Produção]
  E -->|Não| I[CDeployment: Deploy automático]
  I --> H
  C -->|Falhou| J[Corrigir código]
  J --> A
```

**Pipeline stages típicos:** `commit → lint → typecheck → testes unitários → testes de integração → build → staging → produção`. Cada stage tem uma responsabilidade específica e quanto antes falha, mais barato é o erro.

### Quick Check 1

**1. Qual a diferença prática entre Continuous Delivery e Continuous Deployment?**
**Resposta:** Continuous Delivery exige uma aprovação manual para levar o artefato à produção; Continuous Deployment faz o deploy automaticamente se todos os quality gates passarem.

**2. Em qual stage do pipeline um erro de sintaxe no código deve ser detectado?**
**Resposta:** No stage de lint ou typecheck, logo após o commit, antes mesmo dos testes unitários.

---

## 2. Quality Gates

Quality gates são barreiras de qualidade que o código precisa superar para avançar no pipeline. Cada gate é uma verificação automatizada que bloqueia o fluxo se não for atendida.

**Tipos comuns de quality gates:**

- **Lint:** zero warnings. Ferramentas como ESLint, Pylint ou RuboCop verificam estilo e más práticas. A flag `--max-warnings 0` impede que o pipeline prossiga com qualquer aviso.
- **Typecheck:** zero erros de tipo. Em TypeScript, `tsc --noEmit` garante que o código é tipo-seguro.
- **Cobertura de testes:** percentual mínimo de linhas, branches ou funções cobertas. Um threshold de 80% de branches é comum em projetos maduros.
- **Segurança:** scanners de dependências vulneráveis (Dependabot, Snyk) e análise SAST (static application security testing) bloqueiam código com CVEs conhecidas.
- **Build:** o artefato precisa compilar sem erros.

**Branch protection + Quality Gates:** no GitHub, você configura branch protection rules para a branch `main` que exigem que todos os status checks passem antes de permitir um merge. Isso impede que código que não passou pelos gates chegue à branch principal.

> *Quality gates funcionam como fitness functions arquiteturais: eles evoluem com o projeto. Conforme a maturidade da equipe aumenta, os thresholds sobem e novos gates são adicionados.*

```mermaid
flowchart TB
  A[Push / PR] --> B{Lint}
  B -->|Zero warnings| C{Typecheck}
  B -->|Falhou| X[Blocado]
  C -->|Zero erros| D{Testes Unitários}
  C -->|Falhou| X
  D -->|Cobertura >= 80%| E{Testes Integração}
  D -->|Falhou| X
  E -->|Passou| F{Build}
  E -->|Falhou| X
  F -->|OK| G[Artefato pronto]
  F -->|Falhou| X
```

### Quick Check 2

**1. O que acontece se um PR tiver 3 warnings de lint com a flag `--max-warnings 0`?**
**Resposta:** O pipeline falha e o PR fica bloqueado — não pode ser mergeado até que os warnings sejam corrigidos.

**2. Por que a cobertura de testes não deve ser o único quality gate de um projeto?**
**Resposta:** Porque cobertura alta não garante qualidade dos testes — é possível ter 100% de cobertura com testes frágeis ou que não verificam comportamento. Por isso gates de lint, typecheck e segurança são igualmente importantes.

---

## 3. Ambientes de Deploy

Ambientes são instâncias isoladas onde o software é executado. Os dois principais são staging e produção, mas projetos maiores podem ter ambientes adicionais (dev, QA, canário).

**Staging** é uma réplica de produção onde a equipe valida o comportamento antes do deploy real. O deploy em staging é automático (push na main dispara o deploy). Aqui rodam testes de integração, testes de fumaça e validação manual.

**Produção** é o ambiente que atende usuários reais. O deploy em produção exige um **approval gate** — uma pessoa autorizada precisa aprovar manualmente. Isso reduz o risco de falhas críticas chegarem aos usuários.

**Secrets management:** cada ambiente tem suas próprias variáveis sensíveis (chaves de API, senhas de banco, tokens). Esses valores nunca devem estar no código-fonte. O GitHub Actions resolve isso com **Actions Secrets** por ambiente — a mesma variável `DATABASE_URL` pode ter valores diferentes em staging e produção.

**Rollback strategy:** se o health check falhar após o deploy, o pipeline deve reverter automaticamente para a versão anterior. Um health check simples é uma requisição HTTP a um endpoint `/health` que retorna 200. Se falhar por N tentativas em M segundos, o rollback é disparado.

```mermaid
flowchart TB
  subgraph main
    A[Push na main]
  end
  A --> B[CI passa?]
  B -->|Sim| C[Deploy Staging]
  C --> D[Health Check]
  D -->|OK| E{Aprovação manual}
  D -->|Falha| F[Rollback]
  E -->|Aprovado| G[Deploy Produção]
  E -->|Rejeitado| H[Notifica equipe]
  G --> I[Health Check Produção]
  I -->|OK| J[Sucesso]
  I -->|Falha| K[Rollback Produção]
```

### Quick Check 3

**1. Qual a principal diferença entre staging e produção no contexto de CI/CD?**
**Resposta:** Staging recebe deploy automático e serve para validação interna; produção requer aprovação manual e atende usuários reais.

**2. Por que secrets devem ser configurados por ambiente e não globalmente?**
**Resposta:** Porque cada ambiente tem credenciais diferentes (ex.: staging usa banco de testes, produção usa banco real). Misturar secrets entre ambientes pode causar vazamento de dados de produção ou falhas de conexão.

---

> **APLICAÇÃO:** Workflow GitHub Actions para o E-commerce

> *Agora que você entende os conceitos de CI/CD, vamos implementar um pipeline completo no GitHub Actions para o projeto de e-commerce que você vem construindo.*

---

## 4. Workflow Completo

O pipeline do e-commerce tem 6 jobs organizados em dois níveis. O primeiro nível executa lint, typecheck, testes unitários e testes de integração em paralelo. O segundo nível (build) só roda se todos do primeiro nível passarem. O deploy em staging é o último passo, dependente do build.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx eslint . --max-warnings 0

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  unit-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"lines":85}}'

  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, unit-test, integration-test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build]
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: echo "Deploying to staging..."
      - run: curl -f http://staging.exemplo.com/health
```

```mermaid
flowchart TB
  subgraph "Nível 1 (paralelo)"
    A[Lint]
    B[Typecheck]
    C[Unit Test]
    D[Integration Test]
  end
  A --> E{Build}
  B --> E
  C --> E
  D --> E
  E -->|Artefato| F[Deploy Staging]
  subgraph "Nível 2 (encadeado)"
    E
    F
  end
```

### Quick Check 4

**1. O que a chave `needs` faz no workflow?**
**Resposta:** Define que o job atual depende da conclusão bem-sucedida de um ou mais jobs listados. No exemplo, `build` só roda se `lint`, `typecheck`, `unit-test` e `integration-test` passarem.

**2. Por que os jobs `lint`, `typecheck` e `unit-test` não usam `needs` entre si?**
**Resposta:** Porque são independentes e devem rodar em paralelo para reduzir o tempo total do pipeline. Usar `needs` entre eles os tornaria sequenciais, aumentando o tempo de feedback.

---

## 5. Quality Gates no Pipeline

Cada quality gate do pipeline tem uma configuração específica. Veja como configurar cada um no projeto de e-commerce.

### ESLint com zero warnings

```yaml
- run: npx eslint . --max-warnings 0
```

A flag `--max-warnings 0` faz o ESLint retornar código de saída 1 (erro) se houver qualquer warning. Certifique-se de que o arquivo `.eslintrc.json` ou `eslint.config.js` existe no projeto.

### TypeScript strict com zero erros

```yaml
- run: npx tsc --noEmit
```

O `tsconfig.json` deve ter:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Cobertura de testes com Jest

```yaml
- run: npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"lines":85}}'
```

Se a cobertura ficar abaixo de 80% de branches ou 85% de linhas, o comando retorna erro e o job falha.

### Branch protection rules no GitHub

1. Acesse Settings > Branches > Add branch protection rule
2. Em "Branch name pattern", digite `main`
3. Marque "Require status checks before merging"
4. Selecione os checks: `lint`, `typecheck`, `unit-test`, `integration-test`, `build`
5. Marque "Require pull request reviews before merging"
6. Marque "Do not allow bypassing the above settings"

```yaml
# Exemplo de config via API (opcional — para automação):
# gh api repos/:owner/:repo/branches/main/protection \
#   --method PUT \
#   --field required_status_checks.strict=true \
#   --field required_status_checks.contexts[]='lint'
```

### Quick Check 5

**1. O que a flag `--coverageThreshold` faz no Jest?**
**Resposta:** Define um percentual mínimo de cobertura. Se o valor real ficar abaixo do threshold, o comando falha e o pipeline bloqueia.

**2. Alguém pode fazer push direto na main se as branch protection rules estiverem ativas?**
**Resposta:** Não, a menos que a opção "Allow bypass" esteja marcada. O GitHub bloqueia pushes diretos e exige que toda alteração passe por PR e status checks.

---

## 6. Matrix Strategy

A matrix strategy permite executar um mesmo job com variações de parâmetros. É ideal para testar múltiplas versões de Node.js, sistemas operacionais ou dependências sem duplicar YAML.

```yaml
unit-test:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      node-version: [18, 20, 22]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm test
```

O GitHub Actions expande esse YAML em 3 jobs paralelos: `unit-test (18)`, `unit-test (20)` e `unit-test (22)`. Cada um roda com a versão correspondente do Node.js.

**Combinando matrix com cache:** o `actions/setup-node` com `cache: 'npm'` gerencia o cache automaticamente. O cache é chaveado pelo arquivo `package-lock.json` e pela versão do Node.js, então cada combinação da matrix tem seu próprio cache.

### Quick Check 6

**1. Quantos jobs são gerados pela matrix `node-version: [18, 20, 22]` combinada com `os: [ubuntu-latest, windows-latest]`?**
**Resposta:** 6 jobs (3 versões × 2 sistemas operacionais).

**2. O cache de `node_modules` funciona corretamente com matrix?**
**Resposta:** Sim, desde que a chave do cache inclua a versão do Node.js (o `actions/setup-node` faz isso automaticamente quando `cache: 'npm'` é usado).

---

## 7. Ambientes e Deploy Multi-Ambiente

O GitHub Environments adiciona uma camada de segurança e organização ao deploy. Cada ambiente pode ter protection rules, secrets próprios e URL de visualização.

### Configuração de ambientes

No repositório, vá em Settings > Environments e crie dois ambientes:

- **staging:** sem protection rules — deploy automático
- **production:** com "Required reviewers" (2 pessoas) e "Wait timer" de 5 minutos

### Secrets por ambiente

| Secret | Staging | Production |
|---|---|---|
| `DATABASE_URL` | `postgres://user:pass@staging-db:5432/db` | `postgres://user:pass@prod-db:5432/db` |
| `API_KEY` | `sk-test-abc123` | `sk-prod-xyz789` |

### Workflow com ambientes

```yaml
deploy-staging:
  runs-on: ubuntu-latest
  needs: [build]
  environment: staging
  steps:
    - uses: actions/checkout@v4
    - uses: actions/download-artifact@v4
      with:
        name: build-output
        path: dist/
    - run: ./deploy.sh staging
    - name: Health Check
      run: |
        for i in {1..5}; do
          curl -f http://staging.exemplo.com/health && break
          sleep 5
        done

deploy-production:
  runs-on: ubuntu-latest
  needs: [build]
  environment: production
  steps:
    - uses: actions/checkout@v4
    - uses: actions/download-artifact@v4
      with:
        name: build-output
        path: dist/
    - run: ./deploy.sh production
    - name: Health Check
      run: |
        for i in {1..5}; do
          curl -f https://exemplo.com/health && break
          sleep 5
        done
    - name: Rollback on Failure
      if: failure()
      run: ./rollback.sh production
```

> *A chave `environment: production` com "Required reviewers" faz o workflow pausar automaticamente até que as pessoas designadas aprovem o deploy. ninguém precisa ficar monitorando o pipeline.*

### Quick Check 7

**1. O que acontece quando um job usa `environment: production` com required reviewers?**
**Resposta:** O workflow pausa automaticamente e só prossegue após o número necessário de revisores aprovar o deploy.

**2. Como acessar um secret do ambiente dentro do workflow?**
**Resposta:** Usando `${{ secrets.NOME_DO_SECRET }}`. O GitHub Actions injeta o valor do secret correspondente ao ambiente definido no job.

---

## 8. Notificações

Notificações mantêm a equipe informada sobre o estado do pipeline. A forma mais comum é via webhook para Slack ou Discord.

```yaml
notify-success:
  runs-on: ubuntu-latest
  needs: [deploy-staging]
  if: success()
  steps:
    - run: |
        curl -X POST -H "Content-Type: application/json" \
          -d '{"text":"✅ Pipeline concluído com sucesso para main"}' \
          ${{ secrets.SLACK_WEBHOOK_URL }}

notify-failure:
  runs-on: ubuntu-latest
  needs: [deploy-staging]
  if: failure()
  steps:
    - run: |
        curl -X POST -H "Content-Type: application/json" \
          -d '{"text":"❌ Pipeline falhou em main — verificar logs"}' \
          ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Condicionais importantes:**

- `if: success()` — executa apenas se todos os jobs anteriores (via `needs`) tiverem sucesso
- `if: failure()` — executa se qualquer job anterior falhar
- `if: always()` — executa independentemente do resultado (útil para limpeza)

> *O webhook URL é armazenado como secret do repositório para evitar exposição. Nunca cole a URL diretamente no YAML.*

### Quick Check 8

**1. Qual a diferença entre `if: failure()` e `if: always()`?**
**Resposta:** `failure()` executa apenas se algum job anterior falhou; `always()` executa independentemente do resultado (sucesso, falha ou cancelamento).

**2. Por que o webhook URL deve ser armazenado como secret?**
**Resposta:** Para evitar que pessoas não autorizadas descubram o URL e enviem mensagens falsas no canal. Secrets são mascarados nos logs do GitHub Actions.

---

## Autoavaliação: Quiz Rápido

**1. Qual estágio do pipeline detecta problemas de formatação e más práticas no código?**
**Resposta:** Lint. Ferramentas como ESLint analisam o código estático e apontam violações de estilo e más práticas.

**2. O que acontece se um job lista `needs: [lint, test]` e o job `lint` falha?**
**Resposta:** O job não executa e é marcado como "skipped" no summary do workflow.

**3. Para que serve a chave `strategy.matrix` no GitHub Actions?**
**Resposta:** Para definir uma combinação de variáveis (versões de runtime, SOs) que geram múltiplas execuções paralelas do mesmo job.

**4. Como impedir que código com cobertura de testes abaixo de 80% seja mergeado?**
**Resposta:** Configurando `--coverageThreshold` no Jest e exigindo que o job de testes passe como status check na branch protection rule.

**5. Qual a diferença entre um secret do repositório e um secret de ambiente?**
**Resposta:** O secret do repositório fica disponível para todos os workflows; o secret de ambiente só fica disponível para jobs que usam aquele ambiente específico.

**6. O que significa a flag `--max-warnings 0` no ESLint?**
**Resposta:** Significa que zero warnings são tolerados. Qualquer warning faz o ESLint retornar erro e o pipeline falha.

**7. Qual condicional deve ser usada em um job que envia notificação apenas em caso de falha?**
**Resposta:** `if: failure()`. A condicional `if: success()` só enviaria em caso de sucesso.

---

## Mão na Massa: Exercícios Graduados

### Exercício 1 (Fácil): Completar Trecho de Pipeline

Complete o YAML abaixo adicionando `needs` e `cache` nos lugares indicados por comentários.

```yaml
name: CI Básico

on: [push]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          # ADICIONAR CACHE AQUI
      - run: npm ci
      - run: npx eslint .

  test:
    runs-on: ubuntu-latest
    # ADICIONAR NEEDS AQUI
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    # ADICIONAR NEEDS AQUI (DEPENDE DE LINT E TEST)
    steps:
      - run: echo "Deploying..."
```

**Gabarito:**

```yaml
lint:
    # ...
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

  test:
    needs: [lint]
    # ...

  deploy:
    needs: [lint, test]
    # ...
```

### Exercício 2 (Médio): Adicionar Matrix + Coverage

Parta do YAML abaixo e faça duas alterações:

1. Adicione matrix strategy para testar Node.js 18, 20 e 22
2. Adicione `--coverageThreshold` com 80% de linhas e 75% de branches

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm test
```

**Gabarito:**

```yaml
test:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      node-version: [18, 20, 22]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm test -- --coverage --coverageThreshold='{"global":{"lines":80,"branches":75}}'
```

### Exercício 3 (Difícil): Pipeline Multi-Ambiente Completo

Crie um pipeline completo com:

- 4 jobs de CI (lint, typecheck, test, build) com paralelismo e encadeamento corretos
- Matrix strategy para testes em Node.js 20 e 22
- Cobertura mínima de 85% de linhas
- Deploy em staging automático com health check
- Deploy em produção com aprovação manual
- Notificação de falha via webhook
- Cache de dependências em todos os jobs

**Gabarito:**

```yaml
name: Pipeline Multi-Ambiente

on:
  push:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx eslint . --max-warnings 0

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage --coverageThreshold='{"global":{"lines":85}}'

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build]
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: echo "Deploying to staging..."
      - run: |
          for i in {1..5}; do
            curl -f http://staging.exemplo.com/health && break
            sleep 5
          done

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build]
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: echo "Deploying to production..."
      - run: |
          for i in {1..5}; do
            curl -f https://exemplo.com/health && break
            sleep 5
          done

  notify-failure:
    runs-on: ubuntu-latest
    needs: [deploy-staging, deploy-production]
    if: failure()
    steps:
      - run: |
          curl -X POST -H "Content-Type: application/json" \
            -d '{"text":"❌ Pipeline multi-ambiente falhou"}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Resumo da Aula

CI/CD é a espinha dorsal da entrega moderna de software. A Integração Contínua valida cada commit automaticamente. Quality gates (lint, typecheck, cobertura, segurança) funcionam como barreiras que protegem a branch principal. Ambientes de staging e produção com approval gates separam validação de entrega ao usuário. O GitHub Actions implementa tudo com workflows YAML, matrix strategy para testes multi-versão, environments com secrets segregados e webhooks para notificação. Um pipeline bem projetado combina velocidade (jobs paralelos) com segurança (gates e aprovações).

---

## Próxima Aula

Na **Aula 19: DevSecOps**, você vai aprender a integrar segurança no pipeline — análise SAST, scanning de dependências, política de secrets, e como criar um security gate que bloqueia vulnerabilidades antes de chegarem em produção.

---

## Referências

### Fundamentos de CI/CD
- Fowler, M. "Continuous Integration" — martinfowler.com
- Humble, J. & Farley, D. "Continuous Delivery" — Addison-Wesley
- Kim, G. et al. "The DevOps Handbook" — IT Revolution Press

### GitHub Actions
- GitHub Docs: "Understanding GitHub Actions" — docs.github.com
- GitHub Docs: "Using environments for deployment" — docs.github.com
- GitHub Docs: "Workflow syntax for GitHub Actions" — docs.github.com

### Quality Gates e Testes
- ESLint Docs: "Command Line Interface" — eslint.org
- Jest Docs: "Configuration / coverageThreshold" — jestjs.io
- TypeScript Docs: "Compiler Options in detail" — typescriptlang.org

---

## FAQ

**1. Posso usar CI/CD sem GitHub Actions?**
Sim. GitLab CI/CD, Jenkins, CircleCI, Bitbucket Pipelines e Azure DevOps são alternativas consolidadas.

**2. O que é mais importante: cobertura de testes ou lint?**
Ambos, mas lint detecta problemas mais cedo (erros óbvios de sintaxe e estilo), enquanto cobertura garante que o código foi exercitado. Um pipeline maduro tem ambos.

**3. Preciso de um servidor próprio para rodar o GitHub Actions?**
Não. O GitHub fornece runners hospedados (ubuntu, windows, macos). Para projetos maiores, você pode configurar self-hosted runners na sua infraestrutura.

**4. Como faço para um job rodar apenas em PRs e não em push direto?**
Use `on: pull_request:` no lugar de `on: push:` ou combine condições com `github.event_name`.

**5. Matrix strategy aumenta o consumo de minutos do GitHub Actions?**
Sim, cada combinação da matrix consome minutos independentemente. Planeje a matrix para testar apenas versões relevantes.

**6. Posso usar Actions Secrets em forks?**
Não. Por segurança, secrets não são passados para workflows disparados por forks de pull requests.

**7. O que é um self-hosted runner?**
É um servidor que você configura para executar jobs do GitHub Actions na sua própria infraestrutura, útil para acessar recursos internos da empresa.

**8. Como saber se meu health check é confiável?**
Um health check bom verifica conectividade com banco de dados, filas e serviços externos, não apenas se o servidor HTTP está rodando.

**9. Preciso de quality gates para projetos pequenos?**
Sim, mas adaptados. Um projeto pessoal pode ter só lint + testes; um projeto de equipe exige todos os gates.

**10. O que significa "shift left" no contexto de CI/CD?**
É a prática de mover verificações de qualidade para estágios mais iniciais do pipeline — detectar erros no commit em vez de no deploy.

---

## Glossário

| Termo | Significado |
|---|---|
| **Build** | Processo de compilar ou empacotar o código em um artefato executável |
| **CI (Continuous Integration)** | Integração frequente de código com validação automatizada |
| **CD (Continuous Delivery)** | Artefato sempre pronto para deploy, mas deploy é manual |
| **CD (Continuous Deployment)** | Deploy automático se todos os gates passarem |
| **Gate** | Barreira de qualidade que bloqueia o pipeline se não for atendida |
| **Job** | Unidade de trabalho em um workflow do GitHub Actions |
| **Matrix Strategy** | Técnica para executar o mesmo job com múltiplas combinações de parâmetros |
| **Runner** | Agente que executa os jobs do GitHub Actions |
| **Secret** | Variável sensível criptografada no repositório ou ambiente |
| **Stage** | Fase do pipeline (lint, test, build, deploy) |
| **Workflow** | Pipeline automatizado definido em YAML no GitHub Actions |
| **Webhook** | URL que recebe notificações HTTP sobre eventos do pipeline |
