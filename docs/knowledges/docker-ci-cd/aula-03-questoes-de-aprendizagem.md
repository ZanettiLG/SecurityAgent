---
titulo: "Aula 03 — Questões de Aprendizagem"
modulo: "Docker — Da Containerização ao Deploy em Produção"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 03: Docker Registry, Docker Hub e Introdução ao CI/CD com GitHub Actions"
data: 2026-06-18
---

# Aula 03 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o **checkpoint de aprendizagem** da Aula 03 — seu terceiro checkpoint do módulo. A pergunta central: *"eu realmente entendi a matéria?"*

- Faça as questões na ordem (1 a 8). Cada uma tem **Conceito-chave → Objetivo → Passos → Entrega**.
- Crie uma pasta `entregas-aula-03/` no seu repositório para salvar suas respostas.
- Tente resolver sem consultar a aula. Se travar, cada questão indica a seção exata onde o conceito foi ensinado (no campo **Conceito-chave**).
- Ao final, o **Checklist Final** confirma se você está pronto para a Aula 04.

---

## Questão 1: Distribuição de Artefatos — Por Que o Registry?

**Conceito-chave:** Distribuição de artefatos e papel do registry (Aula 03, Seção 1).

**Objetivo:** Comparar os métodos de distribuição de imagens e justificar por que um registry é a solução universal.

**Passos de Execução:**

1. Liste os três métodos improvisados de distribuir uma imagem sem registry (expostos na Seção 1).
2. Para cada método, identifique a fragilidade principal.
3. Explique, em suas palavras, como um registry resolve cada fragilidade.
4. Dê um exemplo concreto de como você distribuiria a stack da Aula 02 para um colega usando registry vs sem registry.

**Entrega:** crie `entregas-aula-03/01-distribuicao-artefatos.md`:

```markdown
# Questão 1 — Distribuição de Artefatos

## Métodos improvisados e fragilidades

| Método | Fragilidade principal | Como o registry resolve |
|---|---|---|
| | | |
| | | |
| | | |

## Exemplo concreto

Sem registry: (descreva os passos que seu colega precisaria seguir)

Com registry: (descreva o fluxo com um único comando)
```

---

## Questão 2: Versionamento SemVer

**Conceito-chave:** Versionamento Semântico (SemVer) (Aula 03, Seção 2).

**Objetivo:** Aplicar a convenção MAJOR.MINOR.PATCH a cenários reais de versionamento de imagens.

**Passos de Execução:**

1. Para cada cenário abaixo, determine se a versão deve ser MAJOR, MINOR ou PATCH:
   - Você adiciona uma nova rota `/api/v2/users` que substitui a rota antiga — clientes antigos quebram
   - Você corrige um bug no cálculo de timeout que não afeta a interface pública
   - Você adiciona uma rota `/api/health` sem remover nada existente
2. Escreva o comando `docker build -t` para cada cenário, partindo da versão atual `app:1.3.0`
3. Explique por que faria sentido publicar também a tag `:latest` para o cenário MINOR, mas não para o MAJOR

**Entrega:** crie `entregas-aula-03/02-versionamento-semver.md`:

```markdown
# Questão 2 — Versionamento SemVer

## Cenários e versões

| Cenário | Mudança | Versão (partindo de 1.3.0) |
|---|---|---|
| Breaking change na API | MAJOR | |
| Correção de bug | | |
| Nova funcionalidade compatível | | |

## Comandos

MAJOR: `docker build -t app:____ .`
MINOR: `docker build -t app:____ .`
PATCH: `docker build -t app:____ .`

## Reflexão sobre :latest

Por que :latest é arriscado no cenário MAJOR mas aceitável no MINOR?

```

---

## Questão 3: Registries como Catálogo Universal

**Conceito-chave:** Registries como catálogo universal de artefatos (Aula 03, Seção 3).

**Objetivo:** Demonstrar compreensão do papel dos registries em diferentes ecossistemas de software.

**Passos de Execução:**

1. Preencha a tabela comparando três registries de ecossistemas diferentes com o Docker Hub.
2. Para cada registry, identifique: ecossistema, tipo de artefato armazenado, comando de push e comando de pull.
3. Explique qual a característica arquitetural comum a todos os registries.

**Entrega:** crie `entregas-aula-03/03-registries-universais.md`:

```markdown
# Questão 3 — Registries como Catálogo Universal

## Tabela comparativa

| Registry | Ecossistema | Artefato | Comando push | Comando pull |
|---|---|---|---|---|
| npmjs.com | | | | |
| PyPI | | | | |
| Docker Hub | | | | |

## Característica comum

Descreva o que todo registry tem em comum em termos de operações e arquitetura.
```

---

## Questão 4: Transferência Delta na Prática

**Conceito-chave:** Transferência delta e imutabilidade (Aula 03, Seção 4).

**Objetivo:** Executar push/pull de duas versões e documentar a ocorrência de "Layer already exists" como prova do delta.

**Passos de Execução:**

1. Construa e publique `app:1.0.0` no registry local (como na Seção 7).
2. Construa `app:1.0.1` com uma alteração mínima (adicione uma rota) e publique.
3. Compare os outputs dos dois pushes — identifique quais camadas foram "Pushed" vs "Layer already exists".
4. Execute garbage collection no registry com `docker exec CONTAINER registry garbage-collect /etc/docker/registry/config.yml` e observe se o espaço é liberado (substitua `CONTAINER` pelo nome do container do registry — veja com `docker compose ps`).

**Entrega:** crie `entregas-aula-03/04-delta-transfer.md`:

```markdown
# Questão 4 — Transferência Delta

## Output do push de app:1.0.0
(cole o output)

## Output do push de app:1.0.1
(cole o output)

## Comparação

| Camada | Push 1.0.0 | Push 1.0.1 | Transferida em 1.0.1? |
|---|---|---|---|
| (camada base Alpine) | | | |
| (camada Node.js) | | | |
| (código da app) | | | |

## Análise

Quantas camadas foram realmente transferidas no segundo push? Por que?

## Garbage collection

(cole o output do GC e explique o que foi removido)
```

---

## Questão 5: Push para o Docker Hub (Cloud Real)

**Conceito-chave:** Docker Hub — push para cloud real (Aula 03, Seção 8).

**Objetivo:** Criar conta no Docker Hub, autenticar com token e publicar uma imagem em registry cloud real.

**Passos de Execução:**

1. Acesse hub.docker.com e crie uma conta (se ainda não tiver). Anote seu username.
2. Crie um token de acesso em Account Settings → Security → New Access Token (permissão Read & Write).
3. Autentique no terminal: `docker login -u SEU_USERNAME` (use o token como senha).
4. Tagueie a imagem `app:1.0.0` para seu namespace: `docker tag app:1.0.0 SEU_USERNAME/app:1.0.0`
5. Publique: `docker push SEU_USERNAME/app:1.0.0`
6. Verifique no navegador: a imagem aparece em `https://hub.docker.com/r/SEU_USERNAME/app`

**Entrega:** crie `entregas-aula-03/05-push-dockerhub.md`:

```markdown
# Questão 5 — Push para o Docker Hub

## Informações da conta

Docker Hub username: _______________
Nome do token criado: _______________

## Output do docker login
(cole o output — deve mostrar "Login Succeeded")

## Output do docker push
(cole o output)

## Verificação no navegador
URL da imagem no Docker Hub: https://hub.docker.com/r/_______________

## Reflexão
Qual a diferença entre publicar em `localhost:5000/app:1.0.0` e `SEU_USERNAME/app:1.0.0`? Quem pode baixar cada uma?
```

---

## Questão 6: Nomenclatura Canônica — Decompondo Referências

**Conceito-chave:** Nomenclatura canônica e versionamento (Aula 03, Seções 8 e 9).

**Objetivo:** Decompor a nomenclatura canônica `registry/namespace/repo:tag` em seus 4 componentes para diferentes registries.

**Passos de Execução:**

1. Execute `docker pull node:22-alpine` (forma curta) e `docker pull docker.io/library/node:22-alpine` (forma canônica).
2. Verifique que ambas apontam para a mesma imagem: `docker images node --format "{{.Repository}}:{{.Tag}} -> {{.ID}}"`
3. Para cada referência abaixo, identifique registry, namespace, repositório e tag:
   - `localhost:5000/app:1.0.0`
   - `SEU_USERNAME/app:latest`
   - `bitnami/postgresql:16`
   - `ghcr.io/meuuser/api:v2.0.0`

**Entrega:** crie `entregas-aula-03/06-nomenclatura-canonica.md`:

```markdown
# Questão 6 — Nomenclatura Canônica

## Verificação de IMAGE ID
(cole o output de `docker images node --format "{{.Repository}}:{{.Tag}} -> {{.ID}}"`)

## Tabela de decomposição

| Referência | Registry | Namespace | Repositório | Tag |
|---|---|---|---|---|
| `localhost:5000/app:1.0.0` | | | | |
| `SEU_USERNAME/app:latest` | | | | |
| `bitnami/postgresql:16` | | | | |
| `ghcr.io/meuuser/api:v2.0.0` | | | | |

## Reflexão
Por que o formato `registry/namespace/repo:tag` é considerado universal? Dê exemplos de outros registries.
```

---

## Questão 7: Primeiro Workflow GitHub Actions

**Conceito-chave:** GitHub Actions — primeiro workflow (Aula 03, Seções 10 e 11).

**Objetivo:** Criar um workflow GitHub Actions que faz build da imagem, login no Docker Hub via secrets e push automático a cada `git push`.

**Passos de Execução:**

1. Crie o diretório `.github/workflows/` no seu repositório.
2. Crie o arquivo `docker-build-push.yml` com o workflow completo (use o modelo da Seção 11.2).
3. Configure os secrets no GitHub:
   - `DOCKERHUB_USERNAME`: seu username (criado na Questão 5)
   - `DOCKERHUB_TOKEN`: token de acesso (criado na Questão 5)
4. Faça `git add`, `git commit`, `git push`.
5. Acesse a aba Actions do repositório e verifique se o workflow executou com sucesso (status verde).
6. Adicione o badge de status ao README (veja Seção 12).

**Entrega:** crie `entregas-aula-03/07-primeiro-workflow.md`:

```markdown
# Questão 7 — Primeiro Workflow GitHub Actions

## Arquivo YAML

Cole aqui o conteúdo completo do `.github/workflows/docker-build-push.yml`:

```yaml

```

## Secrets configurados

| Nome do secret | Valor (não cole o valor real — apenas marque se configurou) |
|---|---|
| DOCKERHUB_USERNAME | ✅ Configurado |
| DOCKERHUB_TOKEN | ✅ Configurado |

## Status do workflow no Actions

Status: ✅ / ❌ (circule um)

URL da execução: https://github.com/___________/___________/actions

## Badge no README

Linha adicionada ao README.md:
```
(cole aqui a linha do badge)
```

## Reflexão
O que acontece automaticamente agora a cada `git push` na branch main?
```

---

## Questão 8: Estratégia de Versionamento com CI/CD

**Conceito-chave:** Estratégia de versionamento e CI/CD (Aula 03, Seções 9 e 12).

**Objetivo:** Definir uma estratégia de tags para ambientes dev/staging/prod com CI/CD.

**Passos de Execução:**

1. Considere que seu pipeline (da Questão 7) publica apenas `:latest`. Quais ambientes ficam desprotegidos?
2. Defina uma estratégia de tags para três ambientes:
   - Desenvolvimento local
   - Staging (time compartilhado)
   - Produção
3. Para cada ambiente:
   - Qual tag usar (SemVer, :latest, :staging, digest)?
   - Quem pode fazer push/pull?
   - Qual o risco de usar a tag errada?
4. Explique como o CI/CD (GitHub Actions) poderia automatizar a promoção entre ambientes.

**Entrega:** crie `entregas-aula-03/08-estrategia-versionamento.md`:

```markdown
# Questão 8 — Estratégia de Versionamento com CI/CD

## Tabela de estratégia

| Ambiente | Tag recomendada | Risco de usar :latest | Como promove |
|---|---|---|---|
| Desenvolvimento local | | | |
| Staging (compartilhado) | | | |
| Produção | | | |

## O papel do CI/CD na promoção

Descreva como um workflow GitHub Actions poderia:
1. Publicar `:staging` a cada push na branch `develop`
2. Publicar `:production` apenas quando a PR para `main` é aprovada

## Reflexão final

Por que ambientes compartilhados (staging, produção) nunca devem usar `:latest`?
```

---

## Checklist Final: Pronto para a Aula 04?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Explicar por que distribuir imagens sem registry é frágil (usando os métodos zip, git rebuild e README)
- [ ] Aplicar SemVer (MAJOR.MINOR.PATCH) a cenários reais de versionamento de imagens
- [ ] Descrever o papel de um registry como catálogo universal de artefatos imutáveis
- [ ] Explicar por que "Layer already exists" aparece no push e como o delta transfer funciona
- [ ] Criar um registry local com `registry:2` e executar o fluxo push/pull
- [ ] Criar conta no Docker Hub, autenticar com token e publicar imagem em cloud real
- [ ] Decompor a nomenclatura canônica `registry/namespace/repo:tag` para diferentes registries
- [ ] Distinguir `:latest` de tags SemVer e digest, explicando quando usar cada um
- [ ] Explicar o que é CI/CD e como GitHub Actions automatiza o pipeline build→push
- [ ] Criar um workflow GitHub Actions com login no Docker Hub via secrets e push automático

> *"Acertou todos? Você está pronto para a Aula 04, onde vamos transformar este workflow simples em um pipeline profissional com testes automatizados, cache de camadas e deploy multi-ambiente com approval gates. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar."*
