# Plano do Módulo: Engenharia de Software — Do Código Limpo ao Pipeline Agêntico (21 aulas)

Este arquivo é a **fonte única da verdade** sobre a sequência, numeração e escopo das 21 aulas deste módulo. Ensina engenharia de software aplicada de forma progressiva: dos fundamentos de código limpo e refatoração, passando por SOLID, design patterns (GoF + React), DDD estratégico e tático, arquitetura de software, engenharia de requisitos, SDD/BDD, TDD, pirâmide de testes, CI/CD, DevSecOps, observabilidade, até a construção de um pipeline agêntico completo — onde agentes de IA colaboram com o desenvolvedor em cada etapa do ciclo de vida do software.

## Público-alvo e ponto de partida

**Público**: desenvolvedores intermediários que concluíram os módulos de Node.js (npm, `package.json`, servidores Express, variáveis de ambiente, debugging), TypeScript (tipos, generics, decorators), Docker (containerização, Compose, CI/CD) e idealmente o módulo de LangChain (padrões multi-serviço, integração de APIs, orquestração de dependências). Experiência com git, APIs REST, React (componentes, hooks básicos) e bancos de dados relacionais (PostgreSQL).

**O que o aluno já sabe**: TypeScript/JavaScript com Node.js e Express, operações CRUD, middlewares, rotas, `async/await`, módulos npm, React com componentes funcionais e hooks básicos, Jest para testes unitários, git (branch, merge, PR), PostgreSQL (schemas, queries, migrations), variáveis de ambiente, debugging de aplicações, Docker (Dockerfile, Compose), e o ciclo de desenvolvimento completo: codificar, testar manualmente, fazer deploy.

**O que o aluno NÃO sabe**: Estruturar código profissionalmente com princípios de engenharia (SOLID, design patterns), modelar domínios complexos com Domain-Driven Design, projetar arquiteturas desacopladas e testáveis (Clean Architecture, Ports & Adapters), especificar requisitos de forma executável (BDD, Gherkin), aplicar TDD sistematicamente em features reais, construir pipelines de CI/CD com quality gates e security scanning, instrumentar aplicações para observabilidade (logs, métricas, tracing), gerenciar dívida técnica com métricas objetivas, aplicar patterns web/React (HOC, Render Props, Hooks Pattern, Compound Components), e integrar agentes de IA em cada etapa do ciclo de desenvolvimento — da elicitação de requisitos ao code review automatizado.

**Compromisso do módulo**: partir do código que o aluno já escreve — controllers Express monolíticos, componentes React acoplados, lógica de negócio espalhada, testes pontuais — e evoluí-lo sistematicamente para uma aplicação full-stack profissional com arquitetura limpa, testes completos, pipeline automatizado, operação observável e agentes de IA como parceiros de desenvolvimento. Cada princípio é apresentado como resposta a uma dor real que o aluno já sentiu: "mudei uma coisa e quebrou três", "não consigo testar sem subir o banco", "o deploy manual deu errado de novo", "o agente escreveu código que não compila".

## Filosofia: cada aula é concreta e treinável

Esta é a maior exigência do módulo. Cada aula entrega:

1. **Conteúdo principal** (`aula-NN-<slug>.md`): explicação conceitual + demonstração guiada + prática durante a aula (Mão na Massa inline, Quick Check, Quiz rápido).
2. **Questões de Aprendizagem** (`aula-NN-questoes-de-aprendizagem.md`): um arquivo **separado** com tarefas práticas que funcionam como checkpoint de aprendizagem — *"eu realmente entendi a matéria?"*. Cada questão tem **Objetivo → Passos de Execução → Entrega** (com template para o aluno preencher).

O arquivo de questões é um guia: *"isto é importante — você entendeu? Então tente fazer."* O aluno só avança quando consegue completar as questões por conta própria, sem reler a aula a cada passo.

## Projeto Progressivo: API de E-commerce em Node.js/TypeScript + Frontend React

O aluno parte de uma API Express monolítica com código procedural e, aula a aula, aplica princípios de engenharia de software até produzir uma aplicação full-stack com arquitetura limpa, testes completos, pipeline CI/CD, observabilidade e agentes de IA integrados ao ciclo de desenvolvimento. Cada peça é funcional por si só e se ancora em conhecimento prévio: TypeScript, Express, React, PostgreSQL, Docker, git.

| Aula | Peça adicionada | O que o aluno faz | Âncora de conhecimento |
|---|---|---|---|
| 01 | **Visão geral do módulo + projeto inicial** | Compreende o roadmap completo, define o projeto progressivo (API e-commerce), configura o repositório base com TypeScript, Express e ESLint | TypeScript, Express, npm |
| 02 | **Código limpo** | Refatora controller Express de 300 linhas (procedural, duplicado) → funções pequenas, nomes claros, sem duplicação, SLAP | JavaScript/TypeScript, Express básico |
| 03 | **Refactoring catalog** | Identifica 4 famílias de code smells no projeto, aplica refactorings do catálogo (Extract Method/Class, Rename, Move), configura ESLint como segurança | Clean Code, funções, testes |
| 04 | **SOLID — SRP, OCP, LSP** | Aplica primeira metade do SOLID: separa services por responsabilidade, cria gateways de pagamento extensíveis (OCP), garante substituibilidade com LSP | Classes, interfaces, herança |
| 05 | **SOLID — ISP, DIP + DI** | Segunda metade: segrega interfaces de repository, inverte dependências com contratos, configura tsyringe como contêiner de injeção | SOLID parte 1, interfaces, módulos |
| 06 | **Padrões Criacionais** | Implementa Factory Method, Abstract Factory, Builder, Singleton, Object Literal (pattern JS/TS), Prototype — cada um resolvendo um problema do e-commerce | SOLID, classes, construtores |
| 07 | **Padrões Estruturais** | Implementa Adapter, Decorator, Facade, Composite, Proxy, Bridge — isolando infraestrutura e compondo comportamentos | Criacionais, interfaces, composição |
| 08 | **Padrões Comportamentais** | Implementa Strategy, Observer, Command, State, Chain of Responsibility, Template Method — orquestrando regras de negócio sem acoplamento | Estruturais, eventos, callbacks |
| 09 | **Module Pattern + Patterns Web/React** | Module (IIFE, ES Modules, barrel exports), Composition vs Inheritance, HOC, Render Props, Hooks Pattern, Compound Components, Context + Provider → frontend do e-commerce em React | Patterns GoF, componentes React, hooks |
| 10 | **DDD — Modelagem Estratégica** | Define Ubiquitous Language, identifica 4 Bounded Contexts (Vendas, Estoque, Pagamento, Catálogo), mapeia relações via Context Mapping, executa Event Storming | Patterns, modelagem OO, negócio |
| 11 | **DDD — Padrões Táticos** | Implementa Entities, Value Objects, Aggregates com invariantes, Domain Events, Repositories (contratos), Domain Services em cada Bounded Context | DDD estratégico, Value Objects, aggregates |
| 12 | **Arquitetura de Software — Estilos e Decisões** | Compara Layered, Hexagonal, Clean, Vertical Slices, Microservices; modela com C4 Model; documenta decisões com ADRs | DDD, camadas, contratos |
| 13 | **Clean Architecture na Prática** | Migra o projeto para 4 camadas (domain/application/infrastructure/interface), aplica regra da dependência, testa arquitetura com dependency-cruiser | Estilos arquiteturais, DI, testes |
| 14 | **Engenharia de Requisitos** | Elicitação, User Stories, Casos de Uso, critérios de aceitação, priorização. 🤖 Agente extrai requisitos → gera cards | Negócio, user stories, critérios |
| 15 | **SDD + BDD com Gherkin** | Escreve cenários Given-When-Then para 10 features, automatiza com Cucumber.js, Specification by Example. 🤖 Agente interpreta Gherkin → gera step definitions | Requisitos, testes de aceitação, Cucumber |
| 16 | **TDD — Red-Green-Refactor** | Ciclo TDD completo para 3 features reais, FIRST principles, mocks/stubs/fakes com Jest | Jest, testes unitários, domínio |
| 17 | **Pirâmide de Testes & Testes Avançados** | Testes de integração (DB em memória), E2E (Playwright), contrato (Pact), performance (k6), property-based testing | TDD, Jest, APIs, DB |
| 18 | **CI/CD Pipeline** | GitHub Actions workflow completo com 6 jobs, quality gates (lint, typecheck, test, coverage), cache, matrix strategy | Git, GitHub, Docker, testes |
| 19 | **DevSecOps** | CodeQL, Dependabot, secrets management, shift-left security. 🤖 Agente revisando PRs com checklist de segurança | CI/CD, segurança, GitHub Actions |
| 20 | **DevOps & Observabilidade** | Docker Compose stack completa, pino, prom-client, OpenTelemetry, Grafana, SLI/SLO/Error Budget | Docker Compose, métricas, logs |
| 21 | **Qualidade, Code Review & Pipeline Agêntico** | SonarQube, métricas de qualidade, code review checklist, fitness functions. 🤖 Pipeline completo: card Jira → agente planejador → HITL humano → agente implementador → agente revisor → CI/CD → merge | Todo o módulo, agentes, CI/CD |

**Eixo transversal**: o fio condutor de todas as aulas é o **ciclo de maturidade do software mediado por agentes** — o aluno descobre como escrever código limpo (Bloco A), como estruturá-lo com princípios e patterns (Bloco B), como modelar o domínio e a arquitetura (Bloco C), como especificar e testar sistematicamente (Bloco D), e como entregar, operar e amplificar sua capacidade com agentes de IA (Bloco E). O modelo mental expande progressivamente: linha de código → classe → módulo → pattern → bounded context → arquitetura → especificação → teste → pipeline → operação → qualidade → agentes.

## O mecanismo central (eixo transversal)

```
Código Sujo → [Clean Code + Refactoring] → [SOLID] → [Design Patterns] → [DDD Estratégico + Tático] → [Arquitetura] → [Especificação] → [Testes] → [Pipeline CI/CD] → [Operação] → [Qualidade] → [Pipeline Agêntico]
     └── Bloco A: Fundamentos ────────┘  └─ Bloco B: Patterns ──┘  └─ Bloco C: Domínio & Arquitetura ──┘  └── Bloco D: Qualidade & Especificação ──┘  └── Bloco E: Entrega, Operação & Agentes ──┘
```

A cada aula o aluno adiciona uma camada a este modelo: primeiro limpa o código (Aulas 01-03), depois estrutura com princípios (Aulas 04-05), depois domina patterns criacionais, estruturais, comportamentais e web (Aulas 06-09), depois modela o domínio com DDD (Aulas 10-11), depois projeta a arquitetura limpa (Aulas 12-13), depois especifica requisitos e automatiza com BDD (Aulas 14-15), depois testa com TDD e pirâmide completa (Aulas 16-17), depois automatiza a entrega com CI/CD e segurança (Aulas 18-19), depois instrumenta a operação (Aula 20), e finalmente fecha o ciclo com métricas de qualidade e agentes como parceiros de desenvolvimento (Aula 21).

## Sequência das 21 aulas

### Bloco A — Fundamentos (Aulas 01–04)

### Aula 01: Introdução à Engenharia de Software — Visão Geral e Projeto Progressivo

**Fluxo da aula**: Contexto (por que engenharia de software importa) → Roadmap (as 21 aulas e 5 blocos) → Experiência (setup do projeto progressivo) → Entendimento (ciclo de vida, dívida técnica, custo da bagunça).

**Conteúdo**:

1. **Contexto (10 min)**: engenharia de software não é sobre ferramentas — é sobre construir sistemas que evoluem sem colapsar. Dados da indústria: 85% do custo total de um sistema está na manutenção (Standish Group). O desenvolvedor passa 10x mais tempo lendo código do que escrevendo. Custo da bagunça: projetos que começam rápidos e ficam cada vez mais lentos — não porque a tecnologia envelheceu, mas porque o design não foi pensado para mudança.

2. **Roadmap do módulo (10 min)**: visão geral dos 5 blocos. Bloco A (Fundamentos): código limpo e SOLID — a base de tudo. Bloco B (Design Patterns): repertório de soluções canônicas GoF + patterns web/React. Bloco C (Domínio & Arquitetura): DDD estratégico e tático, estilos arquiteturais, Clean Architecture. Bloco D (Qualidade & Especificação): engenharia de requisitos, SDD/BDD, TDD, pirâmide de testes. Bloco E (Entrega, Operação & Agentes): CI/CD, DevSecOps, observabilidade, pipeline agêntico. O que o aluno terá construído ao final: uma API de e-commerce full-stack com arquitetura limpa, testes completos, pipeline automatizado e agentes integrados.

3. **Setup do projeto progressivo (20 min)**: inicialização do repositório. `npm init`, TypeScript config (`strict: true`), Express básico, ESLint + Prettier configurados. Estrutura inicial simples: controllers, routes, middlewares. Um endpoint `GET /health` e `POST /orders` funcionais. Ponto de alavanca: *"este é o state inicial — código que funciona, mas não foi projetado. Ao longo do módulo, você vai transformá-lo em algo que evolui com segurança."*

4. **Entendimento (15 min)**: ciclo de vida do software — planejar, codificar, testar, entregar, operar, manter. Cada fase tem seus desafios e o módulo cobre todas. Dívida técnica como metáfora financeira: você pega emprestado tempo agora e paga com juros depois. Tipos de dívida: deliberada (decisão consciente), acidental (evolução do design), bit rot (entropia). A relação entre qualidade interna e velocidade de entrega: software bem projetado acelera com o tempo; software mal projetado desacelera até parar.

**Comandos da aula**: `npm init`, `npm install express typescript @types/express`, `npx tsc --init`, `npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin`, `npx eslint --init`.

**Destaque do projeto**: o aluno inicializa o repositório do projeto progressivo — uma API Express com TypeScript strict, ESLint configurado e endpoints funcionais. Este é o ponto de partida que será transformado aula a aula. 

### Aula 02: Clean Code — Nomes, Funções e Estrutura

**Fluxo da aula**: Problema (código ilegível de 300 linhas) → Experiência (refatorar juntos, extrair funções, renomear) → Entendimento (princípios: DRY, KISS, YAGNI, SLAP) → Prática (aplicar ao projeto).

**Conteúdo**:

1. **Problema (breve — 5 min)**: o aluno recebe um controller Express de 300 linhas com nomes genéricos (`data`, `result`, `tmp`), funções de 80 linhas com múltiplos níveis de abstração, condicionais aninhados, duplicação de lógica de validação. Ponto de alavanca: *"você entendeu esse código em 30 segundos? Nem o você de amanhã vai entender."*

2. **Experiência (mão na massa — 30 min)**: refatoração guiada passo a passo. Extrair validação para funções nomeadas (`validateOrderPayload`, `validateCustomerId`). Extrair formatação de resposta para helper (`formatOrderResponse`). Renomear variáveis para revelar intenção (`orderTotal` em vez de `tot`, `customerEmail` em vez de `e`). Reduzir cada função para ≤ 20 linhas com SLAP (Single Level of Abstraction Principle) — uma função, um nível de abstração. Eliminar duplicação entre `create` e `update`.

3. **Entendimento (a teoria explica a experiência — 15 min)**: nomenclatura significativa: variáveis, funções e classes devem revelar intenção, não implementação. Funções: pequenas, com poucos argumentos (ideal ≤ 2), sem side effects inesperados. DRY (Don't Repeat Yourself): não é sobre código idêntico — é sobre conhecimento duplicado. KISS (Keep It Simple, Stupid): simplicidade como escolha deliberada. YAGNI (You Ain't Gonna Need It): não construa para o futuro hipotético. Comentários: o melhor comentário é um bom nome.

4. **Prática (10 min)**: o aluno aplica os princípios ao `OrderController` do projeto progressivo. Cada refactoring é validado pelos testes existentes.

**Comandos da aula**: `npx eslint . --fix`, `git diff` (para ver antes/depois).

**Destaque do projeto**: o aluno refatora o controller Express monolítico de 300 linhas em funções pequenas e nomeadas, com níveis de abstração consistentes. O código fica legível em 30 segundos. Os testes continuam passando — a rede de segurança prova que o comportamento não mudou.

### Aula 03: Refactoring — Catálogo e Prática

**Fluxo da aula**: Code Smells (4 famílias) → Catálogo de Refactorings → Experiência (aplicar refactorings no projeto) → Ferramentas (ESLint como segurança).

**Conteúdo**:

1. **Code Smells — 4 famílias (15 min)**: **Bloaters** (Long Method, Large Class, Long Parameter List, Data Clumps) — código que cresceu demais. **Abusers** (Switch Statements, Temporary Field, Refused Bequest, Alternative Classes with Different Interfaces) — uso incorreto de OO. **Change Preventers** (Divergent Change, Shotgun Surgery, Parallel Inheritance Hierarchies) — mudar uma coisa quebra várias. **Dispensables** (Comments, Duplicate Code, Dead Code, Speculative Generality, Lazy Class) — código que não deveria existir. Cada smell com exemplo real do projeto.

2. **Catálogo de Refactorings (15 min)**: organizado por propósito. Composing Methods: Extract Method, Inline Method, Extract Variable, Replace Temp with Query. Moving Features: Move Method, Move Field, Extract Class, Inline Class. Organizing Data: Replace Magic Number with Symbolic Constant, Encapsulate Field. Simplifying Conditionals: Decompose Conditional, Consolidate Conditional Expression, Replace Nested Conditional with Guard Clauses.

3. **Experiência (mão na massa — 20 min)**: o aluno aplica refactorings no projeto. Extrai `calculateShipping` de `OrderService` (Long Method → Extract Method). Move `validateEmail` para `Email` Value Object (Feature Envy → Move Method). Substitui `if (status === 'pending') ... else if (status === 'confirmed') ...` por guard clauses. Configura ESLint com regras de complexidade (`complexity`, `max-lines-per-function`, `max-params`).

4. **Testes como rede de segurança (10 min)**: refactoring sem testes é cirurgia sem monitor cardíaco. O aluno executa `npx jest --watchAll` durante a refatoração — cada mudança é validada imediatamente. Git como checkpoint: commit a cada refactoring bem-sucedido.

**Comandos da aula**: `npx eslint . --fix`, `npx jest --watchAll`, `git add -p`.

**Destaque do projeto**: o aluno identifica code smells no projeto usando o catálogo, aplica refactorings do livro do Fowler com segurança (testes passando), e configura ESLint como guardião automatizado. O código agora tem cheiro zero detectável por ferramentas.

### Aula 04: SOLID — SRP, OCP, LSP

**Fluxo da aula**: Problema (cada mudança quebra 3 partes) → Experiência (aplicar SRP, OCP, LSP no código real) → Entendimento (o que cada princípio resolve) → Prática (refatorar o projeto).

**Conteúdo**:

1. **Problema (breve — 5 min)**: o aluno adiciona um novo meio de pagamento (Pix) e precisa modificar `OrderService`, `PaymentController` e `NotificationService`. Adicionar um campo no pedido quebra os relatórios. Ponto de alavanca: *"toda feature nova exige alterar código que já funciona — isso é SOLID gritando para ser aplicado."*

2. **SRP — Single Responsibility Principle (15 min)**: uma classe deve ter um, e apenas um, motivo para mudar. Separação de `OrderService` monolítico em `CreateOrderService`, `CalculateShippingService`, `ProcessPaymentService`. Cada classe com responsabilidade única. Critério prático: descreva o que a classe faz em uma frase sem usar "e" ou "ou".

3. **OCP — Open/Closed Principle (15 min)**: aberto para extensão, fechado para modificação. Criação da interface `PaymentGateway` e implementações `CreditCardGateway`, `PixGateway`, `BoletoGateway`. Novo meio de pagamento = nova classe, zero alterações no código existente. Strategy pattern como aplicação natural do OCP.

4. **LSP — Liskov Substitution Principle (15 min)**: subtipos devem ser substituíveis por seus tipos base. Exemplo prático: `PhysicalProduct` e `DigitalProduct` devem ser substituíveis onde `Product` é esperado. O digital não tem peso — o cálculo de frete não pode quebrar. Violação clássica: `if (product instanceof PhysicalProduct)` no service — sinal de que LSP foi violado. Solução: contrato bem definido na interface base.

5. **Prática (10 min)**: o aluno aplica os 3 princípios no projeto. Cada refactoring é validado por testes.

**Destaque do projeto**: o aluno refatora o projeto aplicando SRP (services com responsabilidade única), OCP (gateways de pagamento extensíveis sem modificar código existente) e LSP (produtos físicos e digitais substituíveis). O código agora aceita mudanças sem efeitos colaterais em cascata.

### Bloco B — Design Patterns (Aulas 05–09)

### Aula 05: SOLID — ISP, DIP + Dependency Injection

**Fluxo da aula**: Problema (interfaces gordas, acoplamento a detalhes) → Experiência (aplicar ISP, DIP) → tsyringe como contêiner DI → Prática (refatorar com injeção).

**Conteúdo**:

1. **Problema (breve — 5 min)**: o repositório atual `IOrderRepository` tem 15 métodos — `findById`, `save`, `delete`, `findByCustomer`, `findPending`, `countByStatus`, `getTotalRevenue`... O `CheckoutService` só usa `findById` e `save`, mas depende da interface inteira. Para testar, precisa mockar 15 métodos. Ponto de alavanca: *"você não implementa métodos que não usa; por que sua interface te obriga a conhecê-los?"*

2. **ISP — Interface Segregation Principle (15 min)**: clientes não devem depender de métodos que não usam. Separação de `IOrderRepository` (leitura/escrita de pedidos) de `IInventoryRepository` (consulta de estoque) e `IOrderQueryRepository` (relatórios). Interfaces enxutas = mocks enxutos = testes simples. CQRS como evolução natural do ISP: separar comandos (escrita) de consultas (leitura).

3. **DIP — Dependency Inversion Principle (15 min)**: módulos de alto nível não devem depender de módulos de baixo nível — ambos devem depender de abstrações. `CreateOrderService` depende de `IOrderRepository` (contrato), não de `PostgresOrderRepository` (implementação concreta). A seta da dependência aponta para a abstração. Ponto de alavanca: *"é como `fetch` — você depende do protocolo HTTP, não de um servidor específico."*

4. **Dependency Injection com tsyringe (15 min)**: o contêiner como fábrica inteligente. Registro de implementações contra contratos: `container.register('IOrderRepository', { useClass: PostgresOrderRepository })`. Resolução automática do grafo de dependências. Ciclo de vida: transient (novo a cada resolução), singleton (mesma instância sempre). Configuração no `tsconfig.json`: `experimentalDecorators: true`, `emitDecoratorMetadata: true`.

5. **Prática (10 min)**: o aluno aplica ISP e DIP no projeto, configura tsyringe e testa que as dependências são injetadas corretamente.

**Comandos da aula**: `npm install tsyringe reflect-metadata`, configuração de decorators no `tsconfig.json`.

**Destaque do projeto**: o aluno completa o SOLID com ISP (interfaces enxutas e segregadas) e DIP (serviços dependem de contratos, não de implementações). Configura tsyringe como contêiner de injeção de dependência. Agora é possível trocar PostgreSQL por MongoDB trocando apenas a implementação do repositório — zero alterações na lógica de negócio.

### Aula 06: Padrões Criacionais

**Fluxo da aula**: Problema (criação de objetos espalhada, acoplada) → Experiência (implementar 6 patterns criacionais no projeto) → Catálogo (quando usar cada um) → Object Literal (pattern fundamental JS/TS).

**Conteúdo**:

1. **Problema (breve — 5 min)**: o código do e-commerce cria gateways de pagamento com `new CreditCardGateway()` espalhado em 4 lugares. Se adicionar um parâmetro no construtor, quebra tudo. A criação de `Order` envolve 8 validações copiadas em 3 endpoints. Ponto de alavanca: *"criação de objetos é responsabilidade de alguém — se esse alguém é 'todo mundo', o acoplamento é máximo."*

2. **Factory Method (10 min)**: `PaymentGatewayFactory.create(type)` — o controller não sabe qual classe concreta está usando. Encapsula a decisão de instanciação.

3. **Abstract Factory (10 min)**: criação de famílias de objetos relacionados. `OrderProcessorFactory` (concreta: `BrazilOrderProcessorFactory`, `InternationalOrderProcessorFactory`) — produz `PaymentProcessor`, `TaxCalculator`, `ShippingProvider` compatíveis entre si.

4. **Builder (10 min)**: construção passo a passo de objetos complexos. `OrderBuilder` com fluent API: `new OrderBuilder().forCustomer(customerId).addItem(product, 2).withCoupon('BLACK20').build()`.

5. **Singleton (5 min)**: instância única com acesso global. Caso legítimo: connection pool do PostgreSQL, instância do tsyringe container. Quando NÃO usar: "vou precisar de um só por enquanto" — YAGNI.

6. **Object Literal (10 min)**: o pattern criacional mais fundamental do JavaScript/TypeScript. Substitui Factory Method em muitos casos: `const paymentGateways = { credit: new CreditCardGateway(), pix: new PixGateway() }`. Namespace, configuração, lookup table.

7. **Prototype (5 min)**: clonagem de objetos existentes. `Object.create()` como mecanismo nativo. Útil para templates de objetos com estado inicial complexo (ex: `OrderTemplate` para pedidos recorrentes).

8. **Catálogo e prática (10 min)**: visão geral de quando usar cada pattern criacional. O aluno implementa Factory Method, Builder e Object Literal no projeto.

**Destaque do projeto**: o aluno implementa 6 padrões criacionais no e-commerce. A criação de gateways de pagamento é centralizada via Factory Method. A construção de pedidos usa Builder com fluent API. Object Literal substitui factories simples. O acoplamento de criação é reduzido a pontos únicos de instanciação.

### Aula 07: Padrões Estruturais

**Fluxo da aula**: Problema (acoplamento a APIs externas, composição de comportamentos) → Experiência (implementar 6 patterns estruturais) → Catálogo (quando usar cada um).

**Conteúdo**:

1. **Problema (breve — 5 min)**: a API dos Correios mudou o contrato — 12 arquivos quebrados. O gateway de pagamento precisa de logging, retry e validação — mas modificar o código original é arriscado. O relatório de vendas precisa tratar `Order` e `OrderCollection` da mesma forma. Ponto de alavanca: *"estruturas bem projetadas isolam a mudança. Estruturas mal projetadas propagam a mudança."*

2. **Adapter (15 min)**: traduz uma interface externa para o contrato esperado pelo sistema. `CorreiosApiAdapter` converte o XML dos Correios para `ShippingQuote`. `PagarmeAdapter` / `StripeAdapter` — troca de gateway de pagamento sem alterar regras de negócio.

3. **Decorator (15 min)**: adiciona comportamento a objetos sem modificar o original. `LoggingPaymentGateway` (log antes/depois), `RetryPaymentGateway` (3 tentativas com backoff), `ValidationPaymentGateway` (valida antes de delegar). Composição: `new RetryGateway(new LoggingGateway(new CreditCardGateway()))`.

4. **Facade (10 min)**: interface simplificada para subsistema complexo. `CheckoutFacade` orquestra `OrderService` + `PaymentService` + `InventoryService` + `EmailService` em um método `checkout(cart)`. O controller chama uma linha em vez de 20.

5. **Composite (10 min)**: tratar objetos individuais e composições uniformemente. `OrderItem` (produto individual) e `BundleItem` (kit com múltiplos produtos) implementam `OrderItemComponent`. Cálculo de total funciona em ambos sem `if (item instanceof Bundle)`.

6. **Proxy (10 min)**: substituto que controla acesso ao objeto real. `CachedProductRepository` (cache em Redis antes de consultar PostgreSQL). `LazyOrderLoader` (carrega itens do pedido sob demanda).

7. **Bridge (5 min)**: separa abstração de implementação para que variem independentemente. `ShippingMethod` (Express, Standard) e `ShippingProvider` (Correios, Transportadora) — combinações M×N sem explosão de classes.

**Destaque do projeto**: o aluno implementa 6 padrões estruturais no e-commerce. APIs externas são isoladas via Adapter. Comportamentos cross-cutting (logging, retry) são compostos via Decorator. O checkout é simplificado com Facade. Relatórios usam Composite para tratar itens e bundles uniformemente.

### Aula 08: Padrões Comportamentais

**Fluxo da aula**: Problema (condicionais gigantes para algoritmos, acoplamento entre emissores e receptores) → Experiência (implementar 6 patterns comportamentais) → Catálogo.

**Conteúdo**:

1. **Problema (breve — 5 min)**: `switch` de 12 cases para tipo de frete. Notificação de pedido acoplada a 4 serviços. Transições de status do pedido com `if/else` aninhado impossível de manter. Ponto de alavanca: *"comportamento flexível não se faz com condicionais — se faz com delegação."*

2. **Strategy (15 min)**: encapsula algoritmos intercambiáveis. `ShippingCalculator` com `CorreiosStrategy`, `TransportadoraStrategy`, `RetiradaStrategy`. Troca de algoritmo em runtime sem `switch`. O contexto (`OrderService`) delega para a estratégia ativa.

3. **Observer (15 min)**: notificação automática para interessados. `OrderPlacedEvent` → `InventoryObserver` (reserva estoque), `EmailObserver` (confirmação), `InvoiceObserver` (emissão de nota). Acoplamento zero entre o emissor e os observers.

4. **Command (15 min)**: encapsula operação como objeto. `PlaceOrderCommand`, `CancelOrderCommand`, `RefundPaymentCommand`. Permite fila, log, undo/redo. `CommandProcessor` executa comandos com transação e retry.

5. **State (10 min)**: comportamento varia com estado interno. `Order` transita entre estados (`Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`). Cada estado é uma classe que implementa transições válidas. Sem `if (status === 'pending')` — o polimorfismo resolve.

6. **Chain of Responsibility (10 min)**: cadeia de handlers que processam ou passam adiante. Validação de pedido: `ItemAvailabilityHandler` → `CreditLimitHandler` → `FraudCheckHandler` → `CouponValidationHandler`. Cada handler decide: "eu trato isso ou passo para o próximo?".

7. **Template Method (5 min)**: esqueleto de algoritmo com passos customizáveis. `PaymentProcessor` com `validate()`, `process()`, `confirm()`, `notify()`. `CreditCardProcessor` e `PixProcessor` implementam os passos específicos.

**Destaque do projeto**: o aluno implementa 6 padrões comportamentais no e-commerce. Cálculo de frete usa Strategy. Eventos de domínio usam Observer. Estados do pedido usam State pattern. A validação de checkout forma uma Chain of Responsibility. O código ganha flexibilidade sem a complexidade de condicionais aninhados.

### Aula 09: Module Pattern, Composição & Patterns Web/React

**Fluxo da aula**: Module Pattern (IIFE, ES Modules, barrel exports) → Composição vs Herança → Patterns React (HOC, Render Props, Hooks, Compound Components, Context + Provider) → Frontend do e-commerce.

**Conteúdo**:

1. **Module Pattern (10 min)**: evolução histórica. IIFE (Immediately Invoked Function Expression) como encapsulamento pré-ES6. ES Modules como padrão moderno: `export`/`import`, escopo de módulo, tree shaking. Barrel exports: `index.ts` que reexporta de submódulos — `import { Order, OrderItem } from './domain'`.

2. **Composição vs Herança (10 min)**: o princípio mais importante do design OO moderno. Herança = "é um" (tight coupling, frágil). Composição = "tem um" (flexível, testável). Exemplo: `AuditableOrder` (herança) vs `Order` com `AuditTrail` injetado (composição). React é fundamentalmente baseado em composição — componentes são funções que compõem outras funções.

3. **Higher-Order Components (10 min)**: função que recebe componente e retorna componente. `withAuth(CheckoutPage)`, `withLoading(ProductList)`. Encapsula lógica cross-cutting (auth, loading, error boundary) sem modificar o componente original.

4. **Render Props (10 min)**: compartilhar lógica via prop que é função. `<MouseTracker render={(position) => <Cat position={position} />} />`. Flexível mas verboso — predecessor dos hooks.

5. **Hooks Pattern (15 min)**: hooks como padrão de composição de lógica. `useOrder()` encapsula estado e operações do pedido. `useAuth()` gerencia autenticação. `useCart()` gerencia carrinho. Custom hooks extraem lógica reutilizável sem HOC wrapper hell.

6. **Compound Components (10 min)**: componentes que compartilham estado implícito. `<OrderSummary>` contém `<OrderSummary.Header>`, `<OrderSummary.Items>`, `<OrderSummary.Total>`. O pai gerencia estado; os filhos acessam via Context interno.

7. **Context + Provider Pattern (10 min)**: estado global com escopo controlado. `OrderContext` + `OrderProvider` — qualquer componente na árvore acessa `useOrderContext()`. Evita prop drilling em árvores profundas.

8. **Frontend do e-commerce (10 min)**: o aluno aplica os patterns ao frontend React do projeto progressivo. Página de checkout com Compound Components. Carrinho com Context + Provider. Autenticação com HOC.

**Destaque do projeto**: o aluno implementa o frontend React do e-commerce aplicando Module Pattern (organização de arquivos), HOC (auth), Hooks Pattern (lógica de carrinho e pedidos), Compound Components (checkout) e Context + Provider (estado global). O frontend ganha a mesma qualidade de engenharia que o backend.

### Bloco C — Domínio & Arquitetura (Aulas 10–13)

### Aula 10: DDD — Modelagem Estratégica

**Fluxo da aula**: Problema (modelo de dados não reflete o negócio) → Ubiquitous Language → Strategic Design (Bounded Contexts, Context Mapping) → Event Storming (workshop colaborativo).

**Conteúdo**:

1. **Problema (breve — 5 min)**: o banco tem tabelas `orders`, `products`, `payments` com colunas genéricas (`status` varchar, `data` jsonb). Quando o time de negócio diz "pedido confirmado", o dev não sabe se é `status = 'approved'` ou `payment_status = 'paid'`. A linguagem do código não é a linguagem do negócio.

2. **Ubiquitous Language (15 min)**: workshop de modelagem — o aluno extrai os termos do domínio colaborando com um "especialista de negócio" simulado. Glossário compartilhado: Order, LineItem, Product, Money, Payment, ShippingAddress, Stock, Coupon. Cada termo com definição precisa, usado no código com o mesmo nome. Exemplo: "Money não é `number` — é `{ amount: number, currency: string }` com operações `add`, `subtract`, `multiply`."

3. **Bounded Contexts (15 min)**: identificação de 4 contexts no e-commerce. **Vendas**: criação de pedidos, checkout, carrinho. **Estoque**: disponibilidade, reserva, reposição. **Pagamento**: processamento, conciliação, reembolso. **Catálogo**: produtos, preços, categorias. Cada context tem seu próprio modelo — `Product` no Catálogo (nome, descrição, fotos) é diferente de `Product` em Vendas (SKU, preço corrente).

4. **Context Mapping (15 min)**: relações entre contexts. Vendas ↔ Estoque: Partnership (colaboração próxima). Vendas ↔ Pagamento: Customer-Supplier (Pagamento provê serviço). Catálogo ↔ Vendas: Conformist (Vendas se adapta ao modelo do Catálogo). Integração externa (gateways) ↔ Pagamento: ACL — Anti-Corruption Layer (traduz o modelo externo para não contaminar o domínio).

5. **Event Storming (10 min)**: workshop visual. Comandos (ações do usuário: "Cliente faz pedido"), Eventos (fatos que aconteceram: "Pedido Realizado"), Aggregates (entidades que reagem: "Order"), Políticas (regras automáticas: "Quando Pedido Realizado → Reservar Estoque"). Post-its coloridos que mapeiam o fluxo "cliente faz pedido → pagamento confirmado → estoque reservado → pedido enviado".

**Destaque do projeto**: o aluno modela 4 Bounded Contexts usando Event Storming, define Ubiquitous Language compartilhada e estabelece Context Mapping entre os contexts. O modelo mental migra de "tabelas de banco" para "contextos de negócio com linguagem própria".

### Aula 11: DDD — Padrões Táticos

**Fluxo da aula**: Entities, Value Objects, Aggregates, Domain Events, Repositories, Domain Services — implementação completa em cada Bounded Context.

**Conteúdo**:

1. **Entities (15 min)**: objetos com identidade contínua. `Order` (identidade: `orderId`, mutável ao longo do ciclo de vida). `Product` (identidade: `productId`). Comparação por identidade, não por atributos. Duas orders com mesmos valores mas `orderId` diferentes são entidades diferentes.

2. **Value Objects (15 min)**: objetos sem identidade, definidos por seus atributos, imutáveis. `Money` (`{ amount: number, currency: 'BRL' | 'USD' }`) com operações `add`, `subtract`, `multiply`. `Address` (street, city, state, zip, country). `Email` com validação interna e normalização. `OrderStatus` como enum tipado (nunca `string`). VOs eliminam primitive obsession.

3. **Aggregates (15 min)**: cluster de entidades e VOs tratados como unidade de consistência. `Order` como aggregate root: contém `OrderItems[]`, `ShippingAddress`, `PaymentInfo`. Invariantes garantidas pela raiz: total = soma dos subtotais, items nunca vazio após confirmação, status só avança (nunca retrocede). Acesso externo apenas pela raiz — ninguém modifica `OrderItem` diretamente.

4. **Domain Events (10 min)**: fatos relevantes que aconteceram no domínio. `OrderPlaced`, `PaymentConfirmed`, `StockReserved`, `OrderShipped`. Disparam side effects entre bounded contexts (ex: `OrderPlaced` → Estoque reserva itens).

5. **Repositories (10 min)**: contratos no domínio, implementações na infraestrutura. `IOrderRepository` define `save(order: Order)`, `findById(id: OrderId)`, `findByCustomer(customerId: CustomerId)`. `PostgresOrderRepository` implementa com SQL. O domínio não sabe que é PostgreSQL.

6. **Domain Services (5 min)**: lógica que não pertence naturalmente a uma entidade ou VO. `PricingService`: cálculo de desconto que envolve múltiplos aggregates. `DuplicateOrderDetector`: verifica se pedido é duplicado.

**Destaque do projeto**: o aluno implementa Entities, Value Objects, Aggregates com invariantes, Domain Events e Repositories em cada um dos 4 Bounded Contexts. O código fala a linguagem do negócio — cada classe representa um conceito do domínio, não uma tabela do banco.

### Aula 12: Arquitetura de Software — Estilos e Decisões

**Fluxo da aula**: Estilos arquiteturais (Layered, Hexagonal, Clean, Vertical Slices, Microservices) → Comparação de trade-offs → C4 Model para documentação → ADRs para decisões.

**Conteúdo**:

1. **Por que arquitetura importa (5 min)**: arquitetura não é sobre frameworks — é sobre como organizar código para que mudanças sejam locais, não sistêmicas. O custo de uma má decisão arquitetural é pago com juros compostos ao longo de anos.

2. **Estilos arquiteturais (25 min)**: visão comparativa. **Layered Architecture**: Controller → Service → Repository. Simples, familiar, mas acoplada ao framework e banco. **Hexagonal / Ports & Adapters**: domínio no centro, portas (interfaces) definem contratos, adaptadores conectam ao mundo externo. **Clean Architecture**: círculos concêntricos — Entities → Use Cases → Interface Adapters → Frameworks. Regra da dependência: setas sempre apontam para dentro. **Vertical Slices**: organizar por feature, não por camada técnica. Cada feature contém seu controller, use case, domínio e infra. **Microservices**: sistemas distribuídos por domínio — cada Bounded Context vira um serviço independente.

3. **Trade-offs (10 min)**: cada estilo resolve um problema e cria outros. Layered é simples mas não escala em complexidade de domínio. Clean Architecture isola o domínio mas adiciona boilerplate. Vertical Slices evita acoplamento entre features mas pode duplicar infra. Microservices permitem deploy independente mas introduzem latência, consistência eventual e complexidade operacional. Não existe bala de prata.

4. **C4 Model (11 min)**: 4 níveis de abstração. **Context** (nível 1): sistema e sistemas externos — "E-commerce integra com Gateway de Pagamento, Correios, Email". **Container** (nível 2): API, SPA React, PostgreSQL, Redis. **Component** (nível 3): Bounded Contexts, Use Cases. **Code** (nível 4): classes. Diagramas Mermaid para cada nível.

5. **ADRs — Architecture Decision Records (9 min)**: documentar decisões arquiteturais. Formato: Título, Contexto (por que precisamos decidir), Decisão (o que escolhemos), Consequências (o que ganhamos e perdemos). Exemplo: "ADR-001: Usar Clean Architecture em vez de Layered tradicional". ADRs são a memória do projeto — explicam o "por quê" para o desenvolvedor do futuro.

**Destaque do projeto**: o aluno compreende 5 estilos arquiteturais com trade-offs, documenta a arquitetura do projeto com C4 Model em 4 níveis e cria ADRs para decisões-chave. A arquitetura deixa de ser implícita e passa a ser comunicável.

### Aula 13: Clean Architecture na Prática

**Fluxo da aula**: Migração do projeto para Clean Architecture (4 camadas) → tsyringe como orquestrador → Regra da dependência → Testes de arquitetura.

**Conteúdo**:

1. **Estrutura de 4 camadas (20 min)**: migração completa do projeto.
   ```
   src/
   ├── domain/          # Entities, Value Objects, Domain Events, Repository interfaces
   ├── application/     # Use Cases / Interactors (CreateOrder, ProcessPayment, CalculateShipping)
   ├── infrastructure/  # Implementações concretas (PostgresOrderRepository, CorreiosApiAdapter)
   └── interface/       # Controllers HTTP, Presenters, Middlewares (Express)
   ```
   Cada camada com seu propósito e regras de importação. `domain` não importa nada externo — nem bibliotecas, nem frameworks. `application` importa apenas `domain`. `infrastructure` implementa interfaces de `domain`. `interface` orquestra `application`.

2. **Regra da dependência (15 min)**: dependências sempre apontam para dentro. `interface → application → domain`. Inversão de controle: o contêiner tsyringe resolve `IOrderRepository → PostgresOrderRepository` na borda, injetando no Use Case que só conhece o contrato. Ponto de alavanca: *"o Use Case não sabe que banco de dados você usa — ele só sabe que alguém vai entregar um `IOrderRepository`."*

3. **Use Cases como orquestradores (10 min)**: cada Use Case é uma classe com método `execute`. `CreateOrderUseCase` recebe `IOrderRepository`, `IPaymentGateway`, `IInventoryService` via construtor. `execute(input: CreateOrderDTO): Promise<Order>`. Validações, regras de negócio e orquestração no Use Case, não no controller.

4. **Testes de arquitetura (10 min)**: dependency-cruiser para validar regras. `domain` não pode importar `infrastructure` ou `interface`. Teste automatizado que quebra se alguém violar a regra da dependência. Fitness functions arquiteturais no pipeline.

5. **DTOs e Mappers (5 min)**: separar modelo de domínio de modelo de API. `CreateOrderDTO` (input do controller) → `Order` (entidade de domínio) → `OrderResponseDTO` (output da API). Camada de mapeamento evita vazamento de detalhes de infraestrutura.

**Destaque do projeto**: o aluno migra o projeto completo para Clean Architecture com 4 camadas. O domínio não tem dependências externas — testar um Use Case requer apenas mocks de contratos. Trocar Express por Fastify afeta apenas a camada `interface`. Os testes de arquitetura garantem que ninguém quebre a regra da dependência.

### Bloco D — Qualidade & Especificação (Aulas 14–17)

### Aula 14: Engenharia de Requisitos

**Fluxo da aula**: Problema (construir feature errada = desperdício) → Elicitação (técnicas) → User Stories + Casos de Uso + Critérios de Aceitação → Priorização → 🤖 Agent Perspective: extração de requisitos via agente.

**Conteúdo**:

1. **Problema (breve — 5 min)**: o aluno já viveu — implementou exatamente o que estava na task, mas o PO disse "não era bem isso". O código certo para o entendimento errado. Ponto de alavanca: *"o bug mais caro é a feature que ninguém precisava."*

2. **Técnicas de elicitação (10 min)**: entrevistas com stakeholders, observação de usuários, análise de sistemas legados, workshops de requisitos. O三角ângulo da elicitação: o que o cliente DIZ, o que ele QUER, o que ele PRECISA — raramente são a mesma coisa.

3. **User Stories (10 min)**: formato "Como [ator], quero [ação] para [benefício]". INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable. Exemplo: "Como cliente, quero aplicar cupom de desconto ao pedido para obter abatimento no valor total."

4. **Casos de Uso (10 min)**: descrição de interação entre ator e sistema. Formato: Nome, Ator, Pré-condições, Fluxo Principal, Fluxos Alternativos, Pós-condições. Mais detalhado que User Story — complementar, não substituto.

5. **Critérios de aceitação (10 min)**: checklist verificável. Dado o cupom válido, não expirado, de 20%: aplicar ao pedido → total reduz em 20%. Dado cupom expirado: retornar erro "cupom vencido". Dado cupom já utilizado pelo cliente: retornar erro "cupom já utilizado". BDD nasce aqui — o próximo passo natural é transformar critérios em Gherkin.

6. **Priorização (5 min)**: MoSCoW: Must have, Should have, Could have, Won't have. RICE: Reach × Impact × Confidence / Effort. Priorizar não é opinar — é calcular.

7. **Agent Perspective (10 min)**: 🤖 demonstração — agente recebe descrição informal de feature ("preciso de um sistema de cashback") e extrai: User Stories estruturadas, critérios de aceitação, casos de uso, edge cases que o humano não pensou. O agente não substitui o Product Owner — amplifica a etapa de detalhamento. Output: cards de requisitos prontos para sprint.

**Destaque do projeto**: o aluno aplica técnicas de elicitação e escreve User Stories + critérios de aceitação para 5 features do e-commerce. Experimenta extração de requisitos via agente como acelerador da etapa de especificação.

### Aula 15: SDD + BDD com Gherkin

**Fluxo da aula**: Problema (especificação ambígua) → Gherkin (Given-When-Then) → Cucumber.js (automação) → Specification by Example → Living Documentation → 🤖 Agent Perspective: agente interpreta Gherkin e gera step definitions.

**Conteúdo**:

1. **Problema (breve — 5 min)**: especificação ambígua gera retrabalho. "O sistema deve aplicar desconto" — que desconto? Em que condições? Com quais limites? Ponto de alavanca: *"especificação que não executa é promessa. Especificação executável é contrato."*

2. **Gherkin (15 min)**: sintaxe Given-When-Then. **Given**: contexto inicial. **When**: ação do ator. **Then**: resultado esperado. Cenário como exemplo concreto: "Dado que o carrinho tem 3 itens totalizando R$ 300, Quando aplico o cupom 'BLACK20', Então o total do pedido é R$ 240". `Scenario Outline` para parametrizar múltiplos exemplos. `Background` para contexto comum a todos os cenários.

3. **10 cenários Gherkin (15 min)**: cobertura das principais features. Criar pedido, aplicar desconto, calcular frete, processar pagamento (aprovação + recusa), cancelar pedido, consultar status, listar pedidos do cliente, estornar pagamento, reservar estoque, notificar cliente.

4. **Cucumber.js (15 min)**: automação dos cenários. Configuração com TypeScript. Step definitions que traduzem Gherkin para chamadas à API real. `Given('o carrinho tem {int} itens totalizando {string}', (qty, total) => ...)`. World object para compartilhar estado entre steps.

5. **Specification by Example (5 min)**: cada cenário é um exemplo concreto que colabora com o entendimento entre dev, QA e negócio. O PO pode ler Gherkin; o computador pode executá-lo.

6. **Living Documentation (5 min)**: cenários Gherkin são documentação viva — sempre atualizados porque quebram se o comportamento mudar. Mais confiável que wiki.

7. **Agent Perspective (10 min)**: 🤖 demonstração — agente recebe arquivo `.feature` e gera step definitions completas. O desenvolvedor revisa e ajusta, mas 80% do boilerplate é gerado. Cenários de borda que o humano não pensou são sugeridos pelo agente.

**Destaque do projeto**: o aluno escreve 10 cenários Gherkin para features do e-commerce, automatiza com Cucumber.js e obtém especificações executáveis. O agente auxilia gerando step definitions e sugerindo cenários de borda.

### Aula 16: TDD — Red-Green-Refactor

**Fluxo da aula**: Ciclo TDD (Red → Green → Refactor) → FIRST principles → Prática (3 features completas) → Mocks, Stubs, Fakes.

**Conteúdo**:

1. **Red-Green-Refactor (10 min)**: o ciclo canônico. **Red**: escrever teste que falha — prova que a feature não existe. **Green**: implementação mínima para o teste passar — sem over-engineering, sem antecipação. **Refactor**: melhorar o código com segurança — testes garantem que nada quebrou. O tempo entre Red e Green deve ser medido em minutos, não horas.

2. **FIRST Principles (10 min)**: **Fast** (execução em ms, não em s), **Independent** (testes não dependem de ordem), **Repeatable** (mesmo resultado sempre, sem flaky tests), **Self-Validating** (passou/falhou sem interpretação humana), **Timely** (escrito antes do código). Cada violação de FIRST é um sinal de problema de design.

3. **Feature 1 — Criar Pedido (15 min)**: TDD passo a passo. Red: teste `CreateOrderUseCase` com campos obrigatórios e mock de repository. Green: implementa validações mínimas. Refactor: extrai `OrderValidator`. Red: teste com itens vazios deve falhar. Green: `if (items.length === 0) throw new EmptyOrderError()`. Refactor: inline validation.

4. **Feature 2 — Calcular Frete (15 min)**: Red: teste `CalculateShippingUseCase` com mock de `ShippingProvider`. Green: calcula frete por peso e CEP. Refactor: extrai `ShippingCalculator` com Strategy. Red: teste de frete grátis acima de R$ 300.

5. **Feature 3 — Processar Pagamento (15 min)**: Red: teste de pagamento aprovado (mock de `PaymentGateway`). Green: `processPayment` retorna transação. Red: teste de pagamento recusado deve lançar erro específico. Green: trata resposta do gateway.

6. **Mocks, Stubs, Fakes (5 min)**: distinção precisa. **Stub**: retorna valor fixo para controle do teste. **Mock**: verifica que foi chamado com parâmetros esperados. **Fake**: implementação simplificada (ex: `InMemoryOrderRepository` com array). Quando usar cada um.

**Destaque do projeto**: o aluno executa o ciclo TDD completo para 3 features reais do e-commerce. Ao final, os Use Cases têm cobertura de teste que prova que funcionam — não que "passaram no teste". Primeiro o teste, depois o código, depois a melhoria.

### Aula 17: Pirâmide de Testes & Testes Avançados

**Fluxo da aula**: Pirâmide de Testes (proporções) → Integração (DB em memória) → E2E (Playwright) → Contrato (Pact) → Performance (k6) → Property-Based.

**Conteúdo**:

1. **Pirâmide de Testes (10 min)**: proporção ideal — muitos unitários (rápidos, isolados, sem I/O), menos integração (componentes reais juntos), poucos E2E (sistema completo, lentos, frágeis). Antipatterns: pirâmide invertida (muitos E2E), cone de sorvete (testes manuais no topo). Cada nível responde uma pergunta: unidade → "a lógica está correta?", integração → "os componentes conversam?", E2E → "o sistema funciona para o usuário?".

2. **Testes de Integração (15 min)**: testar repositórios com banco em memória (better-sqlite3 ou pg-mem). Sem Docker, execução em ms. Testar gateways com nock (mock de HTTP externo). Testar controllers com Supertest (API Express completa, banco em memória).

3. **Testes E2E com Playwright (15 min)**: fluxo completo do usuário. Abre navegador, navega na SPA React, adiciona item ao carrinho, faz checkout, preenche pagamento, confirma pedido. Screenshot em falha. Gravação de vídeo da sessão. Ponto de alavanca: *"E2E testa o que o usuário vê. Se o Playwright consegue comprar no seu site, o site funciona."*

4. **Testes de Contrato com Pact (10 min)**: CDC — Consumer-Driven Contracts. Se a API de pagamentos mudar o formato da resposta, o teste do consumidor quebra antes do deploy. Evita o "funciona na minha máquina" entre serviços.

5. **Testes de Performance com k6 (10 min)**: simulação de carga. 100 usuários simultâneos no endpoint de checkout. Métricas: p95, p99, throughput, error rate. Threshold: p95 < 200ms sob 100 VUs.

6. **Property-Based Testing (5 min)**: em vez de "input X → output Y", você define propriedades: "para qualquer lista de OrderItem com preços positivos, o total do pedido deve ser ≥ 0". fast-check gera centenas de inputs aleatórios e verifica a propriedade.

**Destaque do projeto**: o aluno implementa a pirâmide completa: unitários (TDD), integração (DB em memória + nock), E2E (Playwright), contrato (Pact), performance (k6) e property-based (fast-check). A confiança não é um número de coverage — é a certeza de que se algo quebrar, um teste vai gritar.

### Bloco E — Entrega, Operação & Agentes (Aulas 18–21)

### Aula 18: CI/CD Pipeline

**Fluxo da aula**: Problema (deploy manual = erro + demora) → GitHub Actions workflow completo → Quality gates → Cache e matrix → Pipeline como produto.

**Conteúdo**:

1. **Problema (breve — 5 min)**: deploy manual: rodar testes (às vezes esquece), buildar, subir no servidor, rezar. Pipeline automatizado é um guardião que não esquece etapas.

2. **Workflow completo (25 min)**: GitHub Actions para o e-commerce.
   ```yaml
   name: CI/CD Pipeline
   on: [push, pull_request]
   jobs:
     lint:        # ESLint + Prettier
     typecheck:   # tsc --noEmit
     unit-test:   # Jest unitários
     integration: # Jest integração
     e2e:         # Playwright E2E
     build:       # tsc build + Docker build
     deploy:      # Deploy staging/production
   ```
   Jobs paralelos onde possível (lint, typecheck, unit-test rodam juntos). `needs` para encadear: `build` precisa de `lint + typecheck + test`. Matrix strategy: testar em Node.js 20, 22. Cache de `node_modules` e Docker layers.

3. **Quality Gates (15 min)**: o pipeline decide se o merge pode acontecer. ESLint: `--max-warnings 0`. TypeScript: `strict: true`, zero erros. Jest: coverage ≥ 80% branches. SonarQube: zero bugs bloqueadores. Qualquer gate falhando bloqueia o merge. Branch protection rules no GitHub configuradas.

4. **Deploy multi-ambiente (10 min)**: `staging` (automático no push da main). `production` (approval gate manual). Environment-specific secrets e variáveis. Rollback automatizado se health check falhar.

5. **Pipeline como produto (5 min)**: o pipeline não é um script descartável — é código que evolui com o projeto. Versionado, revisado, testado.

**Destaque do projeto**: o aluno cria um pipeline GitHub Actions completo com 6 jobs, quality gates bloqueantes, cache inteligente e deploy multi-ambiente com approval manual. `git push` dispara tudo — do lint ao deploy com zero intervenção humana até o approval gate de produção.

### Aula 19: DevSecOps

**Fluxo da aula**: Problema (segurança como afterthought) → SAST (CodeQL) → Dependency Scanning (Dependabot) → Secrets Management → Shift-Left Security → 🤖 Agent Perspective: agente revisando PRs com checklist de segurança.

**Conteúdo**:

1. **Problema (breve — 5 min)**: "depois a gente vê segurança" — e nunca vê. Vulnerabilidade em dependência, secret no código, SQL injection que passou no review. Ponto de alavanca: *"segurança integrada ao pipeline é mais barata que incidente em produção."*

2. **SAST com CodeQL (15 min)**: análise estática no pipeline. CodeQL varre o código em busca de padrões de vulnerabilidade: SQL injection, XSS, path traversal, secrets expostos, uso inseguro de criptografia. Integração nativa com GitHub Actions. Alertas de segurança no PR antes do merge.

3. **Dependency Scanning (15 min)**: Dependabot monitora `package.json` e abre PRs automáticos para atualizar dependências com CVEs conhecidas. Snyk como alternativa. Score de segurança da cadeia de dependências. Política: vulnerabilidades critical/high bloqueiam o pipeline.

4. **Secrets Management (10 min)**: nada de `.env` no repositório. Variáveis sensíveis via GitHub Secrets (`secrets.DATABASE_URL`, `secrets.JWT_SECRET`). `.env.example` como template documentado. Detecção de secrets expostos: git-secrets, truffleHog, GitHub secret scanning.

5. **Shift-Left Security (10 min)**: segurança desde o primeiro commit — não na véspera do deploy. Threat modeling no design. Code review com checklist de segurança (OWASP Top 10). Container scanning com Trivy.

6. **Agent Perspective (15 min)**: 🤖 demonstração — agente revisa PR aplicando checklist de segurança: "Esse endpoint valida input do usuário?", "Essa query SQL usa parâmetros ou concatenação?", "Essa dependência atualizada tem breaking changes?", "Essa variável de ambiente está exposta em log?". O agente não bloqueia o merge — ele aumenta a cobertura do review humano.

**Destaque do projeto**: o aluno integra CodeQL e Dependabot ao pipeline, configura gerenciamento de secrets, e implementa shift-left security. O agente de revisão de segurança é integrado como primeiro filtro do code review — o humano revisa depois com os alerts já levantados.

### Aula 20: DevOps & Observabilidade

**Fluxo da aula**: Docker Compose stack completa → Logs estruturados (pino) → Métricas (prom-client) → Tracing (OpenTelemetry) → Dashboards (Grafana) → SLI/SLO/Error Budget.

**Conteúdo**:

1. **Docker Compose stack (10 min)**: ambiente completo de desenvolvimento e observação. Serviços: API Express (hot reload), Frontend React (dev server), PostgreSQL, Redis, Prometheus (coleta métricas), Grafana (dashboards), Jaeger (tracing). Rede interna, volumes, healthchecks. Um comando sobe tudo: `docker compose up`.

2. **Logs estruturados (15 min)**: migração de `console.log` para pino. JSON parseável, níveis (trace/debug/info/warn/error/fatal), contexto em cada log: `requestId` (correlaciona logs da mesma requisição), `userId`, `orderId`. Redação de logs diagnósticos: "Order 1234 payment failed: insufficient funds" em vez de "Error". Nunca logar dados sensíveis (senhas, tokens, CPF, cartão).

3. **Métricas RED (15 min)**: Rate, Errors, Duration para cada endpoint. prom-client: `http_requests_total` (contador), `http_request_duration_seconds` (histograma). Métricas de negócio: `orders_created_total`, `payments_processed_total`, `revenue_total`. Endpoint `/metrics` consumido pelo Prometheus.

4. **Tracing distribuído (10 min)**: OpenTelemetry. Spans mostram o caminho completo: API → CreateOrderUseCase → PostgresOrderRepository → PostgreSQL → resposta. Identificação de gargalos: waterfall view no Jaeger mostra onde o tempo está sendo gasto.

5. **Grafana dashboards (5 min)**: painéis para cada métrica RED. Latência p95 por endpoint, taxa de erro por status code, throughput por minuto. Dashboard de negócio: pedidos/hora, receita/hora, taxa de conversão.

6. **SLI/SLO/Error Budget (5 min)**: SLI: "latência p95 do /checkout < 200ms". SLO: "99% das requisições em < 200ms no período de 30 dias". Error budget: margem para arriscar deploys — se SLO é 99.9%, você tem 43 minutos/mês de erro.

**Destaque do projeto**: o aluno instrumenta a aplicação com logs estruturados (pino), métricas RED (prom-client) e tracing distribuído (OpenTelemetry). Sobe Grafana + Prometheus + Jaeger via Docker Compose. A aplicação não é mais caixa preta — cada requisição deixa rastro visível em dashboards.

### Aula 21: Qualidade, Code Review & Pipeline Agêntico

**Fluxo da aula**: Métricas de qualidade (complexidade, coesão, acoplamento, churn) → SonarQube → Code Review checklist → Fitness Functions → 🤖 Pipeline Agêntico completo: card Jira → agente planejador → HITL humano → agente implementador → agente revisor → CI/CD → merge.

**Conteúdo**:

1. **Métricas de qualidade (15 min)**: complexidade ciclomática (McCabe) — função > 10 merece atenção. Coesão (LCOM): classe com LCOM alto é candidata a split. Acoplamento (Afferent/Efferent Coupling): instabilidade I = Ce/(Ca+Ce). Churn: arquivos com alto churn + alta complexidade são hotspots de bugs. Ferramentas: SonarQube, CodeClimate, ESLint com regras de complexidade.

2. **SonarQube (10 min)**: configuração via Docker Compose + `sonar-project.properties`. Quality Gate: duplicated lines < 3%, coverage ≥ 80%, zero bugs bloqueadores, zero vulnerabilidades. Integração com GitHub Actions — análise roda no pipeline.

3. **Code Review checklist (15 min)**: revisão não é policiamento — é aprendizado compartilhado. Checklist estruturado: (1) Faz o que a task pede? (2) Testes cobrem bordas? (3) Nomes revelam intenção? (4) Duplicação que deve ser abstraída? (5) Complexidade desnecessária? (6) Arquitetura respeitada? (7) Segurança: inputs validados, SQL injection prevenido, secrets não expostos? (8) Performance: N+1 queries, carregamento eager/lazy adequado?

4. **Fitness Functions (10 min)**: testes que verificam propriedades arquiteturais. `domain` não importa `infrastructure`. Nenhum arquivo > 300 linhas. Complexidade ciclomática máxima ≤ 10. dependency-cruiser, eslint-plugin-boundaries. Fitness functions no pipeline — arquitetura é validada a cada commit.

5. **Pipeline Agêntico completo (15 min)**: 🤖 demonstração do fluxo fim a fim. **Card Jira**: "Implementar sistema de cashback — 5% do valor do pedido retorna como crédito". **Agente Planejador**: decompõe em tasks técnicas, identifica bounded contexts impactados, sugere design. **HITL (Human-in-the-Loop)**: desenvolvedor revisa o plano, ajusta, aprova. **Agente Implementador**: gera código (Use Case, entidade, repository, testes) seguindo Clean Architecture. **Agente Revisor**: verifica conformidade com padrões, segurança, cobertura de testes. **CI/CD**: pipeline roda qualidade, testes, SAST — se tudo passar, merge habilitado. O humano é o ponto de decisão e qualidade; os agentes são amplificadores de capacidade.

6. **Fechamento do módulo (5 min)**: o que o aluno construiu em 21 aulas. API de e-commerce com Clean Architecture + frontend React. Testes unitários, integração, E2E, contrato, performance. Pipeline CI/CD com quality gates e DevSecOps. Observabilidade completa. Pipeline agêntico integrado ao ciclo de desenvolvimento. O aluno não apenas aprendeu engenharia de software — construiu um sistema que pode evoluir por anos sem colapsar.

**Destaque do projeto**: o aluno fecha o módulo com o pipeline agêntico completo: card Jira → agente planejador → HITL humano → agente implementador → agente revisor → CI/CD → merge. SonarQube, fitness functions e code review checklist garantem qualidade contínua. O ciclo de maturidade do software está completo — e amplificado por agentes.

## Convenções didáticas

- **Linguagem dos apps de exemplo**: TypeScript com Node.js + Express (backend) e React (frontend) — os alunos dominam esse stack full-stack
- **Âncoras de conhecimento**: todo conceito novo é apresentado a partir de algo que o aluno já domina. Pontos de alavanca principais: refactoring → "você já extraiu função; agora vamos extrair com catálogo e segurança", SOLID → "você já separou código em funções; agora separa em classes com responsabilidade única", DIP → "é o padrão de callback invertido — em vez de chamar, você recebe a dependência pronta", tsyringe → "é o `require()` inteligente que resolve o grafo de dependências", Clean Architecture → "o framework é um detalhe — o coração do sistema não sabe se você usa Express ou Fastify", cenários Gherkin → "é o checklist de aceitação que o computador executa", pipeline CI/CD → "é o script de deploy que não esquece etapas e prova que tudo funciona antes do merge", pipeline agêntico → "é o par de programação que nunca cansa — você decide, ele executa". Cada âncora está embedada no passo da aula onde o aluno encontra o conceito pela primeira vez, como parte natural do fluxo — não como seção separada.
- **Imagem base para containers**: `node:22-alpine` para produção, `node:22` para desenvolvimento com hot reload
- **Comandos**: sempre mostrar saída esperada para auto-verificação; incluir flags de troubleshooting
- **Diagramas**: Mermaid para visualizar camadas arquiteturais, fluxos de dependência, bounded contexts (C4 Model), pipelines CI/CD, pirâmide de testes, Event Storming, state machines de agregados, fluxo agêntico (renderizados como PNG)
- **Tom**: profissional e direto — o aluno é desenvolvedor experiente, não precisa de simplificações excessivas. Analogias técnicas são bem-vindas (ex: "Aggregate Root está para o domínio assim como uma transação de banco está para a persistência — garante consistência na fronteira")
- **Didática**: experiência antes da explicação. O aluno primeiro faz (refatora, implementa, testa, observa o resultado), depois entende o princípio. A teoria explica o que o aluno acabou de experimentar, não o que ele ainda vai ver. As aulas com Agent Perspective incluem demonstração ao vivo do agente em ação.
- **Agentes como amplificadores**: o módulo introduz agentes de IA como parceiros de desenvolvimento — não como substitutos do engenheiro. Cada interação agêntica segue o padrão: agente propõe → humano avalia → decisão humana → agente executa. O aluno aprende a orquestrar agentes, não a ser substituído por eles.

## Arquitetura de pastas de cada aula

```
modules/engenharia-de-software/aulaNN/
├── aula-NN-<slug>.md                       # Conteúdo principal
├── aula-NN-questoes-de-aprendizagem.md     # Tarefas/checkpoint prático (arquivo separado)
├── aula-NN-<slug>.pdf                       # PDF para distribuição (gerado ao final)
└── images/                                  # Diagramas Mermaid renderizados como PNG
```

## Progressão de complexidade

| Aula | Tema | Comandos/ferramentas novos | Arquivos produzidos |
|---|---|---|---|
| 01 | Introdução à Engenharia de Software | ESLint config | Projeto base (TypeScript + Express + ESLint) |
| 02 | Clean Code — Nomes, Funções, Estrutura | Nenhum (princípios) | Código refatorado (controller modular) |
| 03 | Refactoring — Catálogo | ESLint regras avançadas | Code smells catalog, código refatorado |
| 04 | SOLID — SRP, OCP, LSP | Nenhum (princípios) | Interfaces, classes com SRP, gateways extensíveis |
| 05 | SOLID — ISP, DIP + DI | tsyringe, reflect-metadata | Container DI, interfaces segregadas |
| 06 | Padrões Criacionais | Nenhum (TypeScript puro) | Factory, Builder, Abstract Factory, Object Literal |
| 07 | Padrões Estruturais | Nenhum (TypeScript puro) | Adapter, Decorator, Facade, Composite, Proxy, Bridge |
| 08 | Padrões Comportamentais | Nenhum (TypeScript puro) | Strategy, Observer, Command, State, Chain, Template |
| 09 | Module Pattern & Patterns Web/React | React, React Router | Frontend React com HOC, Hooks, Compound Components |
| 10 | DDD — Modelagem Estratégica | Nenhum (workshop) | Bounded Contexts, Context Map, Event Storming board |
| 11 | DDD — Padrões Táticos | Nenhum (TypeScript puro) | Entities, VOs, Aggregates, Domain Events, Repositories |
| 12 | Arquitetura — Estilos e Decisões | Nenhum (modelagem) | C4 Model diagrams, ADRs |
| 13 | Clean Architecture na Prática | tsyringe (avançado), dependency-cruiser | Estrutura 4 camadas (domain/application/infrastructure/interface) |
| 14 | Engenharia de Requisitos | Nenhum (técnicas) | User Stories, critérios de aceitação, MoSCoW/RICE |
| 15 | SDD + BDD com Gherkin | Cucumber.js, Gherkin | 10 arquivos .feature, step definitions |
| 16 | TDD — Red-Green-Refactor | Jest (mocks, spies, fakes) | Testes unitários para 3 features |
| 17 | Pirâmide de Testes & Testes Avançados | Playwright, nock, Pact, k6, fast-check | Testes E2E, contrato, performance, property-based |
| 18 | CI/CD Pipeline | GitHub Actions (workflow, jobs, matrix, cache) | Workflow YAML completo (6 jobs), quality gates |
| 19 | DevSecOps | CodeQL, Dependabot, git-secrets, Trivy | Security scanning configs, review checklist |
| 20 | DevOps & Observabilidade | pino, prom-client, OpenTelemetry, Prometheus, Grafana, Jaeger | docker-compose.yml, dashboards JSON, métricas |
| 21 | Qualidade, Code Review & Pipeline Agêntico | SonarQube, dependency-cruiser, eslint-plugin-boundaries | sonar-project.properties, fitness functions, pipeline agêntico |

> **Nota sobre contagem de ferramentas**: a contagem reflete ferramentas e bibliotecas novas introduzidas por aula. TypeScript, Node.js, Express, PostgreSQL, React, Docker e git que o aluno já domina não são contabilizados como "novos".

## Regras para Manutenção de Coerência

1. **Este README é alterado primeiro.** Se uma aula for mesclada, dividida, reordenada ou renomeada, o README é atualizado **antes** de qualquer arquivo de aula.
2. **Referências nas aulas seguem o README.** O campo "Próxima Aula", menções como "Na Aula 05...", e a "Recapitulação" devem corresponder exatamente a este plano.
3. **Títulos consistentes.** O `titulo` no frontmatter de cada aula deve ser idêntico ao título no plano acima.
4. **A aula N nunca referencia conceitos ou ferramentas da aula N+1.**
5. **Questões de Aprendizagem** sempre têm `tipo: "checkpoint-pratico"` no frontmatter e seguem a estrutura `Objetivo → Passos de Execução → Entrega`.
6. **Projeto progressivo**: a aula N assume que o aluno completou as aulas 1 a N-1. O código inicial da aula N é o código final da aula N-1. O planner recebe o estado do projeto acumulado como input; o reviewer verifica se há referências a aulas futuras (flag crítica).

## Referências

### Livros

- MARTIN, Robert C. **Clean Code: A Handbook of Agile Software Craftsmanship**. Prentice Hall, 2008.
- MARTIN, Robert C. **Clean Architecture: A Craftsman's Guide to Software Structure and Design**. Prentice Hall, 2017.
- EVANS, Eric. **Domain-Driven Design: Tackling Complexity in the Heart of Software**. Addison-Wesley, 2003.
- GAMMA, Erich; HELM, Richard; JOHNSON, Ralph; VLISSIDES, John. **Design Patterns: Elements of Reusable Object-Oriented Software**. Addison-Wesley, 1994.
- FOWLER, Martin. **Refactoring: Improving the Design of Existing Code**. 2nd ed. Addison-Wesley, 2018.
- BECK, Kent. **Test-Driven Development: By Example**. Addison-Wesley, 2002.
- FEATHERS, Michael. **Working Effectively with Legacy Code**. Prentice Hall, 2004.
- VERNON, Vaughn. **Implementing Domain-Driven Design**. Addison-Wesley, 2013.
- HUMBLE, Jez; FARLEY, David. **Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation**. Addison-Wesley, 2010.
- FORSGREN, Nicole; HUMBLE, Jez; KIM, Gene. **Accelerate: The Science of Lean Software and DevOps**. IT Revolution Press, 2018.
- OSHEROVE, Roy. **The Art of Unit Testing**. 3rd ed. Manning, 2024.
- WALLS, Craig. **Spring in Action**. 6th ed. Manning, 2022. — patterns de composição e DI (referência suplementar)
- GEE, Trisha; LEWIS, James; KEVREN, Tanya. **Building Microservices: Designing Fine-Grained Systems**. 2nd ed. O'Reilly, 2021.
- HUMPHREY, Watts S. **A Discipline for Software Engineering**. Addison-Wesley, 1995.
- BROOKS, Frederick P. **The Mythical Man-Month: Essays on Software Engineering**. Anniversary ed. Addison-Wesley, 1995.

### Fontes sobre Patterns Web/React

- ABRAMOV, Dan. **Thinking in React**. React documentation, 2023. https://react.dev/learn/thinking-in-react
- ABRAMOV, Dan. **Presentational and Container Components**. Medium, 2015.
- RENO, Matt. **Compound Components**. YouTube, Epic React, 2020.
- BODUCH, Adam. **React Design Patterns**. Medium / Dev.to series, 2021.

### Fontes sobre Engenharia de Agentes

- DAFOE, Allan; BACHARACH, Yoram; COLLINS, Katherine; et al. **The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery**. Sakana AI, 2024.
- QIAN, Chen; et al. **ChatDev: Communicative Agents for Software Development**. arXiv, 2023.
- ANTHROPIC. **Effective Prompt Engineering for Claude**. Anthropic Documentation, 2025.
- OPENAI. **Codex and Code Generation Best Practices**. OpenAI Documentation, 2024.
- CARPENTER, Andrew. **SWE-bench: Can Language Models Resolve Real-World GitHub Issues?**. arXiv, 2024.
- HONG, Sirui; et al. **MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework**. arXiv, 2023.
- RIEBER, Jeff. **Prompt Engineering for Frontend Code Generation**. Vercel Templates & Guides, 2024.
- YANG, John; et al. **SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering**. Princeton, 2024.

### Documentação oficial e ferramentas

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cucumber.js Documentation](https://github.com/cucumber/cucumber-js)
- [tsyringe (DI Container)](https://github.com/microsoft/tsyringe)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [pino (Structured Logger)](https://getpino.io/)
- [prom-client (Prometheus metrics)](https://github.com/siimon/prom-client)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [SonarQube Documentation](https://docs.sonarsource.com/sonarqube/latest/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [C4 Model](https://c4model.com/)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [Playwright Documentation](https://playwright.dev/)
- [Pact (Contract Testing)](https://docs.pact.io/)
- [k6 (Performance Testing)](https://k6.io/docs/)
- [fast-check (Property-Based Testing)](https://fast-check.dev/)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

### Fontes consultadas para este plano

- Skill `lesson-design` — template canônico e regras de formato, estratégia de projeto progressivo
- Skill `lesson-assets` — pipeline de imagens e DOCX
- Skill `continual-harness` — ciclo de auto-melhoria
- AGENTS.md raiz — princípio do projeto progressivo e arquitetura de aula
- Livros de referência listados acima (Clean Code, Clean Architecture, DDD, Design Patterns GoF, Refactoring, TDD by Example, Accelerate)
- Documentação oficial das ferramentas e frameworks do stack (TypeScript, Jest, Cucumber, GitHub Actions, Docker, OpenTelemetry)
