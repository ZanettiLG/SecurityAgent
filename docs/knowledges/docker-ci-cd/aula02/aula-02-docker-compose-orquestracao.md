---
titulo: "Aula 02: Docker Compose — Orquestração Multi-Serviço"
modulo: "Docker, Docker Compose e Distribuição"
duracao_estimada: "90 minutos"
nivel: "intermediario"
tags: [docker, docker-compose, orquestracao, servicos, postgresql, yaml, compose, multicontainer]
data: 2026-06-15
---

# Curso: Docker, Docker Compose e Distribuição — Aula 02

## Docker Compose: Orquestração Multi-Serviço

**Duração estimada:** 90 minutos (45 de leitura + 45 de prática)
**Nível:** Intermediário
**Pré-requisitos:** Docker Engine instalado (Aula 01), API Express containerizada com Dockerfile multi-stage, `.dockerignore`, bind mount com nodemon, Node.js 18+ com npm, e domínio de redes TCP/IP

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

- [ ] **Explicar** por que a orquestração manual de múltiplos serviços é frágil e não escala, usando o exemplo de stacks multi-serviço como âncora
- [ ] **Descrever** o mecanismo de redes virtuais para comunicação entre serviços, incluindo bridge automática e DNS interno por nome de serviço
- [ ] **Definir** health check como mecanismo universal de verificação de prontidão e explicar como ele resolve o problema de ordem de inicialização
- [ ] **Distinguir** armazenamento efêmero de container de armazenamento persistente via volumes, e explicar por que bancos de dados exigem volumes
- [ ] **Explicar** o paradigma de configuração declarativa (desired state) vs. imperativa (comandos manuais) para gerenciamento de stacks multi-serviço
- [ ] **Criar** um arquivo `docker-compose.yml` funcional com dois serviços (API Express + PostgreSQL) usando `build`, `image`, `ports`, `environment` e `volumes`
- [ ] **Executar** `docker compose up` e interpretar os logs entrelaçados de múltiplos serviços no terminal
- [ ] **Configurar** `depends_on` com `condition: service_healthy` e um healthcheck no PostgreSQL para garantir ordem correta de inicialização
- [ ] **Configurar** volumes nomeados para persistência de dados do PostgreSQL, verificando que os dados sobrevivem a `docker compose down` e `up`
- [ ] **Implementar** profiles `dev` e `prod` no mesmo arquivo Compose, e externalizar configuração via arquivo `.env` com a mesma sintaxe do `dotenv`

---

## Como Usar Esta Aula

Esta aula está organizada em **duas partes** com uma transição explícita entre elas.

A **primeira parte** (FUNDAMENTOS) cobre os mecanismos universais de orquestração — coordenação multiprocesso, redes virtuais entre serviços, health check de prontidão, persistência de estado e configuração declarativa com ambientes. Estes conceitos são apresentados de forma genérica: valem para qualquer stack multi-serviço, qualquer linguagem, qualquer ferramenta de orquestração. São ancorados em **experiências que você já viveu**: subir serviços manualmente, esperar banco de dados iniciar, perder dados em reinicialização.

A **segunda parte** (APLICAÇÃO) conecta cada mecanismo à sua implementação concreta no Docker Compose. Aqui a didática muda: você primeiro **faz** (recebe um YAML pronto, executa `docker compose up`, vê a stack subir sozinha), depois **entende** (a teoria explica o que o Compose fez), e por fim **apro funda** (healthcheck, volumes, profiles, .env).

Ao longo do caminho, você encontrará seções **"Mão na Massa"** com passos práticos para executar no seu terminal, e **"Quick Check"** ao final de cada seção para verificar se você absorveu o conceito.

**Tempo estimado:** 45 minutos de leitura + 45 minutos de prática.

---

## Mapa Mental

Este diagrama mostra todos os conceitos que você vai dominar nesta aula:


![Mapa mental: Docker Compose — Orquestração Multi-Serviço](images/diagrama-01-mindmap.png)

---

## Recapitulação da Aula 01

| Aula | Conceito | Onde aparece nesta aula | Como se conecta |
|---|---|---|---|
| Aula 01 | **Dockerfile multi-stage** (Seção 10) | Seção 8 — `build: .` no serviço `api` | O `docker-compose.yml` referencia o Dockerfile com `build: .`, construindo a imagem da API diretamente do código que você já containerizou |
| Aula 01 | **Bind mounts** (Seção 11) | Seção 11 — profiles dev com `volumes: .:/app` | O bind mount que você usou com `-v $(pwd):/app` agora é declarado no YAML como volume do Compose, ativado apenas no profile `dev` |
| Aula 01 | **Comandos docker** (Seção 8) | Seção 8 — `docker compose ps`, `logs`, `exec` | Cada comando Docker que você domina tem um equivalente no Compose: `docker compose ps` = `docker ps` da stack, `docker compose logs` = logs agregados |
| Aula 01 | **Camadas de imagem** (Seção 2) | Seção 8 — `image: postgres:16-alpine` | A imagem do PostgreSQL é baixada do Docker Hub como você fez com `node:22-alpine` — mesma mecânica de camadas, cache e digest |
| Aula 01 | **.dockerignore** (Seção 10) | Seção 7 — build context no Compose | O `.dockerignore` que você configurou continua valendo — o Compose respeita ele ao executar o build da sua API |

---

**FUNDAMENTOS: Mecanismos Universais de Orquestração**

> *"Os conceitos desta seção são universais — valem para qualquer stack multi-serviço, qualquer linguagem, qualquer ferramenta de orquestração. Na segunda parte, você verá como o Docker Compose implementa cada um deles. Mas aqui, o foco está no 'por que' e 'como funciona', ancorado em problemas que você já enfrentou."*
---

## 1. Coordenação Multiprocesso — O Problema de Subir uma Stack

Você já construiu aplicações que dependem de múltiplos serviços: uma API que conversa com um banco de dados, um cache e uma fila de mensagens. Cada um desses serviços é um **processo independente** no sistema operacional. Para que a aplicação funcione, todos precisam estar rodando ao mesmo tempo, na ordem correta e se comunicando.

### O Problema da Orquestração Manual

Subir esses processos manualmente exige:

1. **Iniciar na ordem correta** — o banco de dados precisa estar pronto antes da API se conectar
2. **Manter terminais separados** — cada processo ocupa um terminal, e você precisa alternar entre eles para ver os logs
3. **Configurar rede manualmente** — cada serviço precisa saber onde encontrar os outros (endereço IP, porta)
4. **Repetir o processo em cada máquina** — desenvolvedor, CI, homologação, produção — cada ambiente repete a mesma coreografia manual

Lembra de quando você precisava subir três terminais separados para rodar uma stack multi-serviço? Um para o servidor da API, outro para o banco, um terceiro para o worker de fila? Cada terminal com seu próprio comando, sua própria ordem, seu próprio gerenciamento de erros? **Isso não escala.**

> *"Subir uma stack de 3 serviços na mão é como cozinhar um jantar de 3 pratos sozinho: cada prato tem seu tempo, seus ingredientes e sua ordem. Se o arroz queimar enquanto você corta legumes para a salada, o jantar desanda. Orquestração é ter um chef que coordena tudo — você diz o cardápio, ele garante que tudo saia no ponto."*

### A Solução Universal

Toda ferramenta de orquestração — seja ela qual for — resolve o mesmo problema fundamental: **coordenar múltiplos processos independentes como se fossem uma única unidade**. Você declara quais serviços existem, como se relacionam e em que ordem devem iniciar. A ferramenta gerencia o ciclo de vida de cada um, a ordem de inicialização e os logs consolidados.


![Diagrama: Orquestração manual — 3 terminais, comandos separados, dependências de ordem](images/diagrama-02-diagram.png)

### Quick Check 1

**1. Por que subir 3 serviços manualmente em terminais separados não escala para times maiores ou ambientes múltiplos?**
**Resposta:** Porque cada desenvolvedor ou ambiente precisa repetir a mesma coreografia manual — ordem de inicialização, terminais separados, configuração de rede. O processo não é versionável, reproduzível nem automatizável. Um novo membro do time precisa descobrir a ordem correta por tentativa e erro.

**2. Qual problema universal as ferramentas de orquestração resolvem?**
**Resposta:** Coordenar múltiplos processos independentes como se fossem uma única unidade — gerenciando ciclo de vida, ordem de inicialização, rede e logs de forma declarativa e reproduzível.

---

## 2. Redes Virtuais e Descoberta de Serviços — Como Processos se Encontram

Processos isolados que precisam se comunicar necessitam de uma **rede compartilhada**. Em um ambiente de múltiplos processos, cada um tem sua própria interface de rede. Para que conversem, é preciso conectá-los.

### O Problema do Endereçamento

Se o serviço A (API) precisa falar com o serviço B (banco de dados), ele precisa saber o endereço de B. Na sua máquina, ambos rodam em `localhost` — a API acessa o banco em `localhost:5432`. Mas em um ambiente de processos isolados, cada um tem seu próprio **net namespace** (lembra da Aula 01?). O `localhost` de cada processo é diferente. A API não vê a porta 5432 do banco no seu `localhost`.

### Redes Virtuais e DNS Interno

A solução universal é criar uma **rede virtual** que conecte todos os processos. Dentro dessa rede, cada processo recebe um nome lógico (o nome do serviço, não seu endereço IP) e um **servidor DNS interno** resolve esse nome para o endereço correto.

- Você não precisa saber o IP do banco — você o chama pelo nome: `db`
- O DNS interno da rede resolve `db` para o endereço do container do banco
- Se o banco reiniciar e ganhar um novo IP, o DNS é atualizado automaticamente

Esse padrão se chama **service discovery** (descoberta de serviços) e é universal: Kubernetes, Nomad, Consul e outras ferramentas de orquestração implementam a mesma ideia. Registrar serviços por nome e resolvê-los em rede, sem configurar endereços manualmente.


![Diagrama: Rede virtual bridge — serviços conectados, DNS interno resolvendo nomes](images/diagrama-03-diagram.png)

> *"Service discovery é o DNS privado da sua stack. Você não decora IPs de serviços mais do que decora números de telefone — você usa a agenda (DNS) para resolver nomes."*

### Quick Check 2

**1. Por que `localhost:5432` não funciona como endereço do banco quando a API e o banco estão em processos isolados?**
**Resposta:** Porque cada processo isolado tem seu próprio net namespace com seu próprio `localhost`. O `localhost` da API é diferente do `localhost` do banco. A API não vê a porta 5432 do banco no seu loopback local — precisa de uma rede compartilhada.

**2. O que é service discovery e qual problema ele resolve?**
**Resposta:** Service discovery é o mecanismo que permite que serviços se encontrem pelo nome em vez de endereço IP. Ele resolve o problema de endereçamento dinâmico: quando um serviço reinicia e ganha um novo IP, o DNS interno é atualizado automaticamente, e os outros serviços continuam encontrando-o pelo nome.

---

## 3. Health Check e Prontidão — O "Tá Pronto?" Antes de Usar

Um processo estar "em execução" não significa estar "pronto para receber conexões". Essa distinção é sutil mas crucial.

### Processo Rodando ≠ Serviço Pronto

Quando você inicia um PostgreSQL, o processo `postgres` aparece como PID ativo em segundos. Mas o banco pode levar mais tempo para inicializar o WAL (Write-Ahead Log), carregar configurações e liberar conexões. Durante esse período, o processo está rodando, mas qualquer tentativa de conectar recebe "connection refused".

O mesmo vale para uma API que depende de um banco: se a API tentar conectar antes do banco estar pronto, ela falha. E falha repetidamente — cada tentativa gera um erro no log.

### Health Check: A Pergunta Explícita

Um **health check** é uma verificação explícita de prontidão: um comando ou endpoint que retorna sucesso quando o serviço está realmente operacional. O health check pergunta "você está pronto? aceitando conexões?" e aguarda a resposta positiva antes de considerar o serviço disponível.

Existem três tipos comuns de health check:

- **TCP connect**: verifica se a porta está aberta e aceitando conexões
- **HTTP GET**: faz uma requisição a um endpoint `/health` e verifica se retorna 200
- **Comando shell**: executa um comando específico do serviço (ex: `pg_isready` para PostgreSQL)

O importante é o **ciclo**: perguntar, esperar, perguntar de novo — até receber "sim" ou esgotar as tentativas.


![Diagrama: Ciclo de health check — pergunta → resposta → decisão (pronto/aguardando)](images/diagrama-04-diagram.png)

### A Analogia do `await`

Se você programa em JavaScript, conhece `await`: "não execute a próxima linha até esta Promise resolver." Health check é o mesmo princípio aplicado à infraestrutura. Serviços dependentes devem **aguardar** o health check do seu dependente antes de inicializar.

```javascript
// await no código: aguarde a Promise resolver
await db.connect();

// health check na infra: aguarde o serviço responder
// while (!dbIsReady()) { await sleep(1); }
```

> *"Health check + dependência é o `await` da infraestrutura. Você não chama a API antes dela estar pronta, e a orquestração não sobe o app antes do banco responder."*

### Quick Check 3

**1. Qual a diferença entre um processo "em execução" e um serviço "pronto"? Dê um exemplo.**
**Resposta:** Um processo "em execução" significa que o binário foi carregado e o PID está ativo. Um serviço "pronto" significa que ele está aceitando conexões. Exemplo: o PostgreSQL pode ter o processo `postgres` rodando (PID visível) mas ainda estar inicializando o WAL — qualquer tentativa de conectar recebe "connection refused".

**2. Quais são os três tipos comuns de health check e como cada um funciona?**
**Resposta:** (1) TCP connect — verifica se a porta está aberta; (2) HTTP GET — faz requisição a um endpoint e verifica status 200; (3) Comando shell — executa um comando específico (ex: `pg_isready`) e verifica código de saída 0.

---

## 4. Persistência de Estado — O Que Sobrevive ao Fim do Processo

Processos têm ciclo de vida: iniciam, executam e terminam. O sistema de arquivos de um processo isolado é, por padrão, **efêmero** — ele some quando o processo termina. Mas alguns serviços são **stateful** — armazenam informações que precisam sobreviver a reinicializações, migrações e falhas.

### Efêmero vs Persistente

Imagine que você está escrevendo um documento. Se escrever em um bloco de notas descartável, ao fechar o programa o texto se perde. Se escrever em um caderno encadernado, o texto permanece — você pode trocar de mesa, de sala, de prédio, o caderno continua lá.

O sistema de arquivos de um processo efêmero é como o bloco de notas. Um **volume** é o caderno encadernado: existe independentemente do processo que o usa.


![Diagrama: Armazenamento efêmero vs volume nomeado — ciclo de vida](images/diagrama-05-diagram.png)

### Stateful vs Stateless

Serviços **stateless** (sem estado) — como uma API REST que não armazena dados localmente — podem usar armazenamento efêmero sem problemas. Se o container reiniciar, a API simplesmente carrega a configuração e começa a atender requisições. Perdeu o cache local? Sem problema — ele se reconstrói.

Serviços **stateful** (com estado) — como bancos de dados, filas de mensagens, sistemas de arquivos — precisam de armazenamento persistente. Perder os dados de um PostgreSQL é inaceitável. A solução universal é **desacoplar o armazenamento do ciclo de vida do processo**: um volume de dados que existe independentemente de qualquer processo, montado no sistema de arquivos do serviço que precisa dele.

### A Conexão com Bind Mounts (Aula 01)

Na Aula 01, você usou **bind mounts** para desenvolvimento: um diretório do seu computador era "espelhado" dentro do container, permitindo hot reload com nodemon. Volumes nomeados são o mesmo conceito, mas com uma diferença importante:

| Característica | Bind Mount | Volume Nomeado |
|---|---|---|
| Quem gerencia | Você (caminho no host) | Runtime |
| Localização | Qualquer diretório do host | Gerenciado pelo runtime |
| Uso típico | Desenvolvimento (código, hot reload) | Dados persistentes (banco) |
| Backup | Manual | Gerenciado |
| Portabilidade | Dependente do host | Independente |

> *"O sistema de arquivos do container é como um bloco de notas que você joga fora no fim do dia. Um volume é um caderno encadernado que sobrevive a você — troque de mesa, troque de escritório, o caderno continua lá."*

### Quick Check 4

**1. O que acontece com os dados de um PostgreSQL se ele for reiniciado sem um volume?**
**Resposta:** Os dados são perdidos. O sistema de arquivos do container é efêmero — quando o container termina, tudo que foi escrito na camada read-write desaparece. Bancos de dados exigem volumes para garantir que os dados sobrevivam a reinicializações.

**2. Qual a diferença fundamental entre um bind mount (Aula 01) e um volume nomeado?**
**Resposta:** O bind mount mapeia um diretório específico do host para dentro do container (você controla o caminho). O volume nomeado é gerenciado pelo runtime — você só referencia pelo nome, sem saber onde ele está fisicamente no host.

---

## 5. Configuração Declarativa e Ambientes — O Estado Desejado como Código

Existem dois paradigmas fundamentais para gerenciar infraestrutura. Você usa ambos no dia a dia sem talvez perceber.

### Imperativo vs Declarativo

**Imperativo**: você descreve **como** fazer, passo a passo.
- "Crie um container com Node.js na porta 3000"
- "Depois crie um container com PostgreSQL na porta 5432"
- "Conecte os dois em uma rede"
- "Agora configure as variáveis de ambiente"

**Declarativo**: você descreve **o que quer**, e o runtime descobre como chegar lá.
- "Quero dois serviços: uma API Node.js e um PostgreSQL, conectados em rede, com os dados do banco persistidos"

O paradigma declarativo descreve o **desired state** (estado desejado) em um arquivo de configuração — tipicamente YAML ou JSON. O runtime compara o estado atual com o desejado e executa as ações necessárias para convergir.


![Diagrama: Declarativo vs imperativo — dois fluxos comparativos](images/diagrama-06-diagram.png)

### Vantagens do Declarativo

- **Versionável**: o arquivo de configuração vai para o git. Cada alteração tem histórico, autor e pode ser revisada em PR.
- **Reproduzível**: o mesmo arquivo produz a mesma stack em qualquer máquina — desenvolvimento, CI, produção.
- **Idempotente**: executar o mesmo arquivo duas vezes produz o mesmo resultado. O runtime só faz o que precisa ser feito.

### Variações por Ambiente

Um mesmo arquivo declarativo pode descrever **variações por ambiente** através de dois mecanismos:

1. **Profiles**: conjuntos de serviços que são ativados seletivamente. Em desenvolvimento, você quer um serviço com hot reload. Em produção, o mesmo serviço sem hot reload. Ambos descritos no mesmo arquivo.
2. **Variáveis externalizadas**: valores que mudam por ambiente (senhas, URLs, portas) são mantidos em arquivos separados e injetados no momento da execução.

> *"Configuração declarativa está para infraestrutura como `package.json` está para dependências. Você declara o que quer (`express: ^4.18`), o runtime resolve como instalar. Na infraestrutura, você declara o que quer (`postgres:16-alpine`), o runtime resolve como subir."*

### A Conexão com `dotenv` e `NODE_ENV`

Você já usa `dotenv` no Node.js: um arquivo `.env` com `DB_HOST=localhost` e `process.env.DB_HOST` no código. A configuração declarativa leva o mesmo princípio para a infraestrutura: em vez de variáveis de ambiente dentro do código, variáveis de ambiente que configuram **como o serviço é executado**.

A diferença: no Node.js, `NODE_ENV` controla o **comportamento** do código (`if production, use optimized logger`). Na configuração declarativa, profiles controlam **quais serviços inteiros existem** — em dev, você quer hot reload; em prod, não.

### Quick Check 5

**1. Qual a diferença entre os paradigmas imperativo e declarativo no contexto de infraestrutura?**
**Resposta:** Imperativo descreve **como fazer** (lista de comandos passo a passo). Declarativo descreve **o que quer** (estado desejado em um arquivo). O declarativo é versionável, reproduzível e idempotente — o runtime descobre como chegar ao estado desejado.

**2. O que são profiles em uma configuração declarativa e qual problema resolvem?**
**Resposta:** Profiles são conjuntos de serviços ativados seletivamente no mesmo arquivo de configuração. Resolvem o problema de ter comportamentos diferentes por ambiente (dev vs prod) sem duplicar o arquivo inteiro — um profile `dev` pode incluir hot reload; o profile `prod` não.

---

**APLICAÇÃO: Orquestração Multi-Serviço com Docker Compose**

> *"Agora que você entende os mecanismos universais — coordenação de múltiplos processos, redes virtuais com descoberta de serviços, health check como verificação de prontidão, persistência de estado via volumes e configuração declarativa com ambientes — vamos conectá-los à prática com Docker Compose. Mas antes da teoria: mão na massa. Você vai receber um arquivo YAML pronto, digitar um comando, e ver uma stack inteira subir sozinha. Depois a teoria explica o que o Compose fez."*
---

## 6. O Problema — Por Que Orquestrar na Mão Não Escala

Você tem a API Express da Aula 01. Agora precisa adicionar PostgreSQL. Como fazer isso manualmente?

### O Caminho Manual (não execute — só observe)

Para subir API + PostgreSQL manualmente, você precisaria de algo como:

```bash
# 1. Criar uma rede para os containers se encontrarem
docker network create minha-rede

# 2. Subir o PostgreSQL com variáveis de ambiente
docker run -d \
  --name meu-db \
  --network minha-rede \
  -e POSTGRES_PASSWORD=minhasenha \
  -e POSTGRES_DB=mydb \
  postgres:16-alpine

# 3. Construir a imagem da API
docker build -t minha-api .

# 4. Subir a API conectada ao banco
docker run -d \
  --name minha-api \
  --network minha-rede \
  -p 3000:3000 \
  -e DATABASE_URL=postgres://postgres:minhasenha@meu-db:5432/mydb \
  minha-api

# 5. Verificar se ambos subiram
docker ps

# 6. Ver logs da API (em outro terminal)
docker logs -f minha-api

# 7. Ver logs do banco (em outro terminal)
docker logs -f meu-db
```

Sete comandos. E isso é o cenário **simples** — sem healthcheck, sem volumes, sem profiles. Se algo der errado, você precisa parar tudo, investigar e executar novamente na ordem correta.

### Conexão com a Seção 1

Este é exatamente o problema de **coordenação multiprocesso** que você entendeu na Seção 1. Cada `docker run` é um comando manual. A ordem importa. Os logs estão em terminais separados. Não há um arquivo versionável que descreva a stack. O processo não escala.

### A Pergunta que Muda Tudo

E se existisse um arquivo onde você declara "quero uma API Node.js e um PostgreSQL, conectados em rede, com os dados do banco persistidos em disco", e um **único comando** sobe tudo? Isso é Docker Compose.

> *"`docker compose up` é o `npm start` da stack inteira — um comando sobe tudo que o app precisa. É o `npm start` que o `package.json` nunca teve para infraestrutura."*

### Quick Check 6

**1. Quantos comandos seriam necessários para subir manualmente API + PostgreSQL com Docker?**
**Resposta:** Pelo menos 4 comandos principais (network create, db run, build, api run) mais comandos de verificação e debug. Cada um desses comandos precisa ser executado na ordem correta, e o processo não é versionável.

**2. Qual conexão existe entre o problema da orquestração manual e o conceito de coordenação multiprocesso da Seção 1?**
**Resposta:** A orquestração manual exige que você gerencie a ordem de inicialização, rede e logs de múltiplos processos — exatamente o problema de coordenação multiprocesso. A falta de uma camada de orquestração transforma 2 serviços em múltiplos comandos manuais frágeis.

---

## 7. A Experiência — `docker compose up`

Chegou a hora de **ver** a stack subir sozinha. Você vai criar um arquivo YAML (já fornecido), atualizar o código da API e executar `docker compose up`. Só depois vamos dissecar o que aconteceu.

### Pré-requisito: Diretório do Projeto

Você deve ter o diretório da Aula 01 com a seguinte estrutura:


![Diagrama: Estrutura de diretórios do projeto](images/diagrama-10-diagram.png)
### Passo 1: Atualizar o Código da API

Substitua seu `server.js` por este código que conecta ao PostgreSQL:

```javascript
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      message: 'API com PostgreSQL funcionando!',
      dbTime: result.rows[0].time,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

**Atenção:** O código usa `pg` (driver PostgreSQL para Node.js) e `DATABASE_URL`. Você precisa instalar o driver.

Adicione `pg` ao `package.json`:

```bash
npm install pg
```

Seu `package.json` deve ficar assim:

```json
{
  "name": "minha-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "npx nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

### Passo 2: Criar o `docker-compose.yml`

Crie o arquivo `docker-compose.yml` no diretório do projeto:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:minhasenha@db:5432/mydb

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=minhasenha
      - POSTGRES_DB=mydb
```

### Passo 3: Executar `docker compose up`

No diretório do projeto, execute:

```bash
docker compose up
```

Você verá algo como:

```
[+] Running 3/3
 ✔ Network meu-projeto_default  Created
 ✔ Container meu-projeto-db-1   Created
 ✔ Container meu-projeto-api-1  Created
Attaching to meu-projeto-api-1, meu-projeto-db-1

meu-projeto-db-1   | 
meu-projeto-db-1   | PostgreSQL Database directory appears to contain a database; Skipping initialization
meu-projeto-db-1   | 
meu-projeto-db-1   | 2026-06-15 ... LOG:  starting PostgreSQL 16.0
meu-projeto-db-1   | 2026-06-15 ... LOG:  database system is ready to accept connections

meu-projeto-api-1  | 
meu-projeto-api-1  | > minha-api@1.0.0 start
meu-projeto-api-1  | > node server.js
meu-projeto-api-1  |
meu-projeto-api-1  | API rodando na porta 3000
```

Observe os **prefixos** nas linhas: `meu-projeto-db-1` e `meu-projeto-api-1`. O Compose prefixa cada linha de log com o nome do serviço — logs **entrelaçados** de múltiplos serviços no mesmo terminal.

### Passo 4: Testar a API

Em outro terminal, teste:

```bash
curl http://localhost:3000
```

**Output esperado:**

```json
{"message":"API com PostgreSQL funcionando!","dbTime":"2026-06-15T..."}
```

### Passo 5: Parar a Stack

Pressione `Ctrl+C` no terminal do Compose. O Compose faz um graceful shutdown: envia SIGTERM para cada container, espera, e se necessário SIGKILL.

```
Gracefully stopping... (press Ctrl+C again to force)
[+] Stopping 2/2
 ✔ Container meu-projeto-api-1  Stopped
 ✔ Container meu-projeto-db-1   Stopped
```

### Interpretando o Que Aconteceu

Em menos de 30 segundos e **um único comando**:

1. O Compose criou uma **rede bridge** automática chamada `meu-projeto_default`
2. Fez pull da imagem `postgres:16-alpine` (se não estava em cache)
3. Construiu a imagem da API a partir do Dockerfile
4. Criou e iniciou os dois containers
5. Conectou ambos à mesma rede
6. Os logs dos dois serviços aparecem **entrelaçados** no terminal


![Diagrama: Fluxo docker compose up — YAML → Compose → network create → pull/build → container start → logs entrelaçados](images/diagrama-07-diagram.png)

### Troubleshooting

- **`port is already allocated`**: a porta 5432 já está em uso (provavelmente um PostgreSQL rodando na sua máquina). Altere a porta do host: `"5433:5432"` no YAML.
- **`connection refused`**: a API tentou conectar ao PostgreSQL antes dele estar pronto. É esperado — vamos resolver na Seção 9 com healthcheck.
- **`no configuration file provided`**: o arquivo deve se chamar exatamente `docker-compose.yml` e estar no diretório onde você executa `docker compose up`.
- **`service "api" refers to undefined build context`**: o Dockerfile não foi encontrado. Verifique se ele está no mesmo diretório do `docker-compose.yml`.

### Quick Check 7

**1. O que o prefixo `meu-projeto-db-1` significa nos logs do Compose?**
**Resposta:** É o identificador do container formatado como `<nome-do-projeto>-<nome-do-serviço>-<índice>`. O prefixo permite identificar de qual serviço cada linha de log veio, já que os logs de todos os serviços aparecem entrelaçados no mesmo terminal.

**2. Por que `docker compose up` é comparado ao `npm start` da stack inteira?**
**Resposta:** Porque um único comando sobe todos os serviços necessários para a aplicação funcionar — API, banco de dados, rede, variáveis de ambiente. Assim como `npm start` inicia um servidor Node.js, `docker compose up` inicia toda a stack multi-serviço.

---

## 8. Anatomia do YAML — Services, Networks e DNS Interno

Você VIU a stack subir sozinha. Agora vamos entender O QUE cada linha do YAML fez. O Docker Compose leu o `docker-compose.yml`, interpretou cada seção e executou as ações correspondentes.

### Dissecando o YAML

```yaml
services:                          # ← Define os containers
  api:                             # ← Nome do serviço (vira nome DNS!)
    build: .                       # ← Constrói imagem do Dockerfile local
    ports:                         # ← Mapeamento de portas host:container
      - "3000:3000"                #   Host:3000 → Container:3000
    environment:                   # ← Variáveis de ambiente injetadas
      - DATABASE_URL=postgres://   #   API usa isso para conectar ao banco
        postgres:minhasenha@       #   Note o "db" como hostname
        db:5432/mydb

  db:                              # ← Serviço do banco de dados
    image: postgres:16-alpine      # ← Imagem do Docker Hub
    ports:
      - "5432:5432"                # ← Expõe PostgreSQL no host (opcional)
    environment:
      - POSTGRES_PASSWORD=minhasenha
      - POSTGRES_DB=mydb
```

### `services:` — Cada Serviço é um Container

A seção `services` define os containers que compõem a stack. Cada serviço é um container independente. O nome do serviço (ex: `api`, `db`) é importante — vira o **nome DNS** dentro da rede do Compose.

- **`api`**: usa `build: .` para construir a imagem a partir do Dockerfile no diretório atual (o mesmo Dockerfile multi-stage da Aula 01)
- **`db`**: usa `image: postgres:16-alpine` para baixar a imagem oficial do Docker Hub (como você fez com `node:22-alpine` na Aula 01)

### `ports:` — Mapeamento de Portas

O formato é `"porta-do-host:porta-do-container"`, idêntico ao `-p` do `docker run`:

- `"3000:3000"` na API: acessível em `localhost:3000`
- `"5432:5432"` no banco: acessível em `localhost:5432` (útil para ferramentas SQL)

> *"Dica: a porta do banco é opcional. Você só precisa dela se quiser acessar o PostgreSQL de fora do Compose (ex: com um cliente SQL no host). A API acessa o banco pela rede interna — sem precisar de porta exposta."*

### `environment:` — Variáveis de Ambiente

As variáveis são injetadas no container, como `-e` no `docker run`. Existem duas formas:

```yaml
# Forma array (usamos esta)
environment:
  - POSTGRES_PASSWORD=minhasenha
  - POSTGRES_DB=mydb

# Forma objeto (equivalente)
environment:
  POSTGRES_PASSWORD: minhasenha
  POSTGRES_DB: mydb
```

### A Rede Automática e o DNS Interno

Agora o mais importante: **o Compose cria automaticamente uma rede bridge**. Todos os serviços da stack são conectados a ela. Dentro dessa rede, cada serviço é acessível pelo seu nome.

A linha mágica é:

```
DATABASE_URL=postgres://postgres:minhasenha@db:5432/mydb
```

O hostname é `db` — não `localhost`, não `127.0.0.1`. É o nome do serviço. O **DNS interno** do Compose resolve `db` para o endereço IP do container do PostgreSQL. Sempre. Automaticamente.

> *"O Compose cria um DNS privado para sua stack. `api` resolve para o container da API, `db` resolve para o container do PostgreSQL. Você não configura IPs, não edita `/etc/hosts`, não passa `--link` — é automático."*


> *"A rede bridge que você usou é criada automaticamente pelo Compose — você não precisa declarar `networks:` para usá-la. A declaração explícita só é necessária em cenários avançados (sub-redes customizadas, drivers específicos, redes externas)."*

### Conexão com a Seção 2

Lembra da Seção 2, onde discutimos redes virtuais com DNS interno? O Compose implementa exatamente isso. Cada serviço recebe um nome DNS — `api` e `db` — e o DNS interno da rede bridge resolve esses nomes para os IPs corretos. A API acessa o PostgreSQL como `db:5432` — sem configurar endereços manualmente.

### Comandos de Inspeção do Compose

Agora que a stack está rodando, vamos inspecioná-la:

```bash
# Listar serviços da stack
docker compose ps

# Output esperado:
# NAME                IMAGE                 COMMAND           SERVICE  PORTS
# meu-projeto-api-1   minha-api             "docker-entry…"   api      0.0.0.0:3000->3000/tcp
# meu-projeto-db-1    postgres:16-alpine    "docker-entry…"   db       0.0.0.0:5432->5432/tcp

# Logs de um serviço específico
docker compose logs db

# Executar comando dentro do container do banco
docker compose exec db psql -U postgres -c "SELECT 1"
```

**Mão na Massa — Inspecionar a Stack:**

- [ ] Execute `docker compose ps` e identifique os dois serviços
- [ ] Execute `docker compose logs db` e veja apenas os logs do PostgreSQL
- [ ] Execute `docker compose exec db psql -U postgres -c "SELECT 1"` — se retornar `?column? --- 1`, o banco está acessível
- [ ] Compare `docker compose ps` com `docker ps` — o Compose filtra os containers da stack

### Conexão com Comandos da Aula 01

| Comando Aula 01 | Equivalente Compose | Diferença |
|---|---|---|
| `docker ps` | `docker compose ps` | Filtra apenas containers da stack |
| `docker logs <id>` | `docker compose logs <serviço>` | Aceita nome do serviço |
| `docker exec -it <id> sh` | `docker compose exec <serviço> <cmd>` | Contexto da stack |

> *"`docker compose ps` é o `docker ps` da stack. `docker compose logs` é o `docker logs` agregado. `docker compose exec` é o `docker exec` contextualizado. Você já sabe usar — só muda o prefixo."*

### Quick Check 8

**1. Por que a connection string do PostgreSQL pode usar `db` como hostname em vez de `localhost` ou um IP?**
**Resposta:** Porque o Compose cria automaticamente uma rede bridge com DNS interno. O nome do serviço (`db`) é registrado como nome DNS dentro dessa rede. O DNS resolve `db` para o IP do container do PostgreSQL, sem configuração manual.

**2. Qual a diferença entre `build: .` e `image: postgres:16-alpine` no YAML?**
**Resposta:** `build: .` indica que a imagem deve ser construída a partir do Dockerfile no diretório atual (build local). `image: postgres:16-alpine` indica que a imagem deve ser obtida de um registry (pull do Docker Hub). Um serviço usa **ou** `build` **ou** `image`.

---

## 9. Dependências e Healthcheck — `depends_on` com `condition: service_healthy`

Você deve ter notado um problema na Seção 7: a API tentava conectar ao PostgreSQL antes dele estar pronto. O log mostrava o erro "connection refused" seguido de algumas tentativas até o banco finalmente responder. Esse é o problema clássico de **ordem de inicialização**.

### O Problema que Você Viveu

Quando você executou `docker compose up`, o Compose iniciou a API e o PostgreSQL **quase simultaneamente**. O PostgreSQL precisa de alguns segundos para inicializar o WAL e ficar pronto. A API, que é mais rápida, tentou conectar antes do banco estar pronto — e recebeu "connection refused".

O container `db` estava em execução (processo rodando), mas o serviço não estava **pronto**. Exatamente a distinção que fizemos na Seção 3.

### A Solução: `depends_on` + `healthcheck`

O Compose oferece dois mecanismos que, juntos, resolvem esse problema:

**Healthcheck no serviço `db`**: define um comando que verifica se o PostgreSQL está pronto. Usamos `pg_isready`, um comando nativo do PostgreSQL que retorna 0 quando o banco aceita conexões.

**`depends_on` no serviço `api`**: define que a API só deve iniciar depois que o banco estiver saudável (`condition: service_healthy`).

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:minhasenha@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy    # ← Só inicia quando db estiver saudável

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=minhasenha
      - POSTGRES_DB=mydb
    healthcheck:                      # ← Novo bloco
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
```

### Entendendo o Healthcheck

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]   # Comando de verificação
  interval: 5s      # A cada 5 segundos
  timeout: 3s       # Timeout de 3s para cada execução
  retries: 5        # 5 falhas seguidas = unhealthy
  start_period: 10s # Período de graça antes de começar a contar falhas
```

O fluxo nos bastidores:

1. O Compose inicia `db` primeiro (por causa do `depends_on`)
2. A cada 5 segundos, executa `pg_isready -U postgres` dentro do container
3. Enquanto o PostgreSQL não estiver pronto, `pg_isready` retorna 1 (falha)
4. Quando o PostgreSQL está pronto, `pg_isready` retorna 0 (sucesso)
5. O healthcheck marca o serviço como `healthy`
6. O Compose então inicia `api`

Isso aparece nos logs como:

```
meu-projeto-db-1  | 2026-06-15 ... LOG:  database system is ready to accept connections
meu-projeto-db-1  | 2026-06-15 ... LOG:  database system is ready to accept connections
meu-projeto-db-1  | 2026-06-15 ... LOG:  starting PostgreSQL 16.0
meu-projeto-db-1  | 2026-06-15 ... LOG:  database system is ready to accept connections
# ← aqui o healthcheck marca como healthy
# ← Compose detecta healthy e inicia api
meu-projeto-api-1 | API rodando na porta 3000
```


![Diagrama: Timeline de inicialização com healthcheck — db inicia → pg_isready falha → pg_isready OK → api inicia](images/diagrama-08-diagram.png)

### Mão na Massa — Adicionar Healthcheck

- [ ] Adicione o bloco `healthcheck` ao serviço `db` no seu `docker-compose.yml`
- [ ] Adicione `depends_on` com `condition: service_healthy` ao serviço `api`
- [ ] Execute `docker compose down` para parar a stack atual
- [ ] Execute `docker compose up` novamente
- [ ] Observe os logs: PostgreSQL inicializa completamente ANTES da API começar
- [ ] Execute `docker compose ps` e veja o status `healthy` no serviço `db`

**Verificação:** O status do serviço `db` no `docker compose ps` deve mostrar `healthy` em vez de apenas o estado do processo.

### Conexão com a Seção 3

`depends_on` com `condition: service_healthy` é exatamente o mecanismo de **health check universal** que você aprendeu na Seção 3, aplicado ao Compose. É o `await db.isReady()` antes de `app.listen(3000)`. O Compose é o runtime que executa esse `await` — você declara a dependência, ele gerencia a espera.

> *"`depends_on` com `condition: service_healthy` é o `await` antes de usar a dependência. Você não chama a API antes dela estar pronta, e o Compose não sobe o app antes do banco responder."*

### Troubleshooting

- **`pg_isready` não encontrado**: o comando `pg_isready` está disponível em todas as imagens oficiais do PostgreSQL. Se você estiver usando uma imagem alternativa, pode ser que não tenha o comando. Use um healthcheck TCP como alternativa.
- **Service sempre `unhealthy`**: verifique se o usuário no `pg_isready` está correto. O padrão da imagem `postgres` é `postgres`. Se você mudou o usuário, ajuste: `pg_isready -U <usuario>`.

### Quick Check 9

**1. Por que apenas `depends_on` (sem healthcheck) não resolve o problema de ordem de inicialização?**
**Resposta:** Porque `depends_on` apenas espera o container **iniciar** (processo em execução), não o serviço ficar **pronto** (aceitando conexões). O PostgreSQL pode ter o processo ativo mas ainda estar inicializando — e a API tentaria conectar antes da hora. O healthcheck adiciona a verificação de prontidão real.

**2. O que o comando `pg_isready -U postgres` faz exatamente?**
**Resposta:** É um comando nativo do PostgreSQL que verifica se o servidor está aceitando conexões. Retorna código 0 (sucesso) quando o banco está pronto e código 1 (falha) quando não está. O healthcheck do Compose executa esse comando periodicamente e considera o serviço saudável quando ele retorna sucesso.

---

## 10. Volumes Nomeados — Persistência de Dados do PostgreSQL

Sem volumes, execute `docker compose down` (remove os containers) e `docker compose up` novamente — os dados do PostgreSQL **sumiram**. Cada `down` destrói o sistema de arquivos efêmero do container. Para um banco de dados, isso é inaceitável.

### O Problema

```bash
# Crie dados
docker compose exec db psql -U postgres -d mydb -c "CREATE TABLE test (id SERIAL, name TEXT);"
docker compose exec db psql -U postgres -d mydb -c "INSERT INTO test (name) VALUES ('sobrevive?');"

# Derribe a stack
docker compose down

# Suba novamente
docker compose up

# Verifique os dados
docker compose exec db psql -U postgres -d mydb -c "SELECT * FROM test;"
# ERROR: relation "test" does not exist ← Dados perdidos!
```

### A Solução: Volumes Nomeados

Precisamos de um volume nomeado que persista os dados do PostgreSQL independentemente do ciclo de vida dos containers.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:minhasenha@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=minhasenha
      - POSTGRES_DB=mydb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    volumes:                         # ← NOVO: monta o volume nomeado
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:                             # ← NOVO: declara o volume no nível raiz
  pgdata:                            #   Nome do volume
```

### Entendendo o Volume

- `volumes: pgdata:` (nível raiz) — declara o volume nomeado `pgdata`. O Docker cria e gerencia esse volume.
- `volumes: - pgdata:/var/lib/postgresql/data` (no serviço `db`) — monta o volume `pgdata` no diretório onde o PostgreSQL armazena dados.

`/var/lib/postgresql/data` é o diretório padrão de dados do PostgreSQL. O volume substitui o armazenamento efêmero do container por armazenamento persistente gerenciado pelo Docker.

### Mão na Massa — Testar Persistência

- [ ] Atualize o `docker-compose.yml` com o volume `pgdata`
- [ ] Execute `docker compose down` para parar a stack atual
- [ ] Execute `docker compose up` para iniciar com o volume
- [ ] Conecte ao PostgreSQL e crie dados:

```bash
docker compose exec db psql -U postgres -d mydb -c "CREATE TABLE test (id SERIAL, name TEXT);"
docker compose exec db psql -U postgres -d mydb -c "INSERT INTO test (name) VALUES ('sobrevive?');"
docker compose exec db psql -U postgres -d mydb -c "SELECT * FROM test;"
#  id |   name
# ----+-----------
#   1 | sobrevive?
```

- [ ] Derribe a stack e suba novamente:

```bash
docker compose down
docker compose up
```

- [ ] Verifique que os dados sobreviveram:

```bash
docker compose exec db psql -U postgres -d mydb -c "SELECT * FROM test;"
#  id |   name
# ----+-----------
#   1 | sobrevive?   ← Dados intactos!
```

- [ ] Liste os volumes:

```bash
docker volume ls
# DRIVER    VOLUME NAME
# local     meu-projeto_pgdata
```

**Verificação:** O volume `meu-projeto_pgdata` aparece no `docker volume ls` e os dados sobrevivem a `docker compose down` seguido de `up`.

### Comandos Importantes

```bash
# Deruba containers e redes (mantém volumes)
docker compose down

# Deruba TUDO, incluindo volumes (CUIDADO: destrói dados!)
docker compose down -v

# Lista volumes (para verificar persistência)
docker volume ls

# Inspeciona volume
docker volume inspect meu-projeto_pgdata
```

### Conexão com a Seção 4 e a Aula 01

Na **Seção 4**, você aprendeu a diferença entre armazenamento efêmero e persistente. O volume nomeado `pgdata` é a implementação concreta desse conceito: o volume existe independentemente dos containers, e os dados do PostgreSQL sobrevivem a reinicializações.

Na **Aula 01**, você usou bind mounts (`-v $(pwd):/app`) para desenvolvimento — o diretório do host era espelhado no container. Volumes nomeados são o equivalente para produção: gerenciados pelo Docker, sem dependência de caminho no host.

> *"Volume nomeado é o HD externo da stack. O container morre, o volume fica. Deruba e sobe de novo — os dados do PostgreSQL continuam lá. É a diferença entre salvar o jogo no cartucho (efêmero) e salvar no memory card (persistente)."*

### Troubleshooting

- **`/var/lib/postgresql/data` já existe com dados não compatíveis**: se você já executou o PostgreSQL sem volume, os dados estão na camada efêmera. Ao adicionar o volume, o PostgreSQL pode reclamar que o diretório não está vazio. Solução: execute `docker compose down -v` (cuidado: isso remove os dados existentes) e depois `docker compose up`.
- **Volume não aparece no `docker volume ls`**: o volume só é criado quando um container é iniciado. Execute `docker compose up` primeiro.

### Quick Check 10

**1. O que acontece com os dados do PostgreSQL quando você executa `docker compose down` sem volumes?**
**Resposta:** Os dados são perdidos. `docker compose down` remove os containers e a rede. Sem volume, o sistema de arquivos do container (efêmero) é destruído junto com o container. Ao subir novamente, o PostgreSQL começa com um banco vazio.

**2. Qual a diferença entre adicionar o volume no nível do serviço (`volumes: - pgdata:/var/lib/postgresql/data`) e declará-lo no nível raiz (`volumes: pgdata:`)?**
**Resposta:** A declaração no nível raiz (`volumes: pgdata:`) informa ao Compose que o volume existe e deve ser gerenciado. A montagem no serviço (`volumes: - pgdata:/var/lib/postgresql/data`) especifica onde o volume é montado dentro do container. Ambos são necessários.

---

## 11. Profiles e `.env` — Múltiplos Ambientes no Mesmo Arquivo

Em desenvolvimento, você quer hot reload com bind mount e nodemon. Em produção, quer a imagem otimizada do multi-stage build. São comportamentos diferentes, mas não queremos dois arquivos Compose separados — duplicação leva a divergência.

### O Problema dos Ambientes

O servidor de desenvolvimento precisa de bind mount para hot reload (como você configurou na Aula 01), nodemon como comando de entrada e `NODE_ENV=development`. O servidor de produção precisa executar a imagem construída (sem bind mount), com `node server.js` e `NODE_ENV=production`.

Sem profiles, você teria dois arquivos Compose — `docker-compose.dev.yml` e `docker-compose.prod.yml` — que compartilham 80% do conteúdo. Qualquer alteração no banco precisaria ser replicada em ambos.

### A Solução: Profiles + `.env`

**Profiles** permitem definir serviços que só são ativados quando um perfil específico é selecionado. `--profile dev` ativa os serviços de desenvolvimento; `--profile prod` ativa os de produção.

**`.env`** externaliza variáveis de configuração (senhas, URLs, nomes de banco) para um arquivo separado, com a mesma sintaxe do `dotenv` que você já usa no Node.js.


![Diagrama: Estrutura final do Compose com profiles — dois perfis da API compartilhando o mesmo banco e volume](images/diagrama-09-diagram.png)

### Criando o Arquivo `.env`

Crie o arquivo `.env` no diretório do projeto:

```env
POSTGRES_PASSWORD=minhasenha
POSTGRES_DB=mydb
POSTGRES_USER=postgres
DATABASE_URL=postgres://postgres:minhasenha@db:5432/mydb
```

Sintaxe idêntica ao `dotenv` do Node.js — você já conhece. O Compose lê automaticamente o arquivo `.env` no diretório do projeto.

### O `docker-compose.yml` Completo

Agora, o arquivo Compose final com profiles e variáveis do `.env`:

```yaml
services:
  api-dev:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
    profiles:
      - dev                      # ← Ativado com --profile dev
    command: npm run dev

  api-prod:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    profiles:
      - prod                     # ← Ativado com --profile prod
    command: npm start

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  pgdata:
```

> *"O volume anônimo `- /app/node_modules` impede que o bind mount `.:/app` sobrescreva o diretório `node_modules` instalado dentro do container. Sem ele, o container perderia as dependências instaladas pelo Dockerfile — o diretório `node_modules` do host (vazio ou ausente) substituiria o do container."*

```sql
-- init.sql
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO items (name) VALUES ('Item criado pelo init.sql');
```

### Usando os Profiles

```bash
# Desenvolvimento (bind mount + nodemon + NODE_ENV=development)
docker compose --profile dev up

# Produção (imagem otimizada + NODE_ENV=production)
docker compose --profile prod up

# Parar stack de desenvolvimento
docker compose --profile dev down

# Parar stack de produção (mantendo volume)
docker compose --profile prod down

# Parar TUDO incluindo volume
docker compose --profile dev down -v

# Reconstruir imagem
docker compose --profile dev build

# Verificar serviços ativos do profile
docker compose --profile dev ps
```

### Profiles vs NODE_ENV — Uma Distinção Importante

- **Profiles** controlam **quais serviços existem** e **como são executados**. No profile `dev`, o serviço `api-dev` existe com bind mount e nodemon. No profile `prod`, o serviço `api-prod` existe sem bind mount.
- **NODE_ENV** controla o **comportamento do código** dentro do serviço. `NODE_ENV=development` ativa logs detalhados, stacks de erro, hot reload. `NODE_ENV=production` ativa otimizações, logs mínimos.

Os dois trabalham juntos: profile `dev` + `NODE_ENV=development` para desenvolvimento; profile `prod` + `NODE_ENV=production` para produção.

### Mão na Massa — Profiles e .env

- [ ] Crie o arquivo `.env` com as variáveis do PostgreSQL
- [ ] Atualize o `docker-compose.yml` com a estrutura final (dois serviços de API, profiles, variáveis do `.env`)
- [ ] Execute `docker compose --profile dev up` para desenvolvimento
- [ ] Verifique o hot reload: altere o `server.js`, salve, veja o nodemon reiniciar
- [ ] Pare com `Ctrl+C`
- [ ] Execute `docker compose --profile prod up` para produção
- [ ] Verifique que o comportamento é diferente (sem bind mount, sem nodemon)
- [ ] Teste ambos com `curl http://localhost:3000`

### Conexão com a Seção 5

Profiles são a implementação concreta do conceito de **ambientes declarativos** que você aprendeu na Seção 5. O arquivo YAML descreve o estado desejado com variações por ambiente, tudo versionado no git, sem duplicação.

`.env` é a **externalização de configuração** — mesma sintaxe do `dotenv` que você já usa no Node.js, agora alimentando containers em vez de `process.env`.

> *"Profiles são o `NODE_ENV` do Compose — mesmo código, comportamentos diferentes por ambiente. `.env` é o `dotenv` do Compose — mesma sintaxe que você já conhece, só que agora as variáveis alimentam containers, não só `process.env`."*

### Troubleshooting

- **`undefined variable ${POSTGRES_PASSWORD}`**: o arquivo `.env` não foi encontrado ou está em outro diretório. Verifique se o `.env` está no mesmo diretório do `docker-compose.yml`.
- **`service "api-dev" not found`**: você esqueceu o `--profile dev` no comando. Serviços com profiles só são ativados quando o profile correspondente é passado.
- **Nodemon não reinicia**: verifique se o bind mount está funcionando. Execute `docker compose exec api-dev ls /app/server.js` para confirmar que o arquivo está visível dentro do container.

### Quick Check 11

**1. Qual a diferença entre profiles do Compose e `NODE_ENV` no Node.js?**
**Resposta:** Profiles controlam **quais serviços existem** e como são executados (ex: bind mount ou não). `NODE_ENV` controla o **comportamento do código** dentro do serviço (ex: logs detalhados ou não). Profiles são da infraestrutura; `NODE_ENV` é da aplicação. Eles se complementam.

**2. Por que usar `${POSTGRES_PASSWORD}` no YAML em vez do valor literal?**
**Resposta:** Para externalizar a configuração. O valor fica no arquivo `.env` (que pode ser diferente por ambiente ou desenvolvedor), não hardcoded no YAML. Isso permite versionar o `docker-compose.yml` no git sem expor senhas, e cada desenvolvedor usar seu próprio `.env` local.

---

## Autoavaliação: Quiz Rápido

**1. Qual a diferença fundamental entre orquestração manual e declarativa de serviços?**
**Resposta:** A orquestração manual exige comandos passo a passo (imperativo), não é versionável e depende da ordem correta de execução. A orquestração declarativa descreve o estado desejado em um arquivo, é versionável (git), reproduzível e o runtime decide como atingir o estado.

**2. Como o Compose implementa service discovery entre os serviços da stack?**
**Resposta:** O Compose cria automaticamente uma rede bridge e um servidor DNS interno. Cada serviço é acessível pelo seu nome (ex: `db`, `api`) dentro dessa rede. O DNS resolve o nome do serviço para o IP do container, sem configuração manual.

**3. Qual a diferença entre `depends_on` simples e `depends_on` com `condition: service_healthy`?**
**Resposta:** `depends_on` simples espera apenas o container iniciar (processo em execução). `depends_on` com `condition: service_healthy` espera o healthcheck do serviço dependente retornar sucesso, garantindo que o serviço está pronto para receber conexões.

**4. O que acontece com os dados de um volume nomeado quando você executa `docker compose down`?**
**Resposta:** Os dados são preservados. `docker compose down` remove containers e redes, mas NÃO remove volumes por padrão. O volume nomeado continua existindo e seus dados estão intactos. Para remover o volume, use `docker compose down -v`.

**5. Para que serve a seção `volumes:` no nível raiz do `docker-compose.yml`?**
**Resposta:** Para declarar volumes nomeados que serão gerenciados pelo Compose. Sem essa declaração, o Compose não sabe que o volume existe e não pode gerenciá-lo adequadamente. O volume é então montado nos serviços que precisam dele.

**6. Como você ativa apenas os serviços de desenvolvimento em uma stack com profiles?**
**Resposta:** Usando a flag `--profile dev` no comando: `docker compose --profile dev up`. Isso ativa apenas os serviços que têm `profiles: [dev]` no YAML, além dos serviços sem profile (que são sempre ativados).

**7. O que acontece se você não criar o arquivo `.env` e usar `${VARIÁVEL}` no YAML do Compose?**
**Resposta:** O Compose tentará ler a variável do arquivo `.env`. Se o arquivo não existir ou a variável não estiver definida, o Compose emitirá um aviso e a variável ficará com valor vazio, o que pode causar erros em tempo de execução (ex: senha vazia para o PostgreSQL).

---

## Mão na Massa: Exercícios Graduados

### Exercício 1 (Fácil) — Modifique a Porta da API

Altere a porta exposta da API de `3000` para `8080` no `docker-compose.yml` e verifique que a API passa a responder em `localhost:8080`.

**Passos:**
1. Altere a linha `"3000:3000"` para `"8080:3000"` no serviço `api-dev` (ou `api-prod`)
2. Execute `docker compose --profile dev up`
3. Teste com `curl http://localhost:8080`
4. Verifique que `curl http://localhost:3000` agora falha (conexão recusada)

**Gabarito:**

```bash
# Antes: port 3000 do host mapeada para 3000 do container
# Depois: port 8080 do host mapeada para 3000 do container
# O container ainda escuta na porta 3000, mas agora você acessa via 8080

docker compose --profile dev up
# Em outro terminal:
curl http://localhost:8080
# {"message":"API com PostgreSQL funcionando!","dbTime":"..."}

curl http://localhost:3000
# curl: (7) Failed to connect to localhost port 3000: Connection refused
```

**Verificação:** A API responde em `localhost:8080` e não responde mais em `localhost:3000`. O mapeamento de portas foi alterado — o host agora acessa o container pela porta 8080.

---

### Exercício 2 (Médio) — Adicione um Healthcheck Personalizado

Você vai adicionar um endpoint `/health` no `server.js` que verifica a conexão com o PostgreSQL, e configurar um healthcheck HTTP no Compose para a API.

**Contexto:** O healthcheck da API deve verificar se o endpoint `/health` retorna HTTP 200. Se a API estiver rodando mas sem conexão com o banco, o healthcheck deve falhar.

**Passos:**
1. Adicione uma rota `/health` ao `server.js` que testa a conexão com o PostgreSQL
2. Adicione um bloco `healthcheck` ao serviço `api-dev` (ou `api-prod`) que faz `curl` ao `http://localhost:3000/health`
3. Teste que o serviço `api` aparece como `healthy` no `docker compose ps`

**Gabarito:**

**`server.js` atualizado:**

```javascript
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({ message: 'API com PostgreSQL funcionando!', dbTime: result.rows[0].time });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

**Healthcheck no `docker-compose.yml`:** adicione este bloco ao serviço `api-dev`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 15s
```

**Verificação:**

```bash
docker compose --profile dev up
# Aguarde a stack inicializar
docker compose ps
# NAME                        STATUS
# meu-projeto-api-dev-1       Up (healthy)
# meu-projeto-db-1            Up (healthy)
```

Se o PostgreSQL cair, o healthcheck da API falha e o serviço fica `unhealthy`:

```bash
docker compose stop db
# Aguarde o healthcheck da API falhar
docker compose ps
# meu-projeto-api-dev-1       Up (unhealthy)
```

---

### Desafio (Difícil) — Stack com 3 Serviços e Profile de Debug

Adicione um serviço `adminer` (interface web para gerenciamento de PostgreSQL) à stack, com um profile `debug`. O adminer deve estar na mesma rede que os outros serviços, e você deve coordenar a ordem de inicialização entre os 3 serviços.

**Contexto:** Adminer é uma ferramenta web de administração de banco de dados. A imagem oficial é `adminer:4.8.1`. Ela precisa apenas da variável `ADMINER_DEFAULT_SERVER` apontando para o nome do serviço do banco.

**Premissas:**
- O adminer deve ter profile `debug` (não ativado por padrão)
- O adminer deve depender do PostgreSQL (com healthcheck)
- A API não depende do adminer
- A stack completa (com debug) deve subir com um único comando

**Gabarito:**

**`docker-compose.yml` atualizado:**

```yaml
services:
  api-dev:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
    profiles:
      - dev

  api-prod:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    profiles:
      - prod

  adminer:
    image: adminer:4.8.1
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=db
    depends_on:
      db:
        condition: service_healthy
    profiles:
      - debug
      - dev               # Opcional: adminer também no dev

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  pgdata:
```

**Para ativar o debug:**

```bash
# Só dev + db
docker compose --profile dev up

# dev + db + adminer
docker compose --profile dev --profile debug up
# ou, se adminer tem profile dev:
docker compose --profile dev up

# Acessar adminer: http://localhost:8080
# Servidor: db
# Usuário: postgres
# Senha: (a definida no .env)
```

**Verificação:**

- Adminer acessível em `http://localhost:8080`
- Consegue conectar ao servidor `db` com usuário `postgres` e a senha do `.env`
- A stack sobe sem adminer quando não se usa `--profile debug`
- A ordem de inicialização é: `db` → (saudável) → `api-dev` + `adminer` simultaneamente

---

## Resumo da Aula

### Os 10 Conceitos Fundamentais

1. **Coordenação Multiprocesso**: orquestrar múltiplos serviços manualmente não escala — você precisa de uma camada que gerencie ciclo de vida, ordem e logs como uma unidade.
2. **Redes Virtuais e DNS Interno**: processos isolados precisam de uma rede compartilhada com service discovery por nome, não por IP.
3. **Health Check**: a distinção entre processo "em execução" e serviço "pronto" é resolvida com verificações explícitas de prontidão.
4. **Persistência de Estado**: serviços stateful (como bancos) precisam de armazenamento desacoplado do ciclo de vida do processo — volumes.
5. **Configuração Declarativa**: descrever o estado desejado (YAML) em vez de comandos imperativos torna a stack versionável, reproduzível e idempotente.
6. **Docker Compose**: ferramenta que implementa todos os mecanismos universais de orquestração em um único arquivo YAML e um comando (`docker compose up`).
7. **YAML do Compose**: `services`, `build`, `image`, `ports`, `environment` são os blocos fundamentais para declarar uma stack multi-serviço.
8. **`depends_on` com Healthcheck**: garante ordem de inicialização com verificação real de prontidão — o `await` da infraestrutura.
9. **Volumes Nomeados**: persistem dados além do ciclo de vida do container. Banco de dados sem volume = dados perdidos na reinicialização.
10. **Profiles e `.env`**: profiles permitem múltiplos ambientes no mesmo arquivo; `.env` externaliza configuração com sintaxe idêntica ao `dotenv`.

### O Que Você Construiu Hoje

- [x] `docker-compose.yml` funcional com 2 serviços (API Express + PostgreSQL)
- [x] API conectada ao PostgreSQL via rede bridge com DNS interno (`db:5432`)
- [x] Healthcheck no PostgreSQL com `pg_isready` e `depends_on` com `condition: service_healthy`
- [x] Volume nomeado `pgdata` para persistência dos dados do banco
- [x] Profiles `dev` (bind mount + nodemon) e `prod` (imagem otimizada) no mesmo YAML
- [x] Arquivo `.env` externalizando variáveis de configuração
- [x] `server.js` atualizado com conexão ao PostgreSQL via `pg`
- [x] Domínio dos 7 comandos Compose: up, down, ps, logs, exec, build, restart

---

## Próxima Aula

**Aula 03: Docker Registry — Distribuição e Versionamento de Imagens**

A stack que você construiu hoje (API + PostgreSQL) roda na sua máquina. Mas como compartilhar essa stack com o time? Na Aula 03, você vai adicionar um **Docker Registry** ao Compose, versionar a imagem com SemVer (1.0.0), fazer push e pull simulando um fluxo real de CI/CD. Vai aprender a diferença entre tag e digest, como versionar imagens semanticamente, e como montar um pipeline completo: build → tag → push → pull → run.

---

## Referências

### Documentação Oficial

- [Docker Compose Overview](https://docs.docker.com/compose/) — visão geral do Compose
- [Compose file reference](https://docs.docker.com/compose/compose-file/) — referência completa do YAML
- [Compose — depends_on](https://docs.docker.com/compose/compose-file/05-services/#depends_on) — dependências entre serviços
- [Compose — healthcheck](https://docs.docker.com/compose/compose-file/05-services/#healthcheck) — healthcheck no Compose
- [Compose — volumes](https://docs.docker.com/compose/compose-file/07-volumes/) — volumes nomeados e bind mounts
- [Compose — profiles](https://docs.docker.com/compose/profiles/) — profiles para múltiplos ambientes
- [Compose — environment variables](https://docs.docker.com/compose/environment-variables/) — variáveis de ambiente e `.env`

### Ferramentas

- [PostgreSQL Official Image](https://hub.docker.com/_/postgres) — imagem oficial do PostgreSQL no Docker Hub
- [Adminer](https://hub.docker.com/_/adminer) — interface web para administração de banco de dados
- [pg_isready](https://www.postgresql.org/docs/current/app-pg-isready.html) — documentação do comando de healthcheck
- [Node.js pg driver](https://node-postgres.com/) — driver PostgreSQL para Node.js

### Vídeos Recomendados

- [Como usar corretamente o Docker Compose | HandsOn DevOps (Fabricio Veronez)](https://www.youtube.com/watch?v=hue967OT4gw) — tutorial prático de Docker Compose em português (~25 min)
- [Ambiente de desenvolvimento Node.js com Docker e Docker Compose (Rocketseat)](https://www.youtube.com/watch?v=AVNADGzXrrQ) — Compose aplicado a apps Node.js reais (~35 min)

### Artigos para Aprofundamento

- [Docker Compose Best Practices](https://docs.docker.com/compose/best-practices/) — boas práticas oficiais para arquivos Compose
- [How to Use Docker Compose for Development](https://docs.docker.com/compose/best-practices/) — guia de desenvolvimento com Compose
- [PostgreSQL Docker Deployment](https://hub.docker.com/_/postgres) — boas práticas para PostgreSQL em containers
- [Docker Networking Overview](https://docs.docker.com/network/) — aprofundamento em redes Docker

---

## FAQ

**P: Preciso instalar algo além do Docker para usar o Compose?**
R: Não. O Docker Compose plugin v2 já vem instalado com o Docker Engine na maioria das distribuições. Verifique com `docker compose version`. Se não estiver disponível, instale com `sudo apt install docker-compose-plugin`.

**P: `docker compose` ou `docker-compose` — qual a diferença?**
R: `docker compose` (sem hífen) é o plugin v2 atual, integrado ao Docker CLI. `docker-compose` (com hífen) é o standalone v1 legado. Use sempre `docker compose` (v2). O comando `docker compose` é mais rápido, tem melhor integração e é o padrão desde 2023.

**P: Como faço para que o Compose reconstrua a imagem da API sem cache?**
R: Use `docker compose build --no-cache api-dev` ou `docker compose --profile dev build --no-cache api-dev`. Isso força o rebuild completo ignorando o cache de camadas.

**P: Meu container da API continua dando "connection refused" mesmo com healthcheck. O que pode ser?**
R: O healthcheck pode estar configurado incorretamente. Verifique: (1) o comando `pg_isready -U postgres` está correto? (2) o `start_period` é suficiente? (3) o `depends_on` tem `condition: service_healthy`? Execute `docker compose ps` para ver o status do `db` — deve mostrar `healthy`.

**P: Posso usar o Compose em produção?**
R: Docker Compose é uma ferramenta excelente para desenvolvimento e ambientes de teste. Para produção em larga escala, ferramentas como Kubernetes ou Docker Swarm oferecem orquestração distribuída com auto-scaling, rolling updates e balanceamento de carga. Mas para deploys simples (um servidor), Compose em produção é perfeitamente viável e comum.

**P: Como vejo os logs de um serviço específico sem sair do terminal?**
R: Use `docker compose logs -f <serviço>`. A flag `-f` (follow) mantém o terminal ativo mostrando novos logs em tempo real. Exemplo: `docker compose logs -f db` mostra apenas os logs do PostgreSQL.

**P: O que acontece se eu editar o `.env` com a stack rodando?**
R: As variáveis de ambiente já foram injetadas nos containers na inicialização. Editar o `.env` não afeta containers em execução. Você precisa executar `docker compose down` e `docker compose up` novamente para que os novos valores sejam lidos.

**P: Como eu removo completamente um volume nomeado e seus dados?**
R: Use `docker compose down -v` para remover containers, rede e volumes da stack. Para remover volumes órfãos (não associados a nenhum Compose), use `docker volume prune`. Cuidado: a operação é irreversível.

**P: Profiles e múltiplos arquivos Compose — qual usar?**
R: Profiles são a abordagem moderna e preferida para ambientes no mesmo arquivo. Múltiplos arquivos (ex: `docker-compose.override.yml`) funcionam, mas criam duplicação e divergência. Use profiles sempre que possível. Use múltiplos arquivos apenas quando as diferenças entre ambientes são tão grandes que justificam arquivos separados.

**P: Como usar profiles sem digitar `--profile` em todo comando?**
R: Defina a variável de ambiente `COMPOSE_PROFILES=dev` (no seu shell ou no `.env`). O Compose usará esses profiles automaticamente em todos os comandos — ideal para CI/CD e sessões longas de desenvolvimento.

---

## Glossário

| Termo | Definição |
|---|---|
| **Bind mount** | Mapeamento de diretório do host para o container, com sincronização em tempo real. Usado para desenvolvimento (Seção 11) |
| **Bridge** | Driver de rede padrão do Docker. Cria uma rede privada onde containers se comunicam por IP (Seção 2) |
| **Condition service_healthy** | Condição do `depends_on` que só prossegue após o healthcheck retornar sucesso (Seção 9) |
| **Configuração declarativa** | Paradigma onde se descreve o estado desejado em um arquivo, e o runtime decide como atingi-lo (Seção 5) |
| **DNS interno** (*internal DNS*) | Servidor DNS automático que o Compose cria para resolver nomes de serviço para IPs de container (Seção 2) |
| **Depends_on** | Instrução do Compose que define dependências entre serviços (Seção 9) |
| **Desired state** | Estado desejado declarado no arquivo de configuração — o runtime converge o estado atual para o desejado (Seção 5) |
| **Docker Compose** | Ferramenta para definir e executar aplicações multi-container com Docker (Seção 6) |
| **Health check** | Verificação explícita de prontidão de um serviço. Pode ser TCP, HTTP ou comando shell (Seção 3) |
| **Imperativo** | Paradigma onde se descreve como fazer, passo a passo, em vez do que se quer (Seção 5) |
| **Logs entrelaçados** | Logs de múltiplos serviços exibidos no mesmo terminal, prefixados pelo nome do serviço (Seção 7) |
| **Network namespace** (*netns*) | Isolamento de interfaces de rede. Cada container tem seu próprio netns (Aula 01, referência na Seção 2) |
| **Profile** | Conjunto de serviços ativados seletivamente no Compose via `--profile` (Seção 11) |
| **Service discovery** | Mecanismo que permite que serviços se encontrem pelo nome, não por IP (Seção 2) |
| **Stack** | Conjunto de serviços relacionados que compõem uma aplicação multi-container (Seção 1) |
| **Stateful** | Serviço que mantém estado entre reinicializações. Exige armazenamento persistente (Seção 4) |
| **Stateless** | Serviço que não mantém estado. Pode usar armazenamento efêmero (Seção 4) |
| **Volume nomeado** | Armazenamento persistente gerenciado pelo Docker, independente do ciclo de vida do container (Seção 10) |
