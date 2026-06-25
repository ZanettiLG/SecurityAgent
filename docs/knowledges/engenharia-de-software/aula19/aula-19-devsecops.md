---
titulo: "Aula 19: DevSecOps — Segurança no Pipeline + 🤖 Agent Perspective"
modulo: "Engenharia de Software"
aula: 19
slug: "devsecops"
duracao_estimada: "90 minutos"
nivel: "intermediario"
tags: [devsecops, shift-left, owasp, codeql, dependabot, sast, container-security, agent-perspective]
data: 2026-06-20
---

# Engenharia de Software — Aula 19

## DevSecOps — Segurança no Pipeline + 🤖 Agent Perspective

**Duração:** 90 minutos | **Nível:** Intermediário | **Pré-requisitos:** Aulas 01-18 (especialmente Aula 18: CI/CD Pipeline)

---

## Objetivos de Aprendizagem

- [ ] **Explicar** o princípio de Shift-Left Security e por que corrigir vulnerabilidades no design custa 100x menos que em produção
- [ ] **Identificar** as 5 vulnerabilidades mais críticas do OWASP Top 10 em um código-fonte de e-commerce
- [ ] **Configurar** CodeQL em um workflow do GitHub Actions para análise SAST automática
- [ ] **Interpretar** alertas de segurança do CodeQL e corrigir SQL Injection, XSS e hardcoded secrets
- [ ] **Implementar** varredura de dependências com Dependabot e gerenciar PRs automáticos de correção
- [ ] **Gerenciar** segredos no pipeline usando GitHub Secrets e pre-commit hooks anti-vazamento
- [ ] **Construir** imagens Docker seguras com multi-stage builds e scanning com Trivy
- [ ] **Projetar** um prompt de agente de revisão de código focado em segurança
- [ ] **Analisar** um diff de código e identificar vulnerabilidades classificando por severidade

---

## Como Usar Esta Aula

Esta aula tem duas partes bem definidas. A Parte 1 apresenta os fundamentos conceituais de segurança em pipelines — Shift-Left Security e OWASP Top 10 — sem depender de ferramentas específicas. A Parte 2 mostra a implementação prática com CodeQL, Dependabot, GitHub Secrets, container security e um agente de revisão de código. Os Quick Checks ao final de cada seção servem como autoavaliação. O Quiz, os Exercícios Graduados e o FAQ consolidam o aprendizado. O Glossário ao final reúne os termos técnicos usados ao longo da aula.

---

## Mapa Mental

```mermaid
mindmap
  root((DevSecOps))
    Shift-Left Security
      Custo exponencial de correção
      Design: 1x
      Desenvolvimento: 5x
      Testes: 10x
      Staging: 30x
      Produção: 100x
    OWASP Top 10
      A01 Broken Access Control
      A02 Cryptographic Failures
      A03 Injection
      A04 Insecure Design
      A05 Security Misconfiguration
    SAST com CodeQL
      GitHub Actions
      init Autobuild Analyze
      SQL Injection
      XSS
      Hardcoded Secrets
    Dependency Scanning
      Dependabot
      CVE PR automático
      Pipeline merge
    Secret Management
      GitHub Secrets
      env example
      pre-commit hooks
      Gitleaks
    Container Security
      Multi-stage builds
      Trivy scanner
      Non-root user
    Agent Perspective
      Agente revisor de código
      Checklist de segurança
      Findings por severidade
```

![Mapa mental do DevSecOps](images/aula-19-mindmap.png)

---

## Recapitulação das Aulas 01-18

| Aula | Conceito | Conexão com DevSecOps |
|---|---|---|
| 01-03 | Fundamentos de engenharia de software | Qualidade de código é base para segurança |
| 04-10 | Arquitetura e design de software | Insecure Design (A04) começa na arquitetura |
| 11-14 | Bancos de dados e APIs | SQL Injection (A03) ataca exatamente aqui |
| 15-17 | Git, branches e Pull Requests | PRs são o ponto de entrada para revisão de segurança |
| 18 | CI/CD Pipeline com GitHub Actions | Pipeline existente será estendido com gates de segurança |

> *O pipeline da Aula 18 tem lint, typecheck, testes e deploy. Nesta aula, você vai adicionar gates de segurança em cada estágio — transformando um pipeline CI/CD em um pipeline DevSecOps.*

---

> **FUNDAMENTOS:** Shift-Left Security e OWASP Top 10

> *Esta seção cobre os conceitos universais de segurança que valem para qualquer stack ou ferramenta. Entenda cada vulnerabilidade antes de passar para a implementação prática.*

---

## 1. Shift-Left Security

Shift-Left Security é a prática de mover atividades de segurança para estágios iniciais do ciclo de desenvolvimento — "para a esquerda" no fluxo de trabalho. A ideia central é simples: **detectar e corrigir vulnerabilidades cedo custa muito menos do que corrigir em produção.**

O custo de correção cresce exponencialmente conforme o código avança nas fases do projeto:

```mermaid
flowchart LR
  A["Design<br/>1x"] --> B["Dev<br/>5x"] --> C["Testes<br/>10x"] --> D["Staging<br/>30x"] --> E["Produção<br/>100x"]
```

Uma falha de segurança identificada durante o design exige apenas uma alteração no documento de especificação — custo mínimo. A mesma falha detectada em produção pode exigir hotfix urgente, comunicação com usuários afetados, análise forense, remediação de dados vazados e possíveis multas regulatórias.

### Analogia: Segurança de Aeroporto

Imagine um aeroporto que só faz revista de bagagem na porta do avião, depois que os passageiros já embarcaram. Se um item proibido for encontrado, o custo é altíssimo: atrasar o voo, descarregar toda a bagagem, refazer a segurança. É muito mais eficiente fazer a revista na entrada do terminal (shift-left), antes que o problema se propague.

No desenvolvimento de software, o "raio-X na entrada" é a análise de segurança no momento do commit e do Pull Request, não depois do deploy.

### Como o Shift-Left se aplica ao pipeline

Em um pipeline DevSecOps, cada estágio incorpora verificações de segurança:

| Estágio do Pipeline | Verificação de Segurança | Exemplo |
|---|---|---|
| Commit / IDE | Lint com regras de segurança | ESLint plugin-security |
| Pull Request | SAST + Dependency Scan | CodeQL + Dependabot |
| Build | Análise de containers | Trivy scan |
| Deploy | Secrets check + infra scan | Gitleaks + Checkov |
| Pós-deploy | Monitoramento + WAF | Log analysis |

### Quick Check 1

**1. O que significa "shiftar a segurança para a esquerda" no contexto de DevSecOps?**
**Resposta:** Significa mover verificações de segurança para estágios iniciais do desenvolvimento (design, codificação, commit) em vez de esperar até produção.

**2. Por que uma vulnerabilidade detectada no design custa menos que a mesma vulnerabilidade detectada em produção?**
**Resposta:** Porque no design a correção é conceitual (altera documentos); em produção exige hotfix, rollback, comunicação com usuários, análise forense e possíveis multas.

---

## 2. OWASP Top 10

O **OWASP Top 10** é uma lista publicada pela Open Web Application Security Project que classifica os riscos de segurança mais críticos para aplicações web. Atualizada periodicamente, ela serve como referência mínima para qualquer equipe de desenvolvimento.

Vamos focar nas 5 categorias mais relevantes para o contexto de um e-commerce (projeto que você vem construindo ao longo do módulo):

### A01: Broken Access Control

Ocorre quando um usuário consegue acessar recursos ou executar ações para as quais não tem permissão. É a vulnerabilidade mais comum e mais perigosa.

**Exemplo:** Um usuário comum acessa `/api/admin/users/123` e consegue ver dados de outros usuários porque o backend não verifica se quem faz a requisição é administrador.

**Por que importa:** Em um e-commerce, Broken Access Control permite que um comprador veja pedidos de outros clientes, acesse o painel administrativo ou modifique preços.

### A02: Cryptographic Failures

Antigamente chamada de "Sensitive Data Exposure", esta categoria abrange falhas relacionadas a criptografia: dados trafegados sem HTTPS, senhas armazenadas em texto puro, números de cartão sem criptografia.

**Exemplo:** O banco de dados armazena senhas como VARCHAR sem hash. Um atacante que acesse o banco via SQL Injection obtém todas as senhas em texto claro.

**Por que importa:** LGPD e PCI-DSS exigem proteção de dados pessoais e financeiros. Falhas criptográficas geram multas e danos à reputação.

### A03: Injection

A vulnerabilidade mais conhecida. Ocorre quando dados fornecidos pelo usuário são interpretados como comandos pelo sistema — SQL Injection, NoSQL Injection, Command Injection, LDAP Injection.

**Exemplo clássico de SQL Injection:**

```python
# VULNERÁVEL
query = f"SELECT * FROM produtos WHERE id = {request.GET['id']}"
cursor.execute(query)

# SEGURO (com parâmetros)
query = "SELECT * FROM produtos WHERE id = ?"
cursor.execute(query, (request.GET['id'],))
```

**Por que importa:** Um SQL Injection bem-sucedido pode vazar todo o banco de dados do e-commerce — clientes, pedidos, senhas, dados de pagamento.

### A04: Insecure Design

Diferente das anteriores que são falhas de implementação, Insecure Design é uma falha de arquitetura. O sistema foi projetado sem considerar segurança desde o início.

**Exemplo:** Um sistema de recuperação de senha que usa perguntas de segurança adivinháveis ("Qual sua cor favorita?") em vez de um token criptográfico enviado por e-mail.

**Por que importa:** Falhas de design não são corrigidas com patches — exigem redesign, o que é caro e lento.

### A05: Security Misconfiguration

Configurações padrão inseguras, diretórios expostos, debug habilitado em produção, CORS muito permissivo, headers HTTP ausentes.

**Exemplo:** Um servidor Django em produção com `DEBUG=True` expõe stack traces completos, variáveis de ambiente e configurações internas quando um erro ocorre.

```python
# VULNERÁVEL - produção
DEBUG = True
ALLOWED_HOSTS = ['*']

# SEGURO
DEBUG = False
ALLOWED_HOSTS = ['meu-ecommerce.com.br']
```

**Por que importa:** Configurações incorretas são a porta de entrada mais fácil para atacantes — não exigem exploit complexo, apenas um pouco de reconhecimento.

### Quick Check 2

**1. Qual a diferença entre Broken Access Control (A01) e Insecure Design (A04)?**
**Resposta:** A01 é uma falha de implementação (o código não verifica permissões); A04 é uma falha de arquitetura (o sistema foi projetado sem segurança desde o início).

**2. O exemplo de SQL Injection acima ilustra qual categoria do OWASP Top 10?**
**Resposta:** A03 — Injection. O valor vindo do request é interpolado diretamente na query SQL sem sanitização.

**3. Por que `DEBUG=True` em produção é um risco de segurança?**
**Resposta:** Porque expõe stack traces, variáveis de ambiente e detalhes internos da aplicação que ajudam um atacante a planejar ataques mais específicos.

---

> **APLICAÇÃO:** CodeQL, Dependabot, Secrets, Containers + 🤖 Agente Revisor

> *Agora que você entende os fundamentos, vamos implementar segurança no pipeline usando ferramentas concretas. Cada seção abaixo corresponde a um gate de segurança que você vai adicionar ao workflow da Aula 18.*

---

## 3. SAST com CodeQL

**Static Application Security Testing (SAST)** analisa o código-fonte sem executá-lo, procurando padrões que indicam vulnerabilidades. É o "raio-X do código": examina cada linha em busca de SQL Injection, XSS, hardcoded secrets, uso inseguro de criptografia e centenas de outras categorias.

**CodeQL** é o motor de SAST da GitHub. Ele trata código como dados — você escreve consultas (queries) para encontrar padrões inseguros. O CodeQL é gratuito para repositórios públicos e está disponível no GitHub Actions.

### Configuração no GitHub Actions

Adicione este workflow ao seu repositório (`.github/workflows/codeql.yml`):

```yaml
name: "CodeQL"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 12 * * 1'  # toda segunda ao meio-dia

jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ubuntu-latest
    timeout-minutes: 360
    permissions:
      security-events: write
      actions: read
      contents: read

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'python']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

O workflow tem três passos críticos:

1. **init**: Configura o CodeQL para as linguagens selecionadas e baixa as queries padrão de segurança
2. **autobuild**: Tenta compilar o projeto automaticamente (para linguagens compiladas) ou apenas indexar os arquivos (para interpretadas)
3. **analyze**: Executa as queries e publica os resultados na aba "Security" do repositório

### Exemplo: SQL Injection detectado pelo CodeQL

**ANTES (vulnerável):**

```python
from django.db import connection

def busca_produtos(request):
    termo = request.GET.get('q', '')
    # VULNERÁVEL: interpolação direta
    query = f"SELECT * FROM produtos WHERE nome LIKE '%{termo}%'"
    with connection.cursor() as cursor:
        cursor.execute(query)
        resultados = cursor.fetchall()
    return render(request, 'produtos.html', {'produtos': resultados})
```

**DEPOIS (corrigido):**

```python
from django.db import connection

def busca_produtos(request):
    termo = request.GET.get('q', '')
    # SEGURO: parâmetro parametrizado
    query = "SELECT * FROM produtos WHERE nome LIKE %s"
    with connection.cursor() as cursor:
        cursor.execute(query, [f'%{termo}%'])
        resultados = cursor.fetchall()
    return render(request, 'produtos.html', {'produtos': resultados})
```

### Exemplo: XSS detectado pelo CodeQL

**ANTES (vulnerável):**

```javascript
// VULNERÁVEL: innerHTML com dado não sanitizado
function exibirComentario(comentario) {
  document.getElementById('comments').innerHTML += 
    `<div class="comment">${comentario.texto}</div>`;
}
```

**DEPOIS (corrigido):**

```javascript
// SEGURO: textContent escapa HTML automaticamente
function exibirComentario(comentario) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.textContent = comentario.texto;
  document.getElementById('comments').appendChild(div);
}
```

### Exemplo: Hardcoded Secret detectado

**ANTES (vulnerável):**

```python
# VULNERÁVEL: chave de API hardcoded
API_KEY = "sk_live_REPLACED"
```

**DEPOIS (corrigido):**

```python
# SEGURO: lê de variável de ambiente
import os
API_KEY = os.environ.get('STRIPE_API_KEY')
if not API_KEY:
    raise ValueError("STRIPE_API_KEY não configurada")
```

### Mão na Massa: CodeQL

Adicione o workflow do CodeQL ao seu repositório. Depois de configurado, force um alerta proposital: crie um arquivo com SQL Injection (como o exemplo acima), faça push e veja o CodeQL detectar. Depois corrija e confirme que o alerta fecha.

### Quick Check 3

**1. Qual a diferença entre SAST e DAST?**
**Resposta:** SAST analisa o código-fonte estaticamente (sem executar); DAST testa a aplicação em execução, enviando requisições maliciosas e observando as respostas.

**2. O que acontece se o CodeQL encontrar uma vulnerabilidade em um PR?**
**Resposta:** Ele publica um alerta na aba Security do repositório e marca o PR com um status check. Se configurado como required status check, o PR fica bloqueado até a correção.

---

## 4. Dependency Scanning com Dependabot

Dependabot é o bot de segurança da GitHub que monitora dependências do projeto contra o banco de dados de CVEs (Common Vulnerabilities and Exposures). Quando uma vulnerabilidade é encontrada, ele abre automaticamente um Pull Request atualizando a dependência para a versão corrigida.

### Configuração

Crie o arquivo `.github/dependabot.yml` no repositório:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
    reviewers:
      - "time-dev-team"

  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
```

### Fluxo de Funcionamento

```mermaid
flowchart TB
  A[CVE publicado] --> B[Dependabot consulta advisory database]
  B --> C{Repositório usa<br/>versão vulnerável?}
  C -->|Sim| D[Dependabot abre Pull Request]
  D --> E[Pipeline CI roda]
  E -->|Todos os gates passam| F{Revisor aprova?}
  E -->|Falha| G[Corrigir conflitos]
  G --> D
  F -->|Sim| H[Auto-merge ou merge manual]
  F -->|Não| I[Revisor solicita ajustes]
  H --> J[Dependência atualizada]
```

### Exemplo de PR Real do Dependabot

O Dependabot cria PRs com este formato:

```yaml
# Título do PR
# Bump express from 4.17.1 to 4.18.2

# Corpo do PR
Bumps [express](https://github.com/expressjs/express) from 4.17.1 to 4.18.2.

Changelog:
- 4.18.2: Fix vulnerability in qs
- 4.18.1: Security updates for send
- 4.18.0: New features + security patches

CVE: CVE-2022-24999
Severity: HIGH
CVSS: 7.5

Automerge instructions:
- @dependabot squash and merge
- @dependabot rebase
```

### Mão na Massa: Dependabot

1. Crie o arquivo `.github/dependabot.yml` no seu repositório com as configurações acima
2. Faça push para a branch main
3. Acesse a aba "Security" > "Dependabot" para ver se há alertas
4. Quando um PR automático chegar, revise e faça merge

### Quick Check 4

**1. O que dispara a criação de um PR pelo Dependabot?**
**Resposta:** A publicação de uma nova CVE no GitHub Advisory Database que afeta uma dependência do projeto.

**2. Por que o pipeline CI precisa rodar antes do merge do PR do Dependabot?**
**Resposta:** Para garantir que a atualização de dependência não quebrou testes existentes ou introduziu incompatibilidades. Mesmo correções de segurança precisam ser validadas.

---

## 5. Secret Management

Segredos (chaves de API, senhas de banco, tokens de autenticação) nunca devem estar no código-fonte. O vazamento de um secret pode comprometer todo o sistema — e ocorre mais frequentemente do que se imagina.

### GitHub Secrets

O GitHub Actions fornece um cofre criptografado para armazenar segredos por repositório ou por ambiente:

```yaml
steps:
  - name: Deploy
    run: ./deploy.sh
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      STRIPE_API_KEY: ${{ secrets.STRIPE_API_KEY }}
```

**Boas práticas:**

- Nunca cole o valor de um secret em logs ou outputs
- Use ambientes diferentes (staging vs production) com secrets diferentes
- Rotacione periodicamente as chaves
- Use `${{ secrets.NOME }}` apenas em `env` ou passos que precisam

### .env.example

Mantenha um arquivo `.env.example` no repositório que documenta todas as variáveis necessárias sem os valores reais:

```bash
# .env.example
DATABASE_URL=postgres://usuario:senha@localhost:5432/ecommerce
STRIPE_API_KEY=sk_test_REPLACED
SECRET_KEY=chave-aleatoria-para-django
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
```

O arquivo `.env` (com valores reais) está no `.gitignore` e nunca é commitado.

### Pre-commit Hooks com Gitleaks

**Gitleaks** é uma ferramenta que varre o repositório em busca de secrets vazados. Integrada como pre-commit hook, ela impede que o desenvolvedor commit acidentalmente uma chave:

**.pre-commit-config.yaml:**

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
```

**Exemplo de vazamento detectado pelo Gitleaks:**

```
INFO Gitleaks v8.18.0
INFO scan completed in 2.3s

Finding:   server/config.py:15:API_KEY = "sk_live_REPLACED"
Rule:      Stripe API Key
Severity:  HIGH
Commit:    a1b2c3d4e5f6...
```

### Mão na Massa: Pre-commit + Gitleaks

1. Instale o pre-commit: `pip install pre-commit`
2. Crie o arquivo `.pre-commit-config.yaml` com Gitleaks
3. Execute `pre-commit install` para ativar os hooks
4. Tente commitar um arquivo com uma chave de teste — veja o bloqueio
5. Corrija removendo a chave e usando variável de ambiente

### Quick Check 5

**1. Qual a diferença entre `.env` e `.env.example`?**
**Resposta:** `.env` contém os valores reais dos segredos e está no `.gitignore`; `.env.example` é um template documentando as variáveis necessárias, commitado no repositório.

**2. O que o Gitleaks faz quando encontra um possível secret durante o commit?**
**Resposta:** O pre-commit hook bloqueia o commit e exibe um alerta com o arquivo, linha, tipo de secret e severidade. O desenvolvedor precisa remover o secret antes de commitar.

---

## 6. Container Security

Imagens Docker inseguras são um vetor de ataque comum. Uma imagem gorda (fat image) contém builds intermediários, pacotes desnecessários e potencialmente vulnerabilidades. A abordagem segura usa **multi-stage builds**, **scanning com Trivy** e **execução como non-root user**.

### Multi-stage Build

O Dockerfile multi-stage separa o ambiente de build do ambiente de execução. O resultado é uma imagem final mínima, com apenas os binários necessários:

```dockerfile
# === STAGE 1: Build ===
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# === STAGE 2: Runtime ===
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**O que torna esta imagem segura:**

1. **Multi-stage**: o stage de build (com todas as ferramentas de compilação) é descartado
2. **Usuário não-root**: `USER appuser` impede que o container tenha privilégios de root
3. **Imagem base mínima**: `node:20-alpine` é significativamente menor que `node:20`
4. **Apenas produção**: `npm ci --only=production` instala só o necessário

### Docker Compose com Non-root

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - STRIPE_API_KEY=${STRIPE_API_KEY}
    user: "appuser"
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}

volumes:
  pgdata:
```

### Scanning com Trivy

**Trivy** (aqua security) escaneia imagens Docker em busca de CVEs conhecidas. Integrado ao pipeline:

```yaml
# Job no GitHub Actions
container-scan:
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - name: Build image
      run: docker build -t ecommerce:latest .

    - name: Scan with Trivy
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'ecommerce:latest'
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'

    - name: Upload Trivy results
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-results.sarif'
        category: 'trivy'
```

### Mão na Massa: Container Seguro

1. Crie um Dockerfile multi-stage para seu projeto de e-commerce
2. Adicione o job `container-scan` ao workflow do GitHub Actions
3. Faça push e verifique se o Trivy encontra vulnerabilidades na imagem
4. Corrija as vulnerabilidades atualizando as imagens base ou removendo pacotes desnecessários

### Quick Check 6

**1. Por que multi-stage builds melhoram a segurança da imagem?**
**Resposta:** Porque o stage de build (com ferramentas de compilação, SDKs e dependências de desenvolvimento) é descartado na imagem final, reduzindo a superfície de ataque.

**2. O que a flag `no-new-privileges:true` faz no docker-compose?**
**Resposta:** Impede que o processo dentro do container eleve seus privilégios (ex.: via `sudo` ou `setuid`), mesmo que o binário tenha permissões para isso.

**3. Qual o propósito do Trivy no pipeline?**
**Resposta:** Escanear a imagem Docker em busca de CVEs conhecidas (críticas e altas) e bloquear o deploy se vulnerabilidades forem encontradas.

---

## 7. 🤖 Agent Perspective: Agente de Revisão de Código Focado em Segurança

Um dos usos mais promissores de agentes de IA em DevSecOps é a **revisão automatizada de código com foco em segurança**. Diferente do CodeQL (que segue regras pré-definidas), um agente pode raciocinar sobre o contexto do código, identificar vulnerabilidades complexas e sugerir correções com explicações.

### Prompt do Agente Revisor

```markdown
Você é um engenheiro de segurança especializado em revisão de código.
Analise o diff do Pull Request abaixo seguindo ESTRITAMENTE este checklist:

## Checklist de Segurança
1. ✅ SQL / NoSQL Injection: dados do usuário são sanitizados?
2. ✅ XSS: dados dinâmicos escapam HTML corretamente?
3. ✅ Access Control: há verificação de permissões?
4. ✅ Cryptographic Failures: senhas com hash? HTTPS?
5. ✅ Hardcoded Secrets: chaves/ tokens no código?
6. ✅ Input Validation: tamanho, tipo e formato validados?
7. ✅ Error Handling: exceptions expõem detalhes internos?

## Formato de Saída
Para cada vulnerabilidade encontrada:

### [SEVERIDADE] Título
- **Arquivo:** caminho/arquivo.py
- **Linha:** 42
- **Descrição:** Por que é vulnerável
- **Correção sugerida:** Código corrigido
- **Referência:** Link para OWASP ou CVE

Severidade: CRITICAL | HIGH | MEDIUM | LOW | INFO
```

### Análise de Diff — Exemplo Real

**Diff enviado para revisão:**

```diff
+ def buscar_cliente(request, cliente_id):
+     query = f"SELECT * FROM clientes WHERE id = {cliente_id}"
+     resultado = execute_query(query)
+     return JsonResponse(resultado)
+
+ def atualizar_email(request):
+     email = request.POST['email']
+     if '@' in email:
+         update_email(request.user.id, email)
+         return HttpResponse("Email atualizado!")
+     return HttpResponse("Email inválido", status=400)
```

**Findings do Agente:**

### CRITICAL — SQL Injection em buscar_cliente

- **Arquivo:** views.py
- **Linha:** 2
- **Descrição:** O parâmetro `cliente_id` é interpolado diretamente na query SQL. Um atacante pode passar `1; DROP TABLE clientes;--` e destruir a tabela.
- **Correção sugerida:**

```python
def buscar_cliente(request, cliente_id):
    query = "SELECT * FROM clientes WHERE id = ?"
    resultado = execute_query(query, [cliente_id])
    return JsonResponse(resultado)
```

### MEDIUM — Input Validation frágil em atualizar_email

- **Arquivo:** views.py
- **Linha:** 7
- **Descrição:** A validação de email verifica apenas se contém `@`. Um atacante pode passar `email@<script>alert(1)</script>`.
- **Correção sugerida:**

```python
import re

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

def atualizar_email(request):
    email = request.POST.get('email', '')
    if re.match(EMAIL_REGEX, email):
        update_email(request.user.id, email)
        return HttpResponse("Email atualizado!")
    return HttpResponse("Email inválido", status=400)
```

### Fluxo Completo do Agente no Pipeline

```mermaid
flowchart TB
  A[PR Aberto] --> B[🤖 Agente Analisa Diff]
  B --> C{Executa Checklist<br/>de Segurança}
  C --> D[SQL Injection?]
  C --> E[XSS?]
  C --> F[Secrets Expostos?]
  C --> G[Access Control?]
  D --> H[Gera Report com Severidade]
  E --> H
  F --> H
  G --> H
  H --> I[Comenta no PR]
  I --> J[Humano Revisa Findings]
  J --> K{Aprovado?}
  K -->|Sim| L[Merge]
  K -->|Não| M[Desenvolvedor Corrige]
  M --> N[Novo Commit]
  N --> B
```

### Mão na Massa: Prompt do Agente

1. Crie seu próprio prompt de agente revisor baseado no modelo acima
2. Adicione 2 categorias extras ao checklist (ex.: Rate Limiting, Logging Sensível)
3. Teste o prompt com um diff real do seu projeto
4. Documente os findings em um arquivo `SECURITY_REVIEW.md`

### Quick Check 7

**1. Qual a diferença entre um agente revisor de código e uma ferramenta SAST tradicional como CodeQL?**
**Resposta:** O CodeQL segue queries pré-definidas; um agente pode raciocinar contextualmente sobre o código, identificar vulnerabilidades que cruzam múltiplos arquivos e sugerir correções em linguagem natural.

**2. Por que o humano ainda é necessário no fluxo de revisão com agente?**
**Resposta:** Porque o agente pode gerar falsos positivos (alertar algo que não é vulnerabilidade) ou falsos negativos (deixar passar algo). O humano valida cada finding e decide se a correção é adequada.

---

## Autoavaliação: Quiz Rápido

**1. O que significa "shift-left" em DevSecOps?**
**Resposta:** Mover verificações de segurança para estágios iniciais do desenvolvimento (design, codificação, commit) para reduzir custo e tempo de correção.

**2. Qual a categoria mais crítica do OWASP Top 10?**
**Resposta:** A01 — Broken Access Control. É a mais comum e a mais perigosa, pois permite que um atacante acesse recursos sem autorização.

**3. O que o CodeQL analisa em um pipeline?**
**Resposta:** O código-fonte estaticamente (SAST), procurando padrões que indicam SQL Injection, XSS, hardcoded secrets e outras vulnerabilidades.

**4. Como o Dependabot alerta sobre vulnerabilidades em dependências?**
**Resposta:** Monitorando CVEs publicadas no GitHub Advisory Database e abrindo PRs automáticos com a versão corrigida da dependência.

**5. Onde os segredos devem ser armazenados no GitHub Actions?**
**Resposta:** No cofre de Secrets do repositório ou dos ambientes (Settings > Secrets and variables > Actions), nunca no código-fonte.

**6. Por que multi-stage builds são recomendados para segurança de containers?**
**Resposta:** Porque separam o ambiente de build (com ferramentas de compilação) do ambiente de runtime, resultando em imagens menores e com menos superfície de ataque.

**7. Qual o papel do agente de revisão no fluxo DevSecOps?**
**Resposta:** Analisar o diff de um PR aplicando um checklist de segurança, gerar findings com severidade e comentar no PR para revisão humana.

---

## Mão na Massa: Exercícios Graduados

### Exercício 1 (Fácil): Completar Workflow de Segurança

Complete o YAML abaixo adicionando os trechos que faltam nos lugares indicados por comentários.

```yaml
name: Security Scan

on: [pull_request]

jobs:
  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      # ADICIONAR: Initialize CodeQL para javascript
      # ADICIONAR: Autobuild
      # ADICIONAR: Perform CodeQL Analysis

  dependabot:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Dependabot configurado em .github/dependabot.yml"
```

**Gabarito:**

```yaml
name: Security Scan

on: [pull_request]

jobs:
  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: 'javascript'
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:javascript"

  dependabot:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Dependabot configurado em .github/dependabot.yml"
```

### Exercício 2 (Médio): Analisar Código e Classificar Vulnerabilidades

Analise o código abaixo e identifique as vulnerabilidades. Para cada uma, informe: categoria OWASP, severidade (CRITICAL/HIGH/MEDIUM/LOW) e correção sugerida.

```python
# Arquivo: views.py
from django.http import JsonResponse, HttpResponse
from django.db import connection

def login(request):
    usuario = request.POST['usuario']
    senha = request.POST['senha']
    query = f"SELECT * FROM usuarios WHERE nome='{usuario}' AND senha='{senha}'"
    with connection.cursor() as cursor:
        cursor.execute(query)
        user = cursor.fetchone()
    if user:
        response = JsonResponse({"status": "ok"})
        response.set_cookie("token", "admin_token_123")
        return response
    return HttpResponse("Falha no login")

def exportar_dados(request):
    with open('/etc/passwd', 'r') as f:
        dados = f.read()
    return JsonResponse({"dados": dados})

DEBUG = True
SECRET_KEY = "django-insecure-123456"
```

**Gabarito:**

| Vulnerabilidade | OWASP | Severidade | Correção |
|---|---|---|---|
| SQL Injection em `login` | A03 | CRITICAL | Usar query parametrizada no lugar de interpolação |
| Senha armazenada sem hash (comparação direta) | A02 | HIGH | Usar `check_password()` do Django com hash bcrypt |
| Token hardcoded (`admin_token_123`) | A05 | HIGH | Usar token gerado criptograficamente e armazenado em variável de ambiente |
| Path traversal em `exportar_dados` (lê `/etc/passwd`) | A01 | CRITICAL | Validar caminho do arquivo, nunca expor sistema de arquivos |
| `DEBUG=True` em produção | A05 | HIGH | Definir `DEBUG=False` e configurar variável de ambiente |
| `SECRET_KEY` hardcoded no código | A05 | CRITICAL | Mover para variável de ambiente |

### Exercício 3 (Difícil): Pipeline DevSecOps Completo com Agente Revisor

Projete um pipeline DevSecOps completo no GitHub Actions que inclua:

1. **CodeQL** para SAST (JavaScript + Python)
2. **Dependabot** para varredura de dependências
3. **Container scan** com Trivy (imagem Docker multi-stage)
4. **Secret scan** com Gitleaks (via pre-commit ou action)
5. **Agente revisor** que comenta no PR com findings de segurança
6. **Quality gates**: apenas imagens sem CVEs críticas/altas vão para deploy
7. **Notificação**: webhook no Slack se alguma verificação falhar

**Gabarito:**

```yaml
name: DevSecOps Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  codeql:
    name: CodeQL SAST
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    strategy:
      matrix:
        language: ['javascript', 'python']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3

  secret-scan:
    name: Secret Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  container-scan:
    name: Container Security
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t ecommerce:latest -f Dockerfile .
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ecommerce:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
      - name: Fail if CRITICAL or HIGH found
        run: |
          CRITICAL=$(jq '.runs[0].results | map(select(.level == "error")) | length' trivy-results.sarif)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ $CRITICAL CVEs críticas/altas encontradas"
            exit 1
          fi

  agent-review:
    name: 🤖 Agent Security Review
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: AI Code Review
        uses: openai/code-review-action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          model: gpt-4
          prompt: |
            Você é um engenheiro de segurança. Analise o diff deste PR.
            Checklist: SQL Injection, XSS, Secrets, Access Control, Input Validation.
            Para cada finding: severidade (CRITICAL/HIGH/MEDIUM), arquivo, linha, descrição, correção.

  notify:
    needs: [codeql, secret-scan, container-scan, agent-review]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        run: |
          curl -X POST -H "Content-Type: application/json" \
            -d '{"text":"❌ DevSecOps Pipeline falhou — revisar Security alerts"}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Resumo da Aula

DevSecOps integra segurança em cada estágio do pipeline, não como uma fase separada no final. O princípio de Shift-Left Security mostra que corrigir vulnerabilidades no design custa 100x menos que em produção. O OWASP Top 10 oferece um guia das ameaças mais críticas, com destaque para Broken Access Control (A01), Cryptographic Failures (A02) e Injection (A03). Na prática, implementamos SAST com CodeQL para analisar o código-fonte, Dependabot para monitorar dependências contra CVEs, GitHub Secrets e Gitleaks para proteger segredos, multi-stage builds e Trivy para containers seguros. Por fim, um agente de revisão de código aplica um checklist de segurança em cada PR, gerando findings com severidade que o humano valida antes do merge. O resultado é um pipeline que não entrega apenas código funcionando — entrega código seguro.

---

## Próxima Aula

Na **Aula 20: DevOps & Observabilidade**, você vai aprender a monitorar aplicações em produção com métricas, logs e tracing distribuído. Vamos configurar Prometheus, Grafana e o ecossistema OpenTelemetry para entender o que acontece dentro do seu sistema — incluindo dashboards de segurança e alertas de anomalias.

---

## Referências

### DevSecOps e Shift-Left
- OWASP Foundation. "OWASP Top 10 — 2021" — owasp.org
- Bell, L. et al. "DevSecOps: Shifting Security Left" — O'Reilly
- Kim, G. et al. "The DevOps Handbook" — IT Revolution Press

### Ferramentas de Segurança no Pipeline
- GitHub Docs. "CodeQL: Code scanning" — docs.github.com
- GitHub Docs. "Dependabot: Automated dependency updates" — docs.github.com
- Aqua Security. "Trivy Documentation" — github.com/aquasecurity/trivy
- Gitleaks. "Gitleaks: Protecting secrets" — github.com/gitleaks/gitleaks

### Container Security
- Docker. "Multi-stage builds" — docs.docker.com
- National Vulnerability Database — nvd.nist.gov

### Agentes de IA para Segurança
- OpenAI. "Using GPT-4 for Code Review" — platform.openai.com
- GitHub. "AI Code Review" — docs.github.com

---

## FAQ

**1. Shift-Left Security significa que só preciso me preocupar com segurança no início do projeto?**
Não. Shift-Left significa adicionar verificações de segurança em cada fase, começando o mais cedo possível, mas continuando em todas as etapas — commit, PR, build, deploy e monitoramento.

**2. OWASP Top 10 cobre todos os riscos de segurança?**
Não. A lista cobre os riscos mais comuns e críticos, mas cada aplicação tem seu perfil de risco específico. Consulte também o OWASP ASVS (Application Security Verification Standard) para uma cobertura mais completa.

**3. Preciso de uma licença paga para usar CodeQL?**
CodeQL é gratuito para repositórios públicos. Para repositórios privados, o GitHub fornece 1.500 minutos/mês de análise gratuita. Acima disso, é necessário GitHub Advanced Security (produto pago).

**4. Dependabot pode fazer merge automático dos PRs?**
Sim. Você pode configurar auto-merge para PRs do Dependabot que passem em todos os checks. Use `@dependabot squash and merge` no corpo do PR ou configure no repositório.

**5. Gitleaks funciona apenas como pre-commit hook?**
Não. Gitleaks também pode rodar como GitHub Action, CLI standalone ou integrado ao pipeline de CI, varrendo todo o repositório (incluindo histórico de commits).

**6. Qual a diferença entre Trivy e Docker Scout?**
Ambos escaneiam imagens Docker por CVEs. Trivy é open-source e pode ser usado em qualquer pipeline; Docker Scout é integrado ao Docker Desktop e Docker Hub. Trivy é mais comum em pipelines de CI.

**7. Um agente de IA pode substituir um revisor humano de segurança?**
Não completamente. O agente acelera a detecção de padrões conhecidos, mas o humano entende o contexto de negócio, identifica falsos positivos e toma decisões de aceitação de risco.

**8. Preciso de todos esses gates em um projeto pequeno?**
Adapte ao seu contexto. Um projeto pessoal pode começar só com Dependabot + CodeQL. Um projeto corporativo com dados sensíveis deve ter todos os gates descritos nesta aula.

**9. Como lidar com falsos positivos do CodeQL?**
CodeQL permite marcar alertas como "false positive" na interface do GitHub. Você também pode criar um arquivo `codeql-config.yml` com exclusões de caminhos específicos.

**10. O que significa CVSS?**
Common Vulnerability Scoring System — um sistema numérico (0-10) que classifica a severidade de vulnerabilidades. CVSS >= 7.0 é considerado HIGH, >= 9.0 é CRITICAL.

---

## Glossário

| Termo | Significado |
|---|---|
| **CVE (Common Vulnerabilities and Exposures)** | Catálogo público de vulnerabilidades de segurança conhecidas |
| **CVSS** | Common Vulnerability Scoring System — métrica de severidade (0-10) |
| **DAST** | Dynamic Application Security Testing — teste de segurança executando a aplicação |
| **Gate** | Barreira de qualidade ou segurança que bloqueia o pipeline se não for atendida |
| **Multi-stage build** | Técnica de Docker que separa build e runtime em stages diferentes |
| **OWASP** | Open Web Application Security Project — comunidade de segurança de aplicações |
| **SAST** | Static Application Security Testing — análise de segurança do código-fonte sem executá-lo |
| **Secret** | Informação sensível (chave de API, senha, token) que nunca deve estar no código-fonte |
| **Shift-Left** | Prática de mover verificações de segurança para estágios iniciais do desenvolvimento |
| **Trivy** | Scanner de vulnerabilidades open-source para containers e dependências |
| **CVE** | Identificador único de vulnerabilidade de segurança (ex.: CVE-2022-24999) |
| **Gitleaks** | Ferramenta open-source para detecção de secrets vazados no código-fonte |
