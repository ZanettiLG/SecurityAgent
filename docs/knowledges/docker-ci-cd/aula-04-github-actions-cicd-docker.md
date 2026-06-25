---
titulo: "Aula 04: GitHub Actions para CI/CD com Docker — Pipeline Completo"
modulo: "Docker — Da Containerização ao Deploy em Produção"
duracao_estimada: "120 minutos"
nivel: "intermediario"
tags: [github-actions, ci-cd, docker, pipeline, testes, deploy, multi-ambiente, cache, workflows, environments, secrets]
data: 2026-06-18
---

# Curso: Docker — Da Containerização ao Deploy em Produção — Aula 04

## GitHub Actions para CI/CD com Docker: Pipeline Completo

**Duração estimada:** 120 minutos (60 de leitura + 60 de prática)
**Nível:** Intermediário
**Pré-requisitos:** Dockerfile multi-stage funcional (Aula 01), stack multi-serviço com Compose (Aula 02), Docker Hub com imagem publicada e workflow simples GitHub Actions (build→push) configurado (Aula 03), Node.js e npm com `package.json`, Git com push/pull/branches, ferramenta `jq` instalada

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

- [ ] **Explicar** o que é um pipeline CI/CD e por que automatizar build, teste e deploy é superior a processos manuais
- [ ] **Descrever** a anatomia de um pipeline multi-job: stages, jobs, dependências e gates de qualidade
- [ ] **Comparar** execução paralela e sequencial de jobs em um pipeline, identificando quando usar dependências entre jobs
- [ ] **Definir** ambientes como contextos isolados com configuração, proteção e segredos próprios
- [ ] **Explicar** o mecanismo de segredos como variáveis criptografadas injetadas em runtime, distinguindo dados sensíveis de configuração não-sensível
- [ ] **Construir** um workflow GitHub Actions multi-job com jobs paralelos (lint + teste) e sequenciais (build → push → deploy)
- [ ] **Configurar** ambientes no GitHub com regras de proteção e segredos específicos por ambiente
- [ ] **Integrar** testes automatizados (Jest + supertest) ao pipeline, com lógica condicional para só publicar imagem se os testes passarem
- [ ] **Aplicar** cache de camadas Docker com ferramentas de build que suportam cache de camadas para acelerar builds no CI/CD
- [ ] **Implementar** um pipeline de deploy multi-ambiente completo com tags de ambiente, approval gate manual e versionamento extraído do código

---

## Como Usar Esta Aula

Esta aula está organizada em **duas partes** com uma transição explícita entre elas.

A **primeira parte** (FUNDAMENTOS) cobre os mecanismos universais de pipelines CI/CD — o que é um pipeline orientado a eventos, como se estrutura em stages e jobs, o papel de ambientes isolados e o tratamento seguro de credenciais. Estes conceitos são apresentados de forma genérica e ancorados em experiências que você já domina: git hooks, scripts npm encadeados e variáveis de ambiente.

A **segunda parte** (APLICAÇÃO) conecta cada mecanismo à prática com GitHub Actions e Docker. Você vai transformar o workflow simples que criou na Aula 03 em um pipeline profissional com testes automatizados, cache de camadas, deploy multi-ambiente com approval gates e versionamento automatizado.

Ao longo do caminho, você encontrará seções **"Mão na Massa"** com passos práticos para executar no seu terminal, e **"Quick Check"** ao final de cada seção para verificar se você absorveu o conceito. Ao final, o arquivo separado **Questões de Aprendizagem** traz as tarefas de checkpoint — só avance para a próxima aula quando conseguir completá-las por conta própria.

**Tempo estimado:** 60 minutos de leitura + 60 minutos de prática.

---

## Mapa Mental

Este diagrama mostra todos os conceitos que você vai dominar nesta aula:


![Mapa mental: GitHub Actions CI/CD com Docker](images/diagrama-01-mindmap.png)

---

## Recapitulação das Aulas 01 a 03

| Aula | Conceito | Onde aparece nesta aula | Como se conecta |
|---|---|---|---|
| Aula 01 | **Dockerfile multi-stage** (Seção 10) | Seções 5-9 — imagem que passa por todo o pipeline | O build da sua API gera a imagem que será testada, cacheadas e publicada com tags de ambiente |
| Aula 01 | **Bind mounts e hot reload** (Seção 8) | Seção 7 — testes locais antes do push | O fluxo de desenvolvimento local (editar → ver) agora tem uma camada de CI que testa antes de publicar |
| Aula 02 | **docker-compose.yml** (Seções 6-11) | Seções 7 e 8 — ambiente de teste no CI | O Compose que você construiu sobe a stack completa para execução dos testes automatizados |
| Aula 02 | **Profiles dev/prod** (Seção 12) | Seção 6 — ambientes staging e production no GitHub | O mesmo princípio de configuração por ambiente, agora aplicado ao pipeline CI/CD |
| Aula 03 | **Workflow GitHub Actions** (Seções 10-12) | Seções 5-9 — ponto de partida do pipeline profissional | O workflow simples de build→push é expandido para incluir testes, cache, multi-ambiente e approval |
| Aula 03 | **Tags de ambiente** (`:staging`, `:latest`) | Seções 8-9 — tags gerenciadas pelo pipeline agora com versionamento automático | As tags que você aplicava manualmente agora são geradas e promovidas pelo CI/CD |
| Aula 03 | **Secrets no GitHub** (Seção 11) | Seção 6 — secrets por ambiente com escopo restrito | Você já conhece secrets do repositório; agora vai criar secrets específicos por ambiente |
| Aula 03 | **Versionamento SemVer** (Seções 4-5) | Seção 9 — versão extraída do `package.json` e aplicada automaticamente | O SemVer que você aplicava manualmente nas tags agora é automatizado no pipeline |

---

**FUNDAMENTOS: Mecanismos Universais de Pipelines CI/CD**

> *"Os conceitos desta seção são universais — valem para qualquer plataforma de automação, qualquer ecossistema, qualquer linguagem. Na segunda parte, você verá como GitHub Actions e Docker implementam cada um deles. Mas aqui, o foco está no 'por que' e 'como funciona', ancorado em ferramentas que você já domina: git hooks, scripts npm e variáveis de ambiente."*

---

## 1. O Pipeline como Automação Orientada a Eventos

Você já automatiza processos no seu dia a dia sem perceber. Quando um `git push` dispara uma notificação no Slack, ou quando um hook de pré-commit roda o linter automaticamente, você está usando **automação orientada a eventos**. Um pipeline CI/CD leva esse conceito ao extremo: **cada evento no repositório pode disparar uma sequência inteira de ações automatizadas**.

### 1.1 O Que é um Pipeline CI/CD

**CI/CD** (Continuous Integration / Continuous Delivery) é a prática de automatizar as etapas de build, teste e entrega do software:

- **Continuous Integration (CI)**: a cada `git push`, o código é integrado, testado e buildado automaticamente. Se os testes falharem, o pipeline para — ninguém precisa lembrar de rodar `npm test` antes de commitar.
- **Continuous Delivery (CD)**: após o build passar nos testes, o artefato (imagem Docker, pacote npm, binário) é publicada automaticamente no registry. O deploy para produção pode ser manual ou automático.

O modelo mental é simples: **você define os eventos (gatilhos) e as ações (etapas), e o robô executa religiosamente**.

### 1.2 Eventos como Gatilhos

Um pipeline não executa no vácuo — ele precisa de um **evento** para começar. Os gatilhos mais comuns são:

| Tipo de evento | Exemplo | Quando usar |
|---|---|---|
| Push em branch | `git push origin main` | Pipeline principal de CI/CD |
| Pull Request | Abertura ou atualização de PR | Validar código antes do merge |
| Schedule | Todo dia às 8h | Testes noturnos, renovação de certificados |
| Manual (workflow_dispatch) | Botão na interface | Deploy manual para produção |
| Tag criada | `git tag v1.0.0` | Publicar release versionada |

Você já conhece este padrão dos **git hooks**: o hook `pre-commit` executa um script *antes* do commit, o hook `post-merge` executa *depois* de um merge. Um pipeline CI/CD é a mesma ideia — só que executado em um servidor remoto, não na sua máquina.

### 1.3 Webhooks vs Polling

Como o servidor de CI/CD sabe que um evento aconteceu? Duas abordagens:

- **Webhooks**: o repositório notifica o servidor de CI/CD via HTTP sempre que um evento ocorre. É como um callback assíncrono — instantâneo e eficiente.
- **Polling**: o servidor de CI/CD pergunta periodicamente ao repositório "tem algo novo?". Ineficiente (gasta requisição mesmo quando não há mudanças), mas usado em sistemas legados.

A maioria dos serviços modernos (incluindo o que você usará na Parte 2) usa **webhooks**. Quando você faz `git push`, o repositório envia um POST para o serviço de CI/CD com os detalhes do push, e o pipeline dispara em segundos.

### Quick Check 1

**1. Qual a diferença entre CI e CD?**
**Resposta:** CI (Continuous Integration) testa e builda o código a cada push automaticamente. CD (Continuous Delivery) publica o artefato no registry após o CI passar. CI responde "o código está bom?"; CD responde "entrega o artefato".

**2. Um pipeline disparado por schedule à meia-noite executa que tipo de gatilho?**
**Resposta:** Gatilho temporal (time-based). Diferente de push ou PR (que são gatilhos de evento), o schedule executa independentemente de mudanças no código. É útil para tarefas periódicas como testes de regressão ou renovação de certificados.

---

## 2. Stages, Jobs e Gates — A Anatomia de um Pipeline

Um pipeline não é uma tarefa monolítica — ele é composto de **estágios**, cada estágio contém **trabalhos** (jobs), e entre estágios existem **portões** (gates) que controlam se o pipeline pode avançar.

### 2.1 Stages: As Fases do Pipeline

Um **stage** (estágio) é uma fase lógica do pipeline. Os estágios típicos são:

1. **Build**: compilar o código, construir a imagem, instalar dependências
2. **Test**: executar testes unitários, de integração, lint
3. **Package**: gerar o artefato final (imagem Docker, binário)
4. **Deploy**: publicar o artefato em um ou mais ambientes

Cada estágio é uma **fronteira de verificação**. Se o estágio de teste falha, o pipeline não avança para deploy. É como uma linha de montagem: se a peça sai com defeito da estação 2, ela não vai para a estação 3.

### 2.2 Jobs: Trabalhos Paralelos e Sequenciais

Dentro de cada estágio, você pode ter um ou mais **jobs** (trabalhos). Jobs são unidades de trabalho que executam em um ambiente isolado. Eles podem rodar em **paralelo** ou em **sequência**:

![Diagrama: Jobs e gates no pipeline CI/CD](images/diagrama-02-flowchart.png)


Diagrama: Jobs de lint e testes rodam em paralelo. Após todos passarem, o build é executado. Após o push, um gate de aprovação manual decide se o deploy continua.

**Quando usar paralelo vs sequencial:**

- **Jobs paralelos**: tarefas independentes que podem rodar ao mesmo tempo. Ex: rodar `lint` e `test` em paralelo economiza tempo.
- **Jobs sequenciais**: tarefas que dependem do resultado da anterior. Ex: só faz deploy depois que o build terminou.

A analogia que gruda: *"Jobs paralelos são como `npm run lint & npm test &` — ambos rodam concorrentemente. Jobs sequenciais são como `build && test && deploy` — cada etapa espera a anterior."*

### 2.3 Gates: Os Portões de Qualidade

Um **gate** é uma verificação que decide se o pipeline pode prosseguir. Exemplos:

- **Gate automático**: "todos os testes passaram?" — o sistema verifica e decide.
- **Gate manual**: "alguém aprovou o deploy?" — um humano precisa autorizar.
- **Gate de qualidade**: "a cobertura de testes é superior a 80%?" — métrica quantitativa.

Os gates são o que diferenciam um pipeline de um script qualquer. Um script executa cegamente; um pipeline **decide** se deve continuar com base em condições.

### Quick Check 2

**1. Em que situação você usaria jobs paralelos em vez de sequenciais?**
**Resposta:** Quando os jobs são independentes entre si e podem rodar concorrentemente sem conflito. Exemplo: rodar lint do frontend e testes do backend ao mesmo tempo em jobs separados — ambos usam recursos diferentes e não precisam esperar um pelo outro.

**2. O que acontece com o pipeline se um gate automático de testes falhar?**
**Resposta:** O pipeline é interrompido naquele ponto. Jobs subsequentes (build, deploy) não são executados. O status do pipeline fica como "falhou", e uma notificação é enviada. Isso evita que código com defeito chegue aos ambientes seguintes.

---

## 3. Ambientes e Configuração por Contexto

Uma aplicação raramente executa em um único contexto. Você tem desenvolvimento (onde testa mudanças), staging (onde valida antes de lançar) e produção (onde os usuários acessam). Cada um desses contextos é um **ambiente**.

### 3.1 O Que é um Ambiente

Um **ambiente** é um contexto isolado de execução com configuração, recursos e permissões próprios. Os ambientes típicos são:

| Ambiente | Propósito | Quem acessa | Estabilidade |
|---|---|---|---|
| Desenvolvimento | Codificar e testar localmente | Apenas o desenvolvedor | Pode quebrar |
| Staging | Validar antes do lançamento | Time + QA | Deve estar estável |
| Produção | Usuários finais | Público | Máxima estabilidade |

Você já conhece este conceito da variável `NODE_ENV` no Node.js: `NODE_ENV=development` vs `NODE_ENV=production` muda completamente o comportamento da aplicação (logging detalhado, hot reload, otimizações).

### 3.2 Por Que Ambientes São Necessários no Pipeline

No contexto de CI/CD, ambientes servem a três propósitos:

1. **Configuração isolada**: cada ambiente tem suas próprias variáveis de configuração (URL do banco, chave de API, nível de log). Uma mudança em staging não afeta produção.
2. **Proteção gradual**: você promove uma imagem de staging para produção apenas após validação. Erros são capturados em staging, não em produção.
3. **Rastreabilidade**: cada deploy para um ambiente fica registrado — quem aprovou, qual versão, quando.

O pipeline ideal constrói a imagem **uma vez** e a promove através dos ambientes. A mesma imagem que passou nos testes em staging é a mesma que vai para produção — sem reconstruir, sem recompilar.

### 3.3 Ambientes com Restrições

Ambientes de produção tipicamente têm **proteções** adicionais:

- Quem pode fazer deploy (apenas usuários autorizados)
- De qual branch o deploy é permitido (apenas `main`)
- Se precisa de aprovação explícita antes do deploy
- Se há um tempo de espera mínimo entre deploys

Essas proteções não são burocracia — são **garantias** de que mudanças em produção passaram por validação e revisão.

### Quick Check 3

**1. Por que é importante que a mesma imagem buildada vá para staging e depois para produção?**
**Resposta:** Para garantir que o artefato testado em staging é exatamente o mesmo que será executado em produção. Se você rebuildar entre ambientes, pode introduzir diferenças sutis (dependência atualizada, compilador diferente) que invalidam os testes de staging.

**2. Qual a diferença entre ambientes de staging e produção além da configuração?**
**Resposta:** Staging tem proteções mais leves (deploy automático após testes passarem) e é usado para validação interna. Produção tem proteções mais rígidas (approval manual, branch restrita, janela de deploy) porque impacta usuários reais.

---

## 4. Secrets — Credenciais Fora do Código

Credenciais no código-fonte são um dos erros mais comuns e perigosos no desenvolvimento de software. Um token de API hardcoded no `server.js` vaza na primeira vez que o repositório é tornado público. A solução para isso é o uso de **secrets**.

### 4.1 O Que São Secrets

**Secrets** são valores sensíveis (senhas, tokens, chaves SSH, strings de conexão) que nunca devem ser armazenados no código-fonte ou em arquivos versionados. Em vez disso, eles são:

1. Armazenados em um cofre seguro (vault, gerenciador de secrets do CI/CD)
2. Injetados no ambiente de execução em tempo real
3. Criptografados em repouso e em trânsito

Você já conhece o padrão do arquivo `.env`: colocar variáveis sensíveis em um arquivo ignorado pelo git (`.gitignore`) e carregá-las com `dotenv`. Secrets em CI/CD funcionam de forma similar, mas com uma diferença crucial: **os valores são gerenciados pelo servidor de CI/CD, não por um arquivo local**.

### 4.2 Secrets vs Vars (Configuração Não-Sensível)

Nem toda variável de ambiente é um secret. A distinção é importante:

| Característica | Secret | Var (Variável de Configuração) |
|---|---|---|
| Conteúdo | Senhas, tokens, chaves | URLs, nomes, portas, flags |
| Visibilidade | Nunca aparece em logs | Pode aparecer em logs |
| Criptografia | Criptografado em repouso | Pode ser texto plano |
| Rotação | Deve ser trocado periodicamente | Raramente precisa trocar |
| Exemplo | `DB_PASSWORD`, `API_TOKEN` | `NODE_ENV`, `LOG_LEVEL`, `DB_HOST` |

Uma boa regra: se o valor vazar e causar dano (acesso não autorizado a um sistema), é secret. Se o valor vazar e não causar dano (a URL do banco sem senha não permite acesso), é var.

### 4.3 O Ciclo de Vida de um Secret

1. **Criação**: o administrador cadastra o secret no cofre/gerenciador do CI/CD
2. **Referência**: o pipeline referencia o secret pelo nome (ex: `${{ secrets.DB_PASSWORD }}`)
3. **Injeção**: o sistema injeta o valor no ambiente de execução do job — **apenas no momento da execução**
4. **Uso**: o job usa o secret para autenticar, conectar, assinar
5. **Descarte**: ao final do job, o ambiente é destruído e o secret desaparece

**Regra de ouro:** se o pipeline precisa de um valor para funcionar mas esse valor não pode aparecer no código, ele é um candidato a secret.

### Quick Check 4

**1. Qual a principal diferença entre um secret e uma variável de configuração (var)?**
**Resposta:** Um secret contém dados sensíveis que, se expostos, causam dano de segurança (senhas, tokens). Uma var contém configuração não-sensível (URLs, portas, flags). Secrets são criptografados, têm rotação periódica e nunca aparecem em logs. Vars podem ser texto plano e são seguras para exibição.

**2. Em que momento do pipeline o valor do secret é injetado no ambiente?**
**Resposta:** Apenas no momento da execução do job que referencia o secret. O valor não fica disponível antes (no código-fonte) nem depois (persistido em log ou artefato). O ambiente é destruído ao final do job, eliminando qualquer vestígio do secret.

---

**APLICAÇÃO: Pipeline CI/CD Completo com GitHub Actions e Docker**

> *"Agora que você entende os mecanismos universais — eventos como gatilhos, anatomia de stages/jobs/gates, ambientes isolados e secrets — vamos conectá-los à prática com GitHub Actions e Docker. Cada conceito da primeira parte ganha uma implementação concreta. O workflow simples da Aula 03 será transformado em um pipeline profissional."*

---

## 5. Workflows Multi-Job — Do Build→Push ao Pipeline Profissional

Na Aula 03, você criou um workflow com um único job que fazia checkout → login → build → push. Era um bom começo, mas tratava todas as etapas como um bloco monolítico. Agora vamos separar responsabilidades em **jobs distintos**, alguns paralelos e outros sequenciais.

### 5.1 Anatomia de um Workflow Multi-Job

Um workflow com múltiplos jobs permite que cada etapa do pipeline tenha seu próprio ambiente, logs e status. Olhe para a estrutura:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test

  build-and-push:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login no Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build e Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/app:latest
```

**O que mudou em relação ao workflow da Aula 03:**

| Característica | Workflow Aula 03 | Workflow Multi-Job |
|---|---|---|
| Número de jobs | 1 job monolítico | 3 jobs separados |
| Testes | Não executava | Job `test` dedicado |
| Lint | Não executava | Job `lint` dedicado |
| Dependências | Nenhuma | `build-and-push` depende de `lint` e `test` |
| Paralelismo | N/A | `lint` e `test` rodam em paralelo |

### 5.2 O Poder do `needs`

A palavra-chave `needs` define dependências entre jobs. Quando você escreve:

```yaml
build-and-push:
  needs: [lint, test]
```

está dizendo: "o job `build-and-push` só executa DEPOIS que `lint` E `test` terminarem com sucesso". Se qualquer um deles falhar, o pipeline para — a imagem não é construída.

O `needs` implementa o conceito de **gate automático** da Seção 2: os jobs `lint` e `test` rodam em paralelo, e o gate "todos passaram?" decide se o pipeline avança.

### 5.3 Passagem de Artefatos entre Jobs

Jobs executam em ambientes isolados — cada um recebe uma VM limpa do GitHub. Por padrão, um job não tem acesso aos arquivos gerados por outro job. Para compartilhar resultados (como o build de uma imagem), você usa **artefatos**:

```yaml
jobs:
  build:
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy:
    needs: [build]
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: ./deploy.sh
```

No contexto de Docker, o artefato principal é a **imagem** — e em vez de passar arquivos, você passa o nome e a tag da imagem que o job anterior já publicou no registry.

### Mão na Massa 5.1 — Seu Primeiro Workflow Multi-Job

Vamos transformar o workflow da Aula 03 em um pipeline com dois jobs paralelos (lint + test) e um job sequencial (build e push).

- [ ] No seu repositório, edite `.github/workflows/docker-build-push.yml` e substitua o conteúdo pelo YAML da Seção 5.1 acima
- [ ] Se você não tem scripts `lint` e `test` no `package.json`, adicione:
  ```json
  "scripts": {
    "lint": "echo 'Lint passou'",
    "test": "echo 'Testes passaram'"
  }
  ```
- [ ] Faça commit e push:
  ```bash
  git add .github/workflows/docker-build-push.yml
  git commit -m "ci: multi-job workflow with lint and test"
  git push
  ```
- [ ] Acesse a aba **Actions** e observe: os jobs `lint` e `test` rodam em paralelo (ambos com status 🟡 amarelo). Após ambos terminarem com ✅, o job `build-and-push` inicia automaticamente

**Verificação:** Na execução do workflow, você deve ver três jobs na página de detalhes. Os jobs `lint` e `test` aparecem lado a lado (paralelo). O job `build-and-push` só aparece depois que ambos terminam.

### Quick Check 5

**1. O que acontece se o job `test` falhar? O job `build-and-push` ainda executa?**
**Resposta:** Não. O `needs: [lint, test]` faz com que `build-and-push` só execute se AMBOS os jobs anteriores terminarem com sucesso. Se `test` falhar, o pipeline para e o status geral fica como "falhou". A imagem não é construída nem publicada.

**2. Por que jobs em paralelo (como `lint` e `test` juntos) economizam tempo?**
**Resposta:** Porque ambos executam simultaneamente em VMs separadas. Se cada um leva 2 minutos, o tempo total com paralelismo é 2 minutos (não 4). O workflow só espera o mais lento terminar. Isso é mais eficiente que executá-los em sequência.

---

## 6. GitHub Environments e Approval Gates

Agora vamos implementar o conceito de **ambientes isolados** (Seção 3) usando Environments do GitHub. Os environments permitem criar contextos separados com configuração, segredos e regras de proteção próprios.

### 6.1 Criando Environments no GitHub

Um **Environment** no GitHub é um contexto de deploy com configuração própria. Você pode criar ambientes como `staging` e `production`, cada um com:

- **Secrets específicos**: o token de acesso ao banco de staging é diferente do token de produção
- **Regras de proteção**: quem pode aprovar, de qual branch o deploy é permitido
- **Histórico de deploys**: cada deploy fica registrado com timestamp e usuário

**Mão na Massa 6.1 — Criar environments no GitHub:**

- [ ] Acesse seu repositório no GitHub → **Settings** → **Environments**
- [ ] Clique em **New environment** e crie `staging`:
  - **Environment name:** `staging`
  - **Required reviewers:** deixe vazio (deploy automático para staging)
  - **Wait timer:** 0 minutos
  - **Branch restrictions:** deixe vazio (qualquer branch pode fazer deploy para staging)
- [ ] Clique em **Configure environment**
- [ ] Repita o processo para criar `production`:
  - **Environment name:** `production`
  - **Required reviewers:** adicione seu próprio usuário do GitHub
  - **Wait timer:** 5 minutos (tempo para cancelar se algo errado)
  - **Branch restrictions:** selecione apenas `main`

**O que você acabou de configurar:**

| Ambiente | Deploy automático | Precisa de aprovação | Branch permitida |
|---|---|---|---|
| staging | Sim | Não | Qualquer branch |
| production | Não | Sim (você + 5 min de espera) | Apenas main |

### 6.2 Secrets por Environment

Agora que os ambientes existem, você pode configurar secrets diferentes para cada um:

- [ ] No environment `staging`, adicione:
  - `STAGING_API_URL`: `https://staging.meuapp.com`
- [ ] No environment `production`, adicione:
  - `PRODUCTION_API_URL`: `https://meuapp.com`
  - `DEPLOY_KEY`: sua chave SSH de produção (se aplicável)

**Por que isso importa:** se um secret de staging vazar, o impacto é limitado. O token de produção fica isolado em seu próprio ambiente, visível apenas para deploys aprovados na branch `main`.

### 6.3 Deploy com Environment no Workflow

Para referenciar um environment no workflow, use a chave `environment`:

```yaml
deploy-staging:
  runs-on: ubuntu-latest
  needs: [build-and-push]
  environment:
    name: staging
    url: https://staging.meuapp.com
  steps:
    - name: Deploy para Staging
      run: echo "Deploying to staging..."
      # Aqui você executaria docker pull + docker run na sua VM de staging
```

A chave `environment.name` diz ao GitHub: "este job pertence ao ambiente `staging`". Com isso:

1. Os secrets do ambiente `staging` ficam disponíveis para o job
2. O deploy fica registrado no histórico do ambiente
3. As regras de proteção do ambiente são aplicadas

Para o ambiente `production`, que tem **required reviewers**, o workflow pausa automaticamente até que alguém aprove:

```yaml
deploy-production:
  runs-on: ubuntu-latest
  needs: [deploy-staging]
  environment:
    name: production
    url: https://meuapp.com
  steps:
    - name: Deploy para Producao
      run: echo "Deploying to production..."
```

Quando este job atinge o ponto de execução, o GitHub Actions gera uma **revisão de deploy** — alguém com permissão precisa clicar em "Approve and deploy" na interface do GitHub. Durante o wait timer (5 minutos, conforme configurado), o deploy pode ser cancelado.

### Quick Check 6

**1. Qual a vantagem de ter secrets diferentes por environment em vez de um único conjunto global?**
**Resposta:** Isolamento de risco. Se um secret de staging vazar, o impacto é limitado ao ambiente de staging. O secret de produção (mais sensível) não é exposto e permanece protegido por approval gates adicionais.

**2. O que acontece quando um job referencia um environment com required reviewers?**
**Resposta:** O workflow pausa automaticamente antes de executar o job. Uma notificação é enviada aos reviewers configurados. Alguém precisa acessar a interface do GitHub e aprovar o deploy. Só então o job executa.

---

## 7. Testes Automatizados e Cache de Camadas Docker

Na Aula 03, seu workflow buildava e publicava a imagem sem testar o código. Vamos corrigir isso: agora os testes rodam **antes** do build, e só se passarem a imagem é publicada. Além disso, vamos acelerar os builds com **cache de camadas Docker**.

### 7.1 Integrando Jest e Supertest no Pipeline

Sua API Express (construída nas Aulas 01-02) tem testes com Jest e supertest. O workflow precisa:

1. Instalar dependências (`npm ci`)
2. Subir a stack com Docker Compose (se o teste precisar de banco)
3. Executar os testes (`npm test`)
4. Só então construir e publicar a imagem

Aqui está o job `test` completo:

```yaml
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_DB: myapp_test
        POSTGRES_USER: myapp
        POSTGRES_PASSWORD: myapp
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
    - run: npm ci
    - run: npm test
      env:
        DATABASE_URL: postgresql://myapp:myapp@localhost:5432/myapp_test
```

**O que está acontecendo:**

1. **`services`**: o GitHub Actions provisiona um container PostgreSQL como serviço auxiliar, disponível durante todo o job. É como um `docker compose up` automático para dependências.
2. **`npm ci`**: instala dependências exatas do `package-lock.json` — mais rápido e determinístico que `npm install`.
3. **`npm test`**: executa os testes. Se falhar (exit code != 0), o job falha e o pipeline para.
4. **`env` no step**: variáveis de ambiente específicas do step, sem poluir outros steps.

### 7.2 Lógica Condicional com `if`

Você pode usar `if` para executar steps apenas em condições específicas:

```yaml
- name: Notify on failure
  if: failure()
  run: echo "Pipeline falhou!"
```

Os operadores disponíveis:

| Expressão | Quando é verdadeira |
|---|---|
| `success()` | Todos os steps anteriores deste job terminaram sem erro |
| `failure()` | Pelo menos um step anterior deste job falhou |
| `always()` | Sempre, independente do resultado |
| `cancelled()` | O workflow foi cancelado |

O uso mais comum no pipeline Docker é **só publicar a imagem se os testes passarem** — e isso já é garantido pelo `needs: [lint, test]` que vimos na Seção 5.

### 7.3 Cache de Camadas Docker

Um dos maiores gargalos em pipelines CI/CD é o tempo de build da imagem Docker. A cada execução, o Docker baixa camadas de base, instala dependências e constrói a aplicação do zero. **Cache de camadas** resolve isso.

O `docker/build-push-action@v5` suporta cache nativo:

```yaml
- name: Build e Push com Cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ secrets.DOCKERHUB_USERNAME }}/app:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Explicação:**

- **`cache-from: type=gha`**: tenta restaurar camadas cacheadas de execuções anteriores do GitHub Actions (armazenadas no cache do GitHub)
- **`cache-to: type=gha,mode=max`**: ao final do build, salva as camadas no cache (modo `max` armazena todas as camadas, não apenas as finais)

O resultado: na primeira execução, o build leva o tempo normal. Na segunda, **as camadas não alteradas são reutilizadas** — a instalação de dependências (que raramente muda) é instantânea.

**Alternativa: cache inline na imagem**

```yaml
cache-from: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/app:cache
cache-to: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/app:cache,mode=max
```

Este método armazena o cache **no próprio Docker Hub** como uma tag especial `:cache`. Útil quando você quer compartilhar cache entre diferentes runners ou ambientes.

### Mão na Massa 7.1 — Adicionar Testes e Cache

- [ ] Verifique se seu `package.json` tem o script `test` configurado:
  ```json
  "scripts": {
    "test": "jest --passWithNoTests"
  }
  ```
- [ ] Instale jest e supertest como devDependencies (se ainda não tiver):
  ```bash
  npm install --save-dev jest supertest
  ```
- [ ] Crie um teste básico em `tests/api.test.js`:
  ```javascript
  const request = require('supertest');
  const app = require('../server');
  
  describe('API Health', () => {
    it('GET /health deve retornar 200', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
    });
  });
  ```
- [ ] Atualize o workflow para incluir o job `test` com serviço PostgreSQL e cache conforme os exemplos acima
- [ ] Faça commit, push e veja o pipeline rodar com testes + cache

**Verificação:** Na aba Actions, o job `test` mostra "Tests passed: 1" no output. O step de build mostra "Exporting cache" ao final. Execuções subsequentes mostram "Importing cache" no início do build.

### Quick Check 7

**1. O que acontece se os testes falharem? A imagem ainda é publicada?**
**Resposta:** Não. O job `build-and-push` tem `needs: [lint, test]`. Se `test` falhar, `build-and-push` não executa. A imagem não é construída nem publicada. O código com defeito não chega ao registry.

**2. Qual a diferença entre `cache-from: type=gha` e `cache-from: type=registry`?**
**Resposta:** `type=gha` armazena o cache nos servidores do GitHub Actions (rápido, mas vinculado ao repositório). `type=registry` armazena no Docker Hub como uma tag `:cache` (portátil entre runners, mas um pouco mais lento). Ambos reutilizam camadas do build anterior.

---

## 8. Deploy Multi-Ambiente — De Staging a Produção

Agora vamos juntar tudo: o workflow multi-job, os environments com approval gates, os testes e o cache. O resultado é um pipeline que promove a imagem de staging para produção **apenas após aprovação manual**.

### 8.1 O Fluxo Completo

![Diagrama: Fluxo completo do CI/CD — do push ao deploy em produção](images/diagrama-03-sequence.png)


Diagrama: do `git push` ao deploy em produção, passando por testes automáticos, gate de staging e aprovação manual.

### 8.2 O Workflow Completo

Aqui está o pipeline completo que integra todos os conceitos:

```yaml
name: CI/CD Pipeline Completo

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKERHUB_USERNAME }}/app

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: myapp_test
          POSTGRES_USER: myapp
          POSTGRES_PASSWORD: myapp
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://myapp:myapp@localhost:5432/myapp_test

  build-and-push:
    needs: [lint, test]
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Extrair versao do package.json
        id: version
        run: echo "version=$(jq -r '.version' package.json)" >> $GITHUB_OUTPUT
      
      - name: Login no Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build e Push (staging + version)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }}
            ${{ env.IMAGE_NAME }}:staging
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: [build-and-push]
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.meuapp.com
    steps:
      - name: Deploy para Staging
        run: |
          echo "Deploying version ${{ needs.build-and-push.outputs.version }} para staging"
          echo "docker pull ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }}"
          echo "docker tag ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }} ${{ env.IMAGE_NAME }}:staging"
          echo "Deploy executado com sucesso"

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://meuapp.com
    steps:
      - name: Deploy para Producao
        run: |
          echo "Deploying version ${{ needs.build-and-push.outputs.version }} para producao"
          echo "docker pull ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }}"
          echo "docker tag ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }} ${{ env.IMAGE_NAME }}:production"
          echo "Deploy executado com sucesso"
```

### 8.3 O Que Este Workflow Faz, Passo a Passo

1. **Evento**: `git push` na `main` dispara o workflow
2. **`lint`**: executa linter em paralelo com testes
3. **`test`**: sobe PostgreSQL como serviço auxiliar, executa `npm test`
4. **Gate automático**: ambos precisam passar
5. **`build-and-push`**: extrai versão do `package.json`, faz build com cache, publica com tags `:versao` e `:staging`
6. **`deploy-staging`**: deploy automático para staging (sem approval, sem restrição de branch)
7. **Gate manual**: o workflow pausa — alguém precisa aprovar o deploy
8. **`deploy-production`**: após aprovação, deploy para produção (apenas branch `main`, com required reviewers)

### Mão na Massa 8.1 — Pipeline Multi-Ambiente

- [ ] Crie os environments `staging` e `production` no GitHub (Settings → Environments) conforme Seção 6.1
- [ ] Substitua o conteúdo do seu `.github/workflows/docker-build-push.yml` pelo workflow completo da Seção 8.2
- [ ] Faça commit e push:
  ```bash
  git add .
  git commit -m "ci: full multi-environment pipeline"
  git push
  ```
- [ ] Acesse a aba Actions e acompanhe o pipeline:
  1. `lint` e `test` rodam em paralelo ✅
  2. `build-and-push` executa com cache ✅
  3. `deploy-staging` executa automaticamente ✅
  4. O workflow pausa em `deploy-production` 🟡
- [ ] Para aprovar o deploy de produção:
  - Vá na execução do workflow
  - Clique em **Review deployments**
  - Selecione `production` e clique em **Approve and deploy**
- [ ] Observe `deploy-production` executar após a aprovação

**Verificação:** O workflow completo deve executar todos os jobs em ordem. O deploy de produção fica pausado aguardando aprovação. Após aprovar, o deploy executa e o pipeline conclui com status verde.

### Quick Check 8

**1. Por que o deploy para staging é automático, mas o deploy para produção requer aprovação manual?**
**Resposta:** Staging é um ambiente interno de validação — deploys frequentes e automáticos são desejáveis para testar cada alteração. Produção impacta usuários reais e requer validação adicional (revisão de código, testes em staging, aprovação explícita). O approval gate é o controle que impede que código não validado chegue aos usuários.

**2. O que acontece se alguém rejeitar o deploy para produção?**
**Resposta:** O workflow é marcado como "cancelado" para aquele ambiente. O job `deploy-production` não executa. A imagem permanece no Docker Hub com a tag `:staging` — disponível para investigação, mas não em produção. O desenvolvedor pode corrigir o código e fazer um novo push.

---

## 9. Estratégia de Versionamento Automatizado

Tags de imagem como `:latest` são práticas para desenvolvimento, mas insuficientes para rastreabilidade. Um pipeline profissional precisa de **versionamento automático** que extraia a versão do código e a aplique consistentemente.

### 9.1 Extraindo a Versão do package.json

A fonte da verdade para a versão da sua aplicação Node.js é o campo `version` no `package.json`:

```json
{
  "name": "myapp",
  "version": "1.2.3",
  "description": "API Express containerizada"
}
```

Para extrair este valor no pipeline, use `jq`:

```yaml
- name: Extrair versao do package.json
  id: version
  run: echo "version=$(jq -r '.version' package.json)" >> $GITHUB_OUTPUT
```

O `jq -r '.version' package.json` lê o campo `version` e retorna o valor sem aspas. O resultado é armazenado no output do step (`id: version`), que pode ser referenciado em steps posteriores como `${{ steps.version.outputs.version }}`.

### 9.2 Versionamento com Git Tags

Uma alternativa mais robusta é usar **git tags** como fonte da versão:

```yaml
- name: Extrair versao da git tag
  id: version
  run: |
    GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0")
    echo "version=$GIT_TAG" >> $GITHUB_OUTPUT
```

Vantagens das git tags:
- A versão é imutável — uma vez criada, não muda
- O histórico de tags no git é o histórico de releases
- Ferramentas como `npm version` criam tags automaticamente

### 9.3 Tags Múltiplas no Build

Com a versão extraída, você pode gerar múltiplas tags para a imagem Docker:

```yaml
- name: Build e Push com multiplas tags
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: |
      ${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }}
      ${{ env.IMAGE_NAME }}:staging
      ${{ env.IMAGE_NAME }}:latest
```

**Estratégia de tags:**

| Tag | Propósito | Mutável? |
|---|---|---|
| `app:1.2.3` | Versão exata — rastreável | Não |
| `app:staging` | Aponta para a versão atual em staging | Sim |
| `app:production` | Aponta para a versão atual em produção | Sim |
| `app:latest` | Última versão buildada | Sim |

As tags mutáveis (`:staging`, `:production`, `:latest`) são atualizadas a cada deploy. As tags SemVer (`:1.2.3`) permanecem imutáveis — você sempre pode voltar e puxar a versão exata que estava rodando em produção na semana passada.

### Mão na Massa 9.1 — Versionamento Automatizado

- [ ] Verifique se seu `package.json` tem o campo `version` preenchido (ex: `"version": "1.0.0"`)
- [ ] Certifique-se de ter `jq` instalado localmente (e no CI, o GitHub Actions já tem `jq` pré-instalado nas VMs Ubuntu)
- [ ] Adicione o step de extração de versão ao job `build-and-push` no seu workflow (conforme exemplo da Seção 8.2)
- [ ] Atualize as tags do build para incluir `${{ steps.version.outputs.version }}`
- [ ] Incremente a versão no `package.json`:
  ```bash
  npm version patch  # 1.0.0 → 1.0.1
  ```
- [ ] Faça commit e push:
  ```bash
  git add .
  git commit -m "chore: bump version to 1.0.1"
  git push
  ```
- [ ] Verifique no Docker Hub (ou console do CI) que a imagem foi publicada com as tags `1.0.1`, `staging` e `latest`

**Verificação:** No Docker Hub, seu repositório deve mostrar as tags: `1.0.0` (da execução anterior), `1.0.1`, `staging` e `latest`. A tag `1.0.1` aponta para o digest da build mais recente.

### Quick Check 9

**1. Por que é importante extrair a versão do código em vez de hardcodá-la no YAML do workflow?**
**Resposta:** Para garantir que a versão da imagem Docker corresponda exatamente à versão do código que a gerou. Se a versão estiver hardcoded no YAML, é fácil esquecer de atualizá-la, resultando em tags incorretas. A extração automática elimina erro humano e garante rastreabilidade.

**2. Qual a diferença entre a tag `:staging` e a tag `:1.2.3`?**
**Resposta:** `:staging` é uma tag mutável que sempre aponta para a versão atualmente em staging. Ela é sobrescrita a cada deploy. `:1.2.3` é uma tag imutável que sempre referencia aquela versão específica — você pode voltar a ela meses depois e saber exatamente o que estava rodando.

---

## Autoavaliação: Quiz Rápido

**1. Qual a diferença entre CI e CD no contexto de pipelines automatizados?**
**Resposta:** CI (Continuous Integration) testa e builda o código automaticamente a cada push. CD (Continuous Delivery) publica o artefato no registry. CI responde "o código está íntegro?"; CD responde "o artefato está disponível para deploy?".

**2. Em um pipeline multi-job, como você garante que o job de build só execute depois que os jobs de teste terminarem com sucesso?**
**Resposta:** Usando `needs: [test, lint]` no job de build. O GitHub Actions verifica se todos os jobs listados em `needs` terminaram com sucesso antes de iniciar o job dependente.

**3. Qual a vantagem de usar GitHub Environments separados para staging e production?**
**Resposta:** Isolamento de configurações (secrets diferentes), regras de proteção independentes (staging: deploy automático; production: requer aprovação) e rastreibilidade (histórico de deploys por ambiente).

**4. O que significa `cache-from: type=gha` no `docker/build-push-action`?**
**Resposta:** Significa que o build deve tentar restaurar camadas cacheadas de execuções anteriores usando o cache interno do GitHub Actions. Isso acelera builds subsequentes porque camadas não alteradas são reutilizadas.

**5. Como extrair a versão do `package.json` dentro de um workflow GitHub Actions?**
**Resposta:** Com o comando: `echo "version=$(jq -r '.version' package.json)" >> $GITHUB_OUTPUT`. Isso lê o campo `version`, armazena no output do step e permite referência como `${{ steps.version.outputs.version }}`.

**6. O que acontece com o workflow quando um job referencia um environment que tem required reviewers configurados?**
**Resposta:** O workflow pausa automaticamente antes de executar aquele job. Uma notificação de "review de deploy" é enviada. O job só executa depois que um reviewer aprovar na interface do GitHub.

**7. Por que jobs em paralelo economizam tempo no pipeline?**
**Resposta:** Porque executam simultaneamente em ambientes separados. O tempo total do pipeline é determinado pelo job mais lento, não pela soma de todos os jobs. Dois jobs de 2 minutos em paralelo terminam em 2 minutos, não em 4.

**8. Qual a diferença entre um secret e uma variável de ambiente no contexto de CI/CD?**
**Resposta:** Secrets são valores sensíveis criptografados (senhas, tokens) que nunca aparecem em logs. Variáveis de ambiente (vars) são configurações não-sensiveis (URLs, portas) que podem ser exibidas com segurança. Secrets têm requisitos de rotação e proteção adicionais.

---

## Mão na Massa: Exercícios Graduados

**Exercício 1 (Fácil) — Criar um Workflow com 2 Jobs Sequenciais**

Partindo do workflow simples da Aula 03 (1 job de build→push), crie um novo workflow com **2 jobs sequenciais**: `test` e `build-and-push`. O job `test` deve executar `npm test` (ou um echo se não tiver testes), e o job `build-and-push` depende de `test` (`needs: [test]`).

**Passos:**
- [ ] Crie o arquivo `.github/workflows/ci-cd.yml` com 2 jobs
- [ ] O job `test` deve rodar `npm ci` e `npm test`
- [ ] O job `build-and-push` deve ter `needs: [test]`
- [ ] Adicione ação `docker/login-action@v3` e `docker/build-push-action@v5` no segundo job
- [ ] Faça commit e push, verifique na aba Actions que o job `test` executa primeiro e `build-and-push` só depois

**Gabarito:**

```yaml
name: CI/CD 2 Jobs

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test

  build-and-push:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/app:latest
```

O workflow executa `test` primeiro. Se `npm test` falhar, `build-and-push` não executa. A imagem só é publicada com código que passou nos testes.

---

**Exercício 2 (Médio) — Adicionar Cache e Testes com PostgreSQL**

Partindo do workflow multi-job do Exercício 1, adicione:
1. **Serviço PostgreSQL** no job `test` (usando `services:`)
2. **Cache de camadas Docker** no job `build-and-push`
3. **Tags múltiplas** (`:versao` + `:latest`) usando extração de versão do `package.json`

**Passos:**
- [ ] Adicione `services: postgres:16-alpine` no job `test` com healthcheck
- [ ] Passe `DATABASE_URL` como env para o step de teste
- [ ] No job `build-and-push`, adicione step para extrair versão com `jq`
- [ ] Configure `cache-from: type=gha` e `cache-to: type=gha,mode=max`
- [ ] Publique com tags `${{ steps.version.outputs.version }}` e `latest`

**Gabarito:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: myapp_test
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/myapp_test

  build-and-push:
    needs: [test]
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - name: Extrair versao
        id: version
        run: echo "version=$(jq -r '.version' package.json)" >> $GITHUB_OUTPUT
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/app:${{ steps.version.outputs.version }}
            ${{ secrets.DOCKERHUB_USERNAME }}/app:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

A cada push, os testes rodam contra um PostgreSQL real, a versão é extraída automaticamente, o build usa cache e a imagem é publicada com duas tags.

---

**Desafio (Difícil) — Pipeline Multi-Ambiente Completo com Approval Gates**

Construa um workflow completo que implemente:

1. **3 jobs paralelos**: `lint`, `test` (com PostgreSQL), `security-scan` (simulado com `echo`)
2. **Gate automático**: todos os 3 precisam passar
3. **Job `build-and-push`**: com cache, extração de versão, tags `:versao` e `:staging`
4. **Job `deploy-staging`**: deploy automático para o environment `staging`
5. **Gate manual**: environment `production` com required reviewers e 2 minutos de wait timer
6. **Job `deploy-production`**: deploy para produção com tag `:production`
7. **Saída**: ao final, os outputs do workflow devem mostrar qual versão foi deployada em cada ambiente

**Gabarito:**

```yaml
name: Pipeline Completo com Aprovacao

on:
  push:
    branches: [ main ]

env:
  IMAGE_NAME: ${{ secrets.DOCKERHUB_USERNAME }}/app

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: myapp_test
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/myapp_test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Simular scan de seguranca
        run: |
          echo "Executando scan de vulnerabilidades..."
          echo "0 vulnerabilidades encontradas"

  build-and-push:
    needs: [lint, test, security-scan]
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - name: Extrair versao
        id: version
        run: echo "version=$(jq -r '.version' package.json)" >> $GITHUB_OUTPUT
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }}
            ${{ env.IMAGE_NAME }}:staging
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: [build-and-push]
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.meuapp.com
    steps:
      - name: Deploy para Staging
        run: |
          echo "Deployando versao ${{ needs.build-and-push.outputs.version }} para staging"
          echo "docker pull ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }}"
          echo "docker tag ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }} ${{ env.IMAGE_NAME }}:staging"
          echo "Deploy concluido"

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://meuapp.com
    steps:
      - name: Deploy para Producao
        run: |
          echo "Deployando versao ${{ needs.build-and-push.outputs.version }} para producao"
          echo "docker pull ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }}"
          echo "docker tag ${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.version }} ${{ env.IMAGE_NAME }}:production"
          echo "Deploy concluido"
```

**Premissas do gabarito:** O environment `production` deve estar configurado no GitHub com required reviewers (seu usuário) e wait timer de 2 minutos. O environment `staging` deve estar configurado sem proteções. O script `lint` e `test` devem existir no `package.json`. O `jq` está disponível na VM do GitHub Actions.

---

## Resumo da Aula

### Os 9 Conceitos Fundamentais

1. **Pipeline Orientado a Eventos**: pipelines CI/CD são automatizações disparadas por eventos do repositório (push, PR, schedule). Cada evento pode desencadear uma sequência de ações coordenadas.
2. **Stages, Jobs e Gates**: um pipeline se estrutura em estágios com jobs paralelos ou sequenciais. Gates (automáticos ou manuais) controlam o avanço entre estágios, funcionando como portões de qualidade.
3. **Ambientes Isolados**: staging e production são contextos separados com configuração, segredos e regras de proteção próprios. A mesma imagem buildada é promovida entre eles.
4. **Secrets vs Vars**: secrets armazenam dados sensíveis (senhas, tokens) criptografados e injetados em runtime. Vars contêm configuração não-sensível (URLs, portas). Secrets nunca aparecem em logs.
5. **Workflows Multi-Job**: `needs` define dependências entre jobs. Jobs paralelos economizam tempo. Artefatos permitem compartilhar resultados entre jobs.
6. **GitHub Environments**: environments no GitHub implementam ambientes com secrets específicos, required reviewers, wait timers e restrição de branches.
7. **Testes no Pipeline**: serviços auxiliares (PostgreSQL) sobem automaticamente no CI. Testes com Jest + supertest validam o código antes do build. `if: failure()` permite ações condicionais.
8. **Cache de Camadas Docker**: `cache-from` e `cache-to` reutilizam camadas de builds anteriores, reduzindo o tempo de build de minutos para segundos. Suporta cache via GitHub Actions (`type=gha`) ou registry (`type=registry`).
9. **Versionamento Automatizado**: extrair a versão do `package.json` com `jq` garante que a tag Docker corresponda exatamente à versão do código. Tags SemVer são imutáveis; tags de ambiente (`:staging`, `:production`) são mutáveis e promovidas.

### O Que Você Construiu Hoje

- [x] Entendimento dos mecanismos universais de pipelines CI/CD (eventos, stages, gates, ambientes, secrets)
- [x] Workflow multi-job com jobs paralelos (lint + test) e sequenciais (build → push)
- [x] Environments `staging` e `production` configurados no GitHub com regras de proteção
- [x] Secrets específicos por ambiente no GitHub
- [x] Testes automatizados com Jest + supertest integrados ao pipeline
- [x] Cache de camadas Docker com `cache-from`/`cache-to`
- [x] Pipeline completo de deploy multi-ambiente (build → staging → approval → production)
- [x] Versionamento automatizado extraindo versão do `package.json`
- [x] Tags múltiplas na imagem Docker (SemVer + staging + latest)

---

## Próxima Aula

**Aula 05: Docker Swarm — Orquestração Nativa em Cluster**

Seu pipeline CI/CD entrega imagens no Docker Hub automaticamente. Mas quem executa essas imagens em produção com alta disponibilidade? O Docker Swarm. Na Aula 05, você vai subir um cluster Swarm com managers e workers, implantar sua stack como `docker stack deploy` e executar rolling updates sem downtime. Do pipeline ao cluster — a próxima fronteira da containerização.

---

## Referências

### Documentação Oficial

- [GitHub Actions Documentation](https://docs.github.com/en/actions) — documentação oficial completa
- [GitHub Actions — Workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions) — referência de sintaxe YAML
- [GitHub Actions — Environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) — gerenciamento de environments
- [GitHub Actions — Using secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) — uso de secrets no GitHub

### Actions do GitHub Marketplace

- [docker/login-action](https://github.com/docker/login-action) — login no Docker Hub
- [docker/build-push-action](https://github.com/docker/build-push-action) — build e push com cache
- [docker/metadata-action](https://github.com/docker/metadata-action) — geração de tags e labels
- [actions/checkout](https://github.com/actions/checkout) — checkout do repositório
- [actions/setup-node](https://github.com/actions/setup-node) — configuração do Node.js
- [actions/upload-artifact](https://github.com/actions/upload-artifact) — upload de artefatos entre jobs
- [actions/cache](https://github.com/actions/cache) — cache auxiliar

### Docker e CI/CD

- [Docker CI/CD com GitHub Actions](https://docs.docker.com/ci-cd/github-actions/) — guia oficial Docker
- [Docker Buildx](https://docs.docker.com/build/buildx/) — build multi-plataforma
- [Cache de camadas Docker](https://docs.docker.com/build/cache/) — estratégias de cache

### Ferramentas

- [jq](https://jqlang.github.io/jq/) — processador JSON de linha de comando
- [Jest](https://jestjs.io/) — framework de testes JavaScript
- [Supertest](https://github.com/ladjs/supertest) — testes HTTP para Express

### Artigos para Aprofundamento

- [GitHub Actions — Security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) — boas práticas de segurança em workflows
- [Docker Build Cache — In-depth](https://docs.docker.com/build/cache/) — aprofundamento em cache de build
- [SemVer Specification](https://semver.org/) — especificação oficial do versionamento semântico

### Vídeos Recomendados

- [Como Criar Pipeline Docker CI com Github Actions (Caindo na Rede)](https://www.youtube.com/watch?v=4j3iL0iZAqk) — pipeline CI/CD com Docker em português (~20 min)
- [Tutorial Pipeline de CI/CD com GitHub Actions (Fernanda Kipper)](https://www.youtube.com/watch?v=df_WMXk7JxE) — automatize seus deploys com GitHub Actions (~30 min)

---

## FAQ

**P: Meu workflow multi-job está falhando com "Error: .github/workflows/ci-cd.yml (Line: X, Col: Y) — mapping values are not allowed here". O que fazer?**
R: Provavelmente um erro de indentação YAML. O GitHub Actions é rigoroso com indentação — use 2 espaços, nunca tabs. Verifique se todos os `steps:` estão alinhados corretamente sob `jobs:`, e se os arrays como `tags: |` estão com indentação consistente.

**P: Posso usar `docker compose` dentro do GitHub Actions em vez de `services:`?**
R: Sim. Você pode instalar Docker Compose no runner e usar `docker compose up` normalmente. A abordagem `services:` é mais integrada (o GitHub gerencia o ciclo de vida do container), mas menos flexível. Prefira `services:` para dependências simples (banco de dados) e `docker compose` para stacks mais complexas.

**P: Como faço para debugar um workflow que está falhando sem fazer push a cada tentativa?**
R: Use `act` (https://github.com/nektos/act) — uma ferramenta que executa workflows GitHub Actions localmente. Instale com `curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash` e execute `act push` no diretório do repositório. Você vê os logs localmente sem precisar de push.
*(Dica de segurança: leia o script antes com `curl -sL URL | less` ou instale via gerenciador de pacotes: `brew install act` no macOS, ou baixe o binário das GitHub Releases.)*

**P: O cache de camadas Docker está funcionando? Como verificar?**
R: Nos logs do step de build, procure por "Importing cache" no início (confirmando que o cache foi restaurado) e "Exporting cache" ao final (salvando o cache atualizado). Se você não vê "Importing cache" na segunda execução, verifique se `cache-from: type=gha` está configurado corretamente.

**P: Preciso configurar algo no Docker Hub para o cache via registry funcionar?**
R: Sim, o cache via registry (`type=registry`) requer que você tenha uma tag especial `:cache` no seu repositório do Docker Hub. O push da tag `:cache` será feito automaticamente pelo `cache-to`. Certifique-se de que o token do Docker Hub tem permissão de escrita.

**P: O approval gate do environment production não aparece. O que pode ser?**
R: Verifique: (1) o environment `production` existe em Settings → Environments; (2) Required reviewers está configurado com pelo menos um usuário; (3) o job no workflow referencia `environment: name: production`; (4) o usuário que está vendo o workflow tem permissão para ver o ambiente (se você criou o ambiente, você é o administrador).

**P: Como faço para que o deploy de staging só aconteça se a branch for `main`?**
R: Adicione `if: github.ref == 'refs/heads/main'` no job `deploy-staging`. Isso garante que apenas pushes na branch main disparem o deploy para staging. Para outras branches, o pipeline executa testes e build, mas não faz deploy.

**P: Meu `npm ci` está falhando com "The lockfile is not up to date". O que significa?**
R: Significa que o `package.json` foi alterado sem atualizar o `package-lock.json`. Execute `npm install` localmente para atualizar o lockfile, commite ambos os arquivos, e faça push novamente. O `npm ci` exige que o lockfile esteja sincronizado com o `package.json`.

**P: Posso usar o mesmo workflow para fazer deploy em múltiplos ambientes com uma matriz (matrix)?**
R: Sim. Use `strategy: matrix` com uma lista de ambientes: `environment: [staging, production]`. Mas lembre-se que production geralmente requer approval gate, então você precisará de lógica condicional para adicionar o approval apenas no ambiente production. Uma abordagem mais clara é usar jobs separados como vimos nesta aula.

**P: O `jq` está disponível no GitHub Actions por padrão?**
R: Sim. As VMs `ubuntu-latest` do GitHub Actions já têm `jq` pré-instalado. Você não precisa instalar. Se estiver usando um runner auto-hospedado (self-hosted), instale com `sudo apt install -y jq`.

---

## Glossário

| Termo | Definição |
|---|---|
| **Ambiente** (*environment*) | Contexto isolado de execução com configuração, secrets e regras de proteção próprios (ex: staging, production) |
| **Approval gate** | Ponto no pipeline que requer autorização manual antes de prosseguir (Seção 6) |
| **Artefato** | Arquivo ou conjunto de arquivos gerado por um job e compartilhado com outros jobs via upload/download (Seção 5) |
| **Cache de camadas** | Técnica que reutiliza camadas Docker de builds anteriores para acelerar novos builds (Seção 7) |
| **CI** (Continuous Integration) | Prática de integrar, testar e buildar o código automaticamente a cada push (Seção 1) |
| **CD** (Continuous Delivery) | Prática de publicar o artefato (imagem Docker) no registry após o CI passar (Seção 1) |
| **Environment** (GitHub) | Recurso do GitHub que agrupa configuração, secrets e regras de proteção para um contexto de deploy (Seção 6) |
| **Gate** | Verificação (automática ou manual) que decide se o pipeline pode avançar para o próximo estágio (Seção 2) |
| **Gatilho** (*trigger*) | Evento que inicia a execução de um pipeline (push, PR, schedule, workflow_dispatch) (Seção 1) |
| **Job** | Unidade de trabalho em um pipeline, executada em um ambiente isolado (Seção 2) |
| **jq** | Processador JSON de linha de comando, usado para extrair dados de arquivos JSON (Seção 9) |
| **Matrix** | Estratégia do GitHub Actions que executa um job múltiplas vezes com diferentes combinações de parâmetros |
| **Needs** | Palavra-chave do GitHub Actions que define dependências entre jobs (Seção 5) |
| **Required reviewers** | Configuração de environment que exige aprovação explícita de usuários autorizados antes do deploy (Seção 6) |
| **Runner** | Ambiente (VM ou máquina física) onde os jobs do GitHub Actions executam |
| **Secret** | Valor sensível criptografado (senha, token, chave) armazenado no GitHub e injetado no pipeline em runtime (Seção 4) |
| **Service** (GitHub Actions) | Container auxiliar provisionado pelo GitHub durante a execução de um job (Seção 7) |
| **Stage** (*estágio*) | Fase lógica do pipeline composta por um ou mais jobs (ex: build, test, deploy) (Seção 2) |
| **Step** | Unidade mínima de execução em um job — um comando ou ação (Seção 5) |
| **Var** | Variável de configuração não-sensível (URL, porta, flag) que pode ser exibida em logs (Seção 4) |
| **Wait timer** | Tempo de espera configurado em um environment antes do deploy ser executado (Seção 6) |
| **Webhook** | Notificação HTTP enviada por um serviço (ex: GitHub) para outro (ex: CI/CD) quando um evento ocorre (Seção 1) |
