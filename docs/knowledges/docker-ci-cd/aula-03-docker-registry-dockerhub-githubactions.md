---
titulo: "Aula 03: Docker Registry, Docker Hub e Introdução ao CI/CD com GitHub Actions"
modulo: "Docker — Da Containerização ao Deploy em Produção"
duracao_estimada: "120 minutos"
nivel: "intermediario"
tags: [docker, registry, distribuicao, versionamento, semver, docker-hub, github-actions, ci-cd, workflow]
data: 2026-06-18
---

# Curso: Docker — Da Containerização ao Deploy em Produção — Aula 03

## Docker Registry, Docker Hub e Introdução ao CI/CD com GitHub Actions

**Duração estimada:** 120 minutos (60 de leitura + 60 de prática)
**Nível:** Intermediário
**Pré-requisitos:** Docker Engine funcional e Dockerfile multi-stage (Aula 01), orquestração funcional com API + PostgreSQL + healthcheck + volumes + profiles (Aula 02), Git instalado e configurado com conta no GitHub, domínio de `git push`/`git pull`/`git tag`

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

- [ ] **Explicar** por que distribuir imagens de container manualmente (zip, git rebuild, README) é frágil e não escala
- [ ] **Definir** versionamento semântico (SemVer) como convenção MAJOR.MINOR.PATCH e aplicá-lo a imagens de container
- [ ] **Descrever** o papel de um registry como catálogo universal de artefatos imutáveis, traçando paralelos com npm, pip e Maven
- [ ] **Explicar** o mecanismo de transferência delta em push/pull de imagens e por que camadas reutilizadas não são retransferidas
- [ ] **Distinguir** `:latest` de tags versionadas com digest, e explicar por que `:latest` em produção equivale a deploy sem lockfile
- [ ] **Criar** um registry local com `registry:2` na orquestração da Aula 02 e executar o fluxo completo push/pull
- [ ] **Criar** conta no Docker Hub, autenticar com `docker login` e publicar imagem em registry cloud real
- [ ] **Interpretar** a nomenclatura canônica `registry/namespace/repo:tag` e decompor cada componente
- [ ] **Explicar** o que é CI/CD, por que automatizar o pipeline build→push e como GitHub Actions resolve esse problema
- [ ] **Criar** um workflow GitHub Actions que faz build da imagem, login no Docker Hub via secrets e push automático a cada `git push`

---

## Como Usar Esta Aula

Esta aula está organizada em **duas partes** com uma transição explícita entre elas.

A **primeira parte** (FUNDAMENTOS) cobre os mecanismos universais de distribuição e versionamento — distribuição de artefatos, versionamento semântico, registries como catálogo, transferência delta com imutabilidade e caching local. Estes conceitos são apresentados de forma genérica: valem para qualquer ecossistema de software, qualquer linguagem, qualquer ferramenta de distribuição.

A **segunda parte** (APLICAÇÃO) conecta cada mecanismo à prática. Você primeiro reconhece o problema (como compartilhar a stack da Aula 02 com o time?), depois faz (sobe um registry local, tageia com SemVer, faz push e pull), depois escala para a nuvem (Docker Hub real), e por fim automatiza o pipeline com GitHub Actions.

Ao longo do caminho, você encontrará seções **"Mão na Massa"** com passos práticos para executar no seu terminal, e **"Quick Check"** ao final de cada seção para verificar se você absorveu o conceito. Ao final, o arquivo separado **Questões de Aprendizagem** traz as tarefas de checkpoint — só avance para a próxima aula quando conseguir completá-las por conta própria.

**Tempo estimado:** 60 minutos de leitura + 60 minutos de prática.

---

## Mapa Mental

Este diagrama mostra todos os conceitos que você vai dominar nesta aula:


![Mapa mental: Docker Registry, Docker Hub e GitHub Actions](images/diagrama-01-mindmap.png)

---

## Recapitulação das Aulas 01 e 02

| Aula | Conceito | Onde aparece nesta aula | Como se conecta |
|---|---|---|---|
| Aula 01 | **Dockerfile multi-stage** (Seção 10) | Seções 7-9 — imagem que será tagueada e publicada | O build da sua API com multi-stage gera a imagem que você vai versionar com SemVer e distribuir via registry |
| Aula 01 | **Camadas de imagem e CoW** (Seção 2) | Seção 4 — delta transfer com hash de conteúdo | Cada camada é endereçada por hash — camadas não alteradas geram "Layer already exists" no push/pull |
| Aula 01 | **Docker Hub** (Seção 7) | Seção 8 — aprofundamento: criação de conta, push real, namespaces | Você conheceu Docker Hub como "lugar de baixar imagens"; agora vai criar conta e publicar sua própria imagem |
| Aula 01 | **Digest SHA-256** (Seção 7) | Seção 9 — digest como identidade absoluta vs tag mutável | Na Aula 01, digest apareceu no output do `hello-world`; agora você vai usá-lo como alternativa segura a `:latest` |
| Aula 02 | **docker-compose.yml** (Seções 6-11) | Seções 7 e 8 — adicionar serviço `registry:2` ao Compose existente | O Compose que você construiu ganha um novo serviço, integrado à mesma rede bridge |
| Aula 02 | **Rede bridge e DNS interno** (Seção 2) | Seção 7 — registry acessível por `localhost:5000` | O registry é adicionado à stack com port mapping — o mesmo mecanismo que você usou para expor a API na porta 3000 |
| Aula 02 | **Volumes nomeados** (Seção 10) | Seção 7 — volume para dados do registry | O registry armazena imagens em disco; sem um volume nomeado, as imagens são perdidas ao reiniciar o container |
| Aula 02 | **Health check** (Seção 3) | FAQ — manutenção do registry | Mesmo princípio de verificação explícita, agora aplicado à operação do registry |

---

**FUNDAMENTOS: Mecanismos Universais de Distribuição e Versionamento**

> *"Os conceitos desta seção são universais — valem para qualquer ecossistema de software, qualquer linguagem, qualquer ferramenta de distribuição. Na segunda parte, você verá como um registry de containers implementa cada um deles e como um pipeline de CI/CD automatiza o fluxo. Mas aqui, o foco está no 'por que' e 'como funciona', ancorado em ferramentas que você já domina: git, npm, pip."*

---

## 1. O Problema da Distribuição de Artefatos — "Funciona na Minha Máquina" Multiplicado

Você já resolveu o problema "funciona na minha máquina" com containers. Sua aplicação roda idêntica em qualquer lugar. Mas agora surge um novo problema: **como distribuir a imagem para o time, para o CI/CD, para a produção?**

Código-fonte é texto — leve, versionável, distribuível via git. Mas uma imagem de container é um ambiente de execução completo: runtime, dependências, configurações, sistema de arquivos. É um artefato binário pesado que não cabe em repositórios de código.

### As Soluções Improvisadas (e Por Que São Frágeis)

Quando um colega de time precisa da sua imagem, as opções improvisadas são:

- **Zipar a imagem**: salvar em .tar → arquivo .tar → enviar por e-mail/Dropbox. Frágil: o arquivo é grande (~200 MB), ninguém sabe qual versão está usando, e não há histórico.
- **Subir a receita no git e reconstruir**: o colega clona, reconstrói a imagem e torce para o build ser idêntico. Frágil: depende do ambiente da máquina do colega, do cache do apt, da versão do Node.js no repositório.
- **Seguir um README**: o colega instala Node.js, npm, clona, roda `npm ci`, build, orquestração. Frágil: dezenas de passos manuais, cada um sujeito a erro.

Todas essas soluções compartilham o mesmo problema: **não há um ponto central de referência para o artefato**. Cada máquina precisa de sua própria cópia, sua própria build, sua própria configuração.

### A Solução Universal: O Registry

A resposta universal para esse problema é um **registry**: um serviço especializado em armazenar e distribuir artefatos versionados. Você publica o artefato uma vez (push), e qualquer pessoa ou máquina autorizada pode baixá-lo (pull) — sempre a versão exata que você publicou.

![Diagrama: Distribuição sem registry vs com registry](images/diagrama-02-diagram.png)

### O Que Você Já Conhece

Você já usa registries todo dia sem pensar:

- `git push` envia commits para um registry de código-fonte (GitHub, GitLab)
- `npm publish` envia pacotes para um registry de pacotes (npmjs.com)
- `pip install` baixa pacotes do PyPI — o registry de Python

A diferença: git distribui código-fonte (texto), npm distribui pacotes (código compilado + metadados), e um registry de containers distribui **ambientes completos** (runtime + dependências + código + configuração).

> *"Distribuir uma imagem de container sem registry é como distribuir um filme em Blu-ray pelo correio quando o time inteiro está na mesma sala. O registry é o Youtube — você publica uma vez, qualquer um assiste de qualquer lugar, sempre a versão exata que você publicou."*

### Quick Check 1

**1. Por que distribuir uma imagem de container via git (subir a receita e reconstruir) não resolve o problema de reprodutibilidade?**
**Resposta:** Porque cada máquina que reconstrói a imagem depende do seu próprio ambiente — versão do Node.js no repositório, cache do apt, timestamp do build. Não há garantia de que o artefato reconstruído seja byte a byte idêntico ao original. O registry elimina a reconstrução: você baixa o artefato pronto.

**2. Qual o paralelo entre `npm publish`/`npm install` e o fluxo de distribuição de imagens de container?**
**Resposta:** `npm publish` publica um pacote no registry npm, e `npm install` baixa a versão exata de qualquer máquina. Em um registry de containers, `push` publica a imagem no registry, e `pull` baixa a versão exata. A arquitetura é a mesma — só muda o que está sendo distribuído (código JavaScript vs ambiente completo).

---

## 2. Versionamento Semântico (SemVer) — A Linguagem Universal das Versões

Um artefato no registry precisa de um **nome de versão** que comunique o que mudou. Sem uma convenção, cada pessoa inventa seu próprio esquema: `v1`, `final`, `final-mesmo`, `agora-vai`. Isso não escala.

### MAJOR.MINOR.PATCH

**SemVer** (Semantic Versioning) é a convenção adotada pela indústria. Uma versão tem três números:

- **MAJOR** (1.0.0 → 2.0.0): "ATENÇÃO — algo mudou e pode quebrar seu código." O time precisa adaptar algo. Não atualize sem testar.
- **MINOR** (1.0.0 → 1.1.0): "Funcionalidade nova, mas tudo que você usava antes continua funcionando." Atualização segura.
- **PATCH** (1.0.0 → 1.0.1): "Correção de bug urgente." Atualização segura e recomendada.

![Diagrama: Árvore de versões SemVer](images/diagrama-03-diagram.png)

### O Que Você Já Conhece

Você já convive com SemVer todos os dias:

- `node --version` → `v22.11.0` (MAJOR 22, MINOR 11, PATCH 0)
- `"express": "^4.18.2"` no `package.json` (MAJOR 4, MINOR 18, PATCH 2)
- `git tag v1.0.0` — você versiona releases do seu projeto

Agora você vai aplicar a mesma convenção a **imagens de container**. `app:1.0.0` comunica exatamente o que mudou — não é um label arbitrário.

### MAJOR Comunica Risco

Um erro comum é tratar MAJOR como "versão nova e legal". Não é. MAJOR é um **sinal de alerta** para o time: "algo que você usava mudou ou foi removido — você PRECISA adaptar seu código."

- `app:1.0.0` → `app:2.0.0`: a rota `/api/users` mudou de formato de resposta
- `app:2.0.0` → `app:2.1.0`: nova rota `/api/health`, sem quebrar nada existente
- `app:2.1.0` → `app:2.1.1`: correção de bug no cálculo de timeout

> *"`:latest` está para deploy como `package.json` sem `package-lock.json` está para `npm install`. Você não sabe exatamente o que está rodando. Uma tag SemVer `:1.2.3` é o hash do commit — inequívoca, reproduzível, auditável."*

### Quick Check 2

**1. O que significa incrementar o número MAJOR de uma versão SemVer?**
**Resposta:** Significa que houve uma mudança que quebra compatibilidade com versões anteriores. O time PRECISA adaptar algo — não é uma atualização segura. É um sinal de alerta para revisar o código antes de atualizar.

**2. Se você tem `app:1.3.0` e descobre um bug crítico que não quebra API, qual deve ser a próxima versão?**
**Resposta:** `app:1.3.1` — PATCH, porque é uma correção de bug compatível com a versão anterior. Não muda a interface pública, não adiciona funcionalidade, apenas corrige.

---

## 3. Registries — O Catálogo Universal de Artefatos

Um registry é um **serviço especializado** em armazenar, versionar e distribuir artefatos. Ele expõe três operações fundamentais:

- **Push**: publicar um artefato no catálogo
- **Pull**: baixar um artefato do catálogo
- **Search**: descobrir artefatos disponíveis

### O Ecossistema de Registries

Todo ecossistema de software maduro tem um registry:

| Registry | Ecossistema | O que armazena | Comando de push | Comando de pull |
|---|---|---|---|---|
| npmjs.com | JavaScript | Pacotes npm (código + metadados) | `npm publish` | `npm install` |
| PyPI | Python | Pacotes pip (código Python) | `twine upload` | `pip install` |
| Maven Central | Java | Bibliotecas JAR | `mvn deploy` | `mvn install` |
| registry público de containers | Containers | Imagens de container (sistema de arquivos completo) | `docker push` | `docker pull` |

Apesar de domínios diferentes, a **arquitetura é a mesma**: armazenamento de blobs imutáveis, indexação por nome+versão, autenticação e caching.

![Diagrama: Ecossistema de registries](images/diagrama-04-diagram.png)

### Registries Públicos vs Privados

- **Registries públicos**: qualquer um pode fazer pull (e algumas vezes push, com autenticação). Exemplos: npmjs.com (público por padrão), PyPI (sempre público), registry público de containers (repositórios públicos grátis).
- **Registries privados**: exigem autenticação para pull e push. Usados internamente por empresas para distribuir artefatos proprietários.

Para uso interno (times, empresas), existem soluções self-hosted em cada ecossistema. O padrão arquitetural é o mesmo — só muda o que está armazenado.

> *"Um registry é o 'middleware' entre quem produz e quem consome artefatos. Sem ele, cada máquina precisaria construir o artefato do zero. Com ele, o artefato é construído uma vez e distribuído para todos."*

### Quick Check 3

**1. Quais são as três operações fundamentais de um registry?**
**Resposta:** Push (publicar um artefato), Pull (baixar um artefato) e Search (descobrir artefatos disponíveis). Todo registry de qualquer ecossistema implementa essas três operações.

**2. Qual a diferença entre um registry público e um privado?**
**Resposta:** Em um registry público, qualquer um pode baixar artefatos (pull) sem autenticação. Em um registry privado, o acesso exige autenticação — apenas usuários ou sistemas autorizados podem fazer pull ou push.

---

## 4. Transferência Delta e Artefatos Imutáveis

Artefatos em um registry são **imutáveis** — uma vez publicados com uma tag e versão, seu conteúdo não pode ser alterado. A tag pode se mover (você pode sobrescrever `:latest`), mas o conteúdo associado à versão `:1.0.0` é fixo. Isso garante reprodutibilidade: `app:1.0.0` sempre entrega exatamente os mesmos bytes.

### Hash de Conteúdo: A Identidade Digital

Cada camada de uma imagem é endereçada pelo seu **hash SHA-256** — um identificador único derivado do conteúdo. Se duas camadas têm o mesmo hash, elas são byte a byte idênticas. Se o conteúdo muda, o hash muda.

Isso significa que camadas idênticas **nunca são duplicadas**:

- 10 imagens diferentes que usam `node:22-alpine` como base compartilham a mesma camada Alpine em disco
- A segunda vez que você faz push de uma imagem com as mesmas camadas base, o registry responde "Layer already exists"
- O push envia apenas as camadas que o registry ainda não possui

### Transferência Delta na Prática

Quando você publica uma nova versão da sua imagem (`app:1.0.1`), apenas as camadas que mudaram em relação a `app:1.0.0` são transferidas. As camadas base (Alpine, Node.js, dependências) já estão no registry — zero bytes enviados.

![Diagrama: Delta transfer — v1 com 4 camadas → v2 com 1 camada alterada](images/diagrama-05-diagram.png)

### A Analogia do Git

Git armazena objetos por hash SHA-1. Dois arquivos idênticos geram o mesmo blob, e o git só transfere o que mudou entre `push` e `pull`. O modelo de camadas de imagem endereçadas por hash é o mesmo princípio, aplicado a sistemas de arquivos completos.

O cache local do npm (`~/.npm`) também segue a mesma lógica: pacotes já baixados não são retransferidos.

> *"Publicar uma nova versão da imagem sem delta transfer é como enviar o filme inteiro por e-mail cada vez que você edita 1 minuto. Com delta, você envia só a cena editada — o resto o destinatário já tem no cache."*

### Conexão com a Aula 01 — Cache de Camadas no Build

A ordem da receita que você aprendeu na Aula 01 (`COPY package*.json ./` antes de `COPY . .`) não é só para acelerar o build — ela também reduz o delta no push. Se `package.json` não mudou, a camada de `npm ci` é reutilizada tanto no cache de build quanto no cache do registry. Otimizar a receita = otimizar o push.

### Quick Check 4

**1. Por que o segundo push de uma imagem é mais rápido que o primeiro?**
**Resposta:** Porque no segundo push, as camadas que já existem no registry geram a resposta "Layer already exists" — apenas as camadas efetivamente alteradas são transferidas. As camadas base (Alpine, Node.js, node_modules) são reutilizadas.

**2. O que garante que duas camadas com o mesmo hash SHA-256 são idênticas?**
**Resposta:** O hash SHA-256 é derivado matematicamente do conteúdo da camada. Se o conteúdo for byte a byte idêntico, o hash é idêntico. Se qualquer bit mudar, o hash muda completamente. É uma garantia criptográfica de integridade e identidade.

---

## 5. Caching de Distribuição — Por Que o Segundo Pull é Instantâneo

Todo registry possui uma camada de **cache local** no cliente. Quando você faz pull de um artefato, cada bloco (camada) é armazenado no disco local. No próximo pull — da mesma imagem ou de outra que compartilhe camadas — o cliente verifica o hash e usa o cache em vez de baixar novamente.

### Cache Local: Transparente e Universal

- `npm install` é lento na primeira vez (baixa tudo para `~/.npm`) e rápido nas seguintes
- `apt install` baixa pacotes para `/var/cache/apt/archives` e reusa em reinstalações
- `docker pull` baixa camadas para o cache local — o cache nativo do mecanismo de containers

O cache é **transparente**: você não precisa ativar nada. O cliente (mecanismo de containers, npm, apt) gerencia o cache automaticamente, verificando o hash de cada bloco antes de baixar.

![Diagrama: Cache local — primeiro pull vs segundo pull](images/diagrama-06-diagram.png)

### Implicação Prática para CI/CD

Em pipelines de CI/CD automatizados, o cache de camadas de imagem é o que separa um build de 10 minutos de um de 30 segundos. Se o pipeline tem cache disponível (ou usa estratégias de reutilização de camadas de um build anterior), as camadas base são carregadas do cache, não baixadas da internet. Este princípio — evitar transferir o que já foi transferido antes — é a base de toda otimização de pipeline de containers.

> *"Caching de distribuição é o motivo pelo qual o segundo pull é instantâneo. Ele não baixou mais rápido — ele simplesmente não baixou nada. O cache local já tinha tudo."*

### Quick Check 5

**1. Por que o segundo `pull` da mesma imagem é instantâneo?**
**Resposta:** Porque as camadas da imagem já estão em cache local. O mecanismo de containers verifica o hash de cada camada no cache antes de fazer o download — como os hashes coincidem, zero bytes são transferidos.

**2. Como o cache de camadas acelera pipelines de CI/CD?**
**Resposta:** Se o runner de CI/CD mantém cache local entre execuções, as camadas base não precisam ser baixadas a cada execução do pipeline. Apenas as camadas alteradas (código fonte, dependências novas) são baixadas, reduzindo o tempo de execução de minutos para segundos.

---

**APLICAÇÃO: Do Registry Local ao Pipeline Automatizado**

> *"Agora que você entende os mecanismos universais — distribuição de artefatos, versionamento semântico, registries como catálogo, transferência delta com imutabilidade e caching local — vamos conectá-los à prática. Você vai subir um registry local, depois escalar para o Docker Hub na nuvem, e por fim automatizar todo o pipeline com GitHub Actions. A mesma mecânica de push/pull, agora turbinada por automação."*

---

## 6. O Problema — Como o Colega Usa a Stack da Aula 02?

Sua stack da Aula 02 está funcionando. A API Express com PostgreSQL roda perfeitamente no seu computador. Agora um colega de time precisa rodar **exatamente a mesma stack** na máquina dele. Como você entrega?

### As Opções Frágeis (Recordação da Seção 1)

Como vimos na Seção 1, distribuir uma imagem sem registry leva a três abordagens frágeis: **zipar** (arquivo grande, sem rastreabilidade), **reconstruir do git** (depende do ambiente de cada máquina) e **seguir um README** (dezenas de passos manuais sujeitos a erro). Nenhuma delas garante que o colega receba o artefato byte a byte idêntico ao que você construiu.

![Diagrama: Como o colega usa a stack — com Registry](images/diagrama-10-diagram.png)

### A Solução

E se você pudesse publicar a imagem pronta — com tudo instalado, configurado e testado — em um servidor central? E se o colega pudesse baixar essa imagem exata com um **único comando**, sem builds, sem `npm install`, sem surpresas?

Isso é **Docker Registry**.

### Conexão com a Seção 1 (FUNDAMENTOS)

Este é exatamente o problema universal de distribuição de artefatos que você estudou na Seção 1. A falta de um registry transforma compartilhar um ambiente em dezenas de passos manuais. O registry resolve: push uma vez, pull em qualquer lugar.

### Quick Check 6

**1. Quais são os três problemas das abordagens "zip", "git rebuild" e "README" para compartilhar a stack da Aula 02?**
**Resposta:** (1) Falta de rastreabilidade — não há versão clara do artefato. (2) Dependência do ambiente de cada máquina — o build pode produzir resultados diferentes. (3) Fragilidade — dezenas de passos manuais sujeitos a erro, sem garantia de reprodutibilidade.

**2. Como um registry resolve o problema de compartilhar uma stack com o time?**
**Resposta:** Com registry, você publica a imagem pronta (push) uma única vez. Qualquer pessoa ou máquina autorizada baixa a versão exata com um único comando (pull). Sem rebuild, sem `npm install`, sem surpresas.

---

## 7. A Experiência — Push/Pull Real com Registry Local

Chegou a hora de colocar a mão na massa. Você vai executar o fluxo completo de distribuição: subir um registry local, versionar sua imagem com SemVer, publicar (push), simular outra máquina (rmi + pull) e rodar a imagem baixada.

### Pré-requisitos

- A stack da Aula 02 funcionando: `docker-compose.yml` com API + PostgreSQL
- Dockerfile multi-stage da Aula 01 no diretório do projeto
- Porta 5000 livre no seu computador

### Ato 1 — Subir o Registry

Adicione o serviço `registry:2` ao seu `docker-compose.yml`:

```yaml
services:
  # ... seus serviços existentes (api-dev, api-prod, db) ...
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry

volumes:
  pgdata:           # Já existe da Aula 02 — NÃO remova
  registry-data:    # NOVO — adicione esta linha
```

Agora suba apenas o registry:

```bash
docker compose up -d registry
```

**Verificação:**

```bash
docker compose ps
```

**Output esperado:** o serviço `registry` aparece como `Up`. Você pode verificar que o registry está respondendo:

```bash
curl http://localhost:5000/v2/
```

**Output esperado:** `{}` — resposta vazia, mas o registry está vivo.

### Ato 2 — Versionar e Publicar

Construa a imagem da API com uma tag SemVer:

```bash
docker build -t app:1.0.0 .
```

Tagueie a imagem para o registry local:

```bash
docker tag app:1.0.0 localhost:5000/app:1.0.0
```

Publique (push) a imagem para o registry:

```bash
docker push localhost:5000/app:1.0.0
```

**Nota:** os hashes abaixo são ilustrativos e truncados. No seu terminal, você verá hashes SHA-256 completos de 64 caracteres.

**Output esperado:**

```
The push refers to repository [localhost:5000/app]
5f4a8e2d9c3b: Pushed
3a7b1c8d9e2f: Pushed
9d2e4f8a1b3c: Pushed
c1ec31eb5944: Layer already exists
1.0.0: digest: sha256:a1b2c3d4e5f6... size: 1784
```

Observe: as camadas base (Alpine, Node.js) que você já tinha em cache local mostram **"Layer already exists"** — o registry já as tem. Apenas as camadas novas (código, dependências específicas) foram efetivamente enviadas. Isso é a **transferência delta** da Seção 4 em ação.

### Ato 3 — Simular "Outra Máquina"

Remova a imagem local para simular que você está em uma máquina diferente:

```bash
docker rmi localhost:5000/app:1.0.0 app:1.0.0
```

Agora faça pull da imagem do registry:

```bash
docker pull localhost:5000/app:1.0.0
```

**Output esperado:**

```
1.0.0: Pulling from app
5f4a8e2d9c3b: Already exists
3a7b1c8d9e2f: Already exists
9d2e4f8a1b3c: Already exists
c1ec31eb5944: Already exists
digest: sha256:a1b2c3d4e5f6... size: 1784
```


> **Nota:** O cache local do Docker Engine ainda retém as camadas em disco mesmo após `docker rmi` — por isso o pull mostra "Already exists". Em uma máquina sem cache, as camadas seriam efetivamente baixadas.
Execute a stack completa:

```bash
docker compose up -d
curl http://localhost:3000
```

**Output esperado:** `{"message":"API com PostgreSQL funcionando!","dbTime":"2026-06-15T..."}` — a aplicação roda idêntica, baixada do registry.

![Diagrama: Sequência build → tag → push → rmi → pull → run](images/diagrama-07-diagram.png)

### O Paralelo Triplo

> *"`docker push` está para imagens como `git push` está para código. `docker pull` é o `npm ci` de ambiente completo — reconstrói tudo, não só as dependências. E `docker tag` é o `git tag` — você nomeia uma versão específica para referência futura."*

### Reconhecimento da Limitação

Você acabou de simular "outra máquina" removendo a imagem local e puxando do registry. Em um cenário real, o registry estaria em um servidor acessível pela rede (não `localhost`), e o colega de time faria `docker pull registry.da-empresa.com/app:1.0.0` da máquina dele. Mas o **fluxo é idêntico** — push em uma ponta, pull na outra.

### Troubleshooting

- `curl: (7) Failed to connect to localhost port 5000: Connection refused` — o registry não está rodando. Execute `docker compose up -d registry` e verifique com `docker compose ps`.
- `manifest unknown: manifest unknown` — a tag que você tentou puxar não existe no registry. Verifique o nome: foi `localhost:5000/app:1.0.0`? Você esqueceu de fazer push?
- `Error response from daemon: pull access denied for localhost:5000/app` — o registry pode estar configurado como HTTP (sem TLS). Adicione `"insecure-registries": ["localhost:5000"]` no `/etc/docker/daemon.json` e reinicie o daemon.
- `denied: requested access to the resource is denied` — o registry pode estar configurado com autenticação. Veja as perguntas sobre htpasswd no FAQ.

### Quick Check 7

**1. Qual a função do comando `docker tag app:1.0.0 localhost:5000/app:1.0.0`?**
**Resposta:** Criar uma nova referência (tag) para a imagem `app:1.0.0` apontando para o registry em `localhost:5000`. O `docker tag` não altera a imagem — apenas adiciona um alias que informa ao Docker onde publicar a imagem no próximo `docker push`.

**2. O que significa "Layer already exists" no output do `docker push`?**
**Resposta:** Significa que a camada já está armazenada no registry (o hash SHA-256 daquela camada já existe no servidor). O Docker não precisa reenviá-la — é a transferência delta em ação, evitando tráfego desnecessário.

---

## 8. Docker Hub — Do Localhost para a Nuvem Real

Você fez push e pull no registry local (`localhost:5000`). Agora vai dar o próximo passo: publicar sua imagem em um **registry cloud real** — o Docker Hub. Enquanto o registry local só existe na sua máquina, o Docker Hub está disponível para qualquer pessoa no mundo.

### 8.1 Criação de Conta no Docker Hub

Antes de publicar, você precisa de uma conta no Docker Hub:

1. Acesse [hub.docker.com](https://hub.docker.com) e clique em **Sign Up** (ou **Sign In** se já tiver conta)
2. Preencha: **Username** (seu namespace pessoal — anote!), **Email**, **Password**
3. Verifique seu e-mail (clique no link que o Docker Hub envia)
4. Faça login no hub.docker.com

**Seu namespace pessoal** é o username que você escolheu — é ele que vai aparecer no lugar de `localhost:5000` nos comandos de push. Exemplo: se seu username é `maria`, o namespace é `maria`.

### 8.2 Autenticação com Token (Nunca Use Senha!)

O Docker Hub recomenda autenticação via **token de acesso**, não senha. O token é uma senha de uso específico que você pode revogar independentemente da sua conta.

**Passo 1 — Criar um token no Docker Hub:**

- Acesse hub.docker.com → Account Settings (ícone do perfil, canto superior direito)
- Vá em **Security** → **New Access Token**
- Dê um nome ao token (ex: `github-actions-token` ou `dev-machine`)
- Selecione a permissão **Read & Write** (para poder fazer push)
- Clique em **Generate** e **copie o token** — ele só aparece uma vez!

**Passo 2 — Autenticar no terminal:**

```bash
docker login -u SEU_USERNAME
```

Quando o terminal pedir a senha, **cole o token** (não a senha da sua conta).

**Output esperado:**

```
Login Succeeded
```

O Docker salva as credenciais em `~/.docker/config.json` — você não precisa repetir o login a menos que faça `docker logout`.

### 8.3 Primeiro Push para o Docker Hub

Agora que você está autenticado, publique sua imagem no Docker Hub:

```bash
# Tagueie a imagem com seu namespace pessoal
docker tag app:1.0.0 SEU_USERNAME/app:1.0.0

# Publique no Docker Hub
docker push SEU_USERNAME/app:1.0.0
```

**Output esperado:**

```
The push refers to repository [docker.io/SEU_USERNAME/app]
5f4a8e2d9c3b: Pushed
3a7b1c8d9e2f: Pushed
9d2e4f8a1b3c: Pushed
c1ec31eb5944: Pushed
1.0.0: digest: sha256:a1b2c3d4e5f6... size: 1784
```

**Verificação no navegador:**

Acesse `https://hub.docker.com/r/SEU_USERNAME/app`. Você verá seu repositório com a tag `1.0.0` publicada. Sua imagem está disponível para qualquer pessoa do mundo fazer `docker pull SEU_USERNAME/app:1.0.0`.

### 8.4 Namespaces, Repositórios Públicos vs Privados

O Docker Hub organiza imagens em **namespaces** (também chamados de repositórios de alto nível):

| Tipo | Exemplo | Quem pode fazer pull | Quem pode fazer push |
|---|---|---|---|
| **Official Images** | `library/node`, `library/nginx` | Todos (público) | Apenas Docker Inc. + mantenedores |
| **Verified Publishers** | `bitnami/postgresql`, `microsoft/mssql` | Todos (público) | Apenas a organização verificada |
| **Usuário (público)** | `SEU_USERNAME/app` | Todos (público) | Apenas você ou membros da org |
| **Usuário (privado)** | `SEU_USERNAME/app` | Apenas você (1 repo grátis) | Apenas você |

No plano gratuito do Docker Hub, você tem:
- **Repositórios públicos**: ilimitados — qualquer um pode baixar sua imagem
- **Repositórios privados**: 1 grátis — você controla quem pode baixar

### Nomenclatura Canônica — Revisitada

A nomenclatura que você viu na Seção 3 agora faz sentido completo:

```
docker.io/SEU_USERNAME/app:1.0.0
  ↑         ↑        ↑     ↑
registry  namespace  repo  tag
```

O fluxo `build → tag → push → pull → run` é **idêntico** para Docker Hub, registry local, GitHub Container Registry, Amazon ECR — só muda o hostname (registry).

```bash
# Registry local
docker push localhost:5000/app:1.0.0

# Docker Hub
docker push SEU_USERNAME/app:1.0.0

# GitHub Container Registry
docker push ghcr.io/SEU_USERNAME/app:1.0.0
```

**Mão na Massa — Verifique no Navegador:**

- [ ] Acesse `https://hub.docker.com/r/SEU_USERNAME/app`
- [ ] Confirme que a tag `1.0.0` aparece na lista de tags
- [ ] Explore a aba "Settings" — repare que você pode mudar o repositório de público para privado

### Conexão com a Seção 1 (FUNDAMENTOS)

O Docker Hub é a implementação concreta do conceito de **registry universal** que você estudou na Seção 1. Ele faz push, pull e search — as três operações fundamentais — só que em escala global.

### Quick Check 8

**1. Qual a diferença entre usar senha e usar token no `docker login`?**
**Resposta:** O token é uma credencial de uso específico que você pode revogar independentemente da sua conta. Se o token vazar, você revoga só ele — não precisa trocar a senha da sua conta. O Docker Hub recomenda tokens para autenticação programática (CLI, CI/CD).

**2. No plano gratuito do Docker Hub, quantos repositórios privados você pode ter?**
**Resposta:** 1 repositório privado grátis. Repositórios públicos são ilimitados. Para mais repositórios privados, é necessário um plano pago.

---

## 9. Versionamento de Imagens — SemVer, :latest e Digest

Na Seção 7, você usou `app:1.0.0` — uma tag SemVer. Mas o que acontece quando você publicar a versão `1.0.1`? E o que significa `:latest`? E como ter certeza **absoluta** de que a imagem baixada é idêntica à publicada?

### Tags SemVer para Imagens

Assim como você usa SemVer no `package.json` para versionar pacotes npm, você usa SemVer nas tags de imagem para versionar ambientes completos:

- **`app:1.0.0`** — versão exata. Imutável (na prática, tags podem ser sobrescritas — mas não devem). Usada em produção.
- **`app:1.0`** — "a versão 1.0.x mais recente". Útil para "quero patches de segurança, mas não breaking changes".
- **`app:1`** — "a versão 1.x.x mais recente". Flexível, mas arriscado.
- **`app:latest`** — "a versão mais recente publicada, seja qual for". Útil em desenvolvimento, mas **nunca em produção**.
- **`app:staging`** — tag de ambiente que se move conforme novas versões são promovidas para staging.
- **`app:production`** — tag de ambiente, promovida apenas após validação.

### :latest — O Perigo Silencioso

`app:latest` não comunica **nada** sobre o conteúdo. É um ponteiro mutável — ontem apontava para `app:1.0.0`, hoje aponta para `app:2.0.0`, e você não sabe qual versão está rodando.

> *"`:latest` é como fazer deploy sem `package-lock.json`. Você não sabe exatamente o que está rodando. O build que passou nos testes pode não ser o mesmo que está em produção — se alguém publicou uma nova versão enquanto você dormia, `:latest` mudou silenciosamente."*

### Digest — A Identidade Absoluta

Toda imagem tem um **digest** SHA-256 (`sha256:abc123...`). Diferente da tag (que é um label mutável), o digest é **derivado do conteúdo** — imutável por definição.

```bash
# Pull por digest (garantia byte a byte)
docker pull localhost:5000/app@sha256:a1b2c3d4e5f6...
```

**Tags são para humanos** — comunicam o que mudou (MAJOR.MINOR.PATCH).
**Digests são para máquinas** — garantem a imagem exata em CI/CD, Kubernetes, scripts de deploy.

### Quando Usar Cada Tipo de Tag

| Tag | Uso | Risco | Exemplo |
|---|---|---|---|
| `:latest` | Desenvolvimento local | Alto — não sabe qual versão | `app:latest` |
| `:1.0` | Staging (patches automáticos) | Médio — pode incluir mudanças não testadas | `app:1.0` |
| `:1.0.1` | Produção | Baixo — versão exata e auditável | `app:1.0.1` |
| `:staging` | Ambiente de staging | Médio — promovido manualmente | `app:staging` |
| `:production` | Ambiente de produção | Baixo — promovido após testes | `app:production` |
| `@sha256:...` | Kubernetes / CI/CD | Zero — garantia criptográfica | `app@sha256:a1b2...` |

**Mão na Massa — Trabalhando com Digest:**

- [ ] Veja o digest de cada imagem local:

```bash
docker images --digests
```

- [ ] Extraia o digest da sua imagem publicada:

```bash
sudo apt install -y jq
docker inspect localhost:5000/app:1.0.0 | jq '.[0].RepoDigests'
```

**Output esperado:** algo como `["localhost:5000/app@sha256:a1b2c3d4e5f6..."]`

- [ ] Faça pull pelo digest:

```bash
docker pull localhost:5000/app@sha256:a1b2c3d4e5f6...
```

- [ ] Crie e publique a tag `:latest`:

```bash
docker tag app:1.0.0 localhost:5000/app:latest
docker push localhost:5000/app:latest
```

- [ ] Reflita: se alguém publicar `app:1.0.1` e sobrescrever `:latest`, qual versão está rodando em produção?

### Conexão com a Seção 2 (FUNDAMENTOS — SemVer)

SemVer + Digest = comunicação completa. A tag diz "o que mudou" (MAJOR.MINOR.PATCH). O digest garante "é exatamente esta versão". Juntos, eliminam toda ambiguidade na distribuição de imagens.

### Quick Check 9

**1. Por que `:latest` não é seguro para produção?**
**Resposta:** Porque `:latest` é um ponteiro mutável — pode mudar silenciosamente sem que ninguém perceba. O build que passou nos testes hoje pode ser diferente do que está em produção amanhã se alguém publicar uma nova versão com a tag `:latest`. É como fazer deploy sem `package-lock.json`.

**2. Qual a diferença entre uma tag (`:1.0.0`) e um digest (`@sha256:abc...`)?**
**Resposta:** A tag é um label mutável que pode ser sobrescrito para apontar para uma versão diferente. O digest é um identificador imutável derivado criptograficamente do conteúdo — garante byte a byte que a imagem baixada é exatamente a mesma que foi publicada. Tags são para humanos; digests são para máquinas.

---

## 10. Introdução ao CI/CD com GitHub Actions

Você já sabe fazer o pipeline manual: `docker build -t app:1.0.0 .` → `docker push SEU_USERNAME/app:1.0.0`. Funciona, mas **você precisa executar manualmente** a cada nova versão. E se você pudesse ensinar um robô a fazer isso automaticamente a cada `git push`?

### 10.1 O que é CI/CD?

**CI/CD** (Continuous Integration / Continuous Delivery) é a prática de automatizar as etapas de build, teste e entrega do software:

- **Continuous Integration (CI)**: a cada `git push`, o código é integrado, testado e buildado automaticamente. Ninguém precisa lembrar de rodar `npm test` antes de commitar — o robô faz.
- **Continuous Delivery (CD)**: após o build passar nos testes, a imagem é publicada no registry automaticamente. O deploy pode ser manual ou automático.

**A analogia que gruda:** GitHub Actions é o cron job do seu pipeline. Você define o que executar, quando executar (gatilhos), e ele executa religiosamente — sem esquecer, sem pular etapas.

![Diagrama: Fluxo manual vs automatizado com CI/CD](images/diagrama-09-diagram.png)

### 10.2 Por que Automatizar?

- **Elimina erro humano**: você nunca mais vai "esquecer de buildar antes do push". O pipeline executa a cada `git push`.
- **Garante consistência**: a imagem no registry é sempre a versão que passou nos testes — não a que você construiu às 3h da manhã sem confirmar.
- **Histórico auditável**: cada execução do pipeline está registrada no GitHub — quem disparou, qual commit, se passou ou falhou.
- **Time não precisa de Docker local**: colegas que só precisam da imagem não precisam instalar Docker, Node.js, npm, clonar — eles só dão `docker pull`.

> *"GitHub Actions é o robô que executa o pipeline build→push que você fazia manualmente no terminal. Só que ele nunca esquece de buildar antes do push, nunca pula o teste 'porque é só uma correção rápida', e sempre deixa um rastro auditável."*

### 10.3 Anatomia de um Workflow YAML

Um **workflow** do GitHub Actions é um arquivo YAML que define um ou mais jobs. Cada workflow é disparado por **eventos** do GitHub (push, pull_request, schedule).

```yaml
name: Build and Push Docker Image   # Nome do workflow (aparece na UI do GitHub)

on:                                 # Eventos que disparam o workflow
  push:
    branches: [ main ]              # Dispara a cada push na branch main
  pull_request:
    branches: [ main ]              # Dispara a cada PR contra a main

jobs:                               # O que executar
  build-and-push:                   # Nome do job
    runs-on: ubuntu-latest          # Ambiente de execução (VM Ubuntu)
    steps:                          # Sequência de ações
      - name: Checkout código
        uses: actions/checkout@v4   # Clona o repositório na VM
        
      - name: Login no Docker Hub
        uses: docker/login-action@v3 # Autentica no Docker Hub
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
          
      - name: Build e Push
        uses: docker/build-push-action@v5 # Build + push em um step só
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/app:latest
```

**Componentes-chave:**

| Componente | O que é | Exemplo |
|---|---|---|
| `name` | Nome do workflow | `Build and Push Docker Image` |
| `on` | Gatilho que dispara o workflow | `push: branches: [main]` |
| `jobs` | Um ou mais jobs a executar | `build-and-push` |
| `runs-on` | Ambiente de execução (VM) | `ubuntu-latest` |
| `steps` | Passos sequenciais do job | `actions/checkout@v4` |
| `uses` | Ação reutilizável do Marketplace | `docker/login-action@v3` |
| `secrets` | Variáveis criptografadas | `${{ secrets.DOCKERHUB_TOKEN }}` |

### O Modelo Mental

> *"Um workflow é um script shell que roda numa VM limpa do GitHub, disparado por eventos do git. Cada `step` é um comando — só que em vez de digitar `docker build` no terminal, você escreve no YAML e o GitHub executa."*

### Quick Check 10

**1. O que significa CI/CD e qual a diferença entre CI e CD?**
**Resposta:** CI (Continuous Integration) integra e testa o código a cada push automaticamente. CD (Continuous Delivery) entrega o artefato (imagem Docker) para o registry após o CI passar. CI é "testa meu código"; CD é "publica minha imagem".

**2. Quais são os três componentes obrigatórios de um workflow GitHub Actions?**
**Resposta:** (1) `on` — o gatilho que dispara o workflow (ex: push na main). (2) `jobs` — os jobs a executar. (3) `steps` — os passos dentro de cada job. O `name` é opcional mas recomendado.

---

## 11. Primeiro Workflow — Build, Login e Push Automático

Chegou a hora de criar seu primeiro workflow GitHub Actions. O objetivo é simples: **a cada `git push`, o GitHub clona o repositório, faz build da imagem Docker, autentica no Docker Hub e publica a imagem**.

### 11.1 Estrutura de Diretórios

O GitHub Actions procura workflows no diretório `.github/workflows/` na raiz do seu repositório. Crie a estrutura:

```bash
mkdir -p .github/workflows
```

### 11.2 O Arquivo YAML Completo

Crie o arquivo `.github/workflows/docker-build-push.yml` com o conteúdo abaixo. Cada seção tem comentários explicando o que faz:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout do código
        uses: actions/checkout@v4
        # Clona o repositório na VM do GitHub
        
      - name: Login no Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
        # Autentica no Docker Hub usando secrets (NUNCA hardcode)
        
      - name: Build e Push da imagem
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/app:latest
        # Build da imagem com cache automático e push para o Docker Hub
```

### 11.3 Explicação de Cada Bloco

- **`actions/checkout@v4`**: clona o repositório na VM do GitHub. Sem este passo, o runner não tem acesso ao seu código.
- **`docker/login-action@v3`**: autentica no Docker Hub usando as credenciais armazenadas em segredos do GitHub. Por que usar action em vez de `docker login` no shell? Porque a action gerencia caching, logging e segurança automaticamente.
- **`docker/build-push-action@v5`**: faz build da imagem e push para o registry em um único passo. Inclui cache automático de camadas (a transferência delta que você estudou na Seção 4). O `push: true` envia a imagem para o Docker Hub.

### 11.4 Configurando Secrets no GitHub

Secrets são variáveis criptografadas que o GitHub Actions injeta no ambiente de execução. **Nunca hardcode credenciais no YAML.**

**Passo a passo:**

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os dois secrets:

| Nome | Valor |
|---|---|
| `DOCKERHUB_USERNAME` | Seu username do Docker Hub |
| `DOCKERHUB_TOKEN` | O token de acesso que você criou na Seção 8 |

**Importante:** use o **token**, não a senha da sua conta. Se o token vazar, você pode revogá-lo no Docker Hub sem precisar trocar a senha.

### 11.5 Testando o Pipeline

Agora é hora de ver o pipeline rodar:

```bash
# Adicione o workflow ao git
git add .github/workflows/docker-build-push.yml
git commit -m "ci: add Docker build-push workflow"
git push
```

**O que acontece depois do `git push`:**

1. O GitHub detecta o push na branch `main`
2. O workflow `Build and Push Docker Image` é disparado
3. O GitHub provisiona uma VM Ubuntu limpa
4. O código é clonado (`actions/checkout@v4`)
5. O login no Docker Hub é executado (`docker/login-action@v3`)
6. A imagem é buildada e enviada para o Docker Hub (`docker/build-push-action@v5`)
7. O status aparece na aba **Actions** do seu repositório

**Verificação:**

- Acesse seu repositório no GitHub → aba **Actions**
- Você deve ver o workflow `Build and Push Docker Image` com status ✅ (verde)
- Clique no workflow para ver os logs de cada step
- Nos logs do step "Build e Push", procure por "Layer already exists" — é a transferência delta da Seção 4 em ação, agora em um pipeline automatizado

### Mão na Massa — Resumo dos Passos

- [ ] Crie o diretório `.github/workflows/`
- [ ] Crie o arquivo `docker-build-push.yml` com o conteúdo acima
- [ ] Configure os secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` no GitHub
- [ ] Faça `git add`, `git commit`, `git push`
- [ ] Acesse a aba Actions e veja o workflow rodar

### Quick Check 11

**1. Por que usar `docker/login-action@v3` em vez de `docker login` diretamente no YAML?**
**Resposta:** A action gerencia autenticação, caching de credenciais e logs automaticamente. Além disso, evita expor a senha no output do workflow. É a forma recomendada e segura de autenticar em workflows.

**2. O que acontece se você esquecer de configurar os secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` antes de rodar o workflow?**
**Resposta:** O workflow vai falhar no step de login com erro de autenticação. As variáveis `${{ secrets.DOCKERHUB_USERNAME }}` e `${{ secrets.DOCKERHUB_TOKEN }}` serão resolvidas como vazias, e o login no Docker Hub será rejeitado.

---

## 12. Vendo o Pipeline Rodar — Badge, Logs e Próximos Passos

Seu primeiro workflow está rodando. Agora você vai aprender a interpretar os logs, adicionar um badge de status ao README e conectar com o que vem a seguir.

### 12.1 Interpretando os Logs do GitHub Actions

Na aba **Actions** do seu repositório, você vê a lista de execuções do workflow. Clique na execução mais recente para ver os detalhes:

- **Status geral**: ✅ verde (sucesso) | ❌ vermelho (falha) | 🟡 amarelo (em execução)
- **Jobs**: clique no job `build-and-push` para ver os steps
- **Steps**: cada step tem seu output expandível
  - `Checkout código` mostra os arquivos clonados
  - `Login no Docker Hub` mostra "Login Succeeded"
  - `Build e Push` mostra o output do build e push, incluindo "Layer already exists"

**O que procurar nos logs:**

- O digest SHA-256 gerado no push — anote para referência futura
- Linhas "Layer already exists" — confirma que o cache de camadas funcionou
- Erros de sintaxe no YAML — o GitHub valida o workflow antes de executar

### 12.2 Badge no README

Um **badge** é uma imagem que mostra o status do pipeline direto no README do seu repositório — verde (passando) ou vermelho (falhando).

Adicione esta linha ao seu `README.md`:

```markdown
![Docker Build](https://github.com/SEU_USERNAME/SEU_REPO/actions/workflows/docker-build-push.yml/badge.svg)
```

Substitua `SEU_USERNAME` e `SEU_REPO` pelo seu usuário e nome do repositório GitHub.

**Resultado:** sempre que alguém abrir seu repositório no GitHub, verá o badge indicando se o último build passou ou falhou. É o equivalente digital de um selo de qualidade no README.

### 12.3 O Que Você Acabou de Construir

- Um **workflow GitHub Actions** que automatiza o pipeline build → push
- **Secrets configurados** para autenticação segura sem expor credenciais
- Um **badge de status** no README que mostra a saúde do pipeline
- A integração entre **Git (push) → CI/CD (build) → Registry (Docker Hub) → Badge (visibilidade)**

Seu repositório agora tem um pipeline funcional: a cada `git push` na `main`, o GitHub Actions faz build da imagem, autentica no Docker Hub e publica a nova versão automaticamente.

> *"Você começou esta aula fazendo push manual para `localhost:5000`. Agora tem um robô que faz push automático para o Docker Hub real a cada commit. O mesmo pipeline, o mesmo fluxo — só que agora automatizado e auditável."*

### 12.4 Conexão com a Aula 04

Este workflow é o **ponto de partida** para pipelines mais sofisticados. Na Aula 04, você vai expandi-lo para incluir:

- **Testes automatizados**: executar `npm test` antes do build — se falhar, o push nem acontece
- **Cache de camadas**: acelerar o build reutilizando camadas de execuções anteriores
- **Tags múltiplas**: publicar `:semver`, `:staging`, `:production` em vez de só `:latest`
- **Deploy multi-ambiente**: com approval gates para staging e produção

### Quick Check 12

**1. Qual a utilidade de um badge de status no README?**
**Resposta:** O badge mostra visualmente se o último pipeline passou (verde) ou falhou (vermelho) — sem precisar entrar na aba Actions. Qualquer pessoa que abrir o repositório vê imediatamente o status do pipeline.

**2. O que acontece na Aula 04 que não temos neste workflow?**
**Resposta:** Testes automatizados antes do build (se falhar, não publica), cache de camadas para acelerar builds, tags múltiplas (SemVer + ambiente), deploy multi-ambiente com approval gates. O workflow da Aula 03 é a base que será expandida.

---

## Autoavaliação: Quiz Rápido

**1. Qual o principal problema de distribuir imagens Docker sem um registry?**
**Resposta:** Cada máquina precisa reconstruir a imagem do zero ou receber um arquivo sem rastreabilidade. Não há um ponto central que armazene versões imutáveis e garanta que todos usem exatamente o mesmo artefato.

**2. O que significa incrementar o número MINOR em SemVer (ex: 1.0.0 → 1.1.0)?**
**Resposta:** Significa que uma nova funcionalidade foi adicionada de forma compatível com versões anteriores. O código existente continua funcionando sem adaptações.

**3. Qual operação de registry é análoga a `git push`?**
**Resposta:** `docker push` — ambas publicam um artefato (código no git, imagem no registry) para um servidor central. A contraparte é `docker pull` / `git pull`.

**4. Por que a transferência delta em push/pull economiza largura de banda?**
**Resposta:** Porque apenas camadas com novos hashes são transferidas. Camadas já existentes no registry (hash idêntico) geram "Layer already exists" — zero bytes enviados.

**5. Na nomenclatura canônica `ghcr.io/meuuser/app:1.0.0`, o que representa cada componente?**
**Resposta:** `ghcr.io` = registry (GitHub Container Registry), `meuuser` = namespace (usuário/organização), `app` = repositório, `1.0.0` = tag SemVer.

**6. Qual a diferença entre `docker pull app:1.0.0` e `docker pull app@sha256:abc...`?**
**Resposta:** `app:1.0.0` usa uma tag (ponteiro mutável que pode mudar). `app@sha256:abc...` usa o digest (identificador imutável derivado do conteúdo). O pull por digest garante byte a byte a imagem exata.

**7. O que é CI/CD no contexto de containers?**
**Resposta:** CI (Continuous Integration) testa e builda a imagem automaticamente a cada `git push`. CD (Continuous Delivery) publica a imagem no registry após o build passar. Juntos, automatizam o pipeline do commit ao registry.

**8. Qual o papel dos secrets no GitHub Actions?**
**Resposta:** Secrets são variáveis criptografadas que armazenam credenciais (como token do Docker Hub) de forma segura. Elas são injetadas no ambiente de execução do workflow, mas nunca expostas no YAML ou nos logs.

---

## Mão na Massa: Exercícios Graduados

**Exercício 1 (Fácil) — Publique no Docker Hub**

Crie uma alteração na API (adicione uma nova rota), construa a imagem com tag `1.0.1`, e publique no **Docker Hub** (não no registry local).

**Passos:**

- [ ] Adicione uma nova rota no `server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```
- [ ] Construa a imagem com tag SemVer:
```bash
docker build -t app:1.0.1 .
```
- [ ] Faça login no Docker Hub com token:
```bash
docker login -u SEU_USERNAME
```
(cole o token quando pedir a senha)
- [ ] Tagueie para seu namespace no Docker Hub:
```bash
docker tag app:1.0.1 SEU_USERNAME/app:1.0.1
```
- [ ] Publique:
```bash
docker push SEU_USERNAME/app:1.0.1
```
- [ ] Verifique no navegador: acesse `https://hub.docker.com/r/SEU_USERNAME/app` e confirme a tag `1.0.1`
- [ ] Simule outra máquina:
```bash
docker rmi SEU_USERNAME/app:1.0.1 app:1.0.1
docker pull SEU_USERNAME/app:1.0.1
```

**Gabarito:** O comando `docker push SEU_USERNAME/app:1.0.1` publica a imagem no Docker Hub. A verificação no navegador mostra a tag `1.0.1`. O pull de outra máquina (simulada pelo `docker rmi` + `docker pull`) baixa a imagem exata. Sua imagem está disponível publicamente em `docker.io/SEU_USERNAME/app:1.0.1`.

---

**Exercício 2 (Médio) — Pipeline Multi-Ambiente com Docker Hub**

Publique a mesma imagem com três tags diferentes no Docker Hub (`:staging`, `:1.0.1` e `:latest`), simulando um pipeline de CI/CD.

**Passos:**

- [ ] Construa e tagueie para três destinos no Docker Hub:
```bash
docker build -t app:1.0.1 .
docker tag app:1.0.1 SEU_USERNAME/app:1.0.1
docker tag app:1.0.1 SEU_USERNAME/app:staging
docker tag app:1.0.1 SEU_USERNAME/app:latest
```
- [ ] Publique todas as tags:
```bash
docker push SEU_USERNAME/app:1.0.1
docker push SEU_USERNAME/app:staging
docker push SEU_USERNAME/app:latest
```
- [ ] Verifique as tags no navegador: `https://hub.docker.com/r/SEU_USERNAME/app/tags`
- [ ] Responda: qual a diferença entre usar `:staging` e `:1.0.1` em produção? E entre `:latest` e `:1.0.1`?

**Gabarito:** `:staging` e `:1.0.1` apontam para a mesma imagem (mesmo digest). A diferença é de **propósito**: `:staging` é uma tag que se move conforme novas versões são promovidas para o ambiente de staging, enquanto `:1.0.1` é uma tag imutável que sempre referencia aquela versão específica. `:latest` é ainda mais volátil — amanhã pode apontar para `:1.0.2` sem que ninguém perceba. Em produção, use sempre tags SemVer explícitas (`:1.0.1`).

---

**Exercício 3 (Difícil) — Workflow GitHub Actions + Badge**

Você vai criar o workflow GitHub Actions, configurar secrets, fazer push e ver o pipeline rodar. Depois, adicione o badge de status ao README.

**Passos:**

- [ ] Crie o diretório e o arquivo do workflow:
```bash
mkdir -p .github/workflows
```
- [ ] Crie `.github/workflows/docker-build-push.yml` com o conteúdo da Seção 11.2
- [ ] Configure os secrets no GitHub:
  - `DOCKERHUB_USERNAME`: seu username do Docker Hub
  - `DOCKERHUB_TOKEN`: token de acesso com permissão Read & Write
- [ ] Faça commit e push:
```bash
git add .github/workflows/docker-build-push.yml
git commit -m "ci: add Docker build-push workflow"
git push
```
- [ ] Acesse a aba Actions e veja o workflow rodar — capture o status (verde)
- [ ] Adicione o badge ao README:
```markdown
![Docker Build](https://github.com/SEU_USERNAME/SEU_REPO/actions/workflows/docker-build-push.yml/badge.svg)
```
- [ ] Faça commit do badge:
```bash
git add README.md
git commit -m "docs: add build status badge"
git push
```

**Gabarito:** O workflow executa 3 steps: checkout (clona o repo), login (autentica no Docker Hub via secrets), build e push (constrói e publica a imagem). Na aba Actions, você vê cada step com seu output. O badge no README mostra o status verde ✅. A partir de agora, **cada `git push` na `main` dispara o pipeline automaticamente** — build → login → push, sem intervenção manual.

---

## Resumo da Aula

### Os 10 Conceitos Fundamentais

1. **Distribuição de Artefatos**: sem um registry, distribuir imagens Docker exige soluções frágeis (zip, git rebuild, README) que não escalam e não garantem reprodutibilidade.
2. **Versionamento Semântico (SemVer)**: MAJOR.MINOR.PATCH é a linguagem universal que comunica o impacto de cada nova versão — do MAJOR (breaking change) ao PATCH (correção de bug).
3. **Registries Universais**: todo ecossistema maduro tem um registry (npm, PyPI, Maven, Docker Hub) com as mesmas operações: push, pull e search.
4. **Transferência Delta e Imutabilidade**: artefatos são imutáveis e endereçados por hash SHA-256; apenas camadas com novos hashes são transferidas em push/pull.
5. **Caching de Distribuição**: o cache local torna o segundo pull instantâneo — o princípio que acelera CI/CD e economiza largura de banda.
6. **Docker Registry**: serviço oficial de distribuição de imagens, executado com a imagem `registry:2` — o "npm registry dos containers".
7. **Nomenclatura Canônica**: `registry/namespace/repo:tag` é universal — muda apenas o hostname do registry (Docker Hub, GitHub Container Registry, registry local).
8. **Docker Hub**: registry cloud real com namespaces pessoais, official images e repositórios públicos/privados. Autenticação via token, não senha.
9. **Tags SemVer vs Digest**: tags são para humanos (comunicam mudança), digests são para máquinas (garantem identidade). `:latest` é seguro apenas em desenvolvimento local.
10. **CI/CD com GitHub Actions**: workflow YAML automatiza o pipeline build → login → push a cada `git push`. Secrets protegem credenciais. Badge no README mostra o status.

### O Que Você Construiu Hoje

- [x] `docker-compose.yml` atualizado com serviço `registry:2` integrado à stack
- [x] Pipeline build → tag → push → pull → run funcional com registry local
- [x] Conta no Docker Hub criada e imagem publicada em registry cloud real
- [x] Versionamento SemVer aplicado às imagens (`app:1.0.0`)
- [x] Tags de ambiente (`:staging`, `:latest`) para diferentes propósitos
- [x] Workflow GitHub Actions em `.github/workflows/docker-build-push.yml`
- [x] Secrets configurados no GitHub para autenticação segura
- [x] Badge de status do pipeline no README
- [x] Entendimento completo da nomenclatura canônica e do papel de cada componente
- [x] Distinção clara entre `:latest` (mutável) e digest (imutável)

---

## Próxima Aula

**Aula 04: GitHub Actions para CI/CD com Docker — Pipeline Completo**

Você tem um pipeline que faz build e push a cada commit. Na Aula 04, vamos expandir: testes automatizados que bloqueiam o push se falharem, cache de camadas para acelerar builds, tags múltiplas (SemVer + staging + production) e approval gates para ambientes de staging e produção. Do commit ao deploy — tudo automatizado.

---

## Referências

### Documentação Oficial

- [Docker Registry — Overview](https://docs.docker.com/registry/) — visão geral do Docker Registry
- [Docker Registry — Deploy a registry server](https://docs.docker.com/registry/deploying/) — deploy do registry:2
- [Docker Registry — Configuration](https://docs.docker.com/registry/configuration/) — referência de configuração
- [Docker Registry — Garbage Collection](https://docs.docker.com/registry/garbage-collection/) — documentação do GC
- [Docker Registry — Authentication](https://docs.docker.com/registry/recipes/nginx/) — autenticação com htpasswd e Nginx
- [Docker Hub — Official Images](https://docs.docker.com/docker-hub/official_images/) — curadoria de imagens oficiais
- [Docker Hub — Repositories](https://docs.docker.com/docker-hub/repos/) — gerenciamento de repositórios
- [Docker Hub — Access Tokens](https://docs.docker.com/docker-hub/access-tokens/) — criação e gerenciamento de tokens
- [SemVer Specification](https://semver.org/) — especificação oficial do versionamento semântico
- [GitHub Actions Documentation](https://docs.github.com/en/actions) — documentação oficial
- [docker/login-action](https://github.com/docker/login-action) — action de login no Docker Registry
- [docker/build-push-action](https://github.com/docker/build-push-action) — action de build e push
- [actions/checkout](https://github.com/actions/checkout) — action de checkout do repositório

### Ferramentas

- [Docker Registry image (registry:2)](https://hub.docker.com/_/registry) — imagem oficial do Registry
- [jq](https://stedolan.github.io/jq/) — processador JSON de linha de comando

### Vídeos Recomendados

- [Build Your Own Docker Hub | Docker Image Registry (Piyush Garg)](https://www.youtube.com/watch?v=3a92WPwdXWY) — monte seu próprio registry e entenda o Docker Hub por dentro (~18 min)
- [Curso de Docker para iniciantes (Matheus Battisti - Hora de Codar)](https://www.youtube.com/watch?v=np_vyd7QlXk) — reforço completo de Docker incluindo registry e publicação (~60 min)
- [GitHub Actions Introduction (FreeCodeCamp)](https://www.youtube.com/watch?v=R8_veQiYBjI) — introdução prática ao GitHub Actions (~30 min)

### Artigos para Aprofundamento

- [Content-addressable storage in Docker](https://docs.docker.com/engine/storage/drivers/) — como o Docker armazena imagens por hash de conteúdo
- [CI/CD with Docker and GitHub Actions](https://docs.docker.com/ci-cd/github-actions/) — pipeline de CI/CD com Docker
- [Docker Hub Best Practices](https://docs.docker.com/docker-hub/best-practices/) — boas práticas no Docker Hub

---

## FAQ

**P: Preciso de uma conta no Docker Hub para usar registry local?**
R: Não. O registry local (`localhost:5000`) é completamente independente do Docker Hub. Você não precisa de conta, internet ou autenticação para usá-lo.

**P: Como faço para proteger o registry local com autenticação?**
R: O Docker Registry suporta autenticação via htpasswd. Instale o `apache2-utils` (`sudo apt install -y apache2-utils`), crie um arquivo de senhas com `htpasswd -Bc htpasswd usuario` e configure o registry com as variáveis `REGISTRY_AUTH=htpasswd`, `REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd` e `REGISTRY_AUTH_HTPASSWD_REALM=Registry` no `docker-compose.yml`. Monte o arquivo `htpasswd` como volume no container.

**P: Como criar múltiplos usuários no htpasswd?**
R: Após criar o primeiro usuário com `htpasswd -Bc htpasswd usuario1`, adicione outros com `htpasswd -B htpasswd usuario2` (sem a flag `-c`, que cria um novo arquivo). Cada linha no arquivo terá um usuário diferente com seu hash de senha.

**P: Como fazer garbage collection no registry?**
R: Execute `docker exec CONTAINER registry garbage-collect /etc/docker/registry/config.yml`. O GC remove camadas órfãs (blobs não referenciados por nenhum manifesto). Durante o GC, o registry fica em modo somente leitura — agende em janelas de manutenção para ambientes de produção.

**P: Qual registry usar em produção — local, Docker Hub ou cloud?**
R: Depende do cenário: **Registry local** é para desenvolvimento e testes. **Docker Hub** é o padrão para imagens públicas e times pequenos. **Registries cloud** (ECR, GCR, ACR, GHCR) são recomendados para produção em seus respectivos clouds — oferecem integração nativa com IAM, scanning de vulnerabilidades e alta disponibilidade. O fluxo build → tag → push → pull → run é idêntico em todos.

**P: Como corrigir "unauthorized: authentication required" no push?**
R: O registry pode estar configurado com autenticação (htpasswd). Execute `docker login localhost:5000 -u USUARIO` e digite a senha. Se o registry não tiver autenticação, verifique se a URL está correta e se o registry está rodando (`docker compose ps`).

**P: Posso sobrescrever a tag `:1.0.0` com uma nova versão?**
R: Tecnicamente, sim — tags são mutáveis. Mas **não faça isso**. A tag `:1.0.0` deve sempre referenciar a mesma imagem. Se você precisa de uma nova versão, use `:1.0.1` (PATCH) ou `:1.1.0` (MINOR). Sobrescrever tags quebra a confiança no versionamento.

**P: Como escolho entre `:latest` e uma tag SemVer no dia a dia?**
R: Use `:latest` apenas no seu computador para desenvolvimento local — é conveniente e você controla o que está rodando. Em qualquer ambiente compartilhado (staging, produção, CI/CD), use sempre tags SemVer explícitas (`:1.0.1`) ou tags de ambiente promovidas manualmente (`:staging`, `:production`). A regra de ouro: se mais de uma pessoa ou máquina depende da imagem, não use `:latest`.

**P: O GitHub Actions consome recursos da minha máquina local?**
R: Não. O workflow executa em uma **VM gerenciada pelo GitHub**, totalmente na nuvem. Cada execução recebe uma máquina Ubuntu limpa com Docker pré-instalado. Você não paga por nada além do plano gratuito do GitHub (2000 minutos/mês para contas gratuitas). Sua máquina local não é afetada.

**P: Meu workflow falhou — como debugo?**
R: Acesse a aba Actions do seu repositório, clique na execução que falhou e expanda o step com erro (ícone ❌ vermelho). O output mostra o erro exato. Os erros mais comuns são: (1) secrets não configurados — o login no Docker Hub falha; (2) sintaxe YAML inválida — o GitHub rejeita o workflow antes de executar; (3) Dockerfile não encontrado — o `context: .` não inclui o Dockerfile.

---

## Glossário

### Termos da Aula 01 (Aprofundados nesta aula)

| Termo | Definição |
|---|---|
| **Camada de imagem** (*layer*) | Unidade imutável do sistema de arquivos de uma imagem. Cada instrução do Dockerfile cria uma camada. Camadas são endereçadas por hash SHA-256 e compartilhadas entre imagens |
| **Container** | Instância executável de uma imagem. Efêmero por padrão — dados não persistem além do seu ciclo de vida |
| **Digest** | Identificador SHA-256 imutável de uma imagem. Diferente da tag (mutável), o digest nunca muda — garante a identidade byte a byte do artefato |
| **Docker Hub** | Registry público padrão do Docker. Armazena official images, verified publishers e imagens de usuários |
| **Dockerfile** | Arquivo de receita que descreve como construir uma imagem |
| **Imagem** | Blueprint imutável de um container. Contém sistema de arquivos, variáveis de ambiente e comando de inicialização |
| **Multi-stage build** | Técnica que usa múltiplos estágios no Dockerfile para separar ferramentas de build do ambiente de execução, resultando em imagens finais menores |

### Termos da Aula 02

| Termo | Definição |
|---|---|
| **Docker Compose** | Ferramenta para definir e executar aplicações multi-container com um arquivo YAML declarativo e um comando (`docker compose up`) |
| **Health check** | Verificação explícita de prontidão de um serviço. Pode ser TCP, HTTP ou comando shell |
| **Network bridge** | Driver de rede padrão do Docker. Cria uma rede privada onde containers se comunicam por IP ou nome DNS |
| **Profile** | Conjunto de serviços ativados seletivamente no Compose via `--profile`. Permite múltiplos ambientes no mesmo YAML |
| **Volume nomeado** | Armazenamento persistente gerenciado pelo Docker, independente do ciclo de vida do container |

### Termos da Aula 03

| Termo | Definição |
|---|---|
| **:latest** | Tag mutável que aponta para a versão mais recente publicada. Conveniente em desenvolvimento local, mas perigosa em produção |
| **Badge** | Imagem inline no README que mostra o status do pipeline (passando/falhando) |
| **CI/CD** | Continuous Integration (integração contínua — testar e buildar a cada push) + Continuous Delivery (entrega contínua — publicar o artefato automaticamente) |
| **Docker Hub** | Registry público de containers mantido pelo Docker Inc. Suporta namespaces pessoais, official images e verified publishers |
| **Garbage collection** | Processo de remoção de camadas órfãs (blobs não referenciados) do disco do registry |
| **GitHub Actions** | Plataforma de CI/CD do GitHub. Executa workflows YAML em VMs gerenciadas, disparados por eventos do repositório |
| **htpasswd** | Ferramenta do Apache para criar arquivos de senha hasheadas. Usada pelo Docker Registry para autenticação básica HTTP |
| **Nomenclatura canônica** | Forma completa de endereçar uma imagem: `registry/namespace/repo:tag` |
| **Push / Pull** | Operações fundamentais de um registry. Push publica uma imagem; pull baixa uma imagem |
| **Registry** | Serviço especializado em armazenar, versionar e distribuir artefatos |
| **Secret** | Variável criptografada no GitHub que armazena credenciais (tokens, senhas) de forma segura. Injetada no workflow em tempo de execução |
| **SemVer** (Semantic Versioning) | Convenção de versionamento MAJOR.MINOR.PATCH que comunica o impacto de cada nova versão |
| **Tag** | Identificador nomeado (label) que aponta para uma versão específica de uma imagem. Mutável |
| **Token de acesso** | Credencial de uso específico para autenticação no Docker Hub. Preferível à senha por ser revogável independentemente |
| **Workflow** | Arquivo YAML que define um pipeline de CI/CD no GitHub Actions. Contém gatilhos (`on`), jobs e steps |
