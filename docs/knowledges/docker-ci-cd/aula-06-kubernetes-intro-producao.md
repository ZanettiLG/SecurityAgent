---
titulo: "Aula 06: Kubernetes — Introdução à Orquestração em Produção"
modulo: "Docker — Da Containerização ao Deploy em Produção"
duracao_estimada: "150 minutos"
nivel: "intermediario"
tags:
  [
    kubernetes,
    k8s,
    orquestracao,
    minikube,
    kubectl,
    pods,
    deployments,
    services,
    configmaps,
    secrets,
    declarativo,
  ]
data: 2026-06-18
---

# Curso: Docker — Da Containerização ao Deploy em Produção — Aula 06

## Kubernetes: Introdução à Orquestração em Produção

**Duração estimada:** 150 minutos (70 de leitura + 80 de prática)
**Nível:** Intermediário-Avançado
**Pré-requisitos:** Docker instalado e funcional (Aula 01), Docker Compose e stack multi-serviço funcional (Aula 02), imagem publicada no Docker Hub (Aula 03), pipeline CI/CD completo (Aula 04), cluster Docker Swarm funcional com stack implantada (Aula 05)

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

- [ ] **Explicar** o conceito de estado desejado e reconciliation loop como mecanismo central de orquestradores declarativos
- [ ] **Descrever** a arquitetura de control plane e data plane em um cluster de produção
- [ ] **Distinguir** orquestração declarativa de orquestração imperativa, identificando quando cada uma é apropriada
- [ ] **Explicar** como recursos de infraestrutura são representados como objetos de API em um orquestrador declarativo
- [ ] **Identificar** os componentes do control plane e suas responsabilidades dentro do cluster
- [ ] **Instalar** e configurar o minikube como cluster local de desenvolvimento e aprendizado
- [ ] **Executar** comandos kubectl para interagir com os recursos de um cluster
- [ ] **Criar** manifests YAML de Deployment e Service para uma aplicação containerizada
- [ ] **Traduzir** um docker-compose.yml para manifests equivalentes de orquestrador de produção
- [ ] **Implantar** uma stack completa (aplicação + banco de dados) em um cluster local e verificar seu funcionamento

---

## Como Usar Esta Aula

Esta aula está organizada em duas partes. A **primeira parte** constrói os fundamentos universais de orquestração declarativa em cluster — conceitos como estado desejado, reconciliation loop, arquitetura de control plane e data plane, e recursos como API de infraestrutura. Estes conceitos são apresentados de forma genérica: valem para qualquer orquestrador declarativo, independentemente da ferramenta específica. São ancorados em **experiências que você já domina**: o Docker Swarm da Aula 05, o Compose da Aula 02.

A **segunda parte** conecta cada um desses mecanismos à prática com o Kubernetes — o orquestrador que se tornou o padrão da indústria para produção em escala. Você vai instalar o minikube, escrever manifests YAML, fazer deploy de uma aplicação real e traduzir o docker-compose.yml que você construiu nas Aulas 02-05 para o formato do Kubernetes.

Ao longo do caminho, você encontrará seções **"Quick Check"** ao final de cada tópico para verificar se entendeu antes de avançar. Ao final da aula, o arquivo separado **Questões de Aprendizagem** traz as tarefas de checkpoint — só avance quando conseguir completá-las por conta própria.

**Tempo estimado:** 70 minutos de leitura + 80 minutos de prática.

---

## Mapa Mental

Este diagrama mostra todos os conceitos que você vai dominar nesta aula:

![Mapa mental: Kubernetes — Introdução à Orquestração em Produção](images/diagrama-01-mindmap.png)

---

## Recapitulação das Aulas 01 a 05

| Aula    | Conceito                                            | Onde aparece nesta aula                       | Como se conecta                                                                                                |
| ------- | --------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Aula 01 | **Dockerfile multi-stage** (Seções 8-10)            | Parte 1, Seções 1-3                           | A imagem é o artefato imutável que o orquestrador gerencia e distribui pelo cluster                            |
| Aula 01 | **Camadas de imagem e CoW** (Seção 2)               | Parte 1, Seção 1                              | O reconciliation loop assume imagens imutáveis — cada réplica parte da mesma camada base                       |
| Aula 02 | **docker-compose.yml declarativo** (Seções 6-11)    | Parte 2 — tradução para manifests             | Você já declara infraestrutura em YAML; agora vai declarar no formato do orquestrador de produção              |
| Aula 02 | **Multi-serviço com rede e volumes** (Seções 2, 10) | Parte 2 — aplicação + banco no cluster        | A stack multi-serviço do Compose será traduzida para o cluster                                                 |
| Aula 03 | **Registry e tags versionadas** (Seções 7-9)        | Parte 2 — image pull policy                   | O orquestrador puxa imagens do registry; tags imutáveis garantem que o deploy é exatamente o que foi testado   |
| Aula 04 | **Pipeline CI/CD automatizado** (Seções 1-4)        | Parte 2 — deploy via pipeline                 | O pipeline entrega a imagem no registry; o orquestrador a puxa e implanta no cluster                           |
| Aula 05 | **Estado desejado com serviços** (Seção 2)          | Parte 1, Seção 1 — reconciliation loop        | Você declarou `--replicas 3` e o Swarm convergiu — agora o mesmo princípio em escala de produção               |
| Aula 05 | **Manager e worker nodes** (Seção 1)                | Parte 1, Seção 2 — control plane e data plane | Você já viu a separação entre nó de gestão e nó de execução; agora vai ver a arquitetura completa              |
| Aula 05 | **Docker stack deploy** (Seção 3)                   | Parte 2 — kubectl apply                       | Você aplicava manifests com `docker stack deploy`; agora vai aplicar com o comando equivalente do orquestrador |

---

**FUNDAMENTOS: Mecanismos Universais de Orquestração Declarativa em Cluster**

> _Os conceitos desta seção são universais — valem para qualquer orquestrador declarativo, independentemente da ferramenta específica. Na segunda parte, você verá como um orquestrador de produção implementa cada um deles._

---

## 1. Estado Desejado e Reconciliation Loop — O Coração do Orquestrador

Você chegou até aqui declarando infraestrutura. Na Aula 02, você escreveu um `docker-compose.yml` e digitou `docker compose up` — o Compose leu sua declaração e materializou os serviços. Na Aula 05, você fez `docker service create --replicas 3` e o Swarm manteve três réplicas rodando, mesmo que uma morresse. Esses dois exemplos compartilham o mesmo mecanismo central: **estado desejado**.

Mas há uma diferença fundamental entre o que o Compose fez e o que o Swarm fez. O Compose leu sua declaração, criou os recursos e **parou**. Se um container morresse depois do `up`, o Compose não faria nada — ele não monitora. Já o Swarm é **reativo**: ele observa continuamente o estado atual do cluster e age para corrigir divergências. Esse comportamento reativo e contínuo é o que chamamos de **reconciliation loop**.

### Modelo Mental: O Termostato

Pense em um termostato inteligente. Você programa a temperatura desejada (24 °C) e o termostato lê a temperatura atual continuamente. Se a sala está a 20 °C, ele liga o aquecimento. Quando chega a 24 °C, desliga. Se alguém abre a janela e a temperatura cai, ele religa o aquecimento. O termostato não para de monitorar — ele está sempre no loop: **comparar → agir → observar**.

Um orquestrador declarativo funciona exatamente assim. Você declara "quero 3 réplicas do meu serviço rodando" e o controlador do orquestrador mantém um loop infinito que:

1. **Observa** o estado atual do cluster (quantas réplicas estão rodando, quantas falharam)
2. **Compara** com o estado desejado que você declarou no manifesto
3. **Age** se houver diferença (cria réplicas faltantes, remove excedentes, substitui as que falharam)
4. **Volta para o passo 1** — o ciclo nunca termina enquanto o cluster existir

![Diagrama: Reconciliation Loop — estado desejado vs estado real](images/diagrama-02-flowchart.png)

### O Que Você Já Conhece

O reconciliation loop não é novidade para você. Na Aula 05, quando você executou `docker service create --replicas 3 myapp`, o Swarm manager iniciou um loop interno que monitorava o número de containers rodando, detectava se um nó caía e os containers morriam, e recriava as réplicas em nós saudáveis automaticamente.

A diferença agora é que vamos **generalizar** esse mecanismo. Um orquestrador declarativo de produção implementa o reconciliation loop de forma sistemática para **todos os recursos do cluster** — não só serviços, mas também redes, volumes, configurações, segredos e permissões. Tudo que você declara o orquestrador convergirá.

### Declarativo vs Imperativo

É importante distinguir os dois modos de operação:

- **Imperativo**: você executa comandos na ordem certa. "Cria o container A, depois espera 5 segundos, depois cria o container B, depois conecta a rede." Você dita o passo a passo. O Docker Swarm CLI tradicional opera de forma imperativa com `docker service create`, `docker service update` e `docker service rm`.

- **Declarativo**: você declara o resultado final e o sistema descobre o passo a passo. "Quero 3 réplicas do serviço A conectadas à rede X." O orquestrador decide como chegar lá. O `docker stack deploy` e o `docker-compose.yml` da Aula 02 são declarativos — você escreve o YAML, o sistema lê, compara com o estado atual e age.

O orquestrador declarativo de produção abraça o modelo declarativo de forma radical: **você nunca executa comandos para mudar o estado**. Você escreve um manifesto YAML, envia para a API do cluster, e o orquestrador converge. Se alguém altera algo manualmente em um nó, o orquestrador detecta a divergência no próximo ciclo e reverte.

### Quick Check 1

**1. Qual a diferença prática entre um comando imperativo e uma declaração de estado desejado em um orquestrador?**
**Resposta:** Um comando imperativo diz "crie 2 réplicas agora" e o sistema executa e para. Uma declaração diz "quero 2 réplicas" e o sistema mantém esse estado para sempre — se uma réplica morre, o sistema recria. O imperativo executa uma ação pontual; o declarativo mantém uma condição permanentemente.

**2. No reconciliation loop, o que acontece se um administrador derruba manualmente um container que fazia parte de um serviço com 3 réplicas?**
**Resposta:** O loop detecta no próximo ciclo que o estado atual (2 réplicas) diverge do estado desejado (3 réplicas) e imediatamente cria uma nova réplica para convergir. O sistema se auto-corrige sem intervenção humana — o orquestrador é projetado para ser autorreparável.

---

## 2. Arquitetura de Cluster — Control Plane e Data Plane

Na Aula 05, você subiu um cluster Swarm com dois tipos de nó: **manager** (que gerencia o estado do cluster) e **worker** (que executa os containers). Essa separação de responsabilidades não é exclusiva do Swarm — é um padrão arquitetural de qualquer orquestrador de produção. Os nomes genéricos são **control plane** (plano de controle) e **data plane** (plano de dados).

### Control Plane

O control plane é o cérebro do cluster. Ele mantém o estado desejado, toma decisões de escalonamento e expõe uma API para você interagir com o cluster. Seus componentes principais:

- **API Server**: a porta de entrada única do cluster. Todo comando, toda consulta, toda declaração passa por ele. Você nunca se comunica diretamente com os nós — sempre com o API Server. Ele valida suas requisições, aplica regras de autenticação e autorização, e persiste o estado no banco.

- **State Store**: um banco de dados distribuído e fortemente consistente que armazena todo o estado do cluster. Cada recurso declarado (serviço, configuração, nó) é um objeto nesse banco. O cluster inteiro confia nele como **fonte única da verdade**. Se o State Store corromper, o cluster perde a referência do que deveria estar rodando.

- **Scheduler**: decide em qual nó worker cada workload deve rodar. Ele analisa os recursos disponíveis (CPU, memória, disco), as restrições que você declarou e o estado atual dos nós, e aloca os workloads de forma otimizada.

- **Controller Manager**: o motor que executa os reconciliation loops. Ele contém dezenas de controladores especializados — um para workloads, um para nós, um para redes, um para volumes. Cada controlador observa o estado desejado no banco, verifica o estado real no data plane e age para convergir.

### Data Plane

O data plane é onde o trabalho acontece. São os nós que executam seus containers, processam requisições e armazenam dados. A estrutura de cada nó:

- **Agent**: um processo que roda em cada nó worker e se comunica com o control plane. Ele recebe instruções do API Server, executa containers conforme o schedule e reporta o estado de volta.

- **Runtime**: o motor de containers (Docker, containerd) que de fato cria e gerencia os containers em cada nó.

- **Proxy de Rede**: componente que gerencia as regras de rede local, garantindo que o tráfego chegue aos containers corretos e que as políticas de rede sejam aplicadas.

![Diagrama: Arquitetura de Cluster — Control Plane e Data Plane](images/diagrama-03-flowchart.png)

### O Que Você Já Conhece

No Swarm, o **manager** desempenhava o papel de control plane (embora também pudesse executar workloads em alguns casos). O manager mantinha o estado do cluster usando o algoritmo **Raft** para consenso entre múltiplos managers. Você executava `docker node ls` e via quais nós eram managers e quais eram workers — essa era sua visão da separação control plane / data plane.

A diferença agora é que o control plane de um orquestrador de produção é mais **modular e especializado**. Em vez de um manager monolítico, você tem componentes separados (API Server, Scheduler, Controller Manager, State Store) que podem ser configurados, escalados e protegidos independentemente. Essa modularidade permite que o cluster opere em escala de milhares de nós — algo que o Swarm não foi projetado para fazer.

### Quick Check 2

**1. Qual a responsabilidade do State Store e por que ele precisa ser um sistema fortemente consistente?**
**Resposta:** O State Store armazena todo o estado do cluster — cada recurso declarado, cada nó, cada atributo. Ele precisa ser consistentemente porque é a fonte única da verdade: se dois componentes do control plane lerem estados divergentes, podem tomar ações conflitantes e corromper o cluster.

**2. O que acontece se o API Server ficar indisponível?**
**Resposta:** Nenhuma operação nova pode ser executada — você não consegue fazer deploy, escalar ou consultar o estado. Mas os workloads já rodando no data plane continuam executando normalmente. O data plane não depende do control plane para manter containers em execução; depende apenas para receber novas instruções ou atualizações.

---

## 3. Recursos Declarativos como API de Infraestrutura

No Compose, cada serviço, rede e volume era representado como um bloco YAML dentro de um arquivo `docker-compose.yml`. Você escrevia o YAML, executava `docker compose up`, e o Compose interpretava aquele arquivo como instruções para criar recursos. No Swarm, a evolução foi sutil mas importante: você usava o mesmo YAML do Compose com a seção `deploy` adicional, e executava `docker stack deploy`. O Swarm interpretava aquele YAML como uma **declaração de estado desejado** e iniciava o reconciliation loop.

Agora, generalize: em um orquestrador declarativo de produção, **todo recurso da infraestrutura é um objeto de API**. Isso significa que:

1. Cada tipo de recurso tem uma **representação padronizada** em YAML (ou JSON) com campos bem definidos e validação de esquema
2. Cada recurso é **versionado** e tem um ciclo de vida gerenciado pela API — criar, ler, atualizar, deletar
3. Você **nunca "cria"** um recurso no sentido imperativo — você submete uma declaração e o orquestrador a materializa
4. O orquestrador expõe **endpoints REST** para cada tipo de recurso

### Tudo é Recurso

Nesta arquitetura, absolutamente tudo que você gerencia no cluster é um recurso de API:

| Tipo de Recurso   | O que Declara                               | Exemplo Concreto                               |
| ----------------- | ------------------------------------------- | ---------------------------------------------- |
| **Workload**      | Qual imagem rodar, quantas réplicas, portas | "API Express com 3 réplicas na porta 3000"     |
| **Rede**          | Como os workloads se comunicam              | "Serviço interno na porta 5432 para o banco"   |
| **Armazenamento** | Volumes persistentes                        | "Volume de 10 GB para PostgreSQL"              |
| **Configuração**  | Variáveis de ambiente e arquivos            | "URL do banco = db:5432"                       |
| **Segredos**      | Dados sensíveis criptografados              | "Senha do banco de dados"                      |
| **Autenticação**  | Quem pode fazer o quê                       | "Usuário X pode ler logs; Y pode fazer deploy" |

Cada recurso segue o mesmo padrão de manifesto: um YAML com campos de identificação (`apiVersion`, `kind`, `metadata`) e a configuração desejada (`spec`). Você escreve o YAML, submete via API, e o controlador correspondente entra em ação com seu reconciliation loop.

### Vantagem do Modelo de API

Ao transformar infraestrutura em objetos de API, você ganha:

- **Versionamento e histórico**: toda mudança fica registrada. Você pode ver o histórico completo de cada recurso, comparar versões e reverter para estados anteriores.
- **Automação universal**: qualquer ferramenta que fala HTTP pode gerenciar o cluster — scripts shell, pipelines CI/CD, interfaces gráficas, chatbots.
- **Extensibilidade**: você pode criar seus próprios tipos de recurso. Precisa de um "banco PostgreSQL gerenciado pelo time de banco"? Cria um tipo de recurso customizado com seu próprio controlador — o cluster aprende a gerenciar esse novo recurso.
- **Validação no momento da submissão**: a API valida sua declaração antes de aceitá-la. Erros de sintaxe, campos obrigatórios ausentes ou valores inválidos são detectados na hora, não na execução.

### O Que Você Já Conhece

Na Aula 02, cada serviço no `docker-compose.yml` era essencialmente um recurso declarativo. Você escrevia:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
```

Cada bloco (`api`, `db`) declarava o estado desejado daquele serviço. Agora a mesma ideia é **elevada a sistema**: em vez de um arquivo YAML interpretado por uma ferramenta CLI, cada recurso é um objeto em um banco de dados distribuído, gerenciado por uma API REST, monitorado por controladores que rodam reconciliation loops 24 horas por dia, 7 dias por semana.

### Quick Check 3

**1. O que significa dizer que "tudo é uma API" em um orquestrador declarativo?**
**Resposta:** Significa que cada recurso do cluster — workloads, redes, volumes, configurações, permissões — é representado como um objeto em um banco de dados central, acessível via API REST. Você gerencia o cluster submetendo, lendo e deletando esses objetos via chamadas HTTP, não via comandos específicos de terminal.

**2. Qual a vantagem prática de versionar recursos de infraestrutura como objetos de API em vez de arquivos YAML locais?**
**Resposta:** Versionamento via API permite rastrear cada mudança com timestamp e autor, integrar com CI/CD (pipelines chamam a API para fazer deploy), detectar drift (alguém alterou algo manualmente?), aplicar regras de validação e autorização centralizadas, e reverter para versões anteriores. Arquivos locais não oferecem governança nem auditabilidade.

---

**APLICAÇÃO: Kubernetes — O Orquestrador Declarativo de Produção**

> _Agora que você entende os mecanismos universais de orquestração declarativa em cluster — estado desejado, reconciliation loop, arquitetura control plane / data plane e recursos como API de infraestrutura — vamos conectá-los ao Kubernetes, o orquestrador que se tornou o padrão da indústria para produção em escala._

---

## 4. Arquitetura Kubernetes — O Control Plane em Detalhe

O Kubernetes implementa fielmente a arquitetura que descrevemos na Seção 2. Cada componente do control plane e do data plane tem um nome específico e responsabilidades bem definidas. Vamos conhecer cada um deles.

### Componentes do Control Plane

O control plane do Kubernetes é composto por **quatro processos principais** que podem rodar em um único nó (para laboratório) ou distribuídos em múltiplos nós para alta disponibilidade:

- **API Server (kube-apiserver)**: a porta de entrada única do cluster. Expõe a API REST do Kubernetes. Toda comunicação — kubectl, dashboards, pipelines CI/CD, outros componentes — passa por ele. Ele valida e processa cada requisição, aplica autenticação e autorização, e persiste os dados no banco.

- **etcd**: o State Store do Kubernetes. É um banco chave-valor distribuído, fortemente consistente, baseado no algoritmo Raft. Armazena todo o estado do cluster: cada Pod, cada Deployment, cada Service, cada nó, cada segredo. Nada no cluster existe fora do etcd. Se o etcd corromper, o cluster perde a referência do que deveria estar rodando.

- **Scheduler (kube-scheduler)**: decide em qual nó cada Pod recém-criado deve rodar. Ele analisa requisitos de CPU/memória, restrições de afinidade, taints e tolerations, e distribui a carga de forma otimizada.

- **Controller Manager (kube-controller-manager)**: o motor dos reconciliation loops. Dentro dele rodam dezenas de controladores especializados — Deployment Controller, ReplicaSet Controller, Node Controller, Endpoint Controller, ServiceAccount Controller, e muitos outros. Cada um observa o estado desejado no etcd, verifica o estado real e age para convergir.

### Componentes do Data Plane (Nó Worker)

Cada nó worker executa **três processos** obrigatórios:

- **kubelet**: o agente do Kubernetes em cada nó. Ele se comunica com o API Server, recebe instruções sobre quais Pods rodar, garante que os containers estão rodando conforme o manifesto e reporta o estado de volta ao API Server. É o kubelet que executa o reconciliation loop local do nó.

- **kube-proxy**: o proxy de rede que mantém as regras de encaminhamento em cada nó. Ele garante que o tráfego chegue aos Pods corretos, independentemente de qual nó eles estão rodando. Implementa a descoberta de serviço e o balanceamento de carga no nível da rede.

- **Container Runtime**: o motor que de fato roda os containers (containerd, CRI-O, Docker). O kubelet se comunica com o runtime através do CRI (Container Runtime Interface), uma API padronizada que permite trocar o runtime sem modificar o kubelet.

### Mapeamento Swarm → Kubernetes

| Conceito Swarm                | Conceito Kubernetes                | Diferença Principal                               |
| ----------------------------- | ---------------------------------- | ------------------------------------------------- |
| Manager node                  | Control Plane                      | K8s separa em 4 componentes modulares             |
| Worker node                   | Worker node (kubelet + kube-proxy) | Swarm usa Docker Engine como agent                |
| Service (modo replicado)      | Deployment                         | Deployment gerencia ReplicaSets e rolling updates |
| Task (container individual)   | Pod                                | Pod pode conter 1+ containers                     |
| Service network (VIP)         | Service (ClusterIP)                | K8s tem múltiplos tipos de Service                |
| Config (docker config create) | ConfigMap                          | K8s usa labels e selectors para associar          |
| Secret (docker secret create) | Secret                             | K8s armazena em etcd (base64 por padrão)          |
| Stack (docker stack deploy)   | Conjunto de manifests              | K8s usa `kubectl apply -f .` em diretório         |
| docker-compose.yml            | manifests YAML individuais         | Um recurso por arquivo (boa prática)              |

![Diagrama: Arquitetura Kubernetes — Control Plane e Data Plane](images/diagrama-04-flowchart.png)

### Quick Check 4

**1. Qual a diferença entre kubelet e kube-proxy?**
**Resposta:** O kubelet é o agente que gerencia containers no nó — recebe instruções do API Server, inicia/para Pods e reporta estado. O kube-proxy gerencia a rede — mantém regras de iptables/IPVS para rotear tráfego aos Pods corretos. Um gerencia containers, o outro gerente tráfego de rede.

**2. Por que o etcd precisa usar o algoritmo Raft?**
**Resposta:** O Raft garante consistência forte entre réplicas do etcd em nós diferentes. Se o cluster tiver 3, 5 ou 7 nós etcd, o Raft elege um líder e todas as escritas passam por ele. Isso garante que todos os componentes do control plane leiam o mesmo estado — sem divergência, sem conflitos, sem chances de dois controladores tomarem ações opostas.

---

## 5. minikube e kubectl — Primeiro Contato

O minikube é uma implementação leve do Kubernetes que roda um cluster de nó único na sua máquina local. Perfeito para aprendizado, desenvolvimento e testes. O kubectl é a CLI que você usa para se comunicar com o API Server do cluster.

### Instalação

**minikube:**

```bash
# Linux (amd64)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

# macOS
brew install minikube

# Windows (PowerShell como Admin)
# winget install minikube
```

**kubectl:**

```bash
# Linux (amd64)
curl -LO "https://dl.k8s.io/release/v1.31.0/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/kubectl
rm kubectl

# macOS
brew install kubectl

# Windows (PowerShell como Admin)
# curl.exe -LO "https://dl.k8s.io/release/v1.31.0/bin/windows/amd64/kubectl.exe"
```

### Iniciando o Cluster

```bash
# Inicia o cluster com driver Docker (não precisa de VM virtual)
minikube start --driver=docker

# Verifica o status
minikube status

# Verifica os nós do cluster
kubectl get nodes

# Informações detalhadas do cluster
kubectl cluster-info
```

A saída de `kubectl get nodes` mostra o nó único do minikube com status `Ready`. Seu cluster local está no ar.

### Contextos e Namespaces

O kubectl organiza o acesso a múltiplos clusters através de **contextos**. Um contexto combina três informações: cluster, usuário e namespace. O arquivo de configuração fica em `~/.kube/config`.

```bash
# Lista contextos disponíveis
kubectl config get-contexts

# Contexto atual
kubectl config current-context

# Lista namespaces
kubectl get namespaces
```

**Namespaces** são divisões lógicas dentro de um cluster. Eles permitem organizar recursos por ambiente (dev/staging/prod), equipe ou projeto. Por padrão, você opera no namespace `default`. Os namespaces `kube-system`, `kube-public` e `kube-node-lease` são reservados para o sistema.

### Mão na Massa: Primeiro Contato

```bash
# 1. Instale minikube e kubectl (seguindo os comandos acima)

# 2. Inicie o cluster
minikube start --driver=docker

# 3. Verifique os nós
kubectl get nodes

# 4. Veja as informações do cluster
kubectl cluster-info

# 5. Explore os namespaces
kubectl get namespaces
kubectl get pods -n kube-system

# 6. Veja o contexto atual
kubectl config current-context
```

### Quick Check 5

**1. O que é o minikube e para que ele serve?**
**Resposta:** O minikube é uma ferramenta que cria um cluster Kubernetes de nó único na máquina local. Serve para aprendizado, desenvolvimento e testes — não para produção. Usa drivers como Docker, VirtualBox ou HyperKit para criar o nó.

**2. Qual a diferença entre contexto e namespace no kubectl?**
**Resposta:** Contexto define qual cluster, qual usuário e qual namespace usar por padrão — serve para alternar entre clusters (ex.: dev vs prod). Namespace é uma divisão lógica dentro de um único cluster (ex.: separar recursos da equipe A da equipe B). Você pode ter múltiplos namespaces no mesmo cluster e múltiplos contextos para clusters diferentes.

---

## 6. Pods — A Unidade Mínima do Kubernetes

No Docker Swarm, a menor unidade de execução é o **container**. Você cria um `docker service create` que gera tasks, e cada task é um container. No Kubernetes, a menor unidade é o **Pod**.

### O que é um Pod

Um Pod é um invólucro que contém **um ou mais containers** que compartilham:

- **Mesmo IP** — todos os containers do Pod enxergam `localhost` uns dos outros
- **Mesmo hostname** — o Pod é a identidade de rede
- **Mesmos volumes** — podem montar os mesmos volumes e compartilhar arquivos
- **Mesmos namespaces Linux** — network, PID, IPC

Na prática, **99% dos Pods têm um único container**. O padrão de múltiplos containers no mesmo Pod é usado para sidecars — containers auxiliares que fazem logging, proxy, ou sync com o container principal.

### Comparação Swarm Task vs K8s Pod

| Característica       | Swarm Task                           | K8s Pod                            |
| -------------------- | ------------------------------------ | ---------------------------------- |
| Unidade mínima       | Container                            | Pod (1+ containers)                |
| IP próprio           | Sim, cada container                  | Sim, cada Pod (compartilhado)      |
| Ciclo de vida        | Gerenciado pelo Service              | Gerenciado pelo Controller         |
| Rede                 | Rede overlay do Swarm                | Network namespace do Pod + CNI     |
| Persistência efêmera | Sim, task morre → container recriado | Sim, Pod morre → novo Pod, novo IP |

### YAML de um Pod

```yaml
# api-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-pod
  labels:
    app: minha-api
    version: "1.0"
spec:
  containers:
    - name: api
      image: docker.io/zeferino/api-node:latest
      ports:
        - containerPort: 3000
          protocol: TCP
      env:
        - name: DB_HOST
          value: "localhost"
```

### Comandos Essenciais

```bash
# Aplicar um manifesto (criar ou atualizar)
kubectl apply -f api-pod.yaml

# Listar Pods
kubectl get pods
kubectl get pods -o wide          # Com IP e nó
kubectl get pods --watch          # Monitoramento contínuo

# Descrever um Pod (detalhes completos, eventos)
kubectl describe pod api-pod

# Logs do container
kubectl logs api-pod
kubectl logs api-pod -f           # Follow (modo tail)

# Executar comando dentro do container
kubectl exec -it api-pod -- /bin/sh

# Deletar Pod
kubectl delete pod api-pod
```

### Mão na Massa: Criar e Verificar um Pod

```bash
# 1. Crie o arquivo api-pod.yaml com o conteúdo acima

# 2. Aplique o manifesto
kubectl apply -f api-pod.yaml

# 3. Veja o Pod sendo criado
kubectl get pods --watch

# 4. Quando estiver Running, veja os detalhes
kubectl describe pod api-pod

# 5. Veja os logs
kubectl logs api-pod

# 6. Execute um comando dentro do container
kubectl exec -it api-pod -- sh -c "curl localhost:3000"

# 7. Limpe
kubectl delete pod api-pod
```

### Quick Check 6

**1. Por que o Kubernetes usa o conceito de Pod em vez de container diretamente?**
**Resposta:** O Pod é uma unidade de escalonamento que permite que múltiplos containers co-localizados compartilhem IP, volumes e namespaces Linux sem competir por portas. Isso viabiliza o padrão sidecar — um container principal + um auxiliar que compartilham o mesmo ciclo de vida.

**2. Se um Pod morre, o Kubernetes o recria automaticamente?**
**Resposta:** Depende. Um Pod solto (criado diretamente) não é recriado. Para recriação automática, o Pod precisa ser gerenciado por um controller — como um Deployment ou ReplicaSet. O controller detecta a perda e cria um novo Pod no próximo reconciliation loop.

---

## 7. Deployments — Estado Desejado com Rolling Update

No Docker Swarm, você declarava serviços com `docker service create --replicas 3`. No Kubernetes, o equivalente é o **Deployment**.

### Hierarquia: Deployment → ReplicaSet → Pod

![Diagrama: Hierarquia Deployment, ReplicaSet e Pod](images/diagrama-05a-flowchart.png)

- **Deployment**: gerencia versões e atualizações. Cada vez que você altera a imagem, o Deployment cria um novo ReplicaSet e faz o rolling update.
- **ReplicaSet**: mantém o número exato de réplicas. Executa o reconciliation loop para garantir que o número de Pods corresponde ao desejado.
- **Pod**: a unidade de execução que de fato roda o container.

### Rolling Update

Quando você atualiza a imagem do Deployment, o Kubernetes executa um **rolling update**: ele cria um novo ReplicaSet com a nova versão e gradualmente escala-o enquanto escala o ReplicaSet antigo até zero.

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  labels:
    app: minha-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # Pods extras além das 3 réplicas
      maxUnavailable: 0 # Nenhum Pod pode ficar indisponível
  selector:
    matchLabels:
      app: minha-api
  template:
    metadata:
      labels:
        app: minha-api
    spec:
      containers:
        - name: api
          image: docker.io/zeferino/api-node:latest
          ports:
            - containerPort: 3000
```

**maxSurge** e **maxUnavailable** controlam a velocidade e segurança da atualização:

- `maxSurge: 1` → durante o update, pode haver 1 Pod extra (4 no total)
- `maxUnavailable: 0` → durante o update, nenhum Pod pode ficar fora do ar
- O Kubernetes primeiro cria o novo Pod, espera ele ficar Ready, depois derruba um antigo

### Comparação com Swarm

| Operação         | Swarm                           | K8s                                        |
| ---------------- | ------------------------------- | ------------------------------------------ |
| Criar serviço    | `docker service create`         | `kubectl apply -f deployment.yaml`         |
| Escalar          | `docker service scale`          | `kubectl scale deployment` ou alterar YAML |
| Atualizar imagem | `docker service update --image` | Alterar YAML e re-aplicar                  |
| Rolling update   | `--update-parallelism`          | `strategy.rollingUpdate` no YAML           |
| Ver histórico    | `docker service inspect`        | `kubectl rollout history`                  |

![Diagrama: Deployment, ReplicaSet e Pods](images/diagrama-05-flowchart.png)

### Mão na Massa: Criar Deployment e Testar Rolling Update

```bash
# 1. Crie o api-deployment.yaml com o conteúdo acima

# 2. Aplique o manifesto
kubectl apply -f api-deployment.yaml

# 3. Veja os recursos criados
kubectl get deployments
kubectl get replicasets
kubectl get pods

# 4. Escale para 5 réplicas (altere o YAML ou use comando)
kubectl scale deployment api-deployment --replicas=5
kubectl get pods -w

# 5. Simule um rolling update
kubectl set image deployment/api-deployment api=docker.io/zeferino/api-node:v2
kubectl rollout status deployment/api-deployment

# 6. Veja o histórico
kubectl rollout history deployment/api-deployment

# 7. Se algo der errado, faça rollback
kubectl rollout undo deployment/api-deployment
```

### Quick Check 7

**1. Qual a diferença entre Deployment e ReplicaSet?**
**Resposta:** O Deployment gerencia versões e atualizações — ele cria um novo ReplicaSet para cada versão e coordena o rolling update. O ReplicaSet mantém o número exato de Pods rodando — é o controlador que executa o reconciliation loop para réplicas. O Deployment é "a estratégia de release"; o ReplicaSet é "o contador de Pods".

**2. O que significa `maxSurge: 1` e `maxUnavailable: 0` em um rolling update?**
**Resposta:** Significa que durante a atualização, pode haver 1 Pod extra acima do desejado (surge), mas nenhum Pod pode ficar indisponível (unavailable). O Kubernetes primeiro cria um novo Pod, espera ele ficar saudável, depois remove um antigo. Isso garante disponibilidade total durante a atualização — o número de Pods atendendo requisições nunca fica abaixo do especificado.

---

## 8. Services — Expondo Pods na Rede

No Docker Swarm, você expunha portas com `--publish published=3000,target=3000` e o Swarm roteava o tráfego para os containers através do **routing mesh**. No Kubernetes, a exposição de rede é feita por **Services**.

### Por que Precisamos de Services

Pods são efêmeros — eles morrem, são recriados, ganham novos IPs. Um Service é um **endpoint estável** que abstrai um conjunto de Pods, independentemente de seus IPs individuais. O Service usa **labels** e **selectors** para encontrar os Pods que deve encaminhar tráfego.

### Tipos de Service

| Tipo                   | Acesso                              | Uso Típico                            |
| ---------------------- | ----------------------------------- | ------------------------------------- |
| **ClusterIP** (padrão) | IP interno ao cluster               | Comunicação entre serviços (api → db) |
| **NodePort**           | Porta em todos os nós (30000-32767) | Acesso externo para desenvolvimento   |
| **LoadBalancer**       | IP público do cloud provider        | Produção (AWS ELB, GCP LB, Azure LB)  |
| **ExternalName**       | Alias DNS externo                   | Migração gradual                      |

### DNS Interno

O Kubernetes tem um DNS interno (CoreDNS) que resolve nomes de Service automaticamente. Dentro do cluster, você acessa um Service pelo nome:

```
<service>.<namespace>.svc.cluster.local
```

Por exemplo, `db-service.default.svc.cluster.local` ou simplesmente `db-service` (mesmo namespace).

### YAML de um Service

```yaml
# api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: NodePort
  selector:
    app: minha-api
  ports:
    - port: 80 # Porta do Service
      targetPort: 3000 # Porta do container
      nodePort: 30080 # Porta do nó (opcional, se omitido o K8s escolhe)
```

```yaml
# db-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: db-service
spec:
  type: ClusterIP
  selector:
    app: banco
  ports:
    - port: 5432
      targetPort: 5432
```

![Diagrama: Service roteando tráfego para Pods](images/diagrama-06-flowchart.png)

### Mão na Massa: Criar Services

```bash
# 1. Crie api-service.yaml (NodePort) com o conteúdo acima

# 2. Crie db-service.yaml (ClusterIP) com o conteúdo acima

# 3. Aplique os manifests
kubectl apply -f api-service.yaml
kubectl apply -f db-service.yaml

# 4. Veja os Services
kubectl get services

# 5. Teste o acesso externo (minikube)
minikube service api-service

# 6. Teste o DNS interno (dentro de um Pod)
kubectl run test-pod --image=alpine/curl --rm -it -- sh
# Dentro do Pod: curl http://api-service:80
# Dentro do Pod: nslookup db-service
```

### Quick Check 8

**1. Qual a diferença entre port, targetPort e nodePort em um Service NodePort?**
**Resposta:** `port` é a porta do Service (usada por outros serviços dentro do cluster); `targetPort` é a porta do container do Pod (para onde o tráfego é encaminhado); `nodePort` é a porta no IP do nó (acesso externo, faixa 30000-32767).

**2. Por que usar um Service ClusterIP para o banco de dados em vez de NodePort?**
**Resposta:** O banco de dados só precisa ser acessado pela API, não por clientes externos. ClusterIP expõe o Service apenas dentro do cluster, com IP interno — mais seguro, sem porta exposta externamente. A API acessa o banco pelo nome DNS `db-service:5432`.

---

## 9. ConfigMaps e Secrets — Configuração Externalizada

No Docker Swarm, você usava `docker config create` e `docker secret create` para gerenciar configurações e segredos. No Kubernetes, os equivalentes são **ConfigMap** (dados não-sensíveis) e **Secret** (dados sensíveis, codificados em base64).

### ConfigMap

```yaml
# api-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  DB_HOST: "db-service"
  DB_PORT: "5432"
  DB_NAME: "meubanco"
  NODE_ENV: "production"
```

### Secret

**Atenção:** Secrets são armazenados em base64 no etcd — não é criptografado por padrão. Para produção, ative encryption at rest.

```yaml
# api-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
data:
  DB_USER: cG9zdGdyZXM= # "postgres" em base64
  # Substitua pelo base64 da sua senha real
  DB_PASSWORD: U1VBX1NFTkhBX0FRVUk=
```

Para criar secrets de forma mais segura:

```bash
# Gerar base64 sem expor no histórico
echo -n "postgres" | base64
echo -n "password123" | base64
```

Ou usar `kubectl create secret`:

```bash
kubectl create secret generic api-secret \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=password123
```

### Usando ConfigMap e Secret no Deployment

```yaml
# api-deployment-com-config.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: minha-api
  template:
    metadata:
      labels:
        app: minha-api
    spec:
      containers:
        - name: api
          image: docker.io/zeferino/api-node:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secret
```

### Comparação Swarm × K8s

| Característica          | Swarm Config   | Swarm Secret      | K8s ConfigMap | K8s Secret    |
| ----------------------- | -------------- | ----------------- | ------------- | ------------- |
| Dados                   | Não-sensíveis  | Sensíveis         | Não-sensíveis | Sensíveis     |
| Armazenamento           | Raft (manager) | Raft (encriptado) | etcd          | etcd (base64) |
| Criptografia em repouso | Não            | Sim (Raft)        | Não           | Opcional      |
| Montagem como arquivo   | Sim            | Sim               | Sim           | Sim           |
| Montagem como env       | Não            | Sim (--secret)    | Sim (envFrom) | Sim (envFrom) |

### Mão na Massa: ConfigMap + Secret

```bash
# 1. Crie api-config.yaml e api-secret.yaml

# 2. Aplique os manifests
kubectl apply -f api-config.yaml
kubectl apply -f api-secret.yaml

# 3. Veja os recursos
kubectl get configmaps
kubectl get secrets

# 4. Aplique o Deployment com envFrom
kubectl apply -f api-deployment-com-config.yaml

# 5. Verifique as variáveis dentro de um Pod
kubectl exec -it deploy/api-deployment -- env | grep -E "DB_|NODE_"
```

### Quick Check 9

**1. Por que ConfigMap e Secret são separados?**
**Resposta:** Separar dados não-sensíveis (URLs, portas) de dados sensíveis (senhas, tokens) permite políticas de segurança diferentes: Secrets podem ser criptografados em repouso, ter permissões mais restritas e ser auditados com mais rigor. ConfigMaps não precisam dessas proteções.

**2. Secrets usam base64 — isso é segurança?**
**Resposta:** Não. Base64 é codificação, não criptografia. Qualquer um com acesso ao cluster pode decodificar. Secrets são um mecanismo de gerenciamento, não de segurança absoluta. Para proteção real, ative encryption at rest no etcd, use RBAC para restringir acesso e considere ferramentas externas como HashiCorp Vault ou Sealed Secrets.

---

## 10. De Compose para K8s — Tradução Completa

Agora vamos traduzir o `docker-compose.yml` que você construiu nas Aulas 02-05 para manifests do Kubernetes. Este é o momento em que toda a jornada converge: você vai pegar a stack que começou com um `docker-compose up` e terminou rodando em um cluster Swarm, e vai implantá-la em um cluster Kubernetes.

### Mapeamento Sistemático

| docker-compose.yml         | K8s Manifest                                             | Explicação                                                     |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `services.api`             | `api-deployment.yaml` + `api-service.yaml`               | Deployment (réplicas, imagem) + Service NodePort (exposição)   |
| `services.db`              | `db-deployment.yaml` + `db-service.yaml` + `db-pvc.yaml` | Deployment + Service ClusterIP + PersistentVolumeClaim (dados) |
| `services.api.environment` | `api-configmap.yaml` + `api-secret.yaml`                 | ConfigMap (dados não-sensíveis) + Secret (dados sensíveis)     |
| `services.db.volumes`      | `persistentvolumeclaim.yaml`                             | Volume persistente para o banco                                |
| `services.db.networks`     | `db-service.yaml` (ClusterIP)                            | Rede interna via Service + DNS                                 |
| `services.api.depends_on`  | Desnecessário                                            | K8s não tem depends_on; a API usa retry + health check         |

### Os 7 Manifests

Vamos criar uma stack completa:

**1. api-configmap.yaml** (já criado na Seção 9)
**2. api-secret.yaml** (já criado na Seção 9)
**3. api-deployment.yaml** (com envFrom e health check)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  labels:
    app: minha-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: minha-api
  template:
    metadata:
      labels:
        app: minha-api
    spec:
      containers:
        - name: api
          image: docker.io/zeferino/api-node:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secret
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

**4. api-service.yaml** (NodePort)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: NodePort
  selector:
    app: minha-api
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30080
```

**5. db-pvc.yaml** (PersistentVolumeClaim)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

**6. db-deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-deployment
  labels:
    app: banco
spec:
  replicas: 1
  selector:
    matchLabels:
      app: banco
  template:
    metadata:
      labels:
        app: banco
    spec:
      containers:
        - name: db
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: "postgres"
            - name: POSTGRES_PASSWORD
              value: "password123"
            - name: POSTGRES_DB
              value: "meubanco"
          volumeMounts:
            - name: db-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: db-data
          persistentVolumeClaim:
            claimName: db-pvc
```

> _Nota: em produção, mova `POSTGRES_USER` e `POSTGRES_PASSWORD` para um Secret dedicado ao banco, assim como fizemos com a API. Mantivemos inline aqui para manter o exemplo conciso._

**7. db-service.yaml** (ClusterIP)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db-service
spec:
  type: ClusterIP
  selector:
    app: banco
  ports:
    - port: 5432
      targetPort: 5432
```

![Diagrama: Mapeamento docker-compose.yml para manifests Kubernetes](images/diagrama-07-flowchart.png)

### Mão na Massa: Implantar Stack Completa

```bash
# 1. Crie um diretório para os manifests
mkdir -p k8s-manifests

# 2. Crie cada arquivo YAML dentro do diretório

# 3. Aplique todos de uma vez
kubectl apply -f k8s-manifests/

# 4. Veja tudo rodando
kubectl get all

# 5. Teste a API
# Com minikube: minikube service api-service
# Ou: curl localhost:30080/api/health

# 6. Verifique os logs
kubectl logs -l app=minha-api

# 7. Verifique o banco
kubectl exec -it deploy/db-deployment -- psql -U postgres -d meubanco -c "\dt"
```

### Quick Check 10

**1. Por que o K8s não tem um equivalente direto do `depends_on` do Compose?**
**Resposta:** O design do K8s é orientado a auto-recuperação, não a ordem de inicialização. Cada serviço deve ser resiliente a dependências indisponíveis — usando retry, circuit breaker e health checks. O `depends_on` do Compose apenas atrasa a inicialização; não garante que o banco está pronto para aceitar conexões.

**2. Quantos manifests YAML são necessários para traduzir uma stack com 2 serviços (api + db)?**
**Resposta:** Mínimo de 5 manifests (2 Deployments + 2 Services + 1 PVC), mas tipicamente 7 quando separamos ConfigMap e Secret da api. A boa prática do K8s é um recurso por arquivo, com nomes claros, para facilitar manutenção e revisão em CI/CD.

---

## 11. Integração com Docker Hub

Sua imagem está no Docker Hub desde a Aula 03. Agora vamos garantir que o cluster Kubernetes consegue puxá-la.

### Formato da Imagem

```
docker.io/zeferino/api-node:latest
│       │          │        └── tag
│       │          └── repositório (usuario/repo)
│       └── registry (docker.io = Docker Hub)
└── registry raiz (opcional)
```

Para produção, **nunca use `latest`**. Use tags imutáveis:

```yaml
image: docker.io/zeferino/api-node:1.0.0-build123
```

### imagePullPolicy

| Valor          | Comportamento                          |
| -------------- | -------------------------------------- |
| `Always`       | Sempre puxa a imagem do registry       |
| `IfNotPresent` | Só puxa se não estiver em cache no nó  |
| `Never`        | Nunca puxa — usa apenas imagens locais |

Para produção com tags imutáveis, use `IfNotPresent`. Para desenvolvimento com `latest`, use `Always`.

### Repositórios Privados (imagePullSecrets)

Se sua imagem estiver em um repositório privado, você precisa criar um Secret do tipo `docker-registry` e referenciá-lo no Deployment:

```bash
# Criar o secret
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=zeferino \
  --docker-password=seu-token \
  --docker-email=zeferino@email.com
```

```yaml
# Referenciar no Deployment
spec:
  template:
    spec:
      imagePullSecrets:
        - name: regcred
      containers:
        - name: api
          image: docker.io/zeferino/api-node:private-image
```

### Troubleshooting de Pull

```bash
# Verificar eventos do Pod
kubectl describe pod api-pod

# Verificar se o secret existe
kubectl get secrets regcred

# Testar pull manualmente em um nó
minikube ssh
docker pull docker.io/zeferino/api-node:latest
exit

# Verificar logs do kubelet
minikube logs | grep -i "pull"
```

### Mão na Massa: Integração com Docker Hub

```bash
# 1. Verifique pull público
kubectl run test-pull --image=docker.io/zeferino/api-node:latest --restart=Never
kubectl get pods test-pull -w
kubectl delete pod test-pull

# 2. Se tiver repositório privado, crie o secret
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=SEU_USUARIO \
  --docker-password=SEU_TOKEN \
  --docker-email=SEU_EMAIL

# 3. Adicione imagePullSecrets ao deployment
kubectl patch deployment api-deployment -p \
  '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'
```

### Quick Check 11

**1. Por que usar tags imutáveis em vez de `latest` em produção?**
**Resposta:** Tags imutáveis garantem que a imagem sendo implantada é exatamente a mesma que foi testada no pipeline. `latest` muda a cada push — você pode testar uma versão e implantar outra sem saber. Tags imutáveis (ex.: `1.0.0-build123`) permitem rastrear exatamente qual código está rodando em cada ambiente.

**2. O que acontece se o Kubernetes não conseguir puxar a imagem de um repositório privado?**
**Resposta:** O Pod fica no estado `ImagePullBackOff` — o kubelet tenta novamente com backoff exponencial. O `kubectl describe pod` mostra eventos com a mensagem de erro (autenticação, permissão, imagem não encontrada). A solução típica é configurar `imagePullSecrets` com credenciais válidas.

---

## Autoavaliação: Quiz Rápido

**1. Qual o mecanismo central que mantém o estado do cluster convergindo para o estado desejado?**
**Gabarito:** O reconciliation loop — um ciclo contínuo de observar o estado atual, comparar com o desejado e agir para convergir.

**2. Qual componente do control plane K8s armazena todo o estado do cluster?**
**Gabarito:** etcd — um banco chave-valor distribuído e fortemente consistente baseado no algoritmo Raft.

**3. Qual a unidade mínima de execução no Kubernetes?**
**Gabarito:** O Pod — um invólucro que contém um ou mais containers compartilhando IP, volumes e namespaces Linux.

**4. Qual recurso gerencia réplicas e rolling updates?**
**Gabarito:** O Deployment. Ele gerencia ReplicaSets que, por sua vez, gerenciam Pods.

**5. Qual tipo de Service é usado para expor um serviço apenas dentro do cluster?**
**Gabarito:** ClusterIP — atribui um IP interno acessível apenas de dentro do cluster.

**6. Como o Kubernetes resolve o nome de um Service (ex.: `db-service`)?**
**Gabarito:** Através do CoreDNS interno, que resolve `<service>.<namespace>.svc.cluster.local`.

**7. Qual recurso substitui variáveis de ambiente não-sensíveis no K8s?**
**Gabarito:** ConfigMap. Para dados sensíveis, usa-se Secret.

**8. Quantos manifests YAML são necessários para traduzir uma stack completa com 2 serviços?**
**Gabarito:** Tipicamente 7 manifests: 2 Deployments, 2 Services, 1 ConfigMap, 1 Secret, 1 PersistentVolumeClaim.

---

## Exercícios Graduados

### Fácil

**1. Crie um Pod simples com a imagem nginx.**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
    - name: nginx
      image: nginx:alpine
      ports:
        - containerPort: 80
```

**Gabarito:** Salve como `nginx-pod.yaml` e execute `kubectl apply -f nginx-pod.yaml`. Verifique com `kubectl get pods`.

**2. Liste os comandos kubectl para: a) ver todos os Pods; b) ver logs de um Pod; c) executar um shell interativo em um Pod.**
**Gabarito:** a) `kubectl get pods`; b) `kubectl logs <pod-name>`; c) `kubectl exec -it <pod-name> -- /bin/sh`.

### Médio

**3. Traduza o seguinte serviço Compose para manifests K8s (Deployment + Service):**

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    replicas: 2
```

**Gabarito:**

```yaml
# web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:alpine
          ports:
            - containerPort: 80
---
# web-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
```

**4. Configure um rolling update controlado com maxSurge=2 e maxUnavailable=1. O que isso significa?**
**Gabarito:** Durante o update, podem haver 2 Pods extras acima do desejado e 1 Pod pode ficar indisponível. O K8s pode criar até 2 Pods novos antes de derrubar algum antigo, e pode derrubar 1 Pod antigo antes de criar um novo. Isso acelera o update com disponibilidade parcial.

### Difícil

**5. Implemente health checks (liveness + readiness) para um Deployment da sua API Express, com endpoint `/health` retornando 200.**
**Gabarito:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-health-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-com-health
  template:
    metadata:
      labels:
        app: api-com-health
    spec:
      containers:
        - name: api
          image: docker.io/zeferino/api-node:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

**6. Crie um script que faça deploy completo da stack api + db em K8s, incluindo ConfigMap, Secret, PVC, Deployments e Services, e verifique o status de cada recurso.**
**Gabarito:**

```bash
#!/bin/bash
# deploy-stack-k8s.sh
set -e

echo "=== Aplicando ConfigMap ==="
kubectl apply -f api-configmap.yaml

echo "=== Aplicando Secret ==="
kubectl apply -f api-secret.yaml

echo "=== Aplicando PVC ==="
kubectl apply -f db-pvc.yaml

echo "=== Aplicando Deployments e Services ==="
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml
kubectl apply -f db-deployment.yaml
kubectl apply -f db-service.yaml

echo "=== Aguardando Pods ficarem prontos ==="
kubectl wait --for=condition=Ready pods --all --timeout=120s

echo "=== Stack implantada ==="
kubectl get all

echo "=== Testando API ==="
minikube service api-service --url
```

---

## Resumo da AULA FINAL

**Você começou na Aula 01** isolando um processo Node.js em um container Docker. Digitou `docker run -p 3000:3000 api-node` e viu sua aplicação rodando pela primeira vez. Na **Aula 02**, aprendeu que uma aplicação real precisa de mais de um serviço — colocou api + postgres em um `docker-compose.yml` e viu o Compose orquestrar a stack localmente.

Na **Aula 03**, publicou sua imagem no Docker Hub e entendeu o ciclo completo de build, tag e push. Na **Aula 04**, automatizou esse ciclo com GitHub Actions — a cada push no repositório, uma nova imagem era construída, testada e publicada. Na **Aula 05**, subiu um cluster Swarm, distribuiu sua stack em múltiplos nós e viu o reconciliation loop em ação.

E agora, na **Aula 06**, você conectou todos esses pontos. Entendeu os mecanismos universais de orquestração declarativa — estado desejado, reconciliation loop, control plane, API de recursos. E aplicou cada um deles na prática com Kubernetes: instalou minikube, escreveu manifests YAML, criou Deployments com rolling update, expôs sua aplicação com Services, externalizou configuração com ConfigMaps e Secrets, traduziu seu Compose completo para o formato do K8s e integrou com o Docker Hub.

**Você saiu de um `docker run` solitário até uma stack completa rodando em um cluster orquestrado com estado desejado, auto-recuperação e rolling updates.** Em seis aulas, você construiu o entendimento e a prática que sustentam a grande maioria dos deploys em produção na indústria hoje.

Parabéns. 🎉

Este não é o fim da jornada — é a **certificação de que você domina os fundamentos**. O que vem agora é especialização.

---

## Próximos Passos

O módulo principal de Docker e Kubernetes está completo. Aqui estão caminhos naturais de aprofundamento:

- **Helm** — o gerenciador de pacotes do Kubernetes. Com ele você empacota seus manifests em charts reutilizáveis, versionados e configuráveis por valores. Helm é o padrão da indústria para distribuir aplicações K8s.

- **Certificações oficiais** — CKAD (Certified Kubernetes Application Developer) para foco em desenvolvimento e deploy, ou CKA (Certified Kubernetes Administrator) para operação de clusters. Ambas são reconhecidas globalmente.

- **Clusters reais** — EKS (AWS), AKS (Azure) ou GKE (Google Cloud) para provisionar clusters gerenciados em nuvem. Cada um tem seu próprio conjunto de integrações (load balancers, auto-scaling, IAM).

- **Service Mesh** — Istio, Linkerd ou Consul para gerenciar tráfego entre serviços com observabilidade, segurança mTLS e canary deployments sem modificar o código da aplicação.

- **GitOps** — ArgoCD ou Flux para sincronizar automaticamente o estado do cluster com um repositório Git. Você declara o estado desejado no Git e o cluster converge sozinho.

- **Observabilidade** — Prometheus + Grafana para métricas, Loki para logs, Jaeger ou Tempo para tracing distribuído.

Você saiu de `docker run hello-world` até um pipeline CI/CD com deploy em Kubernetes. A estrada que você percorreu em seis aulas é a mesma que milhares de profissionais percorrem em meses de estudo. Você está pronto para produção.

---

## Referências

### Documentação Oficial

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/)

### Cursos e Trilhas

- [CKAD Curriculum](https://github.com/cncf/curriculum)
- [Kubernetes The Hard Way (Kelsey Hightower)](https://github.com/kelseyhightower/kubernetes-the-hard-way)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)

### Ferramentas Mencionadas

- Helm: [https://helm.sh/](https://helm.sh/)
- ArgoCD: [https://argo-cd.readthedocs.io/](https://argo-cd.readthedocs.io/)
- Prometheus: [https://prometheus.io/](https://prometheus.io/)
- Istio: [https://istio.io/](https://istio.io/)

### Vídeos Recomendados

- [Kubernetes // Dicionário do Programador (Código Fonte TV)](https://www.youtube.com/watch?v=mVL0nOM3AGo) — introdução visual aos conceitos de Kubernetes em português (~12 min)
- [Como criar seu primeiro Cluster Kubernetes na prática (Erick Wendel)](https://www.youtube.com/watch?v=dL19dSGKZoc) — mão na massa com KinD para iniciantes (~40 min)

---

## FAQ

**1. Preciso instalar Docker antes do minikube?**
Sim. O minikube com driver Docker usa o Docker Engine instalado na máquina para criar o nó do cluster. Sem Docker, o minikube precisa de um hipervisor (VirtualBox, HyperKit).

**2. Posso rodar Kubernetes em produção sem minikube?**
Sim. Minikube é apenas para desenvolvimento. Em produção, use clusters gerenciados (EKS, AKS, GKE) ou instale manualmente com kubeadm.

**3. Qual a diferença entre kubectl e kubeadm?**
kubectl é a CLI para interagir com um cluster já rodando. kubeadm é uma ferramenta para provisionar e inicializar um cluster do zero.

**4. Preciso saber tudo isso para usar Kubernetes no trabalho?**
Depende do seu papel. Desenvolvedores precisam dominar Deployment, Service, ConfigMap, Secret, kubectl. Operadores de infra adicionam etcd, control plane, RBAC, networking.

**5. Kubernetes substitui o Docker Compose?**
Não diretamente. Compose é excelente para desenvolvimento local. K8s é para produção e escala. Muitas equipes usam Compose para dev e K8s para prod, com ferramentas como Kompose ou Skaffold fazendo a ponte.

**6. O que é um Ingress?**
Ingress é um recurso que expõe múltiplos Services externamente com um único IP, roteando por hostname ou path. O Ingress Controller (nginx, Traefik, AWS ALB) implementa as regras.

**7. Preciso de um cluster com múltiplos nós para aprender?**
Não. O minikube com nó único é suficiente para aprender todos os conceitos desta aula. Para testar resiliência multi-nó, use `minikube node add`.

**8. Como faço backup do etcd?**
Use `etcdctl snapshot save` ou, em clusters gerenciados, o backup automático do cloud provider. Sem backup do etcd, não há recuperação do cluster em caso de desastre.

**9. Qual a diferença entre StatefulSet e Deployment?**
StatefulSet é para aplicações stateful (bancos de dados) que precisam de identidade estável (hostname fixo, storage persistente por réplica). Deployment é para stateless (APIs) onde qualquer réplica é intercambiável.

**10. O Kubernetes cobra alguma taxa?**
Kubernetes é open source (CNCF). Clusters gerenciados em nuvem (EKS, AKS, GKE) cobram pelo plano de controle. Você também paga pelos nós workers (instâncias EC2, VM, etc.).

---

## Glossário

| Termo                           | Definição                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Cluster**                     | Conjunto de máquinas (nós) que rodam workloads gerenciados pelo Kubernetes                        |
| **Control Plane**               | Conjunto de processos que gerenciam o cluster (API Server, etcd, Scheduler, Controller Manager)   |
| **Data Plane**                  | Nós que executam os containers (kubelet, kube-proxy, container runtime)                           |
| **Pod**                         | Menor unidade de execução no K8s — um ou mais containers com IP e storage compartilhados          |
| **Deployment**                  | Recurso que gerencia réplicas e rolling updates de Pods                                           |
| **ReplicaSet**                  | Controlador que mantém o número exato de Pods rodando                                             |
| **Service**                     | Endpoint estável que abstrai um conjunto de Pods                                                  |
| **ClusterIP**                   | Tipo de Service com IP interno ao cluster                                                         |
| **NodePort**                    | Tipo de Service que expõe uma porta em todos os nós                                               |
| **LoadBalancer**                | Tipo de Service integrado com load balancer do cloud provider                                     |
| **ConfigMap**                   | Recurso para dados de configuração não-sensíveis                                                  |
| **Secret**                      | Recurso para dados sensíveis (codificados em base64)                                              |
| **PersistentVolumeClaim (PVC)** | Pedido de armazenamento persistente                                                               |
| **Rolling Update**              | Estratégia de atualização gradual sem downtime                                                    |
| **Health Check**                | Sonda que verifica se o container está vivo (liveness) ou pronto para receber tráfego (readiness) |
| **Reconciliation Loop**         | Ciclo contínuo de observar, comparar, agir                                                        |
| **Estado Desejado**             | Declaração do estado final que o orquestrador deve manter                                         |
| **kubelet**                     | Agente do K8s em cada nó worker                                                                   |
| **kube-proxy**                  | Proxy de rede em cada nó                                                                          |
| **etcd**                        | Banco chave-valor distribuído do control plane                                                    |
| **kubectl**                     | CLI para interagir com o cluster                                                                  |
| **minikube**                    | Cluster K8s de nó único para desenvolvimento local                                                |
| **Namespace**                   | Divisão lógica dentro de um cluster                                                               |
| **Contexto**                    | Combinação de cluster + usuário + namespace no kubeconfig                                         |
| **Helm**                        | Gerenciador de pacotes do Kubernetes                                                              |
