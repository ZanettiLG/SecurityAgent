---
titulo: "Aula 05: Docker Swarm — Orquestração Nativa em Cluster"
modulo: "Docker, Docker Compose e Registry"
duracao_estimada: "120 minutos"
nivel: "intermediario-avancado"
tags: [docker, swarm, orquestracao, cluster, raft, services, secrets, rolling-update, stack-deploy]
data: 2026-06-18
---

# Curso: Docker, Docker Compose e Registry — Aula 05

## Docker Swarm: Orquestração Nativa em Cluster

**Duração estimada:** 120 minutos (55 de leitura + 65 de prática)
**Nível:** Intermediário-Avançado
**Pré-requisitos:** Docker Engine instalado (Aula 01), Docker Compose funcional com stack multi-serviço (Aula 02), imagem versionada publicada no Docker Hub (Aula 03), e pipeline CI/CD automatizado com GitHub Actions (Aula 04)

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

- [ ] **Explicar** por que um único host não escala para produção e como clusters resolvem alta disponibilidade e escalabilidade horizontal
- [ ] **Definir** o modelo de estado desejado (desired state) e o reconciliation loop como mecanismo universal de orquestradores
- [ ] **Distinguir** containers efêmeros de serviços gerenciados com réplicas, self-healing e scheduling automático
- [ ] **Descrever** service discovery e load balancing em cluster: DNS interno round-robin e overlay networks
- [ ] **Explicar** rolling updates como padrão de deploy sem downtime e rollback como safety net
- [ ] **Comparar** gestão de configuração e secrets em single-host (`.env`) vs cluster (secrets criptografados e distribuídos)
- [ ] **Criar** um cluster Swarm multi-node com `docker swarm init` e `docker swarm join`
- [ ] **Implantar** serviços com `docker service create --replicas` e verificar convergência com `docker service ps`
- [ ] **Converter** o `docker-compose.yml` da Aula 02 em stack YAML com chaves `deploy:` e implantar com `docker stack deploy`
- [ ] **Executar** rolling update com `docker service update --image` e rollback com `docker service rollback`

---

## Como Usar Esta Aula

Esta aula está organizada em **duas partes** com uma transição explícita entre elas.

A **primeira parte** (FUNDAMENTOS) cobre os mecanismos universais de orquestração em cluster — estado desejado, reconciliation loop, serviços gerenciados, service discovery, rolling updates e secrets distribuídos. Estes conceitos são apresentados de forma genérica: valem para qualquer orquestrador de containers. São ancorados em **problemas que você já conhece**: single host que não escala, deploy manual com downtime, senhas em variáveis de ambiente.

A **segunda parte** (APLICAÇÃO) conecta cada mecanismo à sua implementação concreta no Docker Swarm. Aqui a didática muda: você primeiro **faz** (inicializa o cluster, cria serviços, implanta a stack), depois **entende** (a arquitetura por trás de cada comando).

Ao longo do caminho, você encontrará seções **"Mão na Massa"** com passos práticos para executar no seu terminal, e **"Quick Check"** ao final de cada seção para verificar se você absorveu o conceito.

**Tempo estimado:** 55 minutos de leitura + 65 minutos de prática.

---

## Mapa Mental

Este diagrama mostra todos os conceitos que você vai dominar nesta aula:


![Mapa mental: Docker Swarm — Orquestração Nativa em Cluster](images/diagrama-01-mindmap.png)

---

## Recapitulação das Aulas Anteriores

| Aula | Conceito | Onde aparece nesta aula | Como se conecta |
|---|---|---|---|
| Aula 01 | **Dockerfile multi-stage** (Seção 10) | Seções 8-9 — imagem buildada | A mesma imagem que você construiu é usada no cluster — o Swarm não reinventa o build |
| Aula 02 | **docker-compose.yml** (Seção 8) | Seção 9 — stack deploy | O stack YAML é uma evolução direta do Compose com as chaves `deploy:` — você já tem 80% do arquivo pronto |
| Aula 02 | **DNS interno** (Seção 2) | Seção 7 — overlay network | O DNS por nome de serviço que você viu na bridge agora escala para múltiplos hosts com overlay |
| Aula 03 | **Registry e tags SemVer** (Seção 4) | Seções 8-10 — `docker service update --image` | O rolling update puxa a nova tag da imagem do registry — versionamento não é opcional |
| Aula 03 | **GitHub Actions push** (Seção 7) | Seção 9 — pipeline CI/CD | O workflow que builda e publica a imagem agora pode disparar o deploy no Swarm automaticamente |
| Aula 04 | **Pipeline multi-ambiente** (Seção 4) | Seção 10 — staging vs production | Ambientes do GitHub Actions mapeiam para stacks separadas no Swarm com secrets diferentes |

---

**FUNDAMENTOS: Mecanismos Universais de Orquestração em Cluster**

> *"Os conceitos desta seção são universais — valem para qualquer orquestrador de containers. Na segunda parte, você verá como o Docker Swarm implementa cada um deles. Aqui, o foco está no 'por que' e 'como funciona', ancorado em problemas que você já enfrentou com single-host."*

---

## 1. Single-Host → Multi-Host — Por que Orquestração Existe

Você tem uma stack que funciona. API + PostgreSQL sobem com `docker compose up`. Healthchecks garantem ordem. Volumes preservam dados. Profiles separam dev de prod. Tudo funciona — **na sua máquina**.

Quando você tenta colocar essa stack em produção, o cenário muda:

**O host cai.** Não importa se é um VPS, um servidor dedicado ou uma VM na nuvem — hardware falha, kernel panic, energia acaba. Enquanto sua stack está em uma única máquina, **ela tem um ponto único de falha**. Se o servidor reinicia, sua aplicação fica fora do ar até alguém rodar `docker compose up` novamente.

**O tráfego cresce.** Sua API responde em 50ms com 100 usuários simultâneos. Com 10.000, ela começa a degradar. Com 50.000, o Node.js entra em thrashing. A solução óbvia é rodar mais instâncias da API — mas como fazer isso em uma única máquina? Cedo ou tarde você esgota CPU, RAM e conexões de rede.

**Manutenção exige downtime.** Precisa atualizar a imagem da API? `docker compose down`, `docker compose up` — a aplicação fica fora do ar durante o deploy. Para uma aplicação crítica, 30 segundos de downtime já são inaceitáveis.

### O Salto de Single-Host para Cluster

Um **cluster** é um conjunto de máquinas (nós) que se comportam como um único recurso computacional. Em vez de uma única máquina rodando seus containers, você tem N máquinas coordenadas por um **orquestrador**.

O orquestrador resolve os três problemas acima simultaneamente:

- **Alta disponibilidade**: se um nó cai, o orquestrador move os containers para outro nó automaticamente
- **Escalabilidade horizontal**: você diz "quero 5 instâncias da API" e o orquestrador distribui entre os nós disponíveis
- **Deploy sem downtime**: você atualiza uma réplica por vez enquanto as outras continuam atendendo tráfego


![Diagrama: Single host (um ponto de falha) vs Cluster (múltiplos nós, alta disponibilidade)](images/diagrama-02-diagram.png)

> *"Single host é um monociclo: elegante, mas se algo quebra, você cai. Cluster é um carro com 4 rodos: se um pneu fura, os outros três levam você até o borracheiro."*

### Quick Check 1

**1. Quais três problemas de produção o salto de single-host para cluster resolve?**
**Resposta:** (1) Alta disponibilidade — se um nó cai, o orquestrador move os containers; (2) Escalabilidade horizontal — múltiplas réplicas da API nos nós disponíveis; (3) Deploy sem downtime — atualiza uma réplica por vez enquanto as outras atendem.

**2. Por que simplesmente subir mais containers `docker run` na mesma máquina não resolve o problema de escalabilidade real?**
**Resposta:** Porque a máquina tem recursos finitos (CPU, RAM, rede). Mesmo com vários containers, todos compartilham o mesmo kernel e os mesmos recursos físicos. Para escalar de verdade, você precisa de múltiplas máquinas — um cluster.

---

## 2. Estado Desejado — Reconciliation Loop

Você declarou serviços no `docker-compose.yml`: "quero uma API na porta 3000 e um PostgreSQL." O Docker Compose criou exatamente o que você pediu. Mas se a API falhasse e o container morresse, o Compose não faria nada — você precisava rodar `docker compose up` de novo.

Isso funciona para desenvolvimento. Para produção, não.

### Desired State

O **estado desejado** (desired state) é uma declaração: "é assim que eu quero que o sistema esteja." Exemplos:

- "Quero 3 réplicas da API executando a imagem `minha-api:1.2.0`"
- "Quero que a API esteja acessível na porta 80"
- "Quero que o PostgreSQL tenha 10 GB de armazenamento persistente"
- "Quero que, se uma réplica falhar, outra seja criada automaticamente em qualquer nó disponível"

Você não diz **como** fazer (comandos imperativos). Você diz **o que quer** (declaração declarativa). O orquestrador descobre o caminho.

### Reconciliation Loop

O **reconciliation loop** é o motor que faz o estado desejado virar realidade. Ele funciona em três passos contínuos:

1. **Observe**: o orquestrador consulta o estado atual do cluster — quantas réplicas estão rodando, em quais nós, com quais imagens
2. **Compare (diff)**: ele compara o estado atual com o estado desejado que você declarou
3. **Act**: se há diferença (réplicas a menos, imagem errada), ele executa ações para convergir

Esse loop roda **para sempre**, não apenas uma vez. Se uma réplica falha, o loop detecta no passo 1 (estado atual = réplicas a menos) e cria uma nova no passo 3. Se você atualiza a imagem, o loop detecta a diferença e substitui as réplicas gradualmente.


![Diagrama: Reconciliation loop — observe, diff, act em ciclo contínuo](images/diagrama-03-diagram.png)

> *"Reconciliation loop é o termostato da sua aplicação. Você programa a temperatura desejada (22°C). O termostato mede a temperatura atual, compara com a desejada e liga/desliga o ar condicionado para convergir. E continua medindo — para sempre."*

### Quick Check 2

**1. Qual a diferença entre desired state (Compose) e reconciliation loop (orquestrador)?**
**Resposta:** O Compose aplica o estado desejado uma vez e para. O orquestrador aplica o estado desejado e continua monitorando, corrigindo automaticamente qualquer desvio (réplica morta, nó falho, imagem desatualizada).

**2. Quais são os três passos do reconciliation loop? Descreva o que cada um faz.**
**Resposta:** (1) Observe — consulta o estado atual do cluster; (2) Compare (diff) — compara com o estado desejado; (3) Act — executa ações para eliminar a diferença. O ciclo se repete continuamente.

---

## 3. Serviços Gerenciados — Container Efêmero → Serviço Resiliente

Você conhece `docker run`. Ele cria um container, executa um processo e — quando o processo termina — o container para. Se o processo falha, o container falha. Você precisa de um supervisor externo (`--restart always`) para reiniciá-lo.

Em cluster, o conceito evolui de **container** para **serviço**.

### O que é um Serviço Gerenciado?

Um **serviço** é uma abstração que declara:

- **Quantas réplicas** do container você quer rodando simultaneamente
- **Qual imagem** cada réplica deve usar
- **Em quais portas** o serviço deve estar acessível
- **Qual política de restart** (falhou? reinicia em qualquer nó disponível)
- **Qual política de atualização** (rolling update com quantas réplicas paralelas)

O orquestrador gerencia o ciclo de vida completo de cada réplica: criação, monitoramento, reinicialização em falha, substituição em atualização.

### Propriedades de um Serviço Gerenciado

1. **Self-healing**: se uma réplica morre (OOM, segfault, nó cai), o reconciliation loop cria uma substituta automaticamente
2. **Scheduling**: o orquestrador decide em qual nó cada réplica será executada, baseado em recursos disponíveis e restrições
3. **Distribuição**: réplicas são espalhadas entre os nós para maximizar disponibilidade
4. **Rolling updates**: atualizações são feitas gradualmente, réplica por réplica, sem downtime

### Comparação

| Aspecto | Container (`docker run`) | Serviço Gerenciado |
|---|---|---|
| Ciclo de vida | Até o processo terminar | Perpétuo — orquestrador mantém |
| Falha | Container morre | Reconciliation loop recria |
| Escala | Manual (novo `docker run`) | Declarativa (`--replicas 5`) |
| Distribuição | Apenas no host local | Distribuído entre nós do cluster |
| Atualização | `docker stop` + `docker run` | Rolling update automático |

> *"Container é um operário individual: trabalha enquanto está de pé, se cair precisa de alguém para levantar. Serviço é um turno inteiro de fábrica: o supervisor garante que sempre haja N operários trabalhando, substitui quem cai e troca o turno gradualmente sem parar a produção."*

### Quick Check 3

**1. Qual a diferença fundamental entre container efêmero e serviço gerenciado?**
**Resposta:** O container efêmero vive até o processo terminar — se falha, precisa de intervenção externa. O serviço gerenciado declara um estado desejado (N réplicas) e o orquestrador mantém esse estado para sempre, recriando réplicas que falham.

**2. Quais quatro propriedades um serviço gerenciado oferece que um container simples não oferece?**
**Resposta:** Self-healing (recria automaticamente), scheduling (decide em qual nó rodar), distribuição (espalha entre os nós), e rolling updates (atualiza gradualmente sem downtime).

---

## 4. Service Discovery e Load Balancing em Cluster

Na Aula 02, você viu como o Docker Compose cria uma rede bridge com DNS interno. A API acessa o banco pelo nome `db:5432` — sem precisar saber o IP do container do PostgreSQL.

Em cluster, esse padrão precisa funcionar **entre hosts diferentes**. Uma réplica da API no nó 1 precisa encontrar uma réplica do banco no nó 2.

### Overlay Network

Uma **overlay network** é uma rede virtual que atravessa múltiplos hosts. Cada nó do cluster participa dessa rede, e containers em qualquer nó podem se comunicar como se estivessem na mesma máquina.

O tráfego entre containers em nós diferentes é encapsulado (tunelado) e roteado pelo host de cada nó. O container não sabe — nem precisa saber — em qual host físico sua réplica vizinha está rodando.

### DNS Round-Robin Interno

Quando você cria um serviço com múltiplas réplicas, o orquestrador registra cada réplica no DNS interno do cluster. Consultar o nome do serviço retorna **todos os IPs** das réplicas. O cliente escolhe um — tipicamente o primeiro — mas o DNS alterna a ordem a cada consulta (round-robin).

### Load Balancing

Além do DNS round-robin, o orquestrador implementa um **load balancer interno** na porta do serviço. Quando você publica uma porta (ex: 80), qualquer nó do cluster que receber uma requisição nessa porta encaminha para uma réplica saudável — mesmo que a réplica esteja em outro nó.

Isso significa que você pode apontar um único IP (o de qualquer nó do cluster) e o tráfego será balanceado automaticamente entre todas as réplicas, independentemente de onde elas estão rodando.


![Diagrama: Load balancer distribui requisições entre réplicas em nós diferentes, todas acessam o mesmo banco via overlay network](images/diagrama-04-diagram.png)

> *"Overlay network é um túnel privado entre todos os nós do cluster. O container não sabe se sua réplica vizinha está no mesmo host ou em outro continente — o túnel faz parecer que estão na mesma máquina."*

### Quick Check 4

**1. Como uma overlay network resolve o problema de comunicação entre containers em hosts diferentes?**
**Resposta:** A overlay network cria uma rede virtual que encapsula o tráfego entre containers em hosts diferentes. Cada nó participa da overlay, e containers em qualquer nó se comunicam como se estivessem na mesma máquina, sem precisar saber em qual host físico a outra réplica está.

**2. O que é DNS round-robin em um cluster e como ele distribui tráfego?**
**Resposta:** DNS round-robin é um mecanismo onde o servidor DNS retorna todos os IPs das réplicas de um serviço em ordem alternada a cada consulta. O cliente recebe um IP diferente a cada resolução, distribuindo o tráfego entre as réplicas.

---

## 5. Rolling Updates — Deploy Sem Downtime

Você tem 5 réplicas da API rodando. Você publicou uma nova versão (`1.2.0`) e quer que todas as réplicas atualizem. Se você parar tudo e subir de novo, a aplicação fica fora do ar durante o deploy.

### O Padrão Rolling Update

**Rolling update** substitui as réplicas gradualmente, uma (ou algumas) por vez, enquanto as demais continuam atendendo tráfego. O processo é:

1. Você declara o novo estado desejado: "imagem `minha-api:1.2.0`, 5 réplicas"
2. O orquestrador pega uma réplica da versão antiga, drena as conexões ativas e a substitui pela nova
3. Espera a nova réplica ficar saudável (healthcheck)
4. Passa para a próxima réplica
5. Repete até todas as 5 estarem atualizadas

### Parâmetros de um Rolling Update

- **Parallelism**: quantas réplicas são atualizadas simultaneamente (ex: 2 de cada vez)
- **Delay**: tempo de espera entre lotes de atualização (ex: 10s)
- **Failure action**: o que fazer se a nova réplica não ficar saudável — parar (rollback automático) ou continuar
- **Healthcheck**: verificação que confirma que a nova réplica está pronta antes de matar a próxima

### Rollback como Safety Net

Se a nova versão apresenta problemas (erro em produção, degradação de performance), o **rollback** reverte todas as réplicas para a versão anterior em um único comando. O orquestrador mantém o histórico da última configuração estável.


![Diagrama: Rolling update — réplicas substituídas uma a uma, sem downtime](images/diagrama-05-diagram.png)

> *"Rolling update é como trocar os pneus de um carro em movimento: você levanta uma roda por vez, troca o pneu, abaixa e passa para a próxima. O carro nunca para. Rollback é voltar para os pneus anteriores — se o novo pneu furou na primeira curva."*

### Quick Check 5

**1. Descreva o processo de rolling update em 3 passos.**
**Resposta:** (1) Você declara o novo estado desejado (imagem nova, mesmo número de réplicas); (2) O orquestrador substitui uma réplica por vez (drena a antiga, cria a nova, verifica healthcheck); (3) Repete até todas as réplicas estarem atualizadas.

**2. O que acontece se a nova réplica de um rolling update não passa no healthcheck?**
**Resposta:** Depende do `failure_action` configurado. Se for `pause` (padrão), o update para e mantém as réplicas antigas rodando. Se for `rollback`, ele reverte automaticamente todas as réplicas para a versão anterior.

---

## 6. Configuração e Secrets em Escala de Cluster

Na Aula 02, você externalizou configuração via arquivo `.env`. As variáveis de ambiente eram injetadas nos containers na inicialização. Isso funciona em single-host, mas em cluster o cenário é mais complexo:

- **Distribuição**: como garantir que o arquivo `.env` chegue a todos os nós do cluster?
- **Criptografia**: senhas e tokens trafegam em texto plano no YAML e no disco
- **Rotação**: como trocar uma senha sem reiniciar todos os serviços?

### Secrets em Cluster

Um **secret** é um dado sensível (senha, token, chave SSH) gerenciado pelo orquestrador de forma segura:

- **Criptografado em trânsito**: transferido do manager para o worker por TLS
- **Criptografado em repouso**: armazenado no disco do manager criptografado com a chave do cluster
- **Montado como arquivo**: o container acessa o secret como um arquivo em `/run/secrets/`, não como variável de ambiente (evita leak em logs e `docker inspect`)
- **Atualizável sem redeploy**: você pode atualizar o secret e reiniciar apenas o serviço que o consome

### Configs (Não Sensíveis)

Uma **config** é similar a um secret, mas para dados não sensíveis (arquivos de configuração, certificados públicos, scripts). A diferença principal: configs não são criptografadas em repouso (apenas em trânsito).

### Por que Não Variáveis de Ambiente?

Variáveis de ambiente são visíveis em:

- `docker inspect` do container
- Logs de aplicação (se um log acidentalmente imprime `process.env`)
- Qualquer processo filho que herde o environment
- Interfaces de depuração e admin

Em cluster, o padrão é **sempre** usar secrets para dados sensíveis e configs para dados não sensíveis.

> *"Secrets são o cofre do cluster. Variáveis de ambiente são post-its na tela do monitor — todo mundo vê. Secrets são documentos dentro do cofre — só quem tem a chave (e permissão) acessa."*

### Quick Check 6

**1. Quais três vantagens secrets têm sobre variáveis de ambiente em cluster?**
**Resposta:** (1) Criptografados em trânsito e em repouso (não trafegam em texto plano); (2) Montados como arquivo em vez de variável de ambiente (evita leak em logs e `docker inspect`); (3) Distribuídos automaticamente para todos os nós do cluster.

**2. Qual a diferença entre secret e config no contexto de cluster?**
**Resposta:** Secret é para dados sensíveis (senhas, tokens, chaves) — criptografado em trânsito e em repouso. Config é para dados não sensíveis (arquivos de config, scripts) — criptografado apenas em trânsito, mas não em repouso.

---

**APLICAÇÃO: Docker Swarm — Orquestração em Cluster Nativa do Docker**

> *"Agora que você entende os mecanismos universais de orquestração — estado desejado, reconciliation loop, serviços gerenciados, service discovery, rolling updates e secrets — vamos conectá-los à prática com o Docker Swarm, o orquestrador nativo embutido no Docker Engine."*

---

## 7. Arquitetura Swarm — Managers, Workers e Consenso

O Docker Swarm é o **orquestrador nativo** do Docker. Ele não é uma ferramenta separada — está embutido no próprio Docker Engine desde a versão 1.12 (2016). Você não instala nada novo: `docker swarm init` ativa o modo Swarm no seu engine.

### Nós: Managers e Workers

Um cluster Swarm tem dois tipos de nó:

- **Manager node**: executa o **control plane** do cluster. Gerencia o estado, agenda serviços, mantém o consenso. Por segurança, managers também podem executar workloads (em clusters pequenos e de desenvolvimento).
- **Worker node**: executa apenas workloads (containers). Não participa do consenso nem do gerenciamento do cluster. É um "executor puro".

### Raft Consensus

Os managers usam o algoritmo **Raft** para manter o estado do cluster consistente entre si. Raft garante que:

- Todos os managers concordam sobre o estado atual do cluster (quantos nós, quais serviços, quais réplicas)
- Se o manager líder falha, outro manager assume automaticamente
- Com N managers, o cluster tolera a falha de até (N-1)/2 managers (ex: 3 managers toleram 1 falha)


![Diagrama: Arquitetura Swarm — managers com consenso Raft, workers executando réplicas](images/diagrama-06-diagram.png)

### Mão na Massa 1 — Inicializando o Cluster Swarm

Você vai inicializar um cluster Swarm com 1 manager e 2 workers — tudo na mesma máquina, usando Docker-in-Docker. Na prática, cada nó seria uma máquina separada.

**Passo 1: Inicializar o manager**

```bash
# No seu terminal Docker host
docker swarm init --advertise-addr 127.0.0.1
```

Output esperado:
```
Swarm initialized: current node (xxxxx) is now a manager.
To add a worker to this swarm, run the following command:
    docker swarm join --token SWMTKN-1-xxxxx 127.0.0.1:2377
```

**Passo 2: Verificar o nó manager**

```bash
docker node ls
```

Output esperado:
```
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS   ENGINE VERSION
xxxxx *                       hostname   Ready     Active         Reachable        24.0.0
```

O asterisco `*` indica o nó atual. O status `MANAGER STATUS = Reachable` confirma que é um manager.

**Passo 3: Adicionar workers (Docker-in-Docker)**

Para simular workers sem máquinas adicionais, você pode iniciar nós efêmeros com o comando abaixo. Se estiver usando Docker Desktop ou Linux nativo, você pode pular para o exercício com múltiplos terminais. O importante é entender a mecânica:

```bash
# Em um novo terminal ou sessão, execute o token de join
# Substitua TOKEN pelo token que você recebeu no passo 1
docker swarm join --token <TOKEN> 127.0.0.1:2377
```

**Verificação:**

```bash
docker node ls
```

Agora você deve ver o manager (STATUS = Ready, MANAGER STATUS = Leader) e os workers (STATUS = Ready, MANAGER STATUS vazio).

**Passo 4: Promover um worker a manager (opcional)**

```bash
docker node promote <NODE_ID>
```

**Passo 5: Ver detalhes do cluster**

```bash
docker info | grep -i swarm
```

---

### Quick Check 7

**1. Qual a diferença entre manager node e worker node no Swarm?**
**Resposta:** Manager executa o control plane do cluster — gerencia estado, agenda serviços, mantém consenso Raft. Worker executa apenas workloads (containers). Managers podem executar workloads também, mas workers nunca participam do gerenciamento.

**2. O que o algoritmo Raft garante em um cluster com 3 managers?**
**Resposta:** Raft garante que todos os managers concordam sobre o estado do cluster. Com 3 managers, o cluster tolera a falha de 1 manager (até (N-1)/2 falhas). Se o líder cai, outro manager assume automaticamente.

---

## 8. Services — docker service create com Réplicas

Agora que o cluster está de pé, você vai implantar seu primeiro **serviço gerenciado** — a API Express da Aula 01 como um serviço Swarm.

### Conceito

No Swarm, `docker service create` substitui `docker run` para workloads gerenciadas pelo cluster. Em vez de "rode este container", você declara "mantenha N réplicas deste container".

### Mão na Massa 2 — Implantando Serviços com Réplicas

**Passo 1: Criar um serviço simples**

```bash
docker service create \
  --name api-nginx \
  --publish published=8080,target=80 \
  --replicas 3 \
  nginx:alpine
```

Este comando declara: "Quero 3 réplicas do nginx:alpine, acessíveis na porta 8080."

**Passo 2: Verificar o serviço**

```bash
docker service ls
```

Output esperado:
```
ID             NAME        MODE         REPLICAS   IMAGE
xxxxx          api-nginx   replicated   3/3        nginx:alpine
```

`3/3` significa que o estado desejado é 3 réplicas e todas as 3 estão rodando.

**Passo 3: Ver onde as réplicas estão**

```bash
docker service ps api-nginx
```

Output esperado:
```
ID             NAME            IMAGE          NODE          DESIRED STATE   CURRENT STATE
xxxxx          api-nginx.1     nginx:alpine   worker1       Running         Running about a minute
xxxxx          api-nginx.2     nginx:alpine   worker2       Running         Running about a minute
xxxxx          api-nginx.3     nginx:alpine   manager1      Running         Running about a minute
```

Observe que as réplicas foram distribuídas entre os nós do cluster.

**Passo 4: Testar o load balancing**

```bash
curl -s http://localhost:8080 | head -5
curl -s http://localhost:8080 | head -5  # Execute de novo — note o round-robin
```

**Passo 5: Escalar o serviço**

```bash
docker service scale api-nginx=5
```

Repita `docker service ps api-nginx` e veja 2 novas réplicas sendo criadas.

**Passo 6: Remover o serviço**

```bash
docker service rm api-nginx
```

---

### Quick Check 8

**1. Qual comando substitui `docker run` no Swarm e qual informação adicional ele exige?**
**Resposta:** `docker service create` substitui `docker run`. Além das informações de um `docker run` (imagem, portas, volumes), ele exige `--replicas N` (quantas réplicas manter) e pode receber `--name` para nomear o serviço.

**2. O que `docker service ps <serviço>` mostra que `docker ps` não mostraria?**
**Resposta:** `docker service ps` mostra em qual nó cada réplica está rodando, o estado desejado vs estado atual de cada réplica, e o histórico de réplicas (incluindo réplicas que falharam e foram substituídas).

---

## 9. Stack Deploy — Evolução do Compose para Swarm

Você tem um `docker-compose.yml` da Aula 02 com API + PostgreSQL. Para implantar essa stack no cluster Swarm, você poderia criar cada serviço manualmente com `docker service create`. Mas o Swarm oferece uma abordagem muito mais elegante: **stack deploy**.

### Stack Deploy

`docker stack deploy` lê o mesmo formato YAML que você já conhece do Compose e cria/atualiza todos os serviços no cluster. A diferença: o Compose roda em single-host, e o stack deploy roda no cluster.

### Chaves deploy:

O Compose YAML ganha uma chave extra: `deploy:`. Dentro dela, você configura comportamentos específicos do Swarm:

```yaml
services:
  api:
    image: usuario/minha-api:1.0.0
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: any
        delay: 5s
```

### Mão na Massa 3 — Convertendo Compose em Stack

**Passo 1: Criar o arquivo stack.yml**

Crie `stack.yml` no diretório do projeto:

```yaml
version: '3.8'

services:
  api:
    image: seu-usuario/minha-api:1.0.0  # Substitua pela sua imagem do Docker Hub
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      - db
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: any
        delay: 5s
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
    volumes:
      - pgdata:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager  # DB em nó estável
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s

volumes:
  pgdata:
```

**Passo 2: Criar o arquivo .env**

```bash
POSTGRES_PASSWORD=minhasenhaforte123
POSTGRES_DB=meubanco
POSTGRES_USER=postgres
```

**Passo 3: Implantar a stack**

```bash
docker stack deploy -c stack.yml --env-file .env minha-app
```

> *Importante: `depends_on` é silenciosamente ignorado pelo `docker stack deploy`. No Swarm, a ordem de inicialização é gerenciada pelo scheduler com base em health checks, não por dependências declarativas. Seus serviços precisam tolerar a ausência temporária das dependências (retry, circuit breaker).*

> *Diferente do `docker compose up`, o `docker stack deploy` NÃO carrega automaticamente o arquivo `.env`. Use `--env-file .env` explicitamente.*

**Passo 4: Verificar a stack**

```bash
docker stack ls
docker stack services minha-app
docker stack ps minha-app
```

**Passo 5: Testar**

```bash
curl http://localhost:3000
```

**Passo 6: Remover a stack**

```bash
docker stack rm minha-app
```

---

### Quick Check 9

**1. Qual a diferença entre `docker compose up` e `docker stack deploy`?**
**Resposta:** `docker compose up` cria os containers no host local (single-host). `docker stack deploy` cria serviços gerenciados distribuídos no cluster Swarm. A stack deploy entende a chave `deploy:` que o Compose simples ignora (ou respeita apenas em Swarm mode).

**2. Quais configurações da chave `deploy:` você usou no stack.yml?**
**Resposta:** `replicas` (quantas réplicas), `update_config` (rolling update: parallelism, delay, failure_action), `restart_policy` (quando reiniciar), `resources` (limites de CPU/memória), e `placement` (restrições de onde rodar, como `node.role == manager`).

---

## 10. Rolling Updates e Rollback Prático

Com a stack rodando, você vai executar o padrão mais crítico da orquestração: **atualizar a aplicação sem derrubá-la** e — se algo der errado — **reverter em segundos**.

### O Comportamento do update_config

No stack.yml você configurou:

```yaml
update_config:
  parallelism: 1       # Uma réplica por vez
  delay: 10s           # Aguarda 10s entre lotes
  failure_action: rollback  # Se falhar, reverte automaticamente
```

Isso significa que, ao atualizar a imagem, o Swarm vai:

1. Pegar UMA réplica da API
2. Drenar as conexões ativas
3. Parar a réplica antiga
4. Criar uma nova com a imagem atualizada
5. Aguardar o healthcheck (10s de tolerância)
6. Se saudável, passar para a próxima réplica
7. Se falhar (healthcheck não passa), iniciar rollback automático

### Mão na Massa 4 — Rolling Update e Rollback

**Passo 1: Verificar a imagem atual**

```bash
docker service inspect minha-app_api --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
```

**Passo 2: Publicar uma nova versão**

Se você tem o pipeline CI/CD da Aula 04, faça um push com nova tag:

```bash
# Exemplo: publique a v1.1.0
git tag v1.1.0
git push origin v1.1.0
```

**Passo 3: Atualizar a stack com a nova imagem**

```bash
docker service update \
  --image seu-usuario/minha-api:1.1.0 \
  --update-parallelism 1 \
  --update-delay 10s \
  minha-app_api
```

**Passo 4: Acompanhar o rolling update**

```bash
docker service ps minha-app_api
```

Você verá as réplicas sendo atualizadas uma a uma. O comando exibe o estado DESIRED STATE e CURRENT STATE para cada réplica. Durante o update, você verá `Running` e `Ready` alternando.

**Passo 5: Verificar que a aplicação nunca caiu**

Em outro terminal, execute:

```bash
while true; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000; sleep 2; done
```

Durante todo o processo, o HTTP status deve ser sempre `200`. Se aparecer `503` ou `502`, o rolling update não está funcionando corretamente.

**Passo 6: Simular uma falha e rollback**

Agora vamos forçar uma falha — implantar uma imagem com bug:

```bash
docker service update \
  --image nginx:alpine \
  minha-app_api
```

O Swarm vai tentar substituir o Node.js pelo nginx. O healthcheck (se configurado) vai falhar, ou o endpoint `/` vai retornar HTML em vez de JSON. Após a falha:

```bash
docker service rollback minha-app_api
```

**Passo 7: Verificar o rollback**

```bash
docker service ps minha-app_api
```

Todas as réplicas devem ter voltado para `seu-usuario/minha-api:1.1.0`.

---

### Quick Check 10

**1. O que faz o parâmetro `update_config.parallelism: 1` no rolling update?**
**Resposta:** Define que apenas 1 réplica será atualizada por vez. Com `parallelism: 2`, duas réplicas seriam atualizadas simultaneamente (mais rápido, mas menos seguro). Com `parallelism: 0`, todas as réplicas seriam atualizadas ao mesmo tempo.

**2. Qual comando reverte todas as réplicas para a versão anterior e em que cenário ele é usado?**
**Resposta:** `docker service rollback <serviço>`. É usado quando a nova versão apresenta problemas em produção: erros, degradação de performance, healthcheck falhando. Ele reverte para a última configuração estável em segundos.

---

## 11. Secrets e Configs no Swarm

No Swarm, você gerencia dados sensíveis e configurações de forma nativa, sem depender de arquivos `.env` locais.

### Criando Secrets

```bash
# Criar um secret a partir de uma string
echo "minhasenhaforte123" | docker secret create db_password -

# Criar um secret a partir de um arquivo
docker secret create db_config ./config.json

# Listar secrets
docker secret ls
```

### Usando Secrets em Serviços

```bash
docker service create \
  --name api-com-secret \
  --secret db_password \
  --publish published=3000,target=3000 \
  seu-usuario/minha-api:1.0.0
```

O container acessa o secret como arquivo em `/run/secrets/db_password`.

### Usando Secrets no Stack YAML

```yaml
services:
  api:
    image: seu-usuario/minha-api:1.0.0
    ports:
      - "3000:3000"
    secrets:
      - db_password
    environment:
      - DATABASE_URL=postgresql://postgres@db:5432/meubanco
    deploy:
      replicas: 3

  db:
    image: postgres:16-alpine
    secrets:
      - db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    deploy:
      replicas: 1

secrets:
  db_password:
    external: true  # Secret criado manualmente com `docker secret create`
```

### Configs vs Secrets

```yaml
# config — para dados não sensíveis
configs:
  nginx_config:
    external: true

services:
  nginx:
    image: nginx:alpine
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf
```

### Mão na Massa 5 — Criando e Usando Secrets

**Passo 1: Criar o secret**

```bash
echo "minhasenhaforte123" | docker secret create db_password -
```

**Passo 2: Criar um serviço que usa o secret**

```bash
docker service create \
  --name api-secret-test \
  --secret db_password \
  --publish published=3001,target=3000 \
  nginx:alpine
```

**Passo 3: Verificar que o secret está no container**

```bash
# Descubra o container ID
docker ps --filter "name=api-secret-test"

# Entre no container
docker exec -it <CONTAINER_ID> sh

# Dentro do container
cat /run/secrets/db_password
# Output: minhasenhaforte123
```

**Passo 4: Limpar**

```bash
docker service rm api-secret-test
docker secret rm db_password
```

---

### Quick Check 11

**1. Onde o container encontra um secret que você criou com `docker secret create`?**
**Resposta:** O secret é montado como arquivo em `/run/secrets/<nome-do-secret>`. O container lê o arquivo para obter o valor. Isso evita que o dado sensível apareça em logs, `docker inspect` ou variáveis de ambiente.

**2. Por que no stack YAML secrets são declarados como `external: true`?**
**Resposta:** Porque o secret já foi criado manualmente com `docker secret create`. O Swarm não gerencia o ciclo de vida do secret pelo YAML — você cria o secret antes da stack e o YAML apenas referencia o secret existente. Isso separa a gestão de acesso (quem pode criar secrets) da gestão de deploy.

---

## Autoavaliação: Quiz Rápido

**1. Qual mecanismo do reconciliation loop garante que, se uma réplica falha, outra é criada automaticamente?**
**Resposta:**

O observe → diff → act contínuo. No passo "observe", o orquestrador detecta que há menos réplicas que o desejado. No passo "act", ele cria uma nova réplica em qualquer nó disponível.

**2. O que diferencia um serviço gerenciado de um container comum?**
**Resposta:**

Um serviço gerenciado declara estado desejado (N réplicas, imagem, portas) e o reconciliation loop mantém esse estado para sempre, recriando réplicas que falham, distribuindo entre nós e permitindo rolling updates.

**3. Como uma overlay network permite comunicação entre containers em hosts diferentes?**
**Resposta:**

Ela cria uma rede virtual que encapsula o tráfego entre containers em hosts diferentes. Cada nó participa da overlay network, e containers em qualquer nó se comunicam como se estivessem na mesma máquina, sem precisar saber o IP físico do outro nó.

**4. Qual a diferença entre DNS round-robin e load balancing interno no Swarm?**
**Resposta:**

DNS round-robin retorna todos os IPs das réplicas em ordem alternada a cada consulta DNS. Load balancing interno encaminha requisições para uma réplica saudável na porta publicada, mesmo que a réplica esteja em outro nó.

**5. O que acontece se o `failure_action` de um rolling update está configurado como `rollback` e a nova réplica falha no healthcheck?**
**Resposta:**

O Swarm reverte automaticamente todas as réplicas para a versão anterior (a última configuração estável), sem intervenção manual.

**6. Qual comando cria um cluster Swarm e qual comando adiciona um nó ao cluster?**
**Resposta:**

`docker swarm init` cria o cluster e torna o nó atual um manager. `docker swarm join --token <TOKEN> <MANAGER_IP>:2377` adiciona um nó como worker ou manager, dependendo do token usado.

**7. Qual comando substitui `docker compose up` no Swarm e como ele lida com o arquivo Compose?**
**Resposta:**

`docker stack deploy -c stack.yml <nome-da-stack>`. Ele lê o mesmo formato YAML do Compose, mas cria serviços gerenciados no cluster em vez de containers locais. A chave `deploy:` é respeitada apenas no stack deploy.

---

## Mão na Massa 6: Exercícios Graduados

**Exercício 1 (Fácil) — Criar e Escalar um Serviço Nginx**

Crie um serviço Swarm chamado `web-server` com a imagem `nginx:alpine`, 2 réplicas, porta 80 publicada como 8080. Escale para 5 réplicas. Verifique a distribuição entre os nós.

**Gabarito:**

```bash
# Criar o serviço
docker service create \
  --name web-server \
  --publish published=8080,target=80 \
  --replicas 2 \
  nginx:alpine

# Verificar
docker service ls
docker service ps web-server

# Escalar para 5
docker service scale web-server=5

# Verificar novamente
docker service ps web-server

# Remover
docker service rm web-server
```

**Exercício 2 (Médio) — Stack Deploy com Rolling Update**

Crie um arquivo `stack-exercicio.yml` que implanta a API Express como stack no Swarm com:

- 3 réplicas
- Rolling update com parallelism 2, delay 15s, failure_action pause
- Limite de memória de 256MB
- Restart policy com condição any e delay 5s

Em seguida, execute um rolling update manual trocando a imagem para `nginx:alpine` e depois reverta com rollback.

**Gabarito:**

```yaml
# stack-exercicio.yml
version: '3.8'

services:
  api:
    image: seu-usuario/minha-api:1.0.0
    ports:
      - "3000:3000"
    deploy:
      replicas: 3
      update_config:
        parallelism: 2
        delay: 15s
        failure_action: pause
      restart_policy:
        condition: any
        delay: 5s
      resources:
        limits:
          memory: 256M
```

```bash
# Implantar
docker stack deploy -c stack-exercicio.yml meuapp

# Verificar
docker stack services meuapp

# Rolling update manual
docker service update --image nginx:alpine meuapp_api

# Acompanhar
docker service ps meuapp_api

# Rollback
docker service rollback meuapp_api
```

**Desafio (Difícil) — Stack Multi-Serviço com Secrets**

Converta o `docker-compose.yml` completo da Aula 02 (API + PostgreSQL + healthcheck + volumes) para um stack YAML do Swarm com:

- API com 3 réplicas, rolling update configurado, limite de memória
- PostgreSQL com 1 réplica, constraint `node.role == manager`
- Senha do PostgreSQL como secret externo (criado com `docker secret create`)
- A API lê a senha do secret (variável `POSTGRES_PASSWORD_FILE`)
- Volume nomeado `pgdata` para persistência

**Gabarito:**

```yaml
# stack-completo.yml
version: '3.8'

services:
  api:
    image: seu-usuario/minha-api:1.0.0
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres@db:5432/meubanco
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    depends_on:
      - db
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: any
        delay: 5s
      resources:
        limits:
          memory: 256M

  db:
    image: postgres:16-alpine
    secrets:
      - db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
      - POSTGRES_DB=meubanco
      - POSTGRES_USER=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s

secrets:
  db_password:
    external: true

volumes:
  pgdata:
```

```bash
# Criar o secret ANTES da stack
echo "minhasenhaforte123" | docker secret create db_password -

# Implantar
docker stack deploy -c stack-completo.yml meuservico

# Verificar
docker stack services meuservico
docker stack ps meuservico

# Testar
curl http://localhost:3000

# Remover
docker stack rm meuservico
docker secret rm db_password
```

---

## Resumo da Aula

### Os 10 Conceitos Fundamentais

1. **Single-Host → Cluster**: single host tem ponto único de falha, recursos limitados e deploy com downtime. Cluster resolve os três problemas com múltiplos nós coordenados.
2. **Estado Desejado e Reconciliation Loop**: você declara o estado desejado (N réplicas, imagem X) e o orquestrador mantém esse estado para sempre via observe → diff → act contínuo.
3. **Serviços Gerenciados**: abstração que adiciona self-healing, scheduling, distribuição e rolling updates sobre containers efêmeros.
4. **Overlay Network**: rede virtual multi-host que permite comunicação entre containers em nós diferentes como se estivessem na mesma máquina.
5. **Service Discovery e Load Balancing**: DNS round-robin + load balancer interno distribuem tráfego entre réplicas em qualquer nó.
6. **Rolling Updates**: atualização gradual de réplicas sem downtime, com rollback como safety net.
7. **Secrets e Configs**: dados sensíveis criptografados em trânsito e repouso, montados como arquivos em /run/secrets/, não como variáveis de ambiente.
8. **Arquitetura Swarm**: managers (control plane + Raft consensus) e workers (execução pura). Tolerância a falhas com N managers.
9. **Services e Stack Deploy**: `docker service create` para serviços individuais, `docker stack deploy` para stacks completas a partir de YAML.
10. **Rolling Update e Rollback Práticos**: `docker service update --image` para atualizar, `docker service rollback` para reverter em segundos.

### O Que Você Construiu Hoje

- [x] Cluster Swarm inicializado com `docker swarm init`
- [x] Workers adicionados com `docker swarm join`
- [x] Serviço gerenciado com `docker service create --replicas`
- [x] Escalonamento com `docker service scale`
- [x] Stack YAML com chave `deploy:` convertida do Compose
- [x] Implantação com `docker stack deploy -c stack.yml`
- [x] Rolling update com `docker service update --image`
- [x] Rollback com `docker service rollback`
- [x] Secrets gerenciados com `docker secret create`
- [x] Domínio dos 10 comandos Swarm: init, join, node ls, service create/ls/ps/update/rollback, stack deploy, secret create

---

## Próxima Aula

**Aula 06: Kubernetes — Introdução à Orquestração em Produção**

Você dominou o Docker Swarm — o orquestrador nativo do Docker. Mas o mercado usa **Kubernetes** como padrão de facto para orquestração em produção. Na Aula 06, você vai instalar o minikube, aprender a arquitetura do Kubernetes (Pods, Deployments, Services) e traduzir o `docker-compose.yml` que você construiu na Aula 02 para manifests Kubernetes. O que você aprendeu aqui — estado desejado, reconciliation loop, services, rolling updates — é transferível diretamente para o K8s. A diferença é a granularidade e a ecossistema.

---

## Referências

### Documentação Oficial

- [Docker Swarm Overview](https://docs.docker.com/engine/swarm/) — visão geral do Swarm
- [Swarm mode key concepts](https://docs.docker.com/engine/swarm/key-concepts/) — conceitos fundamentais
- [Swarm services](https://docs.docker.com/engine/swarm/services/) — serviços gerenciados
- [Swarm stack deploy](https://docs.docker.com/engine/reference/commandline/stack_deploy/) — comando stack deploy
- [Swarm secrets](https://docs.docker.com/engine/swarm/secrets/) — gerenciamento de secrets
- [Compose file deploy reference](https://docs.docker.com/compose/compose-file/deploy/) — chave deploy no Compose
- [Raft Overview](https://raft.github.io/) — algoritmo de consenso

### Ferramentas

- [Docker Engine](https://docs.docker.com/engine/) — documentação do Docker Engine
- [Docker Hub](https://hub.docker.com/) — registry público de imagens
- [Play with Docker](https://labs.play-with-docker.com/) — ambiente Docker online gratuito para testar Swarm multi-node

### Vídeos Recomendados

- [Docker Swarm Mode Walkthrough (Elton Stoneman)](https://www.youtube.com/watch?v=KC4Ad1DS8xU) — demonstração oficial de Swarm mode passo a passo (~45 min)
- [Docker Swarm Tutorial | What Is Docker Swarm? (Simplilearn)](https://www.youtube.com/watch?v=Tm0Q5zr3FL4) — visão geral de Docker Swarm para iniciantes (~25 min)

### Artigos para Aprofundamento

- [Docker Swarm Best Practices](https://docs.docker.com/engine/swarm/how-swarm-mode-works/) — como o Swarm funciona internamente
- [Raft Consensus Algorithm](https://raft.github.io/raft.pdf) — paper original do Raft
- [From Docker Compose to Swarm](https://docs.docker.com/engine/swarm/stack-deploy/) — guia de migração de Compose para Swarm

---

## FAQ

**P: Preciso de múltiplas máquinas físicas para testar o Swarm?**
R: Não. Você pode simular um cluster multi-node na mesma máquina usando Docker-in-Docker ou VMs locais com Multipass. O Play with Docker (gratuito) também oferece um ambiente multi-node online.

**P: Qual a diferença entre `docker compose up` e `docker stack deploy`?**
R: `docker compose up` roda containers no host local (single-host). `docker stack deploy` cria serviços gerenciados distribuídos no cluster Swarm. O stack deploy entende a chave `deploy:` (replicas, update_config, resources) que o Compose simplesmente ignora fora do Swarm mode.

**P: Posso usar o mesmo `docker-compose.yml` no Swarm?**
R: Sim, com adaptações. O Swarm lê o mesmo formato YAML. Você precisa adicionar a chave `deploy:` para configurações de orquestração e substituir `build:` por `image:` com a imagem já publicada no registry. O Swarm não faz build — ele só puxa imagens.

**P: Quantos managers um cluster Swarm precisa?**
R: Mínimo de 1 (para desenvolvimento) e ímpar para produção (3 ou 5). Com 1 manager, você não tem tolerância a falhas. Com 3, tolera 1 falha. Com 5, tolera 2. O número ímpar evita empates no Raft consensus.

**P: O Swarm faz load balancing automático?**
R: Sim. Quando você publica uma porta (`--publish published=80,target=80`), qualquer nó do cluster que receber uma requisição nessa porta encaminha para uma réplica saudável — mesmo que a réplica esteja em outro nó. Isso se chama **mesh routing** e funciona sem configuração adicional.

**P: O que acontece com os dados do PostgreSQL se o nó do banco cair?**
R: Se o PostgreSQL tem volume nomeado (`pgdata`) montado, os dados persistem. Mas a réplica precisa ser recriada em outro nó. Em produção, use um banco de dados gerenciado externo (RDS, Cloud SQL) ou configure replicação dentro do Swarm com placement constraints.

**P: Como faço para que um serviço rode apenas em nós específicos?**
R: Use `placement: constraints:` no YAML. Ex: `placement: constraints: [node.role == manager]` para rodar apenas em managers, ou `node.hostname == worker1` para um nó específico.

**P: Posso usar um load balancer externo na frente do Swarm?**
R: Sim, e é a prática recomendada em produção. Coloque um Nginx, HAProxy ou Traefik na frente do cluster. Os load balancers externos apontam para todos os nós do Swarm — qualquer nó que receber a requisição encaminha para uma réplica saudável via mesh routing.

**P: Como o Swarm se compara ao Kubernetes?**
R: Swarm é mais simples de configurar (embutido no Docker Engine, sem instalação adicional), ideal para clusters pequenos e médios. Kubernetes é mais poderoso e flexível, mas exige mais infraestrutura (etcd, API server, scheduler, controller manager) e conhecimento. Swarm é o degrau natural antes de Kubernetes.

---

## Glossário

| Termo | Definição |
|---|---|
| **Cluster** | Conjunto de máquinas (nós) que se comportam como um único recurso computacional coordenado por um orquestrador (Seção 1) |
| **Config** (*config*) | Dados não sensíveis gerenciados pelo Swarm, montados como arquivo no container. Criptografado apenas em trânsito (Seção 11) |
| **Desired state** | Estado desejado declarado no YAML — o orquestrador converge o estado atual para este estado continuamente (Seção 2) |
| **DNS round-robin** | Mecanismo de service discovery onde o DNS retorna todos os IPs das réplicas em ordem alternada (Seção 4) |
| **Manager node** | Nó do Swarm que executa o control plane: gerencia estado, agenda serviços, mantém consenso Raft (Seção 7) |
| **Mesh routing** | Mecanismo do Swarm onde qualquer nó que recebe uma requisição encaminha para uma réplica saudável (Seção 4) |
| **Nó** (*node*) | Máquina membro do cluster Swarm, pode ser manager ou worker (Seção 7) |
| **Orquestrador** | Software que gerencia o ciclo de vida de containers em cluster: scheduling, self-healing, scaling, updates (Seção 1) |
| **Overlay network** | Rede virtual que atravessa múltiplos hosts, permitindo comunicação entre containers em nós diferentes (Seção 4) |
| **Raft** | Algoritmo de consenso distribuído que mantém o estado do cluster consistente entre managers (Seção 7) |
| **Reconciliation loop** | Ciclo contínuo observe → diff → act que mantém o estado atual convergindo para o estado desejado (Seção 2) |
| **Réplica** | Instância de um container gerenciado por um serviço. Várias réplicas do mesmo serviço distribuem tráfego (Seção 3) |
| **Rollback** | Reversão de todas as réplicas de um serviço para a versão anterior, em um único comando (Seção 5) |
| **Rolling update** | Atualização gradual de réplicas, uma ou algumas por vez, sem downtime (Seção 5) |
| **Secret** | Dado sensível (senha, token) gerenciado pelo Swarm: criptografado em trânsito e repouso, montado em /run/secrets/ (Seção 6) |
| **Self-healing** | Capacidade do orquestrador de recriar automaticamente réplicas que falham (Seção 3) |
| **Service** | Abstração que declara estado desejado de uma aplicação: número de réplicas, imagem, portas, políticas (Seção 3) |
| **Service discovery** | Mecanismo que permite que serviços se encontrem pelo nome em vez de endereço IP (Seção 4) |
| **Stack** | Conjunto de serviços relacionados que compõem uma aplicação completa, implantada como unidade (Seção 9) |
| **Stack deploy** | Comando que implanta uma stack completa no Swarm a partir de um arquivo YAML (Seção 9) |
| **Worker node** | Nó do Swarm que executa apenas workloads (containers). Não participa do gerenciamento do cluster (Seção 7) |
```
