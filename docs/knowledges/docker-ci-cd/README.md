# Plano do Módulo: Docker — Da Containerização ao Deploy em Produção (6 aulas)

Este arquivo é a **fonte única da verdade** sobre a sequência, numeração e escopo das 6 aulas deste módulo. Ensina containerização com Docker de forma progressiva: dos fundamentos de containers e imagens até a orquestração em cluster com Docker Swarm, pipelines de CI/CD com GitHub Actions e introdução ao Kubernetes.

## Público-alvo e ponto de partida

**Público**: desenvolvedores que concluíram os módulos de Linux (uso avançado de terminal, sistema de arquivos, processos, permissões, gerenciamento de pacotes), Redes (TCP/IP, portas, HTTP, DNS), e a trilha completa de programação: HTML, CSS, JavaScript, Node.js (npm, `package.json`, servidores, variáveis de ambiente, debugging) e LangChain (padrões multi-serviço, integração de APIs, orquestração de dependências). Experiência com git e editores de texto.

**O que o aluno já sabe**: CLI avançado, scripts shell, gerenciamento de pacotes (`apt`, `npm`), ciclo de vida de processos, portas e sockets, variáveis de ambiente (`.env`, `dotenv`), debugging de aplicações Node.js, cadeias de dependências (`node_modules`), servidores HTTP, APIs REST, integração multi-serviço (LLM + vector store + embedding no LangChain), e o problema "funciona na minha máquina" — eles já o viveram repetidamente em projetos reais.

**O que o aluno NÃO sabe**: Containers como abstração de runtime, imagens e camadas (layers) como artefato de build imutável, Dockerfile como DSL declarativa de build, Docker Compose como orquestração de stacks locais, Registry como distribuição de artefatos, redes de container (bridge, overlay), volumes e bind mounts como persistência de estado, healthcheck e `depends_on` como controle de ciclo de vida de serviços, multi-stage builds como técnica de otimização de imagem, CI/CD automatizado com GitHub Actions, orquestração em cluster com Docker Swarm, e fundamentos de Kubernetes (pods, deployments, services).

**Compromisso do módulo**: partir da dor que o aluno já conhece — a matriz de dependências de um projeto Node.js real e a complexidade de ambiente de um stack LangChain — e construir a solução containerização de dentro para fora. Cada conceito do Docker é apresentado como resposta a um problema que o aluno já enfrentou, não como abstração teórica. O aluno constrói uma aplicação real que evolui de um container local até deploy em produção com CI/CD automatizado.

## Filosofia: cada aula é concreta e treinável

Esta é a maior exigência do módulo. Cada aula entrega:

1. **Conteúdo principal** (`aula-NN-<slug>.md`): explicação conceitual + demonstração guiada + prática durante a aula (Mão na Massa inline, Quick Check, Quiz rápido).
2. **Questões de Aprendizagem** (`aula-NN-questoes-de-aprendizagem.md`): um arquivo **separado** com tarefas práticas que funcionam como checkpoint de aprendizagem — *"eu realmente entendi a matéria?"*. Cada questão tem **Objetivo → Passos de Execução → Entrega** (com template para o aluno preencher).

O arquivo de questões é um guia: *"isto é importante — você entendeu? Então tente fazer."* O aluno só avança quando consegue completar as questões por conta própria, sem reler a aula a cada passo.

## Projeto Progressivo: De App Local a Deploy em Produção

O aluno parte de uma aplicação Express que ele mesmo saberia construir em Node.js puro e, aula a aula, adiciona camadas de containerização e automação até produzir um pipeline completo de CI/CD com deploy em cluster. Cada peça é funcional por si só e se ancora em conhecimento prévio: processos (Linux), dependências (Node.js), multi-serviço (LangChain).

| Aula | Peça adicionada | O que o aluno faz | Âncora de conhecimento |
|---|---|---|---|
| 01 | **App containerizado** | Constrói a base conceitual (containers, imagens, camadas, namespaces) e produz um Dockerfile multi-stage funcional + container rodando com hot reload | Processos Linux, `npm` scripts, `node_modules` |
| 02 | **Stack multi-serviço** | Adiciona PostgreSQL à stack, configura rede interna, volumes nomeados, healthcheck e profiles dev/prod via docker-compose.yml | Padrões multi-serviço do LangChain, variáveis de ambiente |
| 03 | **Pipeline de distribuição + CI/CD intro** | Sobe Registry privado, aplica versionamento SemVer, publica no Docker Hub e introduz GitHub Actions para automatizar build e push | Git, npm versioning, deploy de apps Node.js |
| 04 | **Pipeline CI/CD completo** | Domina GitHub Actions: workflows multi-job, secrets, environments, testes automatizados, cache de camadas e deploy multi-ambiente (staging → production) | Git push, testes automatizados, variáveis de ambiente |
| 05 | **Orquestração em cluster** | Sobe um cluster Docker Swarm com managers e workers, implanta a stack como `docker stack deploy`, configura rolling updates e secrets | Redes (overlay), Docker Compose, balanceamento de carga |
| 06 | **Kubernetes intro** | Compreende a arquitetura K8s, traduz o docker-compose.yml para manifests K8s (Deployment, Service, ConfigMap) e faz deploy local com minikube | Docker Swarm, Docker Hub, CI/CD pipeline |

**Eixo transversal**: o fio condutor de todas as aulas é o **princípio do isolamento** — o aluno descobre como Docker isola processos (Aula 01), como Compose isola stacks inteiras (Aula 02), como Registry isola distribuição (Aula 03), como CI/CD isola o pipeline de entrega (Aula 04), como Swarm isola o cluster (Aula 05) e como Kubernetes isola a produção em escala (Aula 06). O modelo mental expande progressivamente: processo → stack → distribuição → pipeline → cluster → produção.

## O mecanismo central (eixo transversal)

```
[Aplicação]
  + [Dependências (Node, libs)]
  + [Configurações (env, portas)]
  = Imagem Docker (pacote auto-contido)

Container = Imagem em execução (isolada por namespaces + cgroups)

Pipeline CI/CD = Build → Test → Push → Deploy (automatizado por GitHub Actions)

Cluster = Múltiplos nós executando serviços (orquestrados por Swarm ou Kubernetes)
```

A cada aula o aluno adiciona uma camada a este modelo: primeiro isola o app (Aula 01), depois isola a stack (Aula 02), depois isola a distribuição (Aula 03), depois automatiza com CI/CD (Aula 04), depois escala com Swarm (Aula 05), e finalmente prepara o caminho para Kubernetes (Aula 06).

## Sequência das 6 aulas

### Aula 01: Docker — Instalação, Primeiro Container e Fundamentos

**Fluxo da aula**: Problema (o aluno reconhece) → Instalação (passo a passo, com verificação) → Primeiro container (o aluno executa e vê) → Entendimento (a teoria explica o que acabou de acontecer).

**Conteúdo**: 

1. **Problema (breve — 5 min)**: relembrar `node_modules` de 500 MB, versões conflitantes de runtime, "funciona na minha máquina" entre Mac/Linux. O aluno reconhece imediatamente — não é necessário convencer ninguém de que containers são úteis.

2. **Instalação (passo a passo — 10 min)**: Docker Engine no Linux via `apt` (eles dominam). Adicionar repositório oficial, instalar `docker-ce`, verificar com `docker --version`, iniciar daemon com `systemctl`. Cada comando com output esperado para auto-verificação. Grupo `docker` para execução sem `sudo`.

3. **Primeiro container (mão na massa imediata — 5 min)**: `docker run hello-world`. O aluno vê a primeira linha do output: "Unable to find image 'hello-world:latest' locally". O Docker acabou de consultar o **Docker Hub** — apresentado aqui com a analogia que gruda: *"Docker Hub é o npm registry das imagens — você `docker pull` em vez de `npm install`, e recebe um ambiente completo, não só um pacote."* Dissecar cada linha do output: pull da imagem do registry público, criação do container, execução, exit. O aluno acabou de usar Docker Hub sem saber — agora ele sabe.

4. **Entendimento (a teoria explica a experiência)**: agora que o aluno VIU um container funcionar — Docker Hub como registry público (o aluno já o usou no passo 3, agora entende a mecânica: namespaces, official images, tags), imagens vs containers (analogia: classe vs objeto), camadas e copy-on-write, Dockerfile como receita (`FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`), multi-stage builds (separar build de produção — o aluno entende: `devDependencies` não vão para produção), `.dockerignore` como `.gitignore` de build context, bind mounts para hot reload com `nodemon` (o aluno já usa), namespaces e cgroups como mecanismo de isolamento (explicados a partir de processos Linux que o aluno conhece).

**Comandos da aula**: `docker --version`, `docker run`, `docker pull`, `docker search`, `docker build`, `docker ps`, `docker images`, `docker logs`, `docker exec`, `docker stop`, `docker rm`, `docker rmi`, `docker system prune`.

**Destaque do projeto**: o aluno sai da Aula 01 com Docker instalado e uma API Express containerizada com Dockerfile multi-stage, `.dockerignore` e bind mount para hot reload. Cada comando é digitado pelo aluno — nada é só teoria ou slide.

### Aula 02: Docker Compose — Orquestração Multi-Serviço

**Fluxo da aula**: Problema (orquestrar na mão é frágil) → Experiência (1 comando sobe tudo) → Entendimento (o que o Compose fez) → Aprofundamento (healthcheck, volumes, profiles).

**Conteúdo**:

1. **Problema (breve — 5 min)**: o aluno tem a API Express da Aula 01 rodando em container. Agora precisa de PostgreSQL. Fazer na mão: `docker network create`, `docker run` com `--link`, scripts de init — lembra o LangChain, onde subir 3 serviços exigia 3 terminais e ordem manual. Frágil, repetitivo, não escala.

2. **Experiência (mão na massa imediata — 10 min)**: o aluno recebe um `docker-compose.yml` pronto e digita `docker compose up`. A stack sobe — API + PostgreSQL — com um único comando. Os logs dos dois serviços aparecem entrelaçados no terminal. Ponto de alavanca: *"`docker compose up` é o `npm start` da stack inteira — sobe tudo que o app precisa com um comando."*

3. **Entendimento (a teoria explica a experiência — 15 min)**: agora que o aluno VIU a stack subir sozinha — dissecar o YAML: `services` (cada container é um serviço), `networks` (bridge automática — o aluno entende da aula de Redes), DNS interno (a API acessa PostgreSQL pelo nome do serviço `db`, não por IP). `depends_on` com `condition: service_healthy`: ponto de alavanca — *"é o `await` antes de usar a dependência. Você não chama a API antes dela estar pronta, e o Compose não sobe o app antes do banco responder."* Healthcheck como o "tá pronto?" que o Compose pergunta antes de liberar o próximo serviço.

4. **Aprofundamento (prática avançada — 20 min)**: volumes nomeados para persistência — ponto de alavanca: *"é o HD externo da stack. O container morre, o volume fica. Deruba e sobe de novo — os dados do PostgreSQL continuam lá."* Profiles dev/prod no mesmo arquivo — ponto de alavanca: *"é o `NODE_ENV` do Compose. Mesmo código, comportamentos diferentes por ambiente."* Arquivo `.env` para config — o aluno já conhece do `dotenv` no Node.js, aqui a sintaxe é a mesma.

**Comandos da aula**: `docker compose up`, `docker compose down`, `docker compose ps`, `docker compose logs`, `docker compose exec`, `docker compose build`, `docker compose restart`.

**Destaque do projeto**: o aluno adiciona PostgreSQL à API Express da Aula 01 via Compose, com healthcheck, volume nomeado para persistência, profiles dev/prod e `.env`. A stack sobe com `docker compose up` — um comando, dois serviços, zero scripts manuais.

### Aula 03: Docker Registry, Docker Hub e Introdução ao CI/CD com GitHub Actions

**Fluxo da aula**: Problema (distribuir a imagem) → Experiência (push/pull real) → Docker Hub aprofundado → GitHub Actions intro (automatizar o pipeline).

**Conteúdo**:

1. **Registry Local e Distribuição**: o aluno adiciona `registry:2` ao Compose, versiona imagens com SemVer, executa push/pull simulando outra máquina. Nomenclatura canônica: `registry/namespace/repo:tag`. Transferência delta com hash SHA-256 (camadas não alteradas geram "Layer already exists").

2. **Docker Hub Aprofundado**: namespaces, official images, verified publishers, repositórios públicos vs privados. Criação de conta, `docker login`, push para Docker Hub como registry cloud real (não mais `localhost:5000`).

3. **Introdução ao GitHub Actions**: o que é CI/CD e por que automatizar. Estrutura de um workflow YAML: `name`, `on` (triggers: push, pull_request), `jobs`, `steps`. Primeiro workflow: build da imagem → login no Docker Hub → push automático a cada `git push`. Ponto de alavanca: *"GitHub Actions é o robô que executa o pipeline build→push que você fazia manualmente no terminal — só que agora ele roda sozinho a cada commit."*

**Comandos da aula**: `docker tag`, `docker push`, `docker pull`, `docker login`, `docker logout`, `docker run -d -p 5000:5000 registry:2`, `docker push` para Docker Hub, criação de workflow YAML no diretório `.github/workflows/`.

**Destaque do projeto**: o aluno publica sua imagem no Docker Hub (registry cloud real) e configura um workflow GitHub Actions que automatiza build e push a cada commit. Ao final da aula, `git push` dispara o pipeline completo automaticamente.

### Aula 04: GitHub Actions para CI/CD com Docker — Pipeline Completo

**Fluxo da aula**: Recap (workflow básico da Aula 03) → Aprofundamento (jobs, secrets, environments) → Prática (pipeline multi-ambiente com testes).

**Conteúdo**:

1. **Workflows Multi-Job**: jobs paralelos e sequenciais (`needs`), matriz de estratégia (`matrix`), steps condicionais (`if`). Separação build/test/deploy em jobs distintos com passagem de artefatos.

2. **Secrets e Environments**: `secrets.DOCKERHUB_TOKEN` para autenticação segura (nunca hardcode credenciais). GitHub Environments para staging e production com approval gates e protection rules.

3. **Testes no Pipeline**: executar testes automatizados (Jest + supertest para API Express) dentro do pipeline antes do push. Cache de camadas Docker (`docker/build-push-action` com `cache-from`/`cache-to`) para acelerar builds.

4. **Deploy Multi-Ambiente**: workflow que promove a imagem de staging para production com approval manual. Tags de ambiente (`:staging`, `:production`) atualizadas automaticamente pelo pipeline.

**Comandos da aula**: actions do GitHub Marketplace (`docker/login-action`, `docker/build-push-action`), configuração de `environments` no GitHub, secrets via UI e API, `docker buildx` para cache multi-plataforma.

**Destaque do projeto**: o aluno transforma o workflow simples da Aula 03 em um pipeline profissional com testes automatizados, cache de camadas, deploy multi-ambiente com approval gates e secrets gerenciados.

### Aula 05: Docker Swarm — Orquestração Nativa em Cluster

**Fluxo da aula**: Problema (single host não escala) → Arquitetura Swarm → Experiência (subir cluster) → Prática (stack deploy com rolling updates).

**Conteúdo**:

1. **Arquitetura Swarm**: manager nodes (control plane) e worker nodes (execução). Raft consensus para tolerância a falhas. Comunicação via overlay network com DNS interno.

2. **Services vs Containers**: `docker service create` — serviços são declarações de estado desejado (réplicas, restart policy). Swarm garante que o estado real converge para o desejado.

3. **Docker Stack Deploy**: evolução natural do Compose para Swarm. `docker stack deploy -c docker-compose.yml myapp` implanta a stack no cluster. Adições ao Compose: `deploy` (replicas, resources, restart_policy, update_config).

4. **Rolling Updates e Rollback**: `update_config` (parallelism, delay, failure_action). `docker service rollback` reverte em segundos. Secrets e configs no Swarm (`docker secret create`, `docker config create`).

**Comandos da aula**: `docker swarm init`, `docker swarm join`, `docker node ls`, `docker service create`, `docker service ls`, `docker service ps`, `docker service update`, `docker service rollback`, `docker stack deploy`, `docker stack ls`, `docker secret create`, `docker config create`.

**Destaque do projeto**: o aluno sobe um cluster Swarm local (3 nós com `docker swarm init` + workers), implanta a stack da Aula 02 como `docker stack deploy`, executa rolling update com `docker service update --image` e reverte com `docker service rollback`. A aplicação continua respondendo durante o update.

### Aula 06: Kubernetes — Introdução à Orquestração em Produção

**Fluxo da aula**: Problema (Swarm é simples mas K8s é o padrão) → Arquitetura K8s → Experiência (minikube + kubectl) → Prática (traduzir Compose para K8s manifests).

**Conteúdo**:

1. **Arquitetura Kubernetes**: control plane (API server, scheduler, controller manager, etcd) e worker nodes (kubelet, kube-proxy, container runtime). Pods como unidade mínima (1+ containers que compartilham rede e storage).

2. **kubectl e minikube**: instalação do minikube para cluster local. `kubectl get pods`, `kubectl describe`, `kubectl logs`, `kubectl exec`. Contexto e namespaces.

3. **Deployments e Services**: Deployment (estado desejado, réplicas, rolling update). Service (ClusterIP, NodePort, LoadBalancer) — expor Pods na rede. ConfigMaps e Secrets para configuração.

4. **De Compose para K8s**: tradução do `docker-compose.yml` da Aula 02 para manifests K8s. API Express → Deployment + Service (NodePort). PostgreSQL → Deployment + Service (ClusterIP) + PersistentVolumeClaim.

**Comandos da aula**: `minikube start`, `kubectl apply -f`, `kubectl get pods/deployments/services`, `kubectl logs`, `kubectl exec`, `kubectl describe`, `kubectl delete`, `kubectl rollout status/undo`.

**Destaque do projeto**: o aluno traduz a stack completa (API + PostgreSQL) do docker-compose.yml para manifests Kubernetes, faz deploy no minikube, verifica o funcionamento e entende o caminho de migração de Compose/Swarm para Kubernetes.

## Convenções didáticas

- **Linguagem dos apps de exemplo**: JavaScript/Node.js com Express — os alunos dominam esse stack
- **Âncoras de conhecimento**: todo conceito novo é apresentado a partir de algo que o aluno já domina. Os pontos de alavanca principais: `docker pull` → `npm install` (registry de ambientes), `docker compose up` → `npm start` (um comando sobe tudo), `depends_on` → `await` (esperar dependência antes de usar), profiles → `NODE_ENV` (ambientes por variável), `.env` → `dotenv` (mesma sintaxe), `docker push/pull` → `git push`/`npm ci` (distribuição de artefatos), `:latest` → deploy sem lockfile (risco de versão flutuante), GitHub Actions workflow → script shell que roda no cloud (automação disparada por eventos). Cada âncora está embedada no passo da aula onde o aluno encontra o conceito pela primeira vez, como parte natural do fluxo — não como seção separada.
- **Imagem base**: `node:22-alpine` para produção (atual LTS, ~45 MB), `node:22` para desenvolvimento com hot reload
- **Comandos**: sempre mostrar saída esperada para auto-verificação; incluir flags de troubleshooting (`--no-cache`, `--progress=plain`)
- **Diagramas**: Mermaid para visualizar camadas, rede de containers, fluxo de build, arquitetura Swarm/K8s (renderizados como PNG)
- **Tom**: conversacional e direto — o aluno é desenvolvedor experiente, não precisa de simplificações excessivas. Analogias técnicas são bem-vindas (ex: "imagem Docker está para container assim como classe está para objeto")
- **Didática**: experiência antes da explicação. O aluno primeiro faz (instala, executa, observa o output), depois entende o mecanismo. A teoria explica o que o aluno acabou de ver, não o que ele ainda vai ver. Isso inverte a ordem tradicional "slides → prática" para "prática → entendimento → prática mais avançada". A primeira parte de cada aula começa com mão na massa (instalar, rodar, ver resultado); a segunda parte sistematiza o que foi observado e avança para conceitos mais profundos.

## Arquitetura de pastas de cada aula

```
modules/curso-docker/aulaNN/
├── aula-NN-<slug>.md                       # Conteúdo principal
├── aula-NN-questoes-de-aprendizagem.md     # Tarefas/checkpoint prático (arquivo separado)
├── aula-NN-<slug>.pdf                       # PDF para distribuição (gerado ao final)
└── images/                                  # Diagramas Mermaid renderizados como PNG
```

## Progressão de complexidade

| Aula | Tema | Comandos novos | Arquivos produzidos |
|---|---|---|---|
| 01 | Docker Fundamentos | ~15 | Dockerfile, .dockerignore |
| 02 | Docker Compose | ~10 | docker-compose.yml, .env, init.sql |
| 03 | Registry + Docker Hub + GitHub Actions intro | ~12 | compose com registry, workflow YAML (.github/workflows/) |
| 04 | GitHub Actions CI/CD completo | ~8 actions | workflows multi-job, environments config |
| 05 | Docker Swarm | ~15 | stack YAML, secrets, configs |
| 06 | Kubernetes intro | ~12 | Deployment YAML, Service YAML, ConfigMap, PVC |

> **Nota sobre contagem de comandos**: a contagem reflete comandos novos de cada tecnologia por aula. Comandos de shell, git e Node.js que o aluno já domina não são contabilizados como "novos".

## Regras para Manutenção de Coerência

1. **Este README é alterado primeiro.** Se uma aula for mesclada, dividida, reordenada ou renomeada, o README é atualizado **antes** de qualquer arquivo de aula.
2. **Referências nas aulas seguem o README.** O campo "Próxima Aula", menções como "Na Aula 05...", e a "Recapitulação" devem corresponder exatamente a este plano.
3. **Títulos consistentes.** O `titulo` no frontmatter de cada aula deve ser idêntico ao título no plano acima.
4. **A aula N nunca referencia conceitos ou ferramentas da aula N+1.**
5. **Questões de Aprendizagem** sempre têm `tipo: "checkpoint-pratico"` no frontmatter e seguem a estrutura `Objetivo → Passos de Execução → Entrega`.

## Referências

### Documentação oficial
- [Docker Docs](https://docs.docker.com/) — documentação oficial
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [Compose file reference](https://docs.docker.com/compose/compose-file/)
- [Docker Registry](https://docs.docker.com/registry/)
- [Docker Hub](https://hub.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [minikube](https://minikube.sigs.k8s.io/docs/)

### Fontes consultadas para este plano
- Documentação oficial do Docker Engine, Compose, Registry, Swarm
- Documentação oficial do GitHub Actions
- Documentação oficial do Kubernetes
- Skill `lesson-design` — template canônico e regras de formato
- Skill `lesson-assets` — pipeline de imagens e DOCX
- Skill `continual-harness` — ciclo de auto-melhoria
