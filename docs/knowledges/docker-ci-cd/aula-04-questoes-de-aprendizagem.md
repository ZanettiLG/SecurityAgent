---
titulo: "Aula 04 — Questões de Aprendizagem"
modulo: "Docker — Da Containerização ao Deploy em Produção"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 04: GitHub Actions para CI/CD com Docker — Pipeline Completo"
data: 2026-06-18
---

# Aula 04 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o **checkpoint de domínio** da Aula 04. A pergunta central é: *"Eu realmente entendi os mecanismos de pipelines CI/CD e sei aplicá-los com GitHub Actions e Docker?"*

Cada questão verifica um conceito-chave da aula. Você deve conseguir responder **sem consultar a aula** — se travar, a seção de referência está indicada em cada questão. Volte e releia antes de tentar novamente.

**Como proceder:**

1. Crie uma pasta `entregas-aula04/` no seu repositório
2. Para cada questão, crie o arquivo indicado no template de Entrega
3. Preencha todos os campos e responda às perguntas de reflexão
4. Ao final, revise o Checklist Final
5. Só avance para a Aula 05 quando conseguir completar todas as questões por conta própria

---

## Questão 1: Anatomia do Pipeline CI/CD

**Conceito-chave:** Stages, jobs, gates e execução paralela vs sequencial (Aula 04, Seções 1-2).

**Objetivo:** Desenhar e explicar a anatomia de um pipeline CI/CD identificando estágios, jobs paralelos/sequenciais e gates.

**Passos de Execução:**

1. Crie um diagrama (textual ou Mermaid) de um pipeline com 4 estágios: Build, Test, Package, Deploy
2. No estágio Test, identifique 2 jobs paralelos: `unit-test` e `lint`
3. No estágio Deploy, identifique 2 jobs sequenciais: `deploy-staging` e `deploy-production`, com um gate manual entre eles
4. Explique em 2-3 frases por que jobs paralelos e sequenciais coexistem no mesmo pipeline

**Entrega:** crie `entregas-aula04/01-anatomia-pipeline.md`:

**Template de Entrega:**

# Questão 1 — Anatomia do Pipeline CI/CD

## Diagrama do Pipeline

[Insira aqui seu diagrama Mermaid ou textual]

## Jobs Paralelos

- Job paralelo 1: [nome e propósito]
- Job paralelo 2: [nome e propósito]
- Por que rodam em paralelo: [explique]

## Jobs Sequenciais

- Job sequencial 1: [nome e propósito]
- Job sequencial 2: [nome e propósito]
- Gate entre eles: [automático ou manual? Descreva]

## Conclusão

[Em 2-3 frases: por que um pipeline profissional precisa de ambos os tipos de job?]

---

## Questão 2: Modelagem de Ambientes e Secrets

**Conceito-chave:** Ambientes isolados, secrets vs vars (Aula 04, Seções 3-4).

**Objetivo:** Projetar uma estratégia de ambientes e secrets para uma aplicação com três ambientes (dev, staging, production).

**Passos de Execução:**

1. Liste 3 ambientes que uma aplicação típica pode ter
2. Para cada ambiente, identifique: 1 secret (dado sensível) e 1 var (configuração não-sensível)
3. Explique por que o secret de produção não deve ser o mesmo que o de staging

**Entrega:** crie `entregas-aula04/02-ambientes-secrets.md`:

**Template de Entrega:**

# Questão 2 — Modelagem de Ambientes e Secrets

## Tabela de Ambientes

| Ambiente | Propósito | Exemplo de Secret | Exemplo de Var |
|---|---|---|---|
| [nome] | [propósito] | `[secret]` | `[var]` |
| [nome] | [propósito] | `[secret]` | `[var]` |
| [nome] | [propósito] | `[secret]` | `[var]` |

## Justificativa de Isolamento

Por que o secret de produção deve ser diferente do secret de staging:

[Explique em 3-5 frases]

## Conclusão

[Em 2-3 frases: qual o impacto de usar o mesmo secret em staging e produção?]

---

## Questão 3: Workflow Multi-Job

**Conceito-chave:** `needs`, artefatos entre jobs, paralelismo (Aula 04, Seção 5).

**Objetivo:** Escrever um workflow GitHub Actions com 3 jobs sendo que 2 rodam em paralelo e 1 depende dos dois anteriores.

**Passos de Execução:**

1. Escreva um workflow YAML com 3 jobs: `lint`, `test`, `build`
2. Configure `lint` e `test` para rodarem em paralelo
3. Configure `build` com `needs: [lint, test]`
4. No job `build`, use `docker/build-push-action@v5` para buildar e publicar a imagem

**Entrega:** crie `entregas-aula04/03-workflow-multijob.md`:

**Template de Entrega:**

# Questão 3 — Workflow Multi-Job

## Workflow YAML

```yaml
# Insira aqui o YAML completo do workflow
name: ...

on:
  push:
    branches: [ main ]

jobs:
  # Job 1: lint
  # Job 2: test
  # Job 3: build (depende de lint e test)
```

## Explicação

- Por que `lint` e `test` rodam em paralelo? [explique]
- O que acontece se `lint` falhar? [explique]
- O que o `needs` garante neste workflow? [explique]

## Conclusão

[Em 2-3 frases: como o paralelismo economiza tempo no pipeline?]

---

## Questão 4: GitHub Environments com Protection Rules

**Conceito-chave:** Environments no GitHub, required reviewers, wait timer, branch restrictions (Aula 04, Seção 6).

**Objetivo:** Configurar dois environments no GitHub (staging e production) com regras de proteção diferentes e referenciá-los em um workflow.

**Passos de Execução:**

1. Descreva os passos para criar o environment `staging` (sem proteções) no GitHub
2. Descreva os passos para criar o environment `production` (com required reviewers e wait timer de 5 minutos, branch = main)
3. Escreva um trecho de YAML que referencia cada environment em jobs distintos

**Entrega:** crie `entregas-aula04/04-environments-github.md`:

**Template de Entrega:**

# Questão 4 — GitHub Environments com Protection Rules

## Configuração do Environment Staging

Passos:
1. [passo]
2. [passo]
3. [passo]

Proteções:
- Required reviewers: [sim/não]
- Wait timer: [minutos]
- Branch restrictions: [quais?]

## Configuração do Environment Production

Passos:
1. [passo]
2. [passo]
3. [passo]

Proteções:
- Required reviewers: [sim/não — quem?]
- Wait timer: [minutos]
- Branch restrictions: [quais?]

## YAML de Referência

```yaml
deploy-staging:
  runs-on: ubuntu-latest
  environment:
    name: [nome]
    url: [url]
  steps:
    - run: echo "Deploy para staging"

deploy-production:
  runs-on: ubuntu-latest
  environment:
    name: [nome]
    url: [url]
  steps:
    - run: echo "Deploy para production"
```

## Conclusão

[Em 2-3 frases: por que production precisa de mais proteções que staging?]

---

## Questão 5: Testes no Pipeline com Lógica Condicional

**Conceito-chave:** Integração de testes no CI, serviços auxiliares, condicionais `if:` (Aula 04, Seção 7).

**Objetivo:** Adicionar um job de teste com serviço PostgreSQL e lógica condicional que execute uma ação apenas em caso de falha.

**Passos de Execução:**

1. Escreva um job `test` que usa `services:` para subir PostgreSQL
2. Configure a string de conexão via env no step de teste
3. Adicione um step com `if: failure()` que envia uma notificação (simulada com `echo`)
4. Explique por que o teste deve rodar antes do build

**Entrega:** crie `entregas-aula04/05-testes-pipeline.md`:

**Template de Entrega:**

# Questão 5 — Testes no Pipeline com Lógica Condicional

## Job de Teste com PostgreSQL

```yaml
test:
  runs-on: ubuntu-latest
  services:
    [configure o serviço PostgreSQL]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm test
      env:
        DATABASE_URL: [string de conexão]
    - name: Notificar falha
      if: [condicional]
      run: echo "Falha nos testes!"
```

## Por que testar antes de buildar?

[Explique em 3-5 frases]

## Conclusão

[Em 2-3 frases: qual o risco de publicar uma imagem sem testar?]

---

## Questão 6: Cache de Camadas Docker

**Conceito-chave:** `cache-from`, `cache-to`, aceleração de build (Aula 04, Seção 7).

**Objetivo:** Configurar cache de camadas Docker em um workflow GitHub Actions e explicar o mecanismo de funcionamento.

**Passos de Execução:**

1. Escreva um step de build com `docker/build-push-action@v5` que usa `cache-from: type=gha` e `cache-to: type=gha,mode=max`
2. Explique o que cada parâmetro faz
3. Descreva o que acontece na primeira execução vs execuções subsequentes

**Entrega:** crie `entregas-aula04/06-cache-camadas.md`:

**Template de Entrega:**

# Questão 6 — Cache de Camadas Docker

## Step de Build com Cache

```yaml
- name: Build e Push com Cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ secrets.DOCKERHUB_USERNAME }}/app:latest
    cache-from: [tipo]
    cache-to: [tipo]
```

## Explicação dos Parâmetros

- `cache-from: type=gha`: [explique]
- `cache-to: type=gha,mode=max`: [explique]
- `mode=max`: [o que significa?]

## Primeira Execução vs Execuções Seguintes

| Execução | O que acontece | Tempo relativo |
|---|---|---|
| Primeira | [descrição] | [mais rápido/mais lento] |
| Segunda (sem mudanças nas camadas) | [descrição] | [mais rápido/mais lento] |

## Conclusão

[Em 2-3 frases: por que o cache de camadas é importante em um pipeline CI/CD?]

---

## Questão 7: Pipeline Staging→Production Completo

**Conceito-chave:** Deploy multi-ambiente, approval gates, tags de ambiente, integração de todos os conceitos (Aula 04, Seções 5-9).

**Esta questão é a peça central do projeto progressivo.** Você vai transformar o workflow simples da Aula 03 no pipeline profissional completo.

**Objetivo:** Construir o workflow completo que integra testes, cache, versionamento, staging e production com approval gate.

**Passos de Execução:**

1. Crie um workflow YAML com: lint, test (com PostgreSQL), build-and-push (com cache e extração de versão), deploy-staging, deploy-production (com approval)
2. Use environments configurados no GitHub (staging sem proteção, production com required reviewers)
3. Inclua tags múltiplas (`:versao`, `:staging`, `:latest`)
4. Extraia a versão do `package.json` com `jq`

**Entrega:** crie `entregas-aula04/07-pipeline-completo.md`:

**Template de Entrega:**

# Questão 7 — Pipeline Staging→Production Completo

## Workflow YAML Completo

Crie o arquivo `.github/workflows/ci-cd.yml` no seu repositório com o workflow abaixo (preencha com seus dados):

```yaml
# Pipeline completo: lint → test → build-and-push → staging → production
# name, on, env, jobs com todos os componentes
```

## Configuração Necessária no GitHub

- [ ] Environment `staging` criado (sem proteções)
- [ ] Environment `production` criado (com required reviewers, wait timer, branch = main)
- [ ] Secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` configurados
- [ ] Secrets específicos por ambiente (se aplicável)

## Verificação

- O workflow executa do início ao fim?
- O job `deploy-staging` executa automaticamente?
- O job `deploy-production` fica pausado aguardando aprovação?
- Após aprovação, o deploy de produção executa?

## Conclusão

[Em 3-5 frases: descreva o fluxo completo do git push ao deploy em produção, mencionando cada gate]

---

## Questão 8: Versionamento Automatizado

**Conceito-chave:** Extração de versão, `jq`, SemVer no pipeline, tags múltiplas (Aula 04, Seção 9).

**Objetivo:** Implementar um step de versionamento automatizado que extrai a versão do `package.json` e publica a imagem com múltiplas tags.

**Passos de Execução:**

1. Escreva um step que extrai a versão do `package.json` usando `jq` e armazena no `$GITHUB_OUTPUT`
2. Escreva o comando `npm version patch` e explique o que ele faz no `package.json`
3. Configure o build para publicar com tags `:versao`, `:staging` e `:latest`

**Entrega:** crie `entregas-aula04/08-versionamento.md`:

**Template de Entrega:**

# Questão 8 — Versionamento Automatizado

## Step de Extração de Versão

```yaml
- name: Extrair versao do package.json
  id: version
  run: [comando com jq]
```

## Comando npm version patch

Comando: `npm version patch`

O que ele faz:
1. [efeito no package.json]
2. [efeito no git]

## Tags Publicadas

| Tag | Valor | Mutável? | Propósito |
|---|---|---|---|
| `app:[versão]` | `${{ steps.version.outputs.version }}` | [sim/não] | [propósito] |
| `app:staging` | `...` | [sim/não] | [propósito] |
| `app:latest` | `...` | [sim/não] | [propósito] |

## Conclusão

[Em 2-3 frases: por que é importante que a tag SemVer seja imutável?]

---

## Checklist Final: Pronto para a Aula 05?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Explicar** o que é um pipeline CI/CD e a diferença entre CI e CD
- [ ] **Descrever** a anatomia de um pipeline multi-job: stages, jobs, gates e o papel de cada um
- [ ] **Comparar** execução paralela e sequencial de jobs, identificando quando usar `needs`
- [ ] **Definir** ambientes como contextos isolados (staging vs production) com configuração própria
- [ ] **Explicar** a diferença entre secrets e vars, e por que secrets nunca devem aparecer em logs
- [ ] **Construir** um workflow GitHub Actions multi-job com jobs paralelos e sequenciais
- [ ] **Configurar** GitHub Environments com protection rules (required reviewers, wait timer)
- [ ] **Integrar** testes automatizados ao pipeline com serviços auxiliares e condicionais
- [ ] **Aplicar** cache de camadas Docker com `cache-from`/`cache-to` no workflow
- [ ] **Implementar** um pipeline de deploy multi-ambiente completo com versionamento automático

> *Acertou todos? Você está pronto para a **Aula 05: Docker Swarm — Orquestração Nativa em Cluster**. Vamos subir um cluster Swarm e implantar sua stack em múltiplos nós com rolling updates. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.