---
titulo: "Aula 05 — Questões de Aprendizagem"
modulo: "Docker, Docker Compose e Registry"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 05: Docker Swarm — Orquestração Nativa em Cluster"
data: 2026-06-18
---

# Curso: Docker, Docker Compose e Registry — Aula 05 (Questões)

## Docker Swarm: Orquestração Nativa em Cluster

## Como Usar Este Arquivo

Este arquivo contém **questões de aprendizagem** para verificar se você realmente entendeu os conceitos da Aula 05. Cada questão testa um objetivo específico da aula.

**Como usar:**

1. Complete a leitura da Aula 05 e todos os Mão na Massa inline
2. Volte a este arquivo e resolva cada questão **sem consultar a aula** (exceto quando o passo pedir)
3. Se uma questão exigir comandos, execute-os no terminal
4. Crie a pasta `entregas-aula-05/` para armazenar suas entregas
5. Marque os checkboxes do Checklist Final conforme completar cada questão

**Dica:** Se você não consegue responder uma questão sem consultar a aula, releia a seção correspondente e tente novamente. O objetivo é que você consiga fazer **sem ajuda**.

---

## Questão 1: Por que Clusters Existem

**Conceito-chave:** Single-Host vs Multi-Host (Aula 05, Seção 1).

**Objetivo:** Explicar por que um único host não é suficiente para produção e como clusters resolvem os problemas fundamentais.

**Passos de Execução:**

1. Liste três problemas de rodar uma aplicação em single-host que clusters resolvem.
2. Para cada problema, explique como o orquestrador (cluster) resolve.
3. Escreva uma analogia própria (diferente das usadas na aula) comparando single-host com cluster.

**Entrega:** crie `entregas-aula-05/q1-clusters.md`:

```markdown
# Questão 1 — Por que Clusters Existem

## Problema 1: [nome do problema]
- Como o cluster resolve: [explicação]

## Problema 2: [nome do problema]
- Como o cluster resolve: [explicação]

## Problema 3: [nome do problema]
- Como o cluster resolve: [explicação]

## Analogia pessoal
[Escreva sua analogia comparando single-host com cluster]
```

---

## Questão 2: Reconciliation Loop na Prática

**Conceito-chave:** Estado Desejado e Reconciliation Loop (Aula 05, Seção 2).

**Objetivo:** Descrever o ciclo observe → diff → act e explicar como ele difere do modelo imperativo.

**Passos de Execução:**

1. Explique o que é estado desejado (desired state) e dê um exemplo concreto.
2. Descreva os três passos do reconciliation loop.
3. Compare o modelo declarativo (orquestrador) com o modelo imperativo (Compose): o que muda quando uma réplica falha em cada modelo?
4. (Opcional) Desenhe o diagrama do reconciliation loop — use sua ferramenta favorita ou descreva em texto.

**Entrega:** crie `entregas-aula-05/q2-reconciliation-loop.md`:

```markdown
# Questão 2 — Reconciliation Loop na Prática

## Definição de Estado Desejado
[Definição + exemplo concreto]

## Os Três Passos
1. Observe: [descrição]
2. Diff: [descrição]
3. Act: [descrição]

## Declarativo vs Imperativo
- No modelo declarativo (orquestrador), quando uma réplica falha: [descrição]
- No modelo imperativo (Compose), quando uma réplica falha: [descrição]
- Diferença fundamental: [explicação]
```

---

## Questão 3: Container vs Serviço Gerenciado

**Conceito-chave:** Serviços Gerenciados (Aula 05, Seção 3).

**Objetivo:** Distinguir um container efêmero de um serviço gerenciado em cluster, incluindo propriedades como self-healing, scheduling e distribuição.

**Passos de Execução:**

1. Execute um container com `docker run -d --name teste nginx:alpine` e mate o processo principal.
2. Agora crie um serviço Swarm com `docker service create --name servico-teste --replicas 2 nginx:alpine` e force a morte de uma réplica.
3. Compare os comportamentos: o que aconteceu em cada caso? Quanto tempo levou para o serviço se recuperar?

**Entrega:** crie `entregas-aula-05/q3-container-vs-servico.md`:

```markdown
# Questão 3 — Container vs Serviço Gerenciado

## Experimento 1: Container efêmero
- Comando usado: [docker run...]
- O que aconteceu quando o processo morreu: [descrição]
- O container foi recriado automaticamente? [Sim/Não]

## Experimento 2: Serviço gerenciado
- Comando usado: [docker service create...]
- O que aconteceu quando a réplica foi morta: [descrição]
- O serviço foi recriado automaticamente? [Sim/Não]
- Quanto tempo levou para a réplica voltar? [estimativa]

## Conclusão
[Em 2-3 frases: qual a diferença prática entre container e serviço?]
```

---

## Questão 4: Overlay Network e Service Discovery

**Conceito-chave:** Service Discovery e Overlay Network (Aula 05, Seção 4).

**Objetivo:** Verificar como a overlay network permite comunicação entre serviços em diferentes nós e como o load balancing funciona.

**Passos de Execução:**

1. Crie uma rede overlay no Swarm: `docker network create --driver overlay minha-overlay`
2. Crie um serviço `srv-a` com 2 réplicas conectado à overlay: `docker service create --name srv-a --network minha-overlay --replicas 2 nginx:alpine sleep 3600`
3. Crie um serviço `srv-b` com 1 réplica conectado à overlay: `docker service create --name srv-b --network minha-overlay nginx:alpine sleep 3600`
4. Entre em uma réplica do `srv-a` e tente resolver o DNS do `srv-b`: `docker exec -it <container_id> sh` e depois `nslookup srv-b` ou `ping srv-b`
5. Descreva o que observou.

**Entrega:** crie `entregas-aula-05/q4-overlay-network.md`:

```markdown
# Questão 4 — Overlay Network e Service Discovery

## Comandos executados
- [rede overlay criada]
- [srv-a criado com N réplicas]
- [srv-b criado]

## Resultado do DNS interno
- IP resolvido para `srv-b` a partir do `srv-a`: [preencher]
- O nome do serviço foi resolvido? [Sim/Não]

## Análise
[Qual a diferença entre essa rede overlay e a rede bridge da Aula 02?]
```

---

## Questão 5: Rolling Update com Healthcheck

**Conceito-chave:** Rolling Updates (Aula 05, Seções 5 e 10).

**Objetivo:** Executar um rolling update em um serviço Swarm com healthcheck e verificar zero downtime.

**Passos de Execução:**

1. Crie um serviço com healthcheck embutido: `docker service create --name health-test --publish published=8888,target=80 --replicas 3 nginx:alpine`
2. Em um terminal separado, execute um loop de `curl` para monitorar disponibilidade: `while true; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8888; sleep 1; done`
3. Em outro terminal, faça o rolling update: `docker service update --image httpd:alpine --update-parallelism 1 --update-delay 5s health-test`
4. Observe o monitor. O código HTTP mudou durante o update? (Nginx → Apache)
5. Reverta com rollback: `docker service rollback health-test`
6. Limpe: `docker service rm health-test`

**Entrega:** crie `entregas-aula-05/q5-rolling-update.md`:

```markdown
# Questão 5 — Rolling Update com Healthcheck

## Configuração
- Serviço criado: [comando]
- Número de réplicas: [N]
- Paralelismo do update: [1]
- Delay entre atualizações: [5s]

## Observação do monitor
- Houve HTTP 503 ou erro durante o update? [Sim/Não]
- Quantas requisições foram perdidas? [0 / alguma]
- O rollback foi instantâneo? [Sim/Não]

## Análise
[Por que o rolling update funciona sem downtime mesmo trocando a imagem inteira (nginx → httpd)?]
```

---

## Questão 6: Projeto Progressivo — Convertendo Compose em Stack

**Conceito-chave:** Stack Deploy (Aula 05, Seções 9 e 11).

**Objetivo:** Converter o `docker-compose.yml` da Aula 02 em um stack YAML para Swarm, adicionando chaves `deploy:` e secrets.

**Passos de Execução:**

1. Copie seu `docker-compose.yml` da Aula 02 (API + PostgreSQL) para `stack-aula05.yml`
2. Adicione as chaves `deploy:`:
   - API: 3 réplicas, rolling update com parallelism 1, delay 10s, failure_action rollback, limite de memória 256MB
   - PostgreSQL: 1 réplica, constraint `node.role == manager`
3. Converta a senha do PostgreSQL de variável de ambiente para secret:
   - Crie o secret: `echo "minhasenhaforte123" | docker secret create db_password_aula05 -`
   - No YAML, declare `secrets:` com `external: true`
   - No PostgreSQL, use `POSTGRES_PASSWORD_FILE=/run/secrets/db_password_aula05`
4. Implante: `docker stack deploy -c stack-aula05.yml app-aula05`
5. Verifique: `docker stack services app-aula05` e `docker stack ps app-aula05`
6. Teste: `curl http://localhost:3000`
7. Remova: `docker stack rm app-aula05` e `docker secret rm db_password_aula05`

**Entrega:** crie `entregas-aula-05/q6-stack-deploy.md`:

```markdown
# Questão 6 — Projeto Progressivo: Convertendo Compose em Stack

## Arquivo stack-aula05.yml
[Cole o conteúdo completo do stack-aula05.yml]

## Secret criado
- Nome: [db_password_aula05]
- Comando usado: [echo... | docker secret create...]

## Resultado do deploy
- Serviços criados: [lista]
- Número de réplicas da API: [3]
- Status esperado: [3/3]

## Teste
- `curl http://localhost:3000` retornou resposta? [Sim/Não]

## Reflexão
[Quais diferenças você notou entre o docker-compose.yml original e o stack YAML? O que a chave deploy: adiciona que não existia antes?]
```

---

## Questão 7: Diagnóstico de Erros no Swarm

**Conceito-chave:** Troubleshooting de erros comuns (Aula 05, Seções 7-10).

**Objetivo:** Diagnosticar e corrigir erros comuns em operações com cluster Swarm.

**Passos de Execução:**

Analise os cenários abaixo sem executar — apenas explique a causa e a correção.

**Cenário A:** Você executou `docker stack deploy -c stack.yml minha-app` e recebeu:
```
this node is not a swarm manager. Use "docker swarm init" or "docker swarm join" to connect this node to swarm and try again
```

**Cenário B:** Você criou o secret com `echo "senha" | docker secret create db_pass -` e executou `docker stack deploy -c stack.yml minha-app`. O YAML tem `secrets: db_pass: external: true`, mas o deploy falhou com:
```
secret "db_pass" not found
```

**Cenário C:** Você executou `docker service update --image nginx:alpine meuapp_api` e as réplicas foram atualizadas, mas o serviço parou de responder. O que pode ter acontecido?

**Entrega:** crie `entregas-aula-05/q7-diagnostico.md`:

```markdown
# Questão 7 — Diagnóstico de Erros no Swarm

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

---

## Questão 8: Reflexão FUNDAMENTOS — Mapeando Conceitos ao Swarm

**Conceito-chave:** Aula 05, Parte 1 (Seções 1-6) e Parte 2 (Seções 7-11).

**Objetivo:** Conectar cada mecanismo universal de orquestração em cluster à sua implementação concreta no Docker Swarm.

**Passos de Execução:**

1. Reveja as Seções 1-6 da aula principal (Single-Host → Cluster, Estado Desejado, Serviços Gerenciados, Service Discovery, Rolling Updates, Secrets).
2. Para cada um dos 6 mecanismos, identifique qual seção ou comando do Docker Swarm o implementa.
3. Escreva 1-2 frases explicando como a implementação se conecta ao mecanismo universal.

**Entrega:** crie `entregas-aula-05/q8-mapeamento-conceitual.md`:

Preencha a tabela abaixo:

```markdown
# Questão 8 — Mapeamento Conceitual: FUNDAMENTOS → Swarm

| Mecanismo Universal (Parte 1) | Implementação no Swarm (Parte 2) | Conexão (1-2 frases) |
|---|---|---|
| **Single-Host → Cluster** (Seção 1) | | |
| **Estado Desejado e Reconciliation Loop** (Seção 2) | | |
| **Serviços Gerenciados** (Seção 3) | | |
| **Service Discovery e Load Balancing** (Seção 4) | | |
| **Rolling Updates** (Seção 5) | | |
| **Secrets e Configs** (Seção 6) | | |
```

---

## Checklist Final: Pronto para a Aula 06?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Questão 1: Expliquei os três problemas de single-host que clusters resolvem
- [ ] Questão 2: Descrevi o reconciliation loop (observe → diff → act) e comparei declarativo vs imperativo
- [ ] Questão 3: Diferenciei container efêmero de serviço gerenciado com experimento prático
- [ ] Questão 4: Criei uma overlay network e verifiquei o DNS interno entre serviços
- [ ] Questão 5: Executei rolling update com monitoramento contínuo e confirmei zero downtime
- [ ] Questão 6: Converti o docker-compose.yml da Aula 02 em stack YAML com deploy: e secrets
- [ ] Questão 7: Diagnostiquei e corrigi erros comuns (Swarm não inicializado, secret não encontrado)
- [ ] Questão 8: Mapeei os 6 mecanismos universais da Parte 1 às implementações concretas no Swarm
- [ ] Sei os 10 comandos Swarm: init, join, node ls, service create/ls/ps/update/rollback, stack deploy, secret create
- [ ] Entendo a diferença entre docker compose up (single-host) e docker stack deploy (cluster)

> *Acertou todos? Você está pronto para a Aula 06, onde vai traduzir todo este conhecimento para o Kubernetes — o orquestrador padrão da indústria. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
