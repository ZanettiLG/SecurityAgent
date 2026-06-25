---
titulo: "Aula 19: DevSecOps — Segurança no Pipeline + 🤖 Agent Perspective"
tipo: "checkpoint-pratico"
modulo: "Engenharia de Software"
aula_referencia: "Aula 19: DevSecOps — Segurança no Pipeline + 🤖 Agent Perspective"
tags: [devsecops, shift-left, owasp, codeql, dependabot, sast, container-security, agent-perspective, exercicios]
data: 2026-06-20
---

# Engenharia de Software — Aula 19

## DevSecOps: Questões de Aprendizagem

---

## Como Usar Este Arquivo

Este arquivo contém 8 questões práticas que consolidam os conceitos da Aula 19. Cada questão exige que você analise código, configure ferramentas ou projete pipelines com foco em segurança. Siga a ordem sugerida — as questões progridem do conceitual para o prático. Não há gabarito neste arquivo: ele é um checkpoint para você mesmo verificar seu progresso. Se travar em uma questão, revise a seção correspondente da aula antes de prosseguir. Crie uma pasta `entregas/aula19/` no seu repositório para salvar as respostas.

---

## Questão 1: Mapear Custo do Shift-Left Security

**Conceito-chave:** Princípio de Shift-Left Security e custo exponencial de correção (Aula 19, Seção 1)

**Objetivo:** Representar visualmente a relação entre fase de desenvolvimento e custo de correção de vulnerabilidades.

**Passos de Execução:**

1. Crie um diagrama Mermaid (flowchart ou xychart) que mostre o custo relativo de correção em cada fase: Design (1x), Desenvolvimento (5x), Testes (10x), Staging (30x), Produção (100x)
2. Adicione uma legenda explicando por que o custo cresce em cada transição
3. Escreva dois parágrafos: um explicando o princípio e outro aplicando a analogia da segurança de aeroporto
4. Identifique em qual fase cada ferramenta da aula atua (CodeQL, Dependabot, Trivy, Gitleaks)

**Entrega:**

```markdown
### Diagrama de Custo

[Inserir diagrama Mermaid]

### Legenda das Fases

| Fase | Custo Relativo | Por que cresce? |
|---|---|---|
| Design | 1x | Apenas documentação |
| ... | ... | ... |

### Explicação do Princípio

[Texto explicando Shift-Left]

### Analogia do Aeroporto

[Texto com a analogia]

### Mapa Ferramentas vs Fase

| Ferramenta | Fase de Atuação | Gate |
|---|---|---|
| CodeQL | Pull Request | SAST |
| ... | ... | ... |
```

---

## Questão 2: Classificar Vulnerabilidades OWASP em Código Real

**Conceito-chave:** Identificação de vulnerabilidades OWASP Top 10 em código-fonte (Aula 19, Seção 2)

**Objetivo:** Analisar um trecho de código e classificar cada vulnerabilidade encontrada segundo o OWASP Top 10.

**Passos de Execução:**

1. Analise o código abaixo e identifique todas as vulnerabilidades presentes
2. Para cada uma, informe: categoria OWASP (A01-A10), descrição, severidade e linha
3. Proponha a correção para cada vulnerabilidade

```javascript
// Arquivo: api/users.js
const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/user/:id', (req, res) => {
  const id = req.params.id;
  const query = `SELECT * FROM users WHERE id = ${id}`;
  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Erro: ' + err.message);
    }
    res.json(result);
  });
});

router.post('/login', (req, res) => {
  const { user, pass } = req.body;
  const query = `SELECT * FROM users WHERE user = '${user}' AND pass = '${pass}'`;
  db.query(query, (err, result) => {
    if (result.length > 0) {
      res.cookie('token', 'secret-token-123', { httpOnly: false });
      res.json({ status: 'ok' });
    }
  });
});

router.get('/admin/users', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    res.json(result);
  });
});
```

**Entrega:**

```markdown
### Vulnerabilidades Encontradas

| # | Linha | OWASP | Descrição | Severidade | Correção |
|---|---|---|---|---|---|
| 1 | 8 | A03 | SQL Injection em ${id} | CRITICAL | Query parametrizada |
| ... | ... | ... | ... | ... | ... |
```

---

## Questão 3: Configurar CodeQL no Pipeline

**Conceito-chave:** Configuração de CodeQL em workflow do GitHub Actions (Aula 19, Seção 3)

**Objetivo:** Adicionar análise SAST com CodeQL a um pipeline existente e interpretar os alertas gerados.

**Passos de Execução:**

1. Crie o arquivo `.github/workflows/codeql.yml` com análise para JavaScript e Python
2. Configure o schedule semanal para segunda-feira ao meio-dia
3. Adicione as permissões corretas (`security-events: write`)
4. Faça push, force um alerta (crie um arquivo com SQL Injection) e capture o resultado
5. Corrija a vulnerabilidade e verifique se o alerta fecha automaticamente
6. Documente o processo com prints ou trechos de log

**Entrega:**

```markdown
### Workflow CodeQL

[YAML completo do codeql.yml]

### Alerta Gerado

[Descrição do alerta: arquivo, linha, severidade, descrição]

### Correção Aplicada

[Código vulnerável → código corrigido]

### Evidência

[Trecho de log ou print mostrando o alerta fechado]
```

---

## Questão 4: Implementar Dependabot e Analisar PR de Segurança

**Conceito-chave:** Varredura de dependências com Dependabot (Aula 19, Seção 4)

**Objetivo:** Configurar Dependabot e analisar um Pull Request automático de correção de vulnerabilidade.

**Passos de Execução:**

1. Crie o arquivo `.github/dependabot.yml` para npm (raiz) e pip (backend/)
2. Configure schedule semanal com revisores do time
3. Faça push e aguarde a primeira varredura (pode levar algumas horas)
4. Se não houver vulnerabilidades, adicione uma dependência antiga e vulnerável ao `package.json` (ex.: `express@4.17.1`)
5. Quando o PR automático chegar, analise: qual CVE? Qual severidade? Qual a diferença de versão?
6. Documente o fluxo completo: CVE → PR → Pipeline → Merge

**Entrega:**

```markdown
### Configuração Dependabot

[YAML do dependabot.yml]

### PR Analisado

- CVE: [identificador]
- Severidade: [CRITICAL/HIGH/MEDIUM/LOW]
- Dependência: [nome]
- Versão vulnerável: [X.Y.Z] → Versão corrigida: [X.Y.Z]

### Fluxo Documentado

[Descrição do fluxo CVE → PR → Merge com observações]
```

---

## Questão 5: Configurar Gitleaks e Prevenir Vazamento de Secret

**Conceito-chave:** Prevenção de vazamento de segredos com pre-commit hooks (Aula 19, Seção 5)

**Objetivo:** Instalar e configurar Gitleaks como pre-commit hook e testar seu funcionamento.

**Passos de Execução:**

1. Instale o pre-commit (`pip install pre-commit` ou `brew install pre-commit`)
2. Crie o arquivo `.pre-commit-config.yaml` com Gitleaks e detect-private-key
3. Execute `pre-commit install` para ativar os hooks
4. Crie um arquivo de teste com uma chave de API fictícia (ex.: `API_KEY = "sk_live_REPLACED"`)
5. Tente commitar e veja o bloqueio do Gitleaks
6. Remova o secret, mova para `.env` e adicione ao `.gitignore`, depois commite com sucesso
7. Crie um `.env.example` documentando as variáveis

**Entrega:**

```markdown
### Configuração Pre-commit

[YAML do .pre-commit-config.yaml]

### Teste de Bloqueio

[Comando executado + saída do Gitleaks mostrando o bloqueio]

### .env.example

[Conteúdo do arquivo .env.example]

### Estrutura Final

[Arquivos alterados: .pre-commit-config.yaml, .env, .env.example, .gitignore]
```

---

## Questão 6: Dockerfile Multi-stage Seguro com Non-root User

**Conceito-chave:** Container security com multi-stage builds e non-root user (Aula 19, Seção 6)

**Objetivo:** Construir um Dockerfile seguro para o projeto de e-commerce e verificar com Trivy.

**Passos de Execução:**

1. Crie um Dockerfile multi-stage para um projeto Node.js com dois estágios: builder e runtime
2. No estágio runtime: crie usuário não-root, copie apenas o necessário do builder, exponha a porta
3. Crie um docker-compose.yml com `no-new-privileges:true` e `read_only: true`
4. Faça o build da imagem
5. Escaneie com Trivy: `trivy image ecommerce:latest --severity CRITICAL,HIGH`
6. Documente os resultados: quantas CVEs foram encontradas? Qual a mais crítica?

**Entrega:**

```markdown
### Dockerfile

[Conteúdo completo do Dockerfile]

### Docker Compose

[YAML do docker-compose.yml]

### Resultado do Trivy

- Total de CVEs: [N]
- CRITICAL: [N]
- HIGH: [N]

### CVE Mais Crítica

- ID: [CVE-XXXX-XXXX]
- Severidade: [CRITICAL/HIGH]
- Descrição: [Descrição]
- Pacote afetado: [nome/versão]
- Correção: [atualizar para versão X.Y.Z]
```

---

## Questão 7: Projetar Prompt de Agente Revisor de Segurança

**Conceito-chave:** Design de prompt para agente de revisão de código focado em segurança (Aula 19, Seção 7)

**Objetivo:** Criar um prompt de agente revisor e testá-lo contra um diff real.

**Passos de Execução:**

1. Baseie-se no prompt da seção 7 e crie uma versão melhorada
2. Adicione 3 categorias extras ao checklist (ex.: Rate Limiting, Logging Sensível, IDOR)
3. Defina o formato de saída com severidade, arquivo, linha, descrição e correção
4. Teste o prompt com um diff real do seu projeto (git diff)
5. Execute o prompt em um LLM (ChatGPT, Claude, etc.) e capture a resposta
6. Avalie os findings: quantos são verdadeiros positivos? Quantos são falsos positivos?

**Entrega:**

```markdown
### Prompt do Agente

[Prompt completo com checklist expandido]

### Diff Analisado

[Trecho do git diff usado no teste]

### Findings Gerados

| # | Severidade | Arquivo | Linha | Descrição | Correção |
|---|---|---|---|---|---|
| 1 | HIGH | ... | ... | ... | ... |

### Avaliação

- Total de findings: [N]
- Verdadeiros positivos: [N]
- Falsos positivos: [N]
- Observações: [o que o agente acertou/errou]
```

---

## Questão 8: Pipeline DevSecOps Completo

**Conceito-chave:** Integração de múltiplos gates de segurança em um pipeline (Aula 19, Seções 3-7)

**Objetivo:** Projetar e implementar um pipeline DevSecOps completo que integre todos os gates de segurança.

**Passos de Execução:**

1. Crie um workflow YAML que contenha: CodeQL, secret scan com Gitleaks, dependency scan, container scan com Trivy, e agente revisor
2. Configure cada job com as dependências corretas (paralelismo onde possível, encadeamento onde necessário)
3. Adicione quality gate: o deploy só acontece se não houver CVEs críticas/altas nem secrets vazados
4. Adicione notificação de falha via webhook
5. Teste o pipeline abrindo um PR com código vulnerável intencional e documente o resultado
6. No mesmo PR, corrija as vulnerabilidades e mostre o pipeline passando

**Entrega:**

```markdown
### Workflow DevSecOps

[YAML completo do pipeline]

### Diagrama do Pipeline

[Diagrama Mermaid mostrando o fluxo dos jobs]

### Teste com Código Vulnerável

- PR aberto em: [link]
- Gates que bloquearam: [lista]
- Findings do CodeQL: [N]
- Findings do Gitleaks: [N]

### Correção e Aprovação

- Commits de correção: [N]
- Pipeline final: [sucesso/falha]
- Merge realizado em: [data]
```

---

## Checklist Final: Pronto para a Aula 20?

- [ ] Eu consigo explicar o princípio de Shift-Left Security com a analogia do aeroporto
- [ ] Eu identifico as 5 principais categorias do OWASP Top 10 em um código-fonte
- [ ] Eu configurei CodeQL em um workflow e interpretei os alertas
- [ ] Eu implementei Dependabot e analisei um PR automático de correção
- [ ] Eu configurei Gitleaks como pre-commit hook e testei o bloqueio
- [ ] Eu criei um Dockerfile multi-stage com usuário não-root
- [ ] Eu escaneei uma imagem Docker com Trivy e interpretei os resultados
- [ ] Eu projetei um prompt de agente revisor de segurança e testei contra um diff real
- [ ] Eu implementei um pipeline DevSecOps completo com múltiplos gates
- [ ] Eu me sinto confiante para adicionar segurança a qualquer pipeline CI/CD existente
