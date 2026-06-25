---
titulo: "Questões de Aprendizagem — Aula 01: Docker — Instalação, Primeiro Container e Fundamentos"
modulo: "Docker, Docker Compose e Registry"
tipo: "checkpoint-pratico"
nivel: "intermediario"
tags: [docker, containers, imagens, dockerfile, docker-hub, namespaces, cgroups, multi-stage, bind-mount]
data: 2026-06-15
---

# Curso: Docker, Docker Compose e Registry — Aula 01

## Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o **checkpoint de aprendizagem** da Aula 01. A pergunta central: *"eu realmente entendi a matéria?"*

- Faça as questões na ordem (1 a 8). Cada uma tem **Conceito-chave → Objetivo → Passos → Entrega**.
- Crie uma pasta `entregas-aula-01/` para salvar suas respostas.
- Tente resolver sem consultar a aula. Se travar, cada questão indica a seção exata onde o conceito foi ensinado (no campo **Conceito-chave**).
- Você só avança para a Aula 02 quando conseguir completar todas as questões por conta própria.

---

## Questão 1: Verificação de Instalação e Primeiro Container

**Conceito-chave:** Instalação e Primeiro Container (Aula 01, Seções 5 e 6)

**Objetivo:** Verificar se o Docker Engine está instalado corretamente e se você consegue executar seu primeiro container.

**Tempo estimado:** 5 minutos

**Contexto:** Você acabou de instalar o Docker Engine. Antes de seguir adiante, precisa confirmar que a instalação está funcional e que você entende o output básico do Docker.

**Passos de Execução:**

1. Verifique a versão do Docker instalada: `docker --version`
2. Verifique que o daemon está rodando: `systemctl status docker` (ou `docker info` se seu usuário está no grupo docker)
3. Execute `docker run hello-world`
4. Execute `docker run hello-world` novamente

**Entrega:**

- [ ] Anote a versão do Docker instalada
- [ ] Anote o status do daemon (deve estar `active (running)`)
- [ ] Compare os outputs das duas execuções de `hello-world` — anote a diferença e explique por que a segunda foi mais rápida

Crie `entregas-aula-01/q1-verificacao.md`:

```markdown
# Questão 1 — Verificação de Instalação e Primeiro Container

## Versão do Docker
[preencher]

## Status do Daemon
[preencher]

## Comparação hello-world
| Execução | Tempo aproximado | O que aconteceu |
|---|---|---|
| 1ª | [preencher] | Pull da imagem |
| 2ª | [preencher] | Cache local |

## Conclusão
[Em 2-3 frases: por que a segunda execução foi instantânea?]
```

---

## Questão 2: Inspeção de Imagem e Camadas

**Conceito-chave:** Imagens, Containers e Camadas (Aula 01, Seções 2 e 8)

**Objetivo:** Inspecionar uma imagem Docker, listar suas camadas e explicar o propósito de cada uma.

**Tempo estimado:** 10 minutos

**Contexto:** Você vai baixar a imagem `node:22-alpine` e inspecionar sua estrutura interna de camadas.

**Passos de Execução:**

1. Faça pull da imagem: `docker pull node:22-alpine`
2. Liste as imagens locais e anote o tamanho: `docker images`
3. Veja o histórico de camadas: `docker image history node:22-alpine`
4. Para cada camada no histórico, identifique se ela foi criada pelo Dockerfile oficial da imagem ou se é uma camada de metadados
5. Execute um container interativo e explore: `docker run -it --rm node:22-alpine sh`
   - Execute `node --version`
   - Execute `ls /` e identifique os diretórios
   - Execute `whoami`
   - Saia com `exit`

**Entrega:**

- [ ] Liste as camadas visíveis no `docker image history` e identifique a função de cada uma (base Alpine, Node.js runtime, configuração, etc.)
- [ ] Anote o tamanho total da imagem
- [ ] Documente: qual o nome do usuário dentro do container? Por que não é seu usuário do host?

Crie `entregas-aula-01/q2-inspecao.md`:

```markdown
# Questão 2 — Inspeção de Imagem e Camadas

## Camadas identificadas
| Camada | Função |
|---|---|
| [preencher] | [preencher] |

## Tamanho total da imagem
[preencher]

## Usuário dentro do container
[preencher]

## Conclusão
[Por que o usuário dentro do container não é o mesmo do host?]
```

---

## Questão 3: Dockerfile para API Express

**Conceito-chave:** Dockerfile e Cache de Camadas (Aula 01, Seção 9)

**Objetivo:** Escrever um Dockerfile funcional para uma API Express fornecida, construir a imagem e executar o container.

**Tempo estimado:** 15 minutos

**Contexto:** Você recebeu o código de uma API Express simples. Seu trabalho é escrever o Dockerfile do zero, construir a imagem e verificar que a API responde.

**Código fornecido (`server.js`):**

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'API containerizada funciona!' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

**Passos de Execução:**

1. Crie um diretório `questao3` e coloque o `server.js` acima
2. Crie `package.json` com `express` como dependência
3. Execute `npm install` para gerar o `package-lock.json`
4. Escreva um Dockerfile com as 7 instruções essenciais (FROM, WORKDIR, COPY, RUN, EXPOSE, CMD)
5. Construa a imagem: `docker build -t questao3-api .`
6. Execute o container: `docker run -p 3000:3000 questao3-api`
7. Teste com `curl http://localhost:3000`

**Entrega:**

- [ ] Conteúdo do `Dockerfile` (com as 7 instruções)
- [ ] Output do `docker build`
- [ ] Output do `curl http://localhost:3000`
- [ ] Explique por que a ordem das instruções no seu Dockerfile está otimizada para cache de camadas

Crie `entregas-aula-01/q3-dockerfile.md`:

```markdown
# Questão 3 — Dockerfile para API Express

## Dockerfile (7 instruções)
```dockerfile
[preencher]
```

## Output do docker build
```
[preencher]
```

## Output do curl
```
[preencher]
```

## Explicação — Cache de Camadas
[Por que a ordem `COPY package*.json ./` antes de `COPY . .` otimiza o cache?]
```

---

## Questão 4: Multi-Stage e Otimização

**Conceito-chave:** Multi-Stage Build e .dockerignore (Aula 01, Seção 10)

**Objetivo:** Refatorar o Dockerfile da Questão 3 para multi-stage, configurar `.dockerignore` e comparar tamanhos de imagem.

**Tempo estimado:** 15 minutos

**Contexto:** O Dockerfile da Questão 3 funciona, mas a imagem inclui npm desnecessariamente. Sua missão é criar um Dockerfile multi-stage e medir o ganho.

**Passos de Execução:**

1. Crie um `.dockerignore` com as exclusões apropriadas (node_modules, .git, .env, logs, etc.)
2. Refatore o Dockerfile para multi-stage:
   - Stage 1 (builder): instala TODAS as dependências
   - Stage 2 (production): copia apenas `node_modules` e `server.js` do builder
3. Construa a imagem otimizada: `docker build -t questao4-api .`
4. Compare o tamanho com a imagem da Questão 3 (use `docker images`)
5. Compare os tamanhos das imagens: `docker images | grep questao4-api` (compare com a questao3-api)
6. Verifique que a imagem otimizada funciona: `docker run --rm -p 3000:3000 questao4-api` + `curl http://localhost:3000`

**Entrega:**

- [ ] Conteúdo do `.dockerignore`
- [ ] Conteúdo do `Dockerfile` multi-stage
- [ ] Comparação de tamanho (questao3-api vs questao4-api)
- [ ] Output do curl em http://localhost:3000
- [ ] Resposta: por que a imagem multi-stage é menor? O que foi removido?

Crie `entregas-aula-01/q4-multistage.md`:

```markdown
# Questão 4 — Multi-Stage e Otimização

## .dockerignore
```
[preencher]
```

## Dockerfile multi-stage
```dockerfile
[preencher]
```

## Comparação de tamanhos
| Imagem | Tamanho |
|---|---|
| questao3-api (single-stage) | [preencher] |
| questao4-api (multi-stage) | [preencher] |

## Output do curl
```
[preencher]
```

## Explicação
[Por que a imagem multi-stage é menor? O que foi removido?]
```

---

## Questão 5: Bind Mount e Hot Reload

**Conceito-chave:** Bind Mount e Hot Reload (Aula 01, Seção 11)

**Objetivo:** Configurar bind mount com nodemon para desenvolvimento com hot reload.

**Tempo estimado:** 15 minutos

**Contexto:** Você precisa modificar a API da Questão 3 em tempo real, sem rebuild a cada alteração. Bind mount + nodemon são a solução.

**Passos de Execução:**

1. Adicione `nodemon` como `devDependency` no `package.json`
2. Adicione o script `"dev": "npx nodemon server.js"` no `package.json`
3. Reconstrua a imagem para incluir nodemon: `docker build -t questao5-api .`
4. Execute com bind mount:
   ```bash
   docker run -p 3000:3000 \
     -v $(pwd):/app \
     -v /app/node_modules \
     questao5-api \
     npx nodemon server.js
   ```
5. Em outro terminal, faça uma requisição: `curl http://localhost:3000`
6. Altere a mensagem no `server.js` (ex: "API com hot reload!"), salve o arquivo
7. Observe o terminal do container — o nodemon deve reiniciar automaticamente
8. Faça uma nova requisição e confirme que a mudança aparece

**Entrega:**

- [ ] Output do terminal mostrando o nodemon reiniciando após a alteração
- [ ] Output do `curl` antes e depois da alteração
- [ ] Explique: por que o segundo `-v /app/node_modules` é necessário?

Crie `entregas-aula-01/q5-bindmount.md`:

```markdown
# Questão 5 — Bind Mount e Hot Reload

## Output do nodemon reiniciando
```
[preencher]
```

## Curl — antes da alteração
```
[preencher]
```

## Curl — depois da alteração
```
[preencher]
```

## Explicação
[Por que o segundo `-v /app/node_modules` é necessário?]
```

---

## Questão 6: Ciclo de Vida de Containers

**Conceito-chave:** Comandos Essenciais de Gerenciamento (Aula 01, Seção 8)

**Objetivo:** Gerenciar o ciclo de vida completo de containers: criar, listar, inspecionar, parar, remover e limpar.

**Tempo estimado:** 10 minutos

**Contexto:** Você vai praticar os 9 comandos essenciais de gerenciamento de containers em sequência.

**Passos de Execução:**

1. Execute um container em background da imagem `node:22-alpine` com `sleep 60`:
   ```bash
   docker run -d --name ciclo-teste node:22-alpine sleep 60
   ```
2. Liste containers em execução: `docker ps`
3. Liste todos os containers (incluindo parados): `docker ps -a`
4. Veja os logs do container: `docker logs ciclo-teste`
5. Execute um comando dentro do container em execução: `docker exec ciclo-teste node --version`
6. Pare o container: `docker stop ciclo-teste`
7. Verifique que ele parou: `docker ps -a` (status deve ser `Exited`)
8. Remova o container: `docker rm ciclo-teste`
9. Verifique que foi removido: `docker ps -a | grep ciclo-teste`
10. (Opcional) Limpe tudo não usado: `docker system prune -f`

**Entrega:**

- [ ] Output de cada comando executado
- [ ] Anote: qual a diferença entre `docker stop` e `docker rm`?
- [ ] Anote: o que `docker system prune` remove?

Crie `entregas-aula-01/q6-ciclo.md`:

```markdown
# Questão 6 — Ciclo de Vida de Containers

## Outputs dos comandos
| Comando | Output |
|---|---|
| docker ps | [preencher] |
| docker ps -a | [preencher] |
| docker logs | [preencher] |
| docker exec | [preencher] |
| docker stop | [preencher] |
| docker rm | [preencher] |

## Diferença entre docker stop e docker rm
[preencher]

## O que docker system prune remove?
[preencher]
```

---

## Questão 7: Diagnóstico — Corrigir Erros Comuns

**Conceito-chave:** Erros Comuns em Dockerfiles (Aula 01, Seção 9)

**Objetivo:** Identificar e corrigir erros comuns em Dockerfiles e comandos Docker.

**Tempo estimado:** 10 minutos

**Contexto:** Você recebeu um Dockerfile com 4 erros. Sua missão é identificar cada erro, corrigi-lo e construir a imagem com sucesso.

**Dockerfile com erros:**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
COPY package*.json ./
RUN npm start
EXPOSE 3000
CMD node server.js
```

**Passos de Execução:**

1. Identifique os erros (são 4)
2. Corrija cada um
3. Construa a imagem: `docker build -t questao7-api .`
4. Execute e teste

**Entrega:**

- [ ] Liste os 4 erros identificados
- [ ] Explique por que cada um é um problema
- [ ] Dockerfile corrigido
- [ ] Output do `docker build` bem-sucedido

Crie `entregas-aula-01/q7-diagnostico.md`:

```markdown
# Questão 7 — Diagnóstico de Erros Comuns

## Erros identificados
| # | Erro | Por que é um problema |
|---|---|---|
| 1 | [preencher] | [preencher] |
| 2 | [preencher] | [preencher] |
| 3 | [preencher] | [preencher] |
| 4 | [preencher] | [preencher] |

## Dockerfile corrigido
```dockerfile
[preencher]
```

## Output do docker build
```
[preencher]
```
```

---

## Questão 8: Reflexão — Mapeando FUNDAMENTOS para Docker

**Conceito-chave:** FUNDAMENTOS e Aplicação Docker (Aula 01, Seções 1 a 4)

**Objetivo:** Conectar os conceitos da Parte 1 (FUNDAMENTOS) com as implementações concretas do Docker na Parte 2.

**Tempo estimado:** 10 minutos

**Contexto:** Esta questão não envolve comandos — é uma reflexão escrita para consolidar o entendimento.

**Passos de Execução:**

Complete as seguintes afirmações com suas próprias palavras:

1. Namespaces (PID, net, mount) são implementados no Docker como...
2. Sistemas de arquivos em camadas aparecem no Docker quando eu...
3. Copy-on-write (CoW) acontece no Docker quando um container...
4. Cgroups são usados pelo Docker para...
5. O build context no Docker corresponde ao conceito de...
6. O `.dockerignore` é a implementação concreta de...

**Entrega:**

- [ ] Parágrafo/sentença para cada uma das 6 afirmações acima
- [ ] Exemplo: para cada afirmação, dê um comando ou situação real do Docker que exemplifica o conceito

Crie `entregas-aula-01/q8-reflexao.md`:

```markdown
# Questão 8 — Mapeando FUNDAMENTOS para Docker

## 1. Namespaces no Docker
[preencher]

**Exemplo:** [comando ou situação real]

## 2. Camadas no Docker
[preencher]

**Exemplo:** [comando ou situação real]

## 3. Copy-on-Write no Docker
[preencher]

**Exemplo:** [comando ou situação real]

## 4. Cgroups no Docker
[preencher]

**Exemplo:** [comando ou situação real]

## 5. Build Context no Docker
[preencher]

**Exemplo:** [comando ou situação real]

## 6. .dockerignore como Exclusão Seletiva
[preencher]

**Exemplo:** [comando ou situação real]
```

---

## Checklist Final: Pronto para a Aula 02?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Explicar por que processos precisam de isolamento (namespaces + cgroups)
- [ ] Descrever sistemas de arquivos em camadas e copy-on-write
- [ ] Distinguir imagem de container com a analogia classe/objeto
- [ ] Instalar Docker Engine via apt e verificar com systemctl
- [ ] Executar hello-world e interpretar cada linha do output
- [ ] Explicar Docker Hub: namespaces, official images, tags vs digests
- [ ] Escrever Dockerfile com FROM, WORKDIR, COPY, RUN, EXPOSE, CMD
- [ ] Construir imagem multi-stage com .dockerignore
- [ ] Configurar bind mount + nodemon para hot reload
- [ ] Usar docker ps, images, logs, exec, stop, rm, rmi, prune

> *"Acertou todos? Você está pronto para a Aula 02, onde adicionará PostgreSQL à stack com Docker Compose. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar."*

---
