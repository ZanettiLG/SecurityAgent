---
titulo: "Aula 01: Docker — Instalação, Primeiro Container e Fundamentos"
modulo: "Docker, Docker Compose e Distribuição"
duracao_estimada: "90 minutos"
nivel: "intermediario"
tags: [docker, containers, imagens, dockerfile, docker-hub, namespaces, cgroups, multi-stage]
data: 2026-06-15
---

# Curso: Docker, Docker Compose e Distribuição — Aula 01

## Docker: Instalação, Primeiro Container e Fundamentos

**Duração estimada:** 90 minutos (45 de leitura + 45 de prática)
**Nível:** Intermediário
**Pré-requisitos:** Linux avançado (terminal, `apt`, `systemctl`, `sudo`), Node.js 18+ com npm, Express, Git, e familiaridade com processos Linux (`ps`, `/proc`), variáveis de ambiente e servidores HTTP

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

- [ ] **Explicar** por que processos precisam de isolamento e como namespaces (PID, net, mount) e cgroups resolvem esse problema
- [ ] **Descrever** o funcionamento de sistemas de arquivos em camadas e o mecanismo de copy-on-write com suas próprias palavras
- [ ] **Distinguir** uma imagem de um container usando a analogia classe/objeto e identificar cada um na prática
- [ ] **Instalar** o Docker Engine no Linux via `apt` e verificar o funcionamento com `docker --version` e `systemctl`
- [ ] **Executar** `docker run hello-world` e interpretar cada linha do output (pull, create, run, exit)
- [ ] **Explicar** o papel do Docker Hub como registry público de imagens, incluindo namespaces, official images e tags
- [ ] **Escrever** um Dockerfile completo com FROM, WORKDIR, COPY, RUN, EXPOSE e CMD para uma API Express
- [ ] **Construir** uma imagem otimizada com multi-stage build separando build de produção, e configurar .dockerignore
- [ ] **Configurar** bind mounts com `-v` para hot reload com nodemon durante desenvolvimento
- [ ] **Utilizar** comandos essenciais de gerenciamento: docker ps, images, logs, exec, stop, rm, rmi, prune

---

## Como Usar Esta Aula

Esta aula está organizada em **duas partes** com uma transição explícita entre elas.

A **primeira parte** (FUNDAMENTOS) cobre os mecanismos universais de isolamento e empacotamento — namespaces, sistemas de arquivos em camadas, copy-on-write, cgroups e build contexts. Estes conceitos são apresentados de forma genérica: valem para qualquer sistema de containerização, qualquer linguagem, qualquer runtime. Eles são ancorados em **problemas que você já enfrentou** — `node_modules` de 500 MB, versões conflitantes de Node.js, "funciona na minha máquina".

A **segunda parte** (APLICAÇÃO) conecta cada mecanismo à sua implementação concreta no Docker. Aqui a didática muda: você primeiro **faz** (instala, executa, vê o output), depois **entende** (a teoria explica o que acabou de acontecer), e por fim **apro funda** (multi-stage, bind mounts, otimizações).

Ao longo do caminho, você encontrará seções **"Mão na Massa"** com passos práticos para executar no seu terminal, e **"Quick Check"** ao final de cada seção para verificar se você absorveu o conceito.

**Tempo estimado:** 45 minutos de leitura + 45 minutos de prática.

---

## Mapa Mental

Este diagrama mostra todos os conceitos que você vai dominar nesta aula:

![Mapa mental: Docker — Instalação, Primeiro Container e Fundamentos](images/diagrama-01-mindmap.png)

---

**FUNDAMENTOS: Mecanismos Universais de Isolamento e Empacotamento**

> *"Os conceitos desta seção são universais — valem para qualquer sistema de containerização, qualquer linguagem, qualquer runtime. Na segunda parte, você verá como o Docker implementa cada um deles. Mas aqui, o foco está no 'por que' e 'como funciona', ancorado em problemas que você já enfrentou."*

---

## 1. Isolamento de Processos — A Raiz do Problema

Lembra quando dois projetos precisavam de versões diferentes do Node.js? Um rodava com Node 18, o outro com Node 22. `nvm` resolvia, mas apenas para o Node — e se o conflito fosse em uma biblioteca nativa compilada, como `sharp` ou `bcrypt`? Ou em um arquivo de configuração do sistema que ambas as aplicações precisavam ler?

O problema fundamental é que **processos compartilham o mesmo sistema operacional**. Eles enxergam os mesmos PIDs, as mesmas interfaces de rede, os mesmos arquivos. Para um processo, todo o sistema está visível. Isso é ótimo para comunicação, mas péssimo para isolamento.

### Namespaces: Salas Separadas no Mesmo Escritório

**Namespaces** são uma funcionalidade do kernel Linux (presente desde 2002) que resolve exatamente isso. Um namespace dá a um processo (e seus filhos) uma visão própria e isolada de um recurso do sistema. É como ter salas separadas em um escritório — cada sala tem seu próprio quadro branco (PID), seu próprio telefone (rede), seus próprios armários (arquivos). O que acontece em uma sala não afeta a outra.

Três namespaces essenciais para containers:

- **PID namespace**: isola a numeração de processos. Dentro de um PID namespace, o processo principal enxerga a si mesmo como PID 1. Ele não vê processos de fora do namespace, nem processos de outros namespaces.
- **Net namespace**: isola interfaces de rede, tabelas de roteamento e regras de firewall. Cada net namespace tem seus próprios endereços IP, suas próprias portas.
- **Mount namespace**: isola a árvore de diretórios montados. Cada mount namespace pode ter seu próprio `/`, `/usr`, `/home` — completamente independente de outros namespaces.

Quando você pensa em "container", pense em um grupo de processos rodando dentro de um conjunto de namespaces. Eles enxergam apenas o que o namespace permite enxergar.

![Diagrama: Processos isolados em namespaces separados, cada um com sua própria visão de PID 1](images/diagrama-02-diagram.png)

### O Que Isso Significa na Prática

Se você tem duas aplicações que precisam de versões diferentes do Node.js, colocar cada uma em seu próprio PID + mount namespace resolve: cada uma enxerga seu próprio sistema de arquivos com seu próprio Node.js. Elas não "sabem" da existência uma da outra — a menos que você explicitamente conecte os namespaces.

> *"Namespaces são como salas separadas em um escritório — cada sala tem seu próprio quadro branco (PID), seu próprio telefone (rede), seus próprios armários (arquivos). O que acontece em uma sala não afeta a outra."*

### Quick Check 1

**1. Qual namespace impediria um processo de enxergar as interfaces de rede de outro processo?**
**Resposta:** O net namespace. Cada net namespace tem suas próprias interfaces de rede, tabelas de roteamento e regras de firewall, isolando completamente a camada de rede entre processos.

**2. Por que o mount namespace é essencial para que duas aplicações rodem versões diferentes do Node.js no mesmo servidor?**
**Resposta:** O mount namespace permite que cada aplicação tenha sua própria árvore de diretórios montados, incluindo o diretório onde o Node.js está instalado. Assim, cada aplicação enxerga sua própria versão do runtime sem conflito.

---

## 2. Sistemas de Arquivos em Camadas — Construindo por Sobreposição

Você já reparou que dois projetos Node.js podem compartilhar a mesma base? Ambos usam Express, ambos usam `lodash`. Se cada projeto tivesse sua própria cópia completa de tudo, o disco encheria rapidamente. Mas se todos compartilhassem a mesma base, projetos diferentes não poderiam ter versões diferentes das mesmas dependências.

A solução para esse dilema são **sistemas de arquivos em camadas** (*layered filesystems*). A ideia é simples: em vez de ter um sistema de arquivos monolítico, você **empilha camadas imutáveis** (layers). Cada camada adiciona, modifica ou remove arquivos em relação à camada anterior. O sistema operacional vê a "soma" de todas as camadas como um único sistema de arquivos.

### Copy-on-Write: A Transparência no Topo

Quando um processo **escreve** em um arquivo, a modificação não altera a camada original. Em vez disso, o sistema copia o arquivo da camada inferior para uma **camada superior** (read-write) e aplica a modificação lá. Isso se chama **copy-on-write (CoW)** — a cópia só acontece quando alguém escreve.

O resultado:
- As camadas inferiores permanecem **imutáveis** e podem ser compartilhadas entre centenas de processos
- Cada processo enxerga sua própria "visão final" da sobreposição de todas as camadas
- Se 10 processos usam a mesma base Ubuntu, a camada base existe uma **única vez** em disco

![Diagrama: Stack de camadas de sistema de arquivos com copy-on-write](images/diagrama-03-diagram.png)

### A Analogia do Retroprojetor

Imagine um retroprojetor com várias transparências empilhadas. A base é a imagem original do sistema operacional. Cada transparência adicional adiciona uma camada: runtime, dependências, código. A "visão final" é a sobreposição de todas as transparências. Agora, se você quiser escrever algo, não rabisca a transparência original — coloca uma nova transparência por cima com sua modificação. A base permanece intacta.

> *"Camadas de sistema de arquivos são como transparências empilhadas em um retroprojetor. A base nunca é alterada. Cada modificação é uma nova transparência no topo. A visão final é a soma de todas elas."*

### Quick Check 2

**1. Se 20 containers usam a mesma imagem base de 50 MB, quanto espaço em disco a imagem base ocupa?**
**Resposta:** Apenas 50 MB — uma única vez. As camadas inferiores são imutáveis e compartilhadas entre todos os containers que as usam, independentemente de quantos containers estejam em execução.

**2. O que acontece com o arquivo original na camada inferior quando um processo modifica esse arquivo?**
**Resposta:** O arquivo original permanece intacto na camada inferior (imutável). O sistema copia o arquivo para a camada superior (read-write) através do mecanismo copy-on-write e aplica a modificação na cópia. O processo vê a versão modificada, mas a base original nunca é alterada.

---

## 3. Controle de Recursos — Limites e Garantias

Processos isolados por namespaces ainda competem pelos mesmos recursos físicos da máquina: CPU, RAM, I/O de disco, largura de rede. Sem controle, um processo pode consumir tudo e prejudicar os outros.

Você já viu isso acontecer. Um processo Node.js com vazamento de memória consome 2 GB de RAM. O sistema começa a usar swap. O servidor fica lento. Outros processos começam a morrer por falta de memória. O que deveria ser um problema local vira um problema global.

### Cgroups: O Controlador de Recursos

**Cgroups** (control groups) são outra funcionalidade do kernel Linux — desde 2007. Eles permitem **contabilizar, limitar e priorizar** o uso de recursos por grupo de processos.

Com cgroups, você pode dizer: "este grupo de processos pode usar no máximo 512 MB de RAM, 0.5 CPUs, e tem prioridade de I/O baixa." O kernel garante o limite — o processo não consegue ultrapassá-lo, independentemente do que faça.

- **CPU shares**: define a fatia relativa de CPU. Se dois grupos têm shares 1024 e 512, o primeiro recebe o dobro de tempo de CPU.
- **Memory limit**: teto absoluto de RAM. Se o grupo tenta alocar mais, o OOM killer (Out-Of-Memory killer) do kernel mata o processo mais pesado do grupo.
- **I/O throttling**: limita operações de leitura/escrita por segundo em disco.

Cgroups são o **porquê** de um container não conseguir derrubar o servidor inteiro. Mesmo que a aplicação dentro do container tenha um vazamento de memória, o cgroup impede que ela consuma mais do que o limite definido — o estrago fica contido dentro do grupo.

> *"Cgroups são o guardião de recursos do sistema — enquanto namespaces dizem 'o que você pode ver', cgroups dizem 'o quanto você pode usar'."*

### Quick Check 3

**1. Qual mecanismo impede que um container consuma mais de 1 GB de RAM independentemente do que a aplicação faça?**
**Resposta:** Cgroups (control groups), através da configuração de memory limit. O kernel força o limite — o processo não consegue alocar mais memória que o teto definido.

**2. Por que namespaces isolarem processos não é suficiente? O que falta que cgroups adicionam?**
**Resposta:** Namespaces isolam a visão (o que o processo enxerga), mas não controlam o consumo de recursos físicos. Cgroups adicionam a camada de controle: limites de CPU, RAM e I/O que impedem um processo de consumir recursos além do permitido e prejudicar outros processos no mesmo servidor.

---

## 4. Empacotamento de Artefatos — A Build como Contrato

Você já passou por isso: o código funciona na sua máquina, você faz deploy, e quebra. O motivo quase sempre é o mesmo — o ambiente é diferente. No seu computador, o Node.js é versão 22, as dependências foram instaladas com npm 10, e o sistema operacional é Ubuntu 24.04. No servidor, Node.js 18, npm 8, Debian 11. Pequenas diferenças que somam um grande problema.

A solução é **empacotar a aplicação junto com todas as suas dependências e configurações de ambiente** em um único artefato imutável. A build produz o artefato; a execução consome o artefato. O que não está no artefato não existe em produção.

### Build Context: O Que Vai Para o Artefato

Quando você prepara um artefato, precisa definir o **contexto de build** — o conjunto de arquivos que serão considerados. No seu diretório de trabalho, você tem:

- Código-fonte (`src/`, `server.js`)
- Dependências (`node_modules/`, mas que podem pesar 300 MB)
- Configurações locais (`.env`, `config/`)
- Artefatos de build anteriores (`dist/`, `build/`)
- Arquivos do sistema de controle de versão (`.git/`, com todo o histórico)
- Arquivos de IDE (`.vscode/`, `.idea/`)
- Logs e temporários (`*.log`, `tmp/`)

**Nem tudo que está no diretório pertence ao artefato final.** O build context inclui tudo por padrão, mas você precisa filtrar o que realmente importa. Um arquivo de exclusão (como `.gitignore`, mas para builds) define o que **não** empacotar. Essa exclusão não é opcional — sem ela, você empacota logs de debug, histórico git, e secrets acidentalmente.

![Diagrama: Build context → filtro de exclusão → artefato final](images/diagrama-04-diagram.png)

### Build vs Execução: Duas Fases Separadas

Este é o princípio mais importante do empacotamento: **build e execução são fases separadas**. A build acontece uma vez — resolve dependências, compila código, gera artefatos. A execução usa o artefato pronto, sem re-resolver ou re-compilar nada.

Isso resolve o problema "funciona na minha máquina" porque:
1. A build acontece em um **ambiente controlado e reproduzível**
2. O artefato gerado é **imutável** — ninguém mexe nele depois de pronto
3. A execução usa **exatamente** o artefato que foi testado

*"Build uma vez, execute em qualquer lugar. O artefato imutável é o contrato entre quem desenvolve e quem roda. Se não está no artefato, não existe."*

### Quick Check 4

**1. O que acontece se o build context incluir arquivos de log ou secrets?**
**Resposta:** Esses arquivos serão incluídos no artefato final, pois o build context inclui tudo por padrão. Por isso é essencial ter um mecanismo de exclusão seletiva (como um arquivo de exclusão) que filtre o que não deve estar no artefato.

**2. Por que build e execução devem ser fases separadas?**
**Resposta:** Para garantir que o artefato executado em produção seja exatamente o mesmo que foi construído e testado. Se a build e execução fossem misturadas, cada execução poderia produzir um resultado diferente (dependências re-resolvidas, versões diferentes), reintroduzindo o problema "funciona na minha máquina".

---

**APLICAÇÃO: Containerização com Docker — Da Instalação ao Hot Reload**

> *"Agora que você entende os mecanismos universais — isolamento de processos com namespaces, sistemas de arquivos em camadas com copy-on-write, controle de recursos com cgroups e empacotamento de artefatos — vamos conectá-los à prática. Cada conceito da primeira parte tem uma implementação concreta no Docker: namespaces isolam containers, camadas UnionFS constroem imagens, cgroups limitam recursos, e o build context alimenta o docker build. Mas antes da teoria: mão na massa. Instale, execute, veja o output. Depois a teoria explica o que você acabou de ver."*

---

## 5. Instalação do Docker Engine no Linux

O Docker Engine é o software que gerencia containers — cria, executa, para e distribui imagens. Você vai instalá-lo via **apt**, o gerenciador de pacotes que você já domina.

**Mão na Massa — Instalação do Docker:**

- [ ] **Passo 1: Atualizar pacotes e instalar pré-requisitos**

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
```

- [ ] **Passo 2: Adicionar chave GPG oficial do Docker**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

- [ ] **Passo 3: Adicionar repositório oficial Docker**

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

- [ ] **Passo 4: Instalar Docker Engine**

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

- [ ] **Passo 5: Verificar instalação**

```bash
docker --version
```

**Output esperado:** `Docker version 27.x.x, build xxxxxxx`

- [ ] **Passo 6: Iniciar e habilitar o daemon**

```bash
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker
```

**Output esperado:** `● docker.service - Docker Application Container Engine` com `active (running)`

- [ ] **Passo 7: Adicionar seu usuário ao grupo docker** (para não precisar de `sudo`)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Verificação:** `docker --version` sem `sudo` deve funcionar.

**Troubleshooting:**
- `docker: permission denied` — o grupo docker não foi aplicado. Execute `newgrp docker` ou faça logout/login.
- `Cannot connect to the Docker daemon` — o daemon não foi iniciado. Execute `sudo systemctl start docker` e verifique com `systemctl status docker`.

### Quick Check 5

**1. Qual comando verifica se o daemon do Docker está rodando?**
**Resposta:** `sudo systemctl status docker` — mostra o status atual, incluindo se está `active (running)`.

**2. Por que é necessário adicionar o usuário ao grupo `docker`?**
**Resposta:** Para executar comandos Docker sem `sudo`. O daemon Docker escuta em um socket Unix (`/var/run/docker.sock`) que pertence ao grupo `docker`. Sem estar no grupo, o usuário precisa de `sudo` para cada comando.

---

## 6. Primeiro Container — `docker run hello-world`

Com o Docker instalado, vamos à experiência inaugural. Digite este comando:

```bash
docker run hello-world
```

O output que você vai ver é algo como:

```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pulling fs layer
c1ec31eb5944: Download complete
Digest: sha256:1408fec503e0b89d9e11e60a1cf45db0f9b2b9e2c5c5e4e4b8e8c8c8c8c8c8c8
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
[...]
```

Agora vamos **dissecar cada linha**:

1. `Unable to find image 'hello-world:latest' locally` — O Docker **procurou a imagem no cache local** (no seu disco) e não encontrou. Precisou buscar em algum lugar.
2. `latest: Pulling from library/hello-world` — Buscou no **Docker Hub** (você acabou de descobrir o registry público de imagens).
3. `c1ec31eb5944: Pulling fs layer` — Cada hash é uma **camada** da imagem (lembra da Seção 2? Camadas imutáveis sendo baixadas).
4. `Digest: sha256:...` — Hash SHA256 de integridade da imagem (como o hash de um commit git, mas para a imagem inteira).
5. `Status: Downloaded newer image for hello-world:latest` — Download concluído com sucesso.
6. `Hello from Docker!` — O container executou e produziu output. **O container rodou e finalizou.**

### O Fluxo nos Bastidores

![Diagrama: Fluxo docker run — client → daemon → registry → container](images/diagrama-05-diagram.png)

**Mão na Massa — Execute 3 vezes:**

```bash
# Primeira execução (já fez — viu o pull)
docker run hello-world

# Segunda execução
docker run hello-world

# Terceira execução
docker run hello-world
```

**Pergunta para você:** Por que a segunda e terceira execuções foram **instantâneas**, sem o bloco de pull?

**Resposta:** Porque a imagem `hello-world:latest` já estava no cache local (baixada na primeira execução). O Docker não precisou buscar no Hub novamente — usou a imagem que já estava em disco.

> *"Você acabou de usar o Docker Hub sem saber — é o npm registry das imagens. `docker run` faz pull automático quando a imagem não está local, assim como `npx` instala pacotes que faltam."*

### Quick Check 6

**1. Por que a primeira execução de `docker run hello-world` é mais lenta que as seguintes?**
**Resposta:** Porque na primeira execução a imagem não está em cache local. O Docker precisa fazer pull do Docker Hub (baixar as camadas). Nas execuções seguintes, a imagem já está em disco — o Docker cria o container instantaneamente.

**2. O que significa a linha `Digest: sha256:...` no output do hello-world?**
**Resposta:** É o hash SHA256 de integridade da imagem — um identificador imutável que garante que a imagem baixada é exatamente a mesma do registry, sem corrupção ou adulteração.

---

## 7. Docker Hub — O npm Registry das Imagens

Você já usou o Docker Hub na seção anterior. Quando o Docker não encontrou `hello-world:latest` localmente, ele buscou no **Docker Hub** — o registry público padrão de imagens Docker.

### O que é um Registry?

**Registry** é um servidor que armazena e distribui imagens, como o npmjs.com armazena e distribui pacotes npm. O Docker Hub é o registry público padrão. Quando você executa `docker run node:22-alpine`, o Docker consulta o Hub, baixa a imagem e cria o container.

### Namespaces: Organizando Imagens

Assim como pacotes npm têm escopos (`@angular/core`, `@nestjs/common`), imagens Docker têm **namespaces**:

- `library/hello-world` → `library/` é o namespace oficial. Imagens sem prefixo (`node`, `nginx`, `ubuntu`) são do namespace `library/`.
- Namespace de usuário: `seuusuario/minha-api` → imagens de usuários ou organizações.
- `library/hello-world` está para Docker como `@angular/core` está para npm.

### Official Images: Curadoria e Segurança

Imagens marcadas como **official** são mantidas pelo Docker ou pelo próprio fornecedor do software (Node.js, nginx, PostgreSQL). Elas passam por revisão de segurança e seguem boas práticas. Sempre prefira imagens oficiais para produção.

### Tags: Versões com Nomes

`hello-world:latest` → `latest` é uma **tag**, como `@latest` no npm. Tags são ponteiros mutáveis — `node:22` pode apontar para `node:22.5.0` hoje e `node:22.6.0` amanhã.

### Digest: O Identificador Imutável

Diferente de tags (que mudam), o **digest** (`sha256:...`) identifica uma imagem específica de forma imutável. É como o hash de um commit git. Se você quer garantir que está usando exatamente a mesma imagem, use o digest: `docker pull node@sha256:1408fec...`

### Comandos para Explorar o Hub

```bash
# Buscar imagens no Docker Hub
docker search node

# Baixar uma imagem sem executar
docker pull node:22-alpine

# Ver detalhes da imagem local
docker images node:22-alpine
```

| Namespace | Exemplo | Descrição |
|---|---|---|
| `library/` | `node`, `nginx`, `ubuntu` | Official images mantidas pelo vendor |
| Usuário | `seuusuario/minha-api` | Imagens pessoais ou de time |
| Organização | `bitnami/postgresql` | Imagens mantidas por empresas parceiras |

> *"`docker pull node:22-alpine` está para Docker como `npm install express@4` está para Node.js. Ambos baixam um artefato versionado de um registry. A diferença: o Docker baixa um ambiente completo (SO + runtime + libs), não só código."*

### Quick Check 7

**1. Qual a diferença entre uma tag (`:latest`) e um digest (`sha256:...`) em uma imagem?**
**Resposta:** Tags são ponteiros mutáveis que podem mudar para apontar para versões diferentes da mesma imagem. Digests são identificadores imutáveis baseados no hash SHA256 do conteúdo — garantem que você está usando exatamente a imagem que espera.

**2. O que significa o prefixo `library/` em `library/hello-world`?**
**Resposta:** É o namespace oficial do Docker Hub. Imagens sem prefixo de usuário (como `node`, `nginx`, `ubuntu`) pertencem ao namespace `library/`, indicando que são official images mantidas pelo Docker ou pelo fornecedor do software.

---

## 8. Imagens, Containers e Camadas — A Teoria Explica a Experiência

Você já viu um container rodar, baixou imagens do Hub, usou tags. Agora vamos entender a mecânica interna — e conectar cada peça com os **FUNDAMENTOS** da primeira parte.

### Imagem = Classe, Container = Objeto

Esta é a analogia mais importante da aula. Se você programa em JavaScript, entende a diferença entre uma classe e uma instância:

- **Imagem** = a classe. É o blueprint imutável — define o sistema de arquivos, as variáveis de ambiente, o comando a executar. Uma imagem está em **disco**.
- **Container** = o objeto. É a instância em execução da imagem. Tem PID, estado, sistema de arquivos volátil. Um container está em **memória** (enquanto roda).

Você pode criar 10 containers da mesma `node:22-alpine` — todos partem da mesma imagem, como 10 objetos da mesma classe. Cada container é independente, com seu próprio PID namespace, seu próprio net namespace.

```bash
# Os dois comandos abaixo criam containers independentes da mesma imagem
docker run node:22-alpine node -e "console.log('A')"
docker run node:22-alpine node -e "console.log('B')"
```

> *"`docker run node:22-alpine` cria uma nova instância. `docker start` retoma uma instância pausada. É a diferença entre `new` e reusar uma referência."*

### Camadas na Prática

Lembra das camadas imutáveis da **Seção 2 (FUNDAMENTOS)**? Vamos vê-las ao vivo.

```bash
# Baixe uma imagem e veja as camadas sendo baixadas
docker pull node:22-alpine

# Veja o histórico de camadas
docker image history node:22-alpine
```

Cada linha no output do `docker pull` (com aquele hash `c1ec31eb5944: Pulling fs layer`) é uma **camada** da imagem. O `docker image history` revela a stack completa: camada base Alpine → Node.js runtime → configurações.

### Copy-on-Write na Prática

Quando um container modifica um arquivo, o Docker cria uma **camada fina de container** (read-write) no topo da stack de camadas de imagem (read-only). É o **copy-on-write** que você aprendeu na Seção 2 — agora em ação:

- As camadas de imagem são **imutáveis** e compartilhadas entre containers
- A camada do container é **volátil** — quando o container morre, a camada desaparece
- Se você quer dados permanentes, precisa de volumes ou bind mounts (Seção 11)

### Comandos Essenciais de Gerenciamento

| Comando | O que faz | Analogia |
|---|---|---|
| `docker ps` | Lista containers em execução | `ps` para containers |
| `docker ps -a` | Lista todos os containers (incluindo parados) | `ps aux` |
| `docker images` | Lista imagens locais | `ls` das imagens |
| `docker logs <container>` | Mostra o output do container | `cat` dos logs |
| `docker exec -it <container> sh` | Abre shell dentro do container | SSH para o container |
| `docker stop <container>` | Para graciosamente (SIGTERM → SIGKILL) | `kill` com cleanup |
| `docker rm <container>` | Remove container parado | Deletar instância |
| `docker rmi <imagem>` | Remove imagem local | `npm uninstall -g` |
| `docker system prune` | Limpa tudo não usado | `clean` geral |

**Mão na Massa — Explorando um Container Node.js:**

- [ ] Rode um container interativo:

```bash
docker run -it --name meu-node node:22-alpine sh
```

- [ ] Dentro do container, explore:

```bash
node --version
ls /
whoami
exit   # sai do shell e para o container
```

- [ ] Verifique o container parado:

```bash
docker ps -a | grep meu-node
```

- [ ] Remova o container:

```bash
docker rm meu-node
```

**Troubleshooting:**
- `docker: Error response from daemon: Conflict` — já existe um container com esse nome. Use `docker rm <nome>` ou escolha outro nome.
- `docker exec` falha com "Container is not running" — o container precisa estar em execução. Use `docker start <container>` primeiro.

### Quick Check 8

**1. Qual a diferença fundamental entre uma imagem e um container?**
**Resposta:** Imagem é o blueprint imutável em disco (a classe), container é a instância em execução (o objeto). Uma imagem pode originar múltiplos containers independentes, cada um com seu próprio PID, rede e sistema de arquivos volátil.

**2. O que acontece com as modificações feitas dentro de um container quando ele é removido?**
**Resposta:** As modificações na camada read-write do container são perdidas. Elas existiam apenas na camada volátil do container, que é descartada com `docker rm`. Para persistir dados, é necessário usar volumes ou bind mounts.

---

## 9. Dockerfile — A Receita do Container

Uma imagem é o blueprint imutável. Mas como se **cria** uma imagem? Com um **Dockerfile** — um arquivo de receita que descreve, passo a passo, como construir a imagem.

Vamos começar com uma API Express mínima. O código abaixo é fornecido — copie, não digite do zero.

### A Aplicação: `server.js`

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Docker está funcionando!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

### `package.json`

```json
{
  "name": "minha-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

### O Dockerfile — 7 Instruções Essenciais

```dockerfile
# 1. FROM — imagem base (Alpine Linux + Node.js ~131 MB em disco, ~45 MB comprimido no registry)
FROM node:22-alpine

# 2. WORKDIR — diretório de trabalho dentro do container
WORKDIR /app

# 3. COPY — copia manifestos primeiro (otimização de cache)
COPY package*.json ./

# 4. RUN — executa comando na build (instala dependências)
RUN npm ci --omit=dev

# 5. COPY — copia o código da aplicação
COPY . .

# 6. EXPOSE — documenta a porta (não publica! -p faz isso)
EXPOSE 3000

# 7. CMD — comando de inicialização (exec form)
CMD ["node", "server.js"]
```

**Por que a ordem das instruções importa?** Cada `COPY`, `RUN` cria uma nova camada. Colocar `COPY package*.json ./` **antes** de `COPY . .` faz com que mudanças no código fonte **não invalidem** a camada de `npm ci`. Se o código mudar, a camada de dependências ainda está em cache — o build reaproveita as dependências já instaladas.

```
  Camada 1: node:22-alpine (FROM)
  Camada 2: WORKDIR /app
  Camada 3: COPY package*.json ./    ← Só muda se package.json mudar
  Camada 4: npm ci --omit=dev ← Só refaz se package.json mudar
  Camada 5: COPY . .                ← Muda a cada alteração no código
  Camada 6: EXPOSE 3000
  ------------------------------------
  Visão final: sua aplicação
```

**Mão na Massa — Construir e Rodar:**

- [ ] Crie um diretório de projeto:

```bash
mkdir minha-api && cd minha-api
```

- [ ] Crie `server.js`, `package.json` e `Dockerfile` com os conteúdos acima
- [ ] Instale as dependências localmente (para gerar `package-lock.json`):

```bash
npm install
```

- [ ] Construa a imagem:

```bash
docker build -t minha-api .
```

- [ ] Rode o container:

```bash
docker run -p 3000:3000 minha-api
```

- [ ] Teste em outro terminal:

```bash
curl http://localhost:3000
```

**Output esperado:** `{"message":"Docker está funcionando!","timestamp":"2026-06-15T..."}`

**Troubleshooting:**
- `port is already allocated` — outra aplicação está usando a porta 3000. Mude a porta do host: `docker run -p 3001:3000 minha-api` (mapeia host:3001 para container:3000).
- `npm ci` falha — `package-lock.json` não encontrado ou desatualizado. Execute `npm install` localmente para gerar/atualizar o lockfile.

### Quick Check 9

**1. Por que `COPY package*.json ./` vem antes de `COPY . .` no Dockerfile?**
**Resposta:** Para otimizar o cache de camadas. Se `package.json` não mudou, a camada de `npm ci` (que é a mais pesada) é reaproveitada do cache. Mudanças no código fonte não invalidam a camada de dependências.

**2. Qual instrução do Dockerfile realmente disponibiliza a aplicação na rede?**
**Resposta:** Nenhuma instrução do Dockerfile faz isso sozinha. `EXPOSE` apenas **documenta** a porta que a aplicação usa. A publicação na rede acontece com `-p 3000:3000` no `docker run`, que mapeia uma porta do host para o container.

---

## 10. Otimização — Multi-Stage Builds e .dockerignore

O Dockerfile da seção 9 funciona, mas tem um problema: a imagem final inclui **npm** (que pesa ~7 MB), headers de compilação, e potencialmente `devDependencies`. Em produção, isso é desperdício — é como levar a cozinha inteira quando você só precisa do prato pronto.

### Multi-Stage Build: Duas Receitas, Um Artefato

**Multi-stage build** resolve isso com dois estágios: um para **construir** (com todas as ferramentas) e outro para **executar** (apenas o essencial).

> *"Multi-stage build é o `NODE_ENV=production` do Docker. No desenvolvimento você tem tudo (npm, nodemon, source maps). Em produção, só o essencial. A diferença: no Docker, desenvolvimento e produção são imagens diferentes — não variáveis de ambiente."*

```dockerfile
# === STAGE 1: BUILD ===
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                 # Instala TUDO (incluindo devDependencies)
COPY . .

# === STAGE 2: PRODUCTION ===
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev      # Instala APENAS dependências de produção
COPY --from=builder /app/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
```

![Diagrama: Multi-stage build — Stage 1 (build) alimenta Stage 2 (produção)](images/diagrama-06-diagram.png)

### .dockerignore: O .gitignore do Build

Lembra da **Seção 4 (FUNDAMENTOS)** sobre build context e exclusão seletiva? O **.dockerignore** é o mecanismo de exclusão do Docker. Funciona como `.gitignore`, mas para o `docker build`.

```dockerignore
# Dependências (serão reinstaladas no container)
node_modules/

# Controle de versão
.git/
.gitignore

# Arquivos de ambiente
.env
.env.local

# Logs
*.log

# Arquivos do Docker
Dockerfile
.dockerignore

# IDE
.vscode/
.idea/

# Sistema
.DS_Store
Thumbs.db
```

**Impacto real:** sem `.dockerignore`, um `node_modules/` de 300 MB é enviado para o daemon Docker a cada build — tempo de upload, memória, disco. Com `.dockerignore`, o build context inclui apenas o código fonte (alguns KB).

> *"`.dockerignore` é o `.gitignore` do build. Ambos respondem à mesma pergunta: 'o que NÃO pertence ao artefato final?' A diferença: `.gitignore` protege o repositório, `.dockerignore` protege a imagem."*

**Mão na Massa — Otimizar:**

- [ ] Crie o `.dockerignore` com o conteúdo acima
- [ ] Atualize o `Dockerfile` para multi-stage
- [ ] Construa e compare tamanhos:

```bash
docker build -t minha-api-otimizada .
docker images | grep minha-api
```

- [ ] Compare os tamanhos das imagens:

```bash
docker images | grep minha-api
```

**Output esperado:** a imagem otimizada (multi-stage) é significativamente menor que uma imagem equivalente de estágio único. A diferença vem da remoção de `devDependencies`, cache do npm e arquivos intermediários de build.

- [ ] Verifique que a imagem otimizada funciona:

```bash
docker run --rm -p 3000:3000 minha-api-otimizada
curl http://localhost:3000
```

**Output esperado:** `{"message":"Docker está funcionando!","timestamp":"..."}` — a imagem menor entrega exatamente o mesmo resultado.

### Quick Check 10

**1. Qual a principal vantagem do multi-stage build?**
**Resposta:** Separar as ferramentas de build (npm, compiladores, devDependencies) do ambiente de execução. A imagem final contém apenas o necessário para rodar a aplicação, resultando em imagens menores, mais seguras e com menos superfície de ataque.

**2. O que acontece se você não criar um `.dockerignore`?**
**Resposta:** Todo o conteúdo do diretório de projeto (incluindo `node_modules/`, `.git/`, `.env`) é enviado para o daemon Docker como build context. Isso torna o build mais lento (upload de centenas de MB), e pode incluir acidentalmente secrets ou arquivos desnecessários na imagem.

---

## 11. Desenvolvimento Ativo — Bind Mounts e Hot Reload com Nodemon

Com o Dockerfile otimizado, a imagem de produção está pronta. Mas tem um problema: **cada alteração no código exige rebuild** (`docker build`) e restart do container. Em desenvolvimento, isso é lento e quebra o fluxo.

### Bind Mount: Espelhamento em Tempo Real

**Bind mount** resolve isso mapeando um diretório do seu computador (host) para dentro do container. Arquivos no host são "espelhados" dentro do container **instantaneamente** — sem rebuild, sem restart.

> *"Bind mount é como abrir a pasta do container no seu editor. Você edita no host, o container vê a mudança instantaneamente. É o oposto do deploy — no deploy, a imagem é selada. No bind mount, ela respira."*

```bash
# -v $(pwd):/app  →  mapeia o diretório atual para /app no container
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  minha-api-otimizada
```

O segundo `-v /app/node_modules` é um **volume anônimo** que evita que o bind mount sobresscreva `node_modules` do container com o do host (que pode não existir ou ser de arquitetura diferente).

### Hot Reload com Nodemon

Você já conhece o **nodemon** — a ferramenta que reinicia automaticamente o servidor Node.js quando arquivos mudam. Combinado com bind mount, você edita o código no host e o nodemon reinicia o servidor dentro do container **automaticamente**.

**Mão na Massa — Desenvolvimento com Hot Reload:**

- [ ] Adicione nodemon ao `package.json`:

```bash
npm install --save-dev nodemon
```

- [ ] Adicione o script de dev no `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "npx nodemon server.js"
  }
}
```

- [ ] Rode o container com bind mount e nodemon:

```bash
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  minha-api-otimizada \
  npx nodemon server.js
```

- [ ] Altere o `server.js` (mude a mensagem da rota) e salve
- [ ] Veja o nodemon reiniciar o servidor automaticamente no terminal
- [ ] Teste com `curl http://localhost:3000` — a mudança aparece sem rebuild

![Diagrama: Bind mount — diretório host ↔ container com nodemon observando mudanças](images/diagrama-07-diagram.png)

### Conexão com Copy-on-Write (Seção 2)

Com bind mount, a camada de container **NÃO** faz copy-on-write para arquivos do mount. As escritas vão **direto para o sistema de arquivos do host**. Isso é diferente da camada read-write normal do container (que é volátil e descartada).

Na prática: edições no host são visíveis no container em tempo real, sem rebuild. Perfeito para desenvolvimento.

### Quick Check 11

**1. Qual a diferença entre a camada de leitura-escrita (CoW) de um container e um bind mount?**
**Resposta:** A camada CoW existe dentro do container e é descartada quando o container é removido. O bind mount mapeia um diretório do host diretamente para dentro do container — as escritas vão para o sistema de arquivos do host e persistem independentemente do ciclo de vida do container.

**2. Por que é necessário o volume anônimo `-v /app/node_modules` junto com o bind mount?**
**Resposta:** Para evitar que o bind mount do diretório do host sobrescreva o `node_modules` do container com o do host (que pode estar vazio ou ter sido instalado para arquitetura diferente). O volume anônimo "congela" o `node_modules` do container, que permanece o instalado durante o `docker build`.

---

## Autoavaliação: Quiz Rápido

**1. Qual mecanismo do kernel Linux permite que um processo tenha sua própria visão de PIDs, interfaces de rede e sistema de arquivos?**
**Resposta:** Namespaces (PID namespace, net namespace, mount namespace). Eles isolam a visão de recursos do sistema para grupos de processos.

**2. Se dois containers usam a mesma imagem base de 200 MB, quanto espaço em disco a imagem base ocupa no total?**
**Resposta:** 200 MB — apenas uma vez. As camadas de imagem são imutáveis e compartilhadas entre todos os containers que usam a mesma imagem base.

**3. Qual é o propósito do build context no empacotamento de artefatos?**
**Resposta:** O build context define o conjunto de arquivos disponíveis durante a construção do artefato. Nem tudo no diretório de trabalho pertence ao artefato final — um arquivo de exclusão (como `.dockerignore`) filtra o que entra.

**4. O que significa a linha `Unable to find image 'hello-world:latest' locally` no output de `docker run hello-world`?**
**Resposta:** Significa que a imagem `hello-world:latest` não estava em cache local (no disco do seu computador). O Docker precisou fazer pull do registry (Docker Hub) antes de criar o container.

**5. Por que `COPY package*.json ./` vem antes de `COPY . .` em um Dockerfile otimizado?**
**Resposta:** Para aproveitar o cache de camadas do Docker. Se `package.json` não mudou, a camada de `npm ci` (a mais pesada) é reutilizada do cache. Mudanças no código fonte não invalidam a camada de dependências.

**6. Qual a diferença entre uma instrução `EXPOSE 3000` no Dockerfile e a flag `-p 3000:3000` no `docker run`?**
**Resposta:** `EXPOSE` apenas documenta a porta que a aplicação usa dentro do container. `-p 3000:3000` publica a porta — mapeia uma porta do host para o container, tornando a aplicação acessível externamente.

**7. O que o multi-stage build resolve que um Dockerfile single-stage não resolve?**
**Resposta:** O single-stage inclui ferramentas de build (npm, compiladores, devDependencies) na imagem final, desnecessariamente aumentando seu tamanho. O multi-stage separa o estágio de build (com todas as ferramentas) do estágio de produção (apenas o runtime e o código compilado/instalado), resultando em imagens menores e mais seguras.

---

## Mão na Massa: Exercícios Graduados

### Exercício 1 (Fácil) — Inspecione uma Imagem

Baixe a imagem `node:22-alpine` e inspecione suas camadas.

**Passos:**
1. Faça pull da imagem: `docker pull node:22-alpine`
2. Liste as imagens locais: `docker images`
3. Veja o histórico de camadas: `docker image history node:22-alpine`
4. Execute um container interativo: `docker run -it --rm node:22-alpine sh`
5. Dentro do container, execute `node --version` e `ls /`

**Perguntas para responder:**
- Quantas camadas a imagem `node:22-alpine` tem?
- Qual o tamanho total da imagem?
- Qual é o comando padrão (CMD) da imagem?

**Gabarito:**

```bash
# Pull e inspect
docker pull node:22-alpine
docker images node:22-alpine
# Output esperado:
# REPOSITORY   TAG         IMAGE ID     CREATED      SIZE
# node         22-alpine   abc123def    2 weeks ago  131 MB

docker image history node:22-alpine
# Mostra ~6-8 camadas, da base Alpine até a configuração do Node

# Shell interativo
docker run -it --rm node:22-alpine sh
# / # node --version
# v22.x.x
# / # ls /
# bin    dev    etc    home   lib    media  mnt    opt    proc
# root   run    sbin   srv    sys    tmp    usr    var
```

A imagem `node:22-alpine` tem tipicamente 6-8 camadas, pesa aproximadamente 131 MB, e o CMD padrão é `node` (definido no Dockerfile oficial da imagem).

---

### Exercício 2 (Médio) — Dockerfile com Dependência Extra

Partindo da API Express da aula, adapte o projeto para incluir a dependência `cors` e duas rotas.

**Contexto:** A aplicação precisa servir duas rotas: `GET /` (pública) e `GET /api/status` (com CORS habilitado).

**Passos:**
1. Crie um novo diretório: `mkdir api-cors && cd api-cors`
2. Crie `package.json` com dependências: `express` e `cors`
3. Crie `server.js` com duas rotas e CORS ativado
4. Execute `npm install`
5. Escreva um Dockerfile multi-stage (build + production)
6. Crie `.dockerignore`
7. Construa a imagem e execute com `-p 3001:3000`
8. Teste com `curl` as duas rotas

**Gabarito:**

**`server.js`:**

```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'API com CORS funcionando' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

**`package.json`:**

```json
{
  "name": "api-cors",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  }
}
```

**Dockerfile multi-stage:**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
```

**`.dockerignore`:**

```
node_modules/
.git/
.env
*.log
Dockerfile
.dockerignore
.vscode/
.DS_Store
```

**Comandos para testar:**

```bash
docker build -t api-cors .
docker run -d -p 3001:3000 --name api-cors-container api-cors
curl http://localhost:3001/
curl http://localhost:3001/api/status
docker rm -f api-cors-container
```

---

### Exercício 3 (Difícil) — Pipeline Completo com Otimização

Partindo de um `server.js` fornecido (API Express com 3 rotas e uma rota POST), você deve:

1. Escrever um Dockerfile multi-stage com estágio de build e estágio de produção
2. Configurar `.dockerignore` abrangente
3. Construir a imagem e medir seu tamanho
4. Configurar bind mount para desenvolvimento com nodemon
5. Documentar cada decisão: por que a ordem do Dockerfile é essa, por que cada item está no `.dockerignore`, qual o ganho de tamanho com multi-stage

**`server.js` fornecido:**

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let items = [];

app.get('/items', (req, res) => {
  res.json(items);
});

app.post('/items', (req, res) => {
  const item = { id: Date.now(), ...req.body };
  items.push(item);
  res.status(201).json(item);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Items API rodando na porta ${PORT}`);
});
```

**`package.json`:**

```json
{
  "name": "items-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "npx nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

**Gabarito:**

**Dockerfile multi-stage:**

```dockerfile
# STAGE 1: Build — instala todas as dependências
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# STAGE 2: Production — apenas runtime + código
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
```

**Decisões de design:**

- `COPY package*.json ./` antes do código: maximiza cache de camadas. Enquanto `package.json` não mudar, o `npm ci` não refaz.
- `npm ci` em vez de `npm install`: determinístico, respeita o `package-lock.json`, mais rápido em CI.
- `npm ci --omit=dev` no stage 2: instala apenas dependências de produção, excluindo devDependencies (como nodemon) e o próprio npm.

**`.dockerignore`:**

```dockerignore
node_modules/
.git/
.gitignore
.env
.env.*
*.log
Dockerfile
.dockerignore
.vscode/
.idea/
.DS_Store
Thumbs.db
npm-debug.log*
```

**Decisões do `.dockerignore`:**

- `node_modules/`: seria reinstalado no container. Enviá-lo no build context só adiciona peso.
- `.env`: contém secrets que não devem estar na imagem.
- `*.log`: logs de debug locais, irrelevantes para o container.
- `.git/`: histórico de versão não pertence à imagem.
- `Dockerfile` e `.dockerignore`: arquivos de build, não de runtime.

**Medição de tamanho:**

```bash
docker build -t items-api .
docker images items-api
# Output esperado: ~131 MB (node:22-alpine + server.js + node_modules)

# Comparação com single-stage (sem multi-stage):
# O mesmo app sem multi-stage pesaria ~140 MB (npm incluso)
# Ganho: ~7 MB eliminando npm da imagem final

docker images items-api | head -2
# Output: compare tamanho single-stage vs multi-stage (~7MB menor)

docker run --rm -p 3000:3000 items-api
curl http://localhost:3000/health
# Output: {"status":"healthy","port":3000}
```

**Bind mount para desenvolvimento:**

```bash
docker build -t items-api .
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  items-api \
  npx nodemon server.js
```

**Teste de hot reload:**

```bash
# Em outro terminal
curl http://localhost:3000/items
# Altere o server.js, salve, teste novamente — mudança visível sem rebuild
```

---

## Resumo da Aula

### Os 10 Conceitos Fundamentais

1. **Namespaces**: mecanismo do kernel Linux que isola a visão de recursos (PID, rede, mount) para grupos de processos. A base do isolamento de containers.
2. **Sistemas de Arquivos em Camadas**: imagens são construídas empilhando camadas imutáveis. O compartilhamento de camadas economiza disco e acelera deploys.
3. **Copy-on-Write (CoW)**: modificações não alteram camadas originais — uma nova camada superior recebe as alterações. A base permanece intacta.
4. **Cgroups**: control groups limitam e contabilizam recursos (CPU, RAM, I/O) por grupo de processos. Impedem que um container derrube o servidor.
5. **Build Context e Exclusão Seletiva**: nem todo arquivo do diretório de trabalho pertence ao artefato final. Uma lista de exclusão (`.dockerignore`) define o que não empacotar.
6. **Imagem vs Container**: imagem é o blueprint imutável (classe); container é a instância em execução (objeto). Múltiplos containers da mesma imagem são independentes.
7. **Docker Hub**: registry público de imagens. Namespaces organizam quem publica o quê. Tags são ponteiros mutáveis; digests são identificadores imutáveis.
8. **Dockerfile**: receita declarativa que descreve como construir uma imagem. Cada instrução cria uma camada. A ordem importa para o cache.
9. **Multi-Stage Build**: dois ou mais estágios no mesmo Dockerfile. O estágio de build tem todas as ferramentas; o estágio de produção tem apenas o runtime. Imagens menores e mais seguras.
10. **Bind Mount**: mapeamento de diretório do host para o container em tempo real. Combinado com nodemon, permite hot reload durante desenvolvimento — sem rebuild a cada alteração.

### O Que Você Construiu Hoje

- [x] Docker Engine instalado e funcional
- [x] Dockerfile multi-stage para API Express com 7 instruções essenciais
- [x] `.dockerignore` configurado para build context enxuto
- [x] Container rodando em modo produção (`docker run -p 3000:3000`)
- [x] Container rodando em modo desenvolvimento com bind mount + nodemon
- [x] Conhecimento sólido dos mecanismos universais de containerização

---

## Próxima Aula

**Aula 02: Docker Compose — Orquestração Multi-Serviço**

A API Express que você containerizou nesta aula vai ganhar companhia. Na Aula 02, você adicionará PostgreSQL à stack usando um único arquivo `docker-compose.yml`. Aprenderá a configurar redes internas, volumes nomeados para persistência, healthchecks que garantem que o banco esteja pronto antes da API conectar, e profiles que separam desenvolvimento de produção — tudo com `docker compose up`.

---

## Referências

### Documentação Oficial

- [Docker Docs — Get Started](https://docs.docker.com/get-started/) — tutorial oficial para iniciantes
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/) — documentação completa de todas as instruções do Dockerfile
- [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) — guia oficial de boas práticas
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/) — documentação oficial de multi-stage builds
- [Use bind mounts](https://docs.docker.com/storage/bind-mounts/) — guia oficial de bind mounts e volumes

### Ferramentas

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — interface gráfica para gerenciar containers (Linux, Mac, Windows)
- [Docker Hub](https://hub.docker.com/) — registry público de imagens
- [Play with Docker](https://labs.play-with-docker.com/) — laboratório Docker online gratuito (sem instalação)
- [Hadolint](https://github.com/hadolint/hadolint) — linter para Dockerfiles (verifica boas práticas automaticamente)

### Vídeos Recomendados

- [Docker Tutorial for Beginners (freeCodeCamp)](https://www.youtube.com/watch?v=fqMOX6JJhGo) — tutorial completo de Docker (~2h)
- [Aprenda Docker, Containers, Images e muito mais! (LINUXtips)](https://www.youtube.com/watch?v=0cDj7citEjE) — tutorial completo de Docker em português (~40 min)
- [Docker em 22 minutos — teoria e prática (Programador a Bordo)](https://www.youtube.com/watch?v=Kzcz-EVKBEQ) — conceitos essenciais de Docker de forma rápida (~22 min)

### Artigos para Aprofundamento

- [Linux namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html) — documentação oficial dos namespaces Linux (man page)
- [cgroups — Linux kernel documentation](https://www.kernel.org/doc/Documentation/cgroup-v1/cgroups.txt) — documentação oficial dos control groups
- [Understanding Docker Union Filesystem](https://docs.docker.com/storage/storagedriver/overlayfs-driver/) — como o Docker implementa camadas com overlayfs
- [Docker Image Size Optimization](https://docs.docker.com/build/building/multi-stage/) — técnicas para reduzir tamanho de imagens

---

## FAQ

**P: Preciso instalar o Docker Desktop ou o Docker Engine basta?**
R: O Docker Engine (Community Edition) é suficiente para o que faremos no curso. Docker Desktop adiciona interface gráfica, Kubernetes local e integração com Docker Hub, mas não é necessário para aprender os fundamentos.

**P: Por que meu container para logo após `docker run`?**
R: Um container só fica em execução enquanto seu processo principal está rodando. Se você roda `docker run node:22-alpine` sem um comando, o shell principal termina e o container para. Use `-it` para manter o terminal aberto ou forneça um comando persistente como `node server.js`.

**P: O que significa `-p 3000:3000`? O primeiro e segundo número são iguais?**
R: O formato é `-p <porta-do-host>:<porta-do-container>`. O primeiro número é a porta no seu computador; o segundo é a porta dentro do container. Se você muda `-p 8080:3000`, acessa a API em `localhost:8080` enquanto o container ainda escuta na porta 3000.

**P: `docker rm` não funciona — diz que o container está em execução. O que fazer?**
R: Use `docker stop <container>` para parar graciosamente, depois `docker rm <container>`. Ou use `docker rm -f <container>` para forçar a remoção (envia SIGKILL).

**P: Como faço para limpar tudo — containers parados, imagens não usadas, cache?**
R: `docker system prune -a` remove todos os containers parados, imagens não usadas e cache de build. Cuidado: é irreversível. Use `docker system prune` (sem `-a`) para remover apenas o não usado sem remover imagens em cache.

**P: Meu `docker build` está lento. O que pode ser?**
R: As causas mais comuns são: (1) build context muito grande — verifique se o `.dockerignore` está funcionando; (2) cache de camadas sendo invalidado — confirme se `COPY package*.json ./` vem antes de `COPY . .`; (3) conexão lenta com registry para baixar a imagem base.

**P: Posso rodar Docker no macOS ou Windows?**
R: Sim — via Docker Desktop, que usa uma máquina virtual Linux por baixo (Hyper-V no Windows, HyperKit no macOS). Os comandos são os mesmos. Este curso foca em Linux, mas os conceitos são idênticos em todas as plataformas.

**P: Qual a diferença entre `docker run --rm`, `docker start` e `docker restart`?**
R: `docker run` cria e inicia um novo container. `--rm` remove automaticamente o container quando ele para (útil para testes). `docker start` inicia um container parado existente. `docker restart` para e inicia novamente um container em execução.

---

## Glossário

| Termo | Definição |
|---|---|
| **Bind mount** | Mapeamento de um diretório do host para dentro do container, com sincronização em tempo real (Seção 11) |
| **Build context** | Conjunto de arquivos e diretórios enviados ao daemon Docker durante o build (Seção 10) |
| **Cache de camadas** | Mecanismo que reaproveita camadas de build inalteradas entre builds sucessivos (Seção 9) |
| **Cgroup** (*control group*) | Funcionalidade do kernel Linux que limita e contabiliza recursos (CPU, RAM, I/O) por grupo de processos (Seção 3) |
| **Container** | Instância em execução de uma imagem — tem PID, rede, estado volátil (Seção 8) |
| **Copy-on-write (CoW)** | Mecanismo onde a cópia de um arquivo só acontece quando ele é modificado; a camada original permanece intacta (Seção 2) |
| **Daemon** (*dockerd*) | Processo em segundo plano que gerencia containers, imagens, redes e volumes no Docker (Seção 5) |
| **Digest** | Hash SHA256 imutável que identifica o conteúdo exato de uma imagem (Seção 7) |
| **Dockerfile** | Arquivo de receita que descreve como construir uma imagem Docker (Seção 9) |
| **Docker Hub** | Registry público padrão de imagens Docker, administrado pelo Docker (Seção 7) |
| **Imagem** | Blueprint imutável contendo sistema de arquivos, variáveis de ambiente e metadados — o "molde" do container (Seção 8) |
| **Layer** (*camada*) | Unidade imutável de alteração em um sistema de arquivos em camadas. Imagens são stacks de layers (Seção 2) |
| **Multi-stage build** | Técnica que usa múltiplos estágios em um Dockerfile para separar build de produção (Seção 10) |
| **Namespace** | Funcionalidade do kernel Linux que isola a visão de recursos (PID, net, mount) para grupos de processos (Seção 1) |
| **Official image** | Imagem mantida pelo Docker ou pelo fornecedor do software, com revisão de segurança (Seção 7) |
| **Registry** | Servidor que armazena e distribui imagens Docker (ex: Docker Hub) (Seção 7) |
| **Tag** | Rótulo mutável que aponta para uma versão específica de imagem (ex: `node:22`) (Seção 7) |
| **Volume** | Mecanismo de persistência de dados gerenciado pelo Docker, que vive além do ciclo de vida do container (Seção 11) |

---
