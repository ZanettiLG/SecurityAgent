---
titulo: "Questões de Aprendizagem — Aula 02: Docker Compose — Orquestração Multi-Serviço"
modulo: "Docker, Docker Compose e Registry"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 02: Docker Compose — Orquestração Multi-Serviço"
data: 2026-06-15
---

# Curso: Docker, Docker Compose e Registry — Aula 02 (Questões)

## Docker Compose: Orquestração Multi-Serviço

## Como Usar Este Arquivo

Este arquivo contém **questões de aprendizagem** para verificar se você realmente entendeu os conceitos da Aula 02. Cada questão testa um objetivo específico da aula.

**Como usar:**
1. Complete a leitura da Aula 02 e os Mão na Massa inline
2. Volte a este arquivo e resolva cada questão **sem consultar a aula** (exceto quando o passo pedir)
3. Se uma questão exigir comandos, execute-os no terminal
4. Marque os checkboxes da seção "Entrega" conforme completar cada artefato

**Dica:** Se você não consegue responder uma questão sem consultar a aula, releia a seção correspondente e tente novamente. O objetivo é que você consiga fazer **sem ajuda**.

---

## Questão 1: Subindo a Stack

**Conceito-chave:** Experiência inicial — `docker compose up` (Seção 7 da aula)
**Objetivo de Aprendizagem:** Executar `docker compose up` e interpretar os logs entrelaçados de múltiplos serviços no terminal
**Tempo estimado:** 10 minutos

**Contexto:** Você já tem o diretório do projeto da Aula 01 com `server.js`, `package.json`, `Dockerfile` e `.dockerignore`. Você atualizou o `server.js` com conexão PostgreSQL e adicionou `pg` ao `package.json`. Agora precisa criar o `docker-compose.yml` e subir a stack.

**Passos de Execução:**

1. Crie o arquivo `docker-compose.yml` no diretório do projeto com dois serviços: `api` (build local, porta 3000) e `db` (imagem `postgres:16-alpine`, porta 5432). Configure as variáveis de ambiente necessárias para ambos.
2. Execute `docker compose up` e observe os logs no terminal.
3. Identifique nos logs: (a) o prefixo de cada serviço, (b) a ordem em que os serviços aparecem, (c) se há erro de conexão.
4. Em outro terminal, execute `curl http://localhost:3000`.
5. Pare a stack com `Ctrl+C`.

**Entrega:** crie `entregas-aula-02/q1-stack-up.md`:

```markdown
# Questão 1 — Subindo a Stack com Docker Compose

## Output do curl
[cole a resposta JSON]

## Prefixos nos logs
- Prefixo do serviço `db`: [preencher]
- Prefixo do serviço `api`: [preencher]

## Conclusão
[Em 2-3 frases: o que o Compose fez que antes exigia múltiplos terminais?]
```


- [ ] Comando executado: `docker compose up`
- [ ] Output do `curl` com a resposta da API (incluindo `dbTime`)
- [ ] Resposta: qual foi o prefixo do serviço `db` nos logs? E do serviço `api`?

---

## Questão 2: DNS Interno na Prática

**Conceito-chave:** Redes virtuais e descoberta de serviços por nome DNS (Seção 8)
**Objetivo de Aprendizagem:** Descrever o mecanismo de redes virtuais e DNS interno
**Tempo estimado:** 8 minutos

**Contexto:** Você subiu a stack e a API está acessando o PostgreSQL como `db:5432`. Mas como provar que o DNS interno está funcionando? Você vai executar comandos dentro dos containers para verificar a resolução de nomes.

**Passos de Execução:**

1. Com a stack rodando, execute `docker compose exec api sh` para abrir um shell na API.
2. Dentro do shell, execute `nslookup db 127.0.0.11` para consultar o DNS embutido do Docker. Anote o IP resolvido.

   **Alternativa via Node.js** (se nslookup não estiver disponível):
   ```bash
   node -e "const dns=require('dns'); dns.lookup('db', (e,addr)=>console.log('IP do db:', addr))"
   ```

3. Saia do shell (`exit`).
4. Agora execute `docker compose exec db sh` e dentro do PostgreSQL, execute `ping api`. Anote o IP resolvido.
5. Compare os IPs — eles estão na mesma sub-rede?

**Entrega:** crie `entregas-aula-02/q2-dns-interno.md`:

```markdown
# Questão 2 — DNS Interno na Prática

## IPs resolvidos
- IP do serviço `db` resolvido a partir da API: [preencher]
- IP do serviço `api` resolvido a partir do banco: [preencher]

## Análise de sub-rede
- Os dois IPs estão na mesma sub-rede? (Sim/Não): [preencher]
- Prefixo de rede: [preencher]

## Explicação
[Explique com suas palavras: por que a API usa `db` como hostname e não o IP?]
```


- [ ] IP do serviço `db` resolvido a partir da API:
- [ ] IP do serviço `api` resolvido a partir do banco:
- [ ] Os dois IPs estão na mesma sub-rede? (Sim/Não) Qual o prefixo de rede?
- [ ] Explique com suas palavras: por que a API usa `db` como hostname e não o IP?

---

## Questão 3: Healthcheck na Prática

**Conceito-chave:** Health check e prontidão com `depends_on` (Seção 9)
**Objetivo de Aprendizagem:** Configurar `depends_on` com `condition: service_healthy` e healthcheck
**Tempo estimado:** 10 minutos

**Contexto:** Sem healthcheck, a API pode tentar conectar ao PostgreSQL antes dele estar pronto. Você vai adicionar healthcheck e verificar a diferença no comportamento.

**Passos de Execução:**

1. Adicione o bloco `healthcheck` ao serviço `db` no `docker-compose.yml` usando `pg_isready -U postgres`.
2. Adicione `depends_on` com `condition: service_healthy` ao serviço `api`.
3. Execute `docker compose down` (se a stack estiver rodando).
4. Execute `docker compose up` novamente.
5. Observe nos logs a diferença de ordem de inicialização.
6. Execute `docker compose ps` e verifique o status do serviço `db`.

**Entrega:** crie `entregas-aula-02/q3-healthcheck.md`:

```markdown
# Questão 3 — Healthcheck na Prática

## Configuração
- Bloco `healthcheck` adicionado ao serviço `db` no YAML: [Sim/Não]
- `depends_on` com `condition: service_healthy` adicionado ao `api`: [Sim/Não]

## Verificação
- Status do `db` no `docker compose ps`: [preencher]

## Análise
[Qual linha do log indica que o PostgreSQL está pronto para conexões?]
```


- [ ] Bloco `healthcheck` adicionado ao serviço `db` no YAML
- [ ] `depends_on` com `condition: service_healthy` adicionado ao `api`
- [ ] Status do `db` no `docker compose ps` (deve mostrar `healthy`)
- [ ] Responda: qual linha do log indica que o PostgreSQL está pronto para conexões?

---

## Questão 4: Persistência de Volume

**Conceito-chave:** Volumes nomeados para persistência de dados (Seção 10)
**Objetivo de Aprendizagem:** Configurar volumes nomeados e verificar persistência
**Tempo estimado:** 10 minutos

**Contexto:** Sem volumes, os dados do PostgreSQL são perdidos quando a stack é derrubada. Você vai configurar um volume nomeado e verificar a persistência.

**Passos de Execução:**

1. Adicione `volumes: - pgdata:/var/lib/postgresql/data` ao serviço `db`.
2. Adicione `volumes: pgdata:` no nível raiz do YAML.
3. Execute `docker compose down` e depois `docker compose up`.
4. Conecte ao PostgreSQL: `docker compose exec db psql -U postgres -d mydb`.
5. Crie uma tabela e insira dados: `CREATE TABLE teste (id SERIAL, nome TEXT); INSERT INTO teste (nome) VALUES ('persistiu');`.
6. Execute `SELECT * FROM teste;` para confirmar.
7. Execute `docker compose down` (sem `-v`).
8. Execute `docker compose up` novamente.
9. Execute `SELECT * FROM teste;` — os dados sobreviveram?
10. Execute `docker volume ls` — o volume `pgdata` aparece?

**Entrega:** crie `entregas-aula-02/q4-persistencia-volume.md`:

```markdown
# Questão 4 — Persistência de Volume

## Configuração
- Volume nomeado `pgdata` adicionado e montado no serviço `db`: [Sim/Não]

## Verificação de persistência
- Dados criados no PostgreSQL antes do `down`: [Sim/Não]
- Dados ainda presentes após `down` e `up`: [Sim/Não]
- Volume `pgdata` listado em `docker volume ls`: [Sim/Não]

## Explicação
[Qual diretório do PostgreSQL o volume monta? Por que esse diretório?]
```


- [ ] Volume nomeado `pgdata` adicionado e montado no serviço `db`
- [ ] Dados criados no PostgreSQL antes do `down`
- [ ] Dados ainda presentes após `down` e `up` — Sim/Não
- [ ] Volume `pgdata` listado em `docker volume ls` — Sim/Não
- [ ] Responda: qual diretório do PostgreSQL o volume monta? Por que esse diretório?

---

## Questão 5: Alternando Entre Profiles

**Conceito-chave:** Profiles e ambientes múltiplos (Seção 11)
**Objetivo de Aprendizagem:** Implementar profiles `dev` e `prod` no mesmo arquivo Compose
**Tempo estimado:** 12 minutos

**Contexto:** Você precisa de comportamentos diferentes entre desenvolvimento (com nodemon e bind mount) e produção (imagem otimizada). Ambos devem ser descritos no mesmo `docker-compose.yml`.

**Passos de Execução:**

1. Crie um serviço `api-dev` com profile `dev`, bind mount (`.`, imagem local), `NODE_ENV=development` e nodemon como comando.
2. Crie um serviço `api-prod` com profile `prod`, sem bind mount, `NODE_ENV=production`.
3. Ambos devem depender do serviço `db` com `condition: service_healthy`.
4. Execute `docker compose --profile dev up` e verifique que o serviço `api-dev` está rodando.
5. Modifique o `server.js` (ex: mude a mensagem da rota), salve e veja o nodemon reiniciar automaticamente.
6. Pare com `Ctrl+C`.
7. Execute `docker compose --profile prod up` e verifique que o serviço `api-prod` está rodando (sem nodemon, sem hot reload).
8. Teste ambos com `curl http://localhost:3000`.

**Entrega:** crie `entregas-aula-02/q5-profiles.md`:

```markdown
# Questão 5 — Alternando Entre Profiles

## Configuração
- Serviço `api-dev` com profile `dev`, bind mount e nodemon: [Sim/Não]
- Serviço `api-prod` com profile `prod`: [Sim/Não]

## Verificação
- Hot reload funcionou no profile `dev`? [Sim/Não]
- Hot reload está presente no profile `prod`? [Sim/Não]

## Análise
[Qual a diferença prática entre profiles e `NODE_ENV`?]
```


- [ ] Serviço `api-dev` com profile `dev`, bind mount e nodemon
- [ ] Serviço `api-prod` com profile `prod`
- [ ] Hot reload funcionou no profile `dev`? (Sim/Não)
- [ ] Hot reload está presente no profile `prod`? (Sim/Não)
- [ ] Responda: qual a diferença prática entre profiles e `NODE_ENV`?

---

## Questão 6: Arquivo .env na Prática

**Conceito-chave:** Externalização de configuração com `.env` (Seção 11)
**Objetivo de Aprendizagem:** Externalizar configuração via arquivo `.env`
**Tempo estimado:** 8 minutos

**Contexto:** As variáveis de ambiente (senha, nome do banco, URL) estão hardcoded no YAML. Você vai externalizá-las para um arquivo `.env`.

**Passos de Execução:**

1. Crie o arquivo `.env` no diretório do projeto com: `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_USER` e `DATABASE_URL`.
2. Substitua os valores literais no `docker-compose.yml` por `${VARIAVEL}`.
3. Execute `docker compose --profile dev up` e verifique que a stack sobe normalmente.
4. Altere o valor de `POSTGRES_DB` no `.env` para `meubanco_teste`.
5. Execute `docker compose down` e `docker compose --profile dev up`.
6. Conecte ao PostgreSQL: `docker compose exec db psql -U postgres -d meubanco_teste`.
7. Verifique que o novo banco existe: `SELECT current_database();`.

**Entrega:** crie `entregas-aula-02/q6-env-file.md`:

```markdown
# Questão 6 — Arquivo .env na Prática

## Configuração
- Arquivo `.env` criado com as variáveis necessárias: [Sim/Não]
- YAML atualizado com `${VARIAVEL}` em vez de valores literais: [Sim/Não]

## Verificação
- Novo banco `meubanco_teste` acessível após alteração do `.env`: [Sim/Não]

## Explicação
[Por que foi necessário executar `docker compose down` antes de subir novamente?]
```


- [ ] Arquivo `.env` criado com as variáveis necessárias
- [ ] YAML atualizado com `${VARIAVEL}` em vez de valores literais
- [ ] Novo banco `meubanco_teste` acessível após alteração do `.env`
- [ ] Responda: por que foi necessário executar `docker compose down` antes de subir novamente?

---

## Questão 7: Diagnóstico de Erros

**Conceito-chave:** Troubleshooting de erros comuns do Compose (Seções 7, 9, 10, 11)
**Objetivo de Aprendizagem:** Diagnosticar e corrigir erros comuns em configurações Compose
**Tempo estimado:** 12 minutos

**Contexto:** Abaixo estão três cenários de erro comuns. Para cada um, identifique a causa e a correção. NÃO execute os comandos — apenas analise e responda.

**Cenário A:** Ao executar `docker compose up`, você recebe:
```
Service "api" refers to undefined build context
```

**Cenário B:** Você executou `docker compose --profile dev up` e recebeu:
```
Service "api-dev" not found
```

**Cenário C:** Você alterou a senha no `.env`, executou `docker compose up` (sem `down` primeiro), e a stack subiu com a senha antiga.

**Entrega:** crie `entregas-aula-02/q7-diagnostico-erros.md`:

```markdown
# Questão 7 — Diagnóstico de Erros

## Cenário A
- Causa: [preencher]
- Correção: [preencher]

## Cenário B
- Causa: [preencher]
- Correção: [preencher]

## Cenário C
- Causa: [preencher]
- Correção: [preencher]
```


- [ ] Cenário A — Causa: Correção:
- [ ] Cenário B — Causa: Correção:
- [ ] Cenário C — Causa: Correção:

---

## Questão 8: Reflexão FUNDAMENTOS — Mapeando Conceitos ao Compose

**Conceito-chave:** Aula 02, Parte 1 (Seções 1-5) e Parte 2 (docker-compose.yml)

**Objetivo de Aprendizagem:** **Explicar** como cada mecanismo universal de orquestração se materializa em uma implementação concreta de orquestração de containers

**Tempo estimado:** 10 minutos

**Contexto:** A aula foi estruturada em duas partes. Na Parte 1, você aprendeu 5 mecanismos universais de orquestração. Na Parte 2, viu como esses mecanismos são implementados na prática. Esta questão fecha o ciclo pedagógico — você deve conectar cada conceito abstrato à sua implementação concreta.

**Passos de Execução:**

1. Reveja as Seções 1-5 da aula principal (Coordenação Multiprocesso, Redes Virtuais, Health Check, Persistência, Configuração Declarativa).
2. Para cada um dos 5 mecanismos, identifique qual seção ou bloco do `docker-compose.yml` o implementa.
3. Escreva 1-2 frases explicando como a implementação se conecta ao mecanismo universal.

**Entrega:**

Preencha a tabela abaixo:

| Mecanismo Universal (Parte 1) | Seção do docker-compose.yml | Conexão (1-2 frases) |
|---|---|---|
| **Coordenação Multiprocesso** (Seção 1) | | |
| **Redes Virtuais e DNS** (Seção 2) | | |
| **Health Check** (Seção 3) | | |
| **Persistência de Estado** (Seção 4) | | |
| **Configuração Declarativa e Ambientes** (Seção 5) | | |

---

## Checklist Final

Antes de considerar esta aula concluída, verifique:

- [ ] Questão 1: Executei `docker compose up` e vi logs entrelaçados
- [ ] Questão 2: Verifiquei o DNS interno com `nslookup` ou Node.js
- [ ] Questão 3: Adicionei healthcheck e `depends_on` com `condition: service_healthy`
- [ ] Questão 4: Configurei volume nomeado e verifiquei persistência de dados
- [ ] Questão 5: Criei profiles `dev` e `prod` e alternei entre eles
- [ ] Questão 6: Externalizei variáveis para `.env` e alterei valores
- [ ] Questão 7: Identifiquei a causa e correção dos 3 cenários de erro
- [ ] Questão 8: Mapeei os 5 mecanismos universais de orquestração às seções do docker-compose.yml
- [ ] Sei usar os 7 comandos do Compose: up, down, ps, logs, exec, build, restart
- [ ] Entendo a diferença entre `depends_on`, healthcheck e a combinação dos dois
