---
titulo: "Aula 20: DevOps & Observabilidade — Operar o que se Constrói"
modulo: "Engenharia de Software"
aula: 20
slug: "devops-observabilidade"
duracao_estimada: "100 minutos"
nivel: "intermediario-avancado"
tags: [devops, observabilidade, docker-compose, pino, prom-client, opentelemetry, prometheus, grafana, jaeger, alertmanager, sli-slo, error-budget, logs-estruturados, metricas-red]
data: 2026-06-21
---

# Engenharia de Software — Aula 20

## DevOps & Observabilidade — Operar o que se Constrói

**Duração:** 100 minutos  
**Nível:** Intermediário-Avançado  
**Pré-requisitos:** Aulas 01–19 (especialmente Aula 18 — CI/CD Pipeline e Aula 19 — DevSecOps). Familiaridade com Docker Compose.

---

## Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

1. Explicar o mindset DevOps como cultura de responsabilidade compartilhada, não como um cargo ou ferramenta
2. Subir uma stack completa de observabilidade (API + PostgreSQL + Redis + Prometheus + Grafana + Jaeger) com Docker Compose e healthchecks
3. Configurar logs estruturados com pino, níveis de severidade, requestId e contexto por requisição, sabendo o que NUNCA logar
4. Implementar métricas RED (Rate, Errors, Duration) com prom-client para cada endpoint da API
5. Adicionar métricas de negócio (orders_created_total, revenue_total) ao lado das métricas técnicas
6. Instrumentar a API com OpenTelemetry para tracing distribuído e visualizar spans no Jaeger
7. Montar um dashboard Grafana com painéis RED + métricas de negócio
8. Configurar alertas no Prometheus com Alertmanager e notificações
9. Definir SLI, SLO e SLA na prática, calculando error budget a partir de métricas reais
10. Aplicar observabilidade para debug de incidentes em produção, reduzindo MTTD e MTTR

---

## Como Usar Esta Aula

Esta aula revisita os conceitos de observabilidade com foco em **operação em produção**. Se você já conhece os fundamentos (Aula 09), esta aula aprofunda cada pilar com código real, configuração de alertas, dashboards exportáveis e SLI/SLO aplicados ao e-commerce.

- Leia a seção **Fundamentos** primeiro — ela conecta DevOps à observabilidade
- Depois acompanhe os **exemplos práticos** com Docker Compose, pino, prom-client e OpenTelemetry
- Execute os comandos no seu terminal — a stack sobe localmente
- Responda ao quiz e aos exercícios antes de consultar os gabaritos
- Para dúvidas rápidas, consulte o **FAQ** e o **Glossário** no final

---

## Mapa Mental da Aula

```mermaid
mindmap
  root((DevOps & Observabilidade))
    Cultura DevOps
      You build it, you run it
      Silos entre Dev e Ops
      Responsabilidade compartilhada
    Pilares da Observabilidade
      Logs Estruturados
        JSON, níveis, requestId
        O que NUNCA logar
      Métricas RED
        Rate, Errors, Duration
        Métricas de negócio
      Tracing Distribuído
        Spans, traces, waterfall
        OpenTelemetry
    Stack de Monitoramento
      Docker Compose
      Prometheus + Grafana
      Jaeger + Loki
      Alertmanager
    Acordos
      SLI: o que medimos
      SLO: a meta
      SLA: o contrato
      Error budget
```

---

## Recapitulação: Aulas 01–19

Nas aulas anteriores você percorreu toda a esteira de engenharia de software:

- **Aulas 01–08:** Clean Code, SOLID, Design Patterns, DDD, Clean Architecture, SDD, TDD, CI/CD
- **Aula 09:** Fundamentos de DevOps e Observabilidade — logs, métricas, tracing
- **Aulas 10–16:** Code Review, Dívida Técnica, Arquitetura, Testes Avançados, Requisitos, BDD
- **Aulas 17–19:** Pirâmide de Testes, Testes Avançados, Qualidade e Pipeline

**Aula 09** foi sua primeira exposição aos três pilares. Agora, na Aula 20, vamos **operar em produção** com uma stack completa de monitoramento, alertas reais e SLI/SLO aplicados ao e-commerce.

---

> **FUNDAMENTOS:** DevOps e os Três Pilares da Observabilidade  
> Antes de configurar qualquer ferramenta, você precisa entender *por que* DevOps e observabilidade andam juntos. Esta seção cobre a cultura, os pilares e os acordos que sustentam a operação em produção.

---

## 1. DevOps: Cultura, não Ferramenta

### O Problema dos Silos

Em organizações tradicionais, o time de desenvolvimento escreve código e "joga por cima do muro" para o time de operações. O time de dev quer lançar features rápido; o time de ops quer estabilidade. O resultado é atrito: deplaves demorados, blame game quando algo quebra, ninguém assume responsabilidade de ponta a ponta.

**DevOps** não é um cargo, uma ferramenta ou um time. É uma **cultura** que quebra esses silos. O princípio fundamental é: **"You build it, you run it"** — quem desenvolve o software também opera ele em produção.

### Os Três Caminhos de DevOps

Gene Kim, no livro *The DevOps Handbook*, define três princípios:

1. **Primeiro Caminho (Fluxo):** acelerar o fluxo de valor do dev ao cliente. CI/CD, deplaves frequentes, entregas pequenas.
2. **Segundo Caminho (Feedback):** amplificar o feedback para detectar problemas rapidamente. Observabilidade, alertas, postmortems.
3. **Terceiro Caminho (Aprendizado):** cultura de experimentação e aprendizado contínuo. Chaos engineering, blameless postmortems, melhoria contínua.

A observabilidade é o **segundo caminho** materializado — sem ela, não há feedback rápido.

### O Que DevOps NÃO É

| Isso NÃO é DevOps | Isso É DevOps |
|---|---|
| Um time de DevOps que "faz deploy para os devs" | Todo dev assume responsabilidade pela operação |
| Comprar ferramentas de automação | Mudar cultura e processos primeiro |
| Um cargo no organograma | Um conjunto de práticas e princípios |
| Só CI/CD pipeline | CI/CD + observabilidade + feedback + cultura |

### Quick Check

**1. Qual o princípio central de DevOps expresso pela frase "You build it, you run it"?**
**Resposta:** Quem desenvolve o software também é responsável por operá-lo em produção. Isso elimina o silo entre dev e ops, reduz o atrito e aumenta a responsabilidade compartilhada.

**2. Qual dos três caminhos de DevOps está diretamente ligado à observabilidade?**
**Resposta:** O Segundo Caminho (Feedback). Observabilidade (logs, métricas, tracing) fornece feedback rápido sobre o comportamento do sistema em produção, permitindo detectar e corrigir problemas antes que afetem os usuários.

---

## 2. Logs Estruturados — O Primeiro Pilar

### Por que Logs Importam em Produção

Logs são o registro mais granular do que acontece no sistema. Enquanto métricas mostram tendências agregadas e tracing mostra o fluxo entre serviços, logs contam a história completa de um evento específico.

**Um bom log responde:** o que aconteceu, quando, em qual requisição, para qual usuário, com quais parâmetros e qual foi o resultado.

### Logs Estruturados com Pino

**Pino** é o logger mais rápido do ecossistema Node.js (até 5x mais rápido que Winston). Ele produz JSON por padrão e é projetado para ser consumido por coletores como Loki, ELK ou Datadog.

```typescript
// src/infrastructure/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: {
    paths: ["password", "token", "cpf", "creditCard", "ssn"],
    censor: "[REDACTED]",
  },
});
```

A propriedade `redact` é um recurso de segurança: ela **remove automaticamente** campos sensíveis dos logs, mesmo que alguém os logue por engano.

### Middleware com requestId

```typescript
// src/interface/middlewares/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../../infrastructure/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;

  const childLogger = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  req.log = childLogger;

  const start = Date.now();
  res.on("finish", () => {
    childLogger.info({
      msg: "request completed",
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      contentLength: res.get("content-length"),
    });
  });
  next();
}
```

### O Que NUNCA Logar

Logs são arquivos texto — se o servidor for comprometido, logs sensíveis vazam dados do usuário. **Nunca logue:**

- Senhas e hashes de senha
- Tokens JWT, API keys, session tokens
- Números de cartão de crédito
- CPF, RG, ou qualquer documento pessoal
- Dados biométricos
- Conteúdo de mensagens privadas

Use a opção `redact` do pino para garantir que, mesmo se alguém tentar logar um campo sensível, ele seja censurado.

### Query no Grafana Loki

Com logs no Loki, você pode consultar:

```
{service="ecommerce-api"} |= "error" |= "order-456"
```

Ou agregar taxa de erro por endpoint:

```
sum(rate({service="ecommerce-api"} |= "error" [5m])) by (route)
```

### Quick Check

**3. Por que logs JSON são superiores a logs de texto livre?**
**Resposta:** Logs JSON são parseáveis por máquinas — ferramentas de agregação conseguem extrair campos (requestId, level, orderId) sem parsing customizado. Você pode filtrar, agrupar e correlacionar logs com consultas como `{service="api"} |= "error"`.

**4. Quais campos NUNCA devem aparecer em logs, e como o pino ajuda a prevenir vazamentos?**
**Resposta:** Senhas, tokens, CPF, cartão de crédito e dados biométricos nunca devem ser logados. O pino tem a opção `redact` que remove automaticamente campos sensíveis dos logs, censurando com "[REDACTED]" mesmo que o desenvolvedor tente logá-los.

---

## 3. Métricas — O Segundo Pilar

### Métricas RED na Prática

O framework **RED** (Rate, Errors, Duration) define as três métricas essenciais para **cada endpoint**:

| Métrica | Tipo Prometheus | O que mede |
|---|---|---|
| `http_requests_total` | Counter | Quantidade de requisições (rate em queries) |
| `http_requests_errors_total` | Counter | Quantidade de erros |
| `http_request_duration_seconds` | Histogram | Distribuição de latência (p50, p95, p99) |

### Implementação com prom-client

```typescript
// src/infrastructure/metrics.ts
import client from "prom-client";

// Métricas padrão do Node.js
client.collectDefaultMetrics();

// RED Metrics
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP",
  labelNames: ["method", "route", "status"],
});

export const httpRequestsErrorsTotal = new client.Counter({
  name: "http_requests_errors_total",
  help: "Total de erros HTTP",
  labelNames: ["method", "route", "error_type"],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições em segundos",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

// Métricas de Negócio
export const ordersCreatedTotal = new client.Counter({
  name: "orders_created_total",
  help: "Total de pedidos criados",
});

export const revenueTotal = new client.Counter({
  name: "revenue_total",
  help: "Receita total acumulada em centavos",
});

export { client };
```

### Middleware RED

```typescript
// src/interface/middlewares/metricsMiddleware.ts
import { Request, Response, NextFunction } from "express";
import {
  httpRequestsTotal,
  httpRequestsErrorsTotal,
  httpRequestDurationSeconds,
} from "../../infrastructure/metrics";

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpRequestDurationSeconds.startTimer();
  
  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route };
    
    httpRequestsTotal.inc({ ...labels, status: res.statusCode });
    
    if (res.statusCode >= 400) {
      httpRequestsErrorsTotal.inc({
        ...labels,
        error_type: res.statusCode >= 500 ? "server" : "client",
      });
    }
    
    end(labels);
  });
  
  next();
}
```

### Métricas de Negócio no Use Case

```typescript
// src/application/useCases/CreateOrderUseCase.ts
import { ordersCreatedTotal, revenueTotal } from "../../infrastructure/metrics";

export class CreateOrderUseCase {
  async execute(input: CreateOrderInput): Promise<Order> {
    const order = await this.orderRepository.save(input);
    
    // Incrementa métricas de negócio
    ordersCreatedTotal.inc();
    revenueTotal.inc(order.totalInCents);
    
    return order;
  }
}
```

### Médias Mentem, Percentis Contam a Verdade

Se você calcular a **média** da latência de 100 requisições, 99 que levaram 100ms e 1 que levou 10s, a média é ~200ms — parece aceitável. Mas para o usuário que teve latência de 10s, a experiência foi péssima.

**Percentis** contam uma história mais honesta:
- **p50 (mediana):** 50% das requisições são mais rápidas que este valor
- **p95:** 95% das requisições são mais rápidas — apenas 5% são piores
- **p99:** 99% das requisições são mais rápidas — apenas 1% são piores

### Quick Check

**5. Qual a diferença entre métricas RED e métricas de negócio?**
**Resposta:** Métricas RED medem a saúde técnica do sistema (rate de requisições, erros, latência). Métricas de negócio medem eventos do domínio (pedidos criados, receita, usuários ativos). Ambas são importantes — RED para engenharia, negócio para produto.

**6. Por que a média de latência pode ser enganosa e o que usar no lugar?**
**Resposta:** A média é distorcida por outliers — uma única requisição lenta puxa a média para cima e esconde que a maioria é rápida. Percentis (p50, p95, p99) mostram a distribuição real.

---

## 4. Tracing Distribuído — O Terceiro Pilar

### O que é Tracing?

Em uma arquitetura moderna, uma única requisição atravessa múltiplos componentes: API Gateway → Service → Repositório → Banco de Dados → Cache → Serviço Externo. Quando algo fica lento, você precisa saber **qual etapa** está demorando.

Tracing distribuído resolve isso com dois conceitos:
- **Trace:** o caminho completo de uma requisição (a árvore)
- **Span:** uma unidade individual de trabalho (um nó na árvore)

### OpenTelemetry + Jaeger

**OpenTelemetry** é o padrão da indústria para instrumentação. Ele captura spans automaticamente.

```typescript
// src/infrastructure/tracing.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const otelExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
    : "http://localhost:4318/v1/traces",
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "ecommerce-api",
    "deployment.environment": process.env.NODE_ENV || "development",
  }),
  traceExporter: otelExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Graceful shutdown
process.on("SIGTERM", () => sdk.shutdown());
```

**Importante:** O tracing deve ser importado **antes** de qualquer outro módulo, porque o OpenTelemetry precisa patchar as bibliotecas antes que sejam carregadas:

```typescript
// src/index.ts — linha 1
import "./infrastructure/tracing"; // PRIMEIRO
import express from "express";
// ... resto da aplicação
```

### Waterfall View no Jaeger

Com spans enviados ao Jaeger (porta 16686), você vê:

```mermaid
graph TD
    subgraph "Trace: POST /orders (2.3s)"
        A("API Gateway<br/>200ms") --> B("Middleware Auth<br/>120ms")
        A --> C("CreateOrder UseCase<br/>800ms")
        C --> D("Repository.save<br/>300ms")
        C --> E("PaymentGateway<br/>400ms")
        C --> F("Event: OrderPlaced<br/>50ms")
        E --> G("HTTP POST /pay<br/>380ms")
        D --> H("INSERT INTO orders<br/>280ms")
    end
```

Com essa visualização, você identifica **instantaneamente** que o gargalo é o gateway de pagamento (400ms).

### Identificando Gargalos com Spans Customizados

Você pode criar spans manuais para operações que não são capturadas automaticamente:

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("ecommerce-api");

export class ShippingCalculator {
  async calculate(order: Order): Promise<ShippingResult> {
    return tracer.startActiveSpan("ShippingCalculator.calculate", async (span) => {
      span.setAttribute("order.id", order.id);
      span.setAttribute("order.zipCode", order.zipCode);
      
      try {
        const result = await this.shippingService.calculate(order);
        span.setAttribute("shipping.cost", result.cost);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### Quick Check

**7. Qual a diferença entre um trace e um span?**
**Resposta:** Um trace é o caminho completo de uma requisição (a árvore inteira). Um span é uma unidade individual de trabalho dentro desse trace (um nó). Vários spans formam um trace.

**8. Por que o OpenTelemetry deve ser importado antes de qualquer outro módulo?**
**Resposta:** Porque o OpenTelemetry precisa patchar (instrumentar) as bibliotecas antes que sejam carregadas. Se o Express for importado primeiro, o OpenTelemetry não consegue capturar automaticamente os spans HTTP.

---

## 5. SLI, SLO e SLA — Acordos de Nível de Serviço

### Definições Práticas

| Termo | Significado | Exemplo no E-commerce |
|---|---|---|
| **SLI** (Service Level Indicator) | A métrica que medimos | Latência p95 do endpoint GET /orders |
| **SLO** (Service Level Objective) | A meta para o SLI | 99% das requisições em < 200ms |
| **SLA** (Service Level Agreement) | Compromisso contratual com o cliente | 99.5% de disponibilidade mensal |

SLI é **medição**, SLO é **meta interna**, SLA é **compromisso externo**. Você pode ter SLOs mais rigorosos que seus SLAs.

### SLIs do E-commerce

Para o nosso e-commerce, definimos estes SLIs:

| Componente | SLI | SLO | Janela |
|---|---|---|---|
| API de Pedidos | Latência p95 do POST /orders | < 300ms | 30 dias corridos |
| API de Catálogo | Latência p95 do GET /products | < 200ms | 30 dias |
| Checkout | Taxa de sucesso (não-erro) | > 99.5% | 30 dias |
| Pagamentos | Latência p99 do gateway | < 2s | 30 dias |

### Error Budget na Prática

**Error budget** = 1 - SLO. Se o SLO é 99% de requisições bem-sucedidas, seu error budget é 1%.

Em um mês com ~10 milhões de requisições:
- Error budget = 100 mil falhas toleráveis
- Se nos primeiros 15 dias já gastamos 80 mil falhas, temos apenas 20 mil para os próximos 15 dias
- O time **para de lançar features** e foca em estabilidade até recuperar folga

### Quando Usar o Error Budget

| Situação | Error Budget Restante | Decisão |
|---|---|---|
| Deploy de feature arriscada | 80% disponível | ✅ Pode fazer deploy |
| Deploy de feature arriscada | 10% disponível | ❌ Não faça — foco em estabilidade |
| Hotfix de segurança | 0% disponível | ✅ Faça mesmo assim (risco do hotfix < risco da vulnerabilidade) |
| Refactor de código crítico | 50% disponível | ⚠️ Faça com gradual rollout |

### Quick Check

**9. Qual a diferença prática entre SLO e SLA?**
**Resposta:** SLO é meta interna (ex: "99% em <200ms"). SLA é contrato com o cliente (ex: "99.5% de disponibilidade"). Quebrar o SLO gera conversa interna; quebrar o SLA pode gerar multas.

**10. Como o error budget ajuda na tomada de decisão sobre deploys arriscados?**
**Resposta:** Se ainda há error budget disponível, o time pode fazer deplays arriscados. Se o error budget acabou, o time foca em estabilidade. Isso substitui o medo de deploy por decisão baseada em dados.

---

> **APLICAÇÃO:** Stack de Monitoramento do E-commerce  
> Agora que você entende os fundamentos, vamos conectar tudo na prática. Você vai subir a stack completa, configurar logs, métricas, tracing, dashboards e alertas para o e-commerce.

---

## 6. Docker Compose — Stack Completa

### docker-compose.yml com Healthchecks

```yaml
# docker-compose.yml
version: "3.8"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ecommerce
      - REDIS_URL=redis://redis:6379
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
      - NODE_ENV=development
      - LOG_LEVEL=info
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      prometheus:
        condition: service_started
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - observability

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ecommerce
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - observability

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - observability

  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
      - prometheusdata:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - observability

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafanadata:/var/lib/grafana
      - ./dashboards:/etc/grafana/provisioning/dashboards
      - ./datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    networks:
      - observability

  jaeger:
    image: jaegertracing/all-in-one:1.48
    ports:
      - "16686:16686"  # UI
      - "4318:4318"    # OTLP HTTP
      - "4317:4317"    # OTLP gRPC
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - observability

  alertmanager:
    image: prom/alertmanager:v0.25.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    networks:
      - observability

volumes:
  pgdata:
  redisdata:
  prometheusdata:
  grafanadata:

networks:
  observability:
    driver: bridge
```

### Configuração do Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: "ecommerce-api"
    static_configs:
      - targets: ["api:3000"]
    metrics_path: /metrics
```

### Configuração do Alertmanager

```yaml
# alertmanager.yml
route:
  receiver: "default"
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: "pagerduty"
      repeat_interval: 1h
    - match:
        severity: warning
      receiver: "slack"

receivers:
  - name: "default"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
        channel: "#alerts"
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'

  - name: "pagerduty"
    pagerduty_configs:
      - routing_key: "YOUR_PAGERDUTY_KEY"

  - name: "slack"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
        channel: "#warnings"
```

### Mão na Massa — Subindo a Stack

- [ ] Crie `docker-compose.yml` na raiz do projeto
- [ ] Crie `prometheus.yml` e `alertmanager.yml`
- [ ] Execute `docker compose up -d`
- [ ] Verifique: `docker compose ps` mostra todos os serviços como "Up"
- [ ] Acesse: API (`localhost:3000`), Prometheus (`localhost:9090`), Grafana (`localhost:3001`), Jaeger (`localhost:16686`), Alertmanager (`localhost:9093`)

---

## 7. Logs com Pino na Prática

### Substituindo console.log

```bash
npm install pino pino-pretty
```

Configure o logger com `redact` para segurança:

```typescript
// src/infrastructure/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: ["password", "token", "authorization", "cpf", "creditCard", "ssn", "secret"],
    censor: "[REDACTED]",
  },
});
```

### Uso nos Use Cases

```typescript
// src/application/useCases/CreateOrderUseCase.ts
import { logger } from "../../infrastructure/logger";

export class CreateOrderUseCase {
  async execute(input: CreateOrderInput): Promise<Order> {
    logger.info({ orderId: input.id, customerId: input.customerId, total: input.total }, "Creating order");
    
    try {
      const order = await this.orderRepository.save(input);
      logger.info({ orderId: order.id, status: order.status }, "Order created successfully");
      return order;
    } catch (error) {
      logger.error({
        orderId: input.id,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }, "Failed to create order");
      throw error;
    }
  }
}
```

---

## 8. Métricas com prom-client na Prática

### Instalação e Configuração

```bash
npm install prom-client
```

### Métricas RED + Negócio

```typescript
// src/infrastructure/metrics.ts
import client from "prom-client";

client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP",
  labelNames: ["method", "route", "status"],
});

export const httpRequestsErrorsTotal = new client.Counter({
  name: "http_requests_errors_total",
  help: "Total de erros HTTP",
  labelNames: ["method", "route", "error_type"],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duração em segundos",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

export const ordersCreatedTotal = new client.Counter({
  name: "orders_created_total",
  help: "Total de pedidos criados",
});

export const revenueTotal = new client.Counter({
  name: "revenue_total_cents",
  help: "Receita total em centavos",
});

export { client };
```

### Endpoint /metrics

```typescript
// app.ts
import { client } from "./infrastructure/metrics";

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});
```

---

## 9. Tracing com OpenTelemetry na Prática

### Instalação

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

### Setup

```typescript
// src/infrastructure/tracing.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const otelExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318"}/v1/traces`,
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "ecommerce-api",
  }),
  traceExporter: otelExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

**Mão na Massa — Verificação:**
- Faça requisições à API
- Abra Jaeger em `http://localhost:16686`
- Selecione o serviço `ecommerce-api` e busque traces
- Explore a waterfall view para ver spans HTTP, SQL queries e suas durações

---

## 10. Dashboards no Grafana e Alertas

### Provisionando o Data Source

```yaml
# datasources/datasource.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

### Dashboard RED JSON

```json
{
  "title": "E-commerce RED Dashboard",
  "uid": "ecommerce-red",
  "panels": [
    {
      "title": "Requisições por minuto",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "targets": [
        {
          "expr": "rate(http_requests_total[1m])",
          "legendFormat": "{{method}} {{route}}"
        }
      ]
    },
    {
      "title": "Taxa de erro",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
      "targets": [
        {
          "expr": "rate(http_requests_errors_total[1m]) / rate(http_requests_total[1m]) * 100",
          "legendFormat": "{{method}} {{route}}"
        }
      ]
    },
    {
      "title": "Latência p95",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "{{method}} {{route}}"
        }
      ]
    },
    {
      "title": "Pedidos por minuto",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
      "targets": [
        {
          "expr": "rate(orders_created_total[1m])",
          "legendFormat": "Pedidos/min"
        }
      ]
    }
  ]
}
```

### Regras de Alerta

```yaml
# alerts.yml
groups:
  - name: ecommerce
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_errors_total[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro acima de 1% nos últimos 5 minutos"
          description: "A taxa de erro atual é {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latência p95 acima de 500ms nos últimos 5 minutos"
          description: "A latência p95 atual é {{ $value | humanizeDuration }}"

      - alert: ServiceDown
        expr: up{job="ecommerce-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API E-commerce está down"
          description: "O Prometheus não consegue scrapear o job ecommerce-api há 1 minuto"

      - alert: NoOrdersCreated
        expr: rate(orders_created_total[10m]) == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Nenhum pedido criado nos últimos 10 minutos"
          description: "Possível falha no fluxo de checkout"
```

### Mão na Massa — Dashboard e Alertas

- [ ] Crie as pastas `datasources/` e `dashboards/`
- [ ] Adicione o datasource provisionado
- [ ] Importe o dashboard RED JSON no Grafana
- [ ] Verifique os alertas em Alerting → Alert Rules
- [ ] Force um erro (POST /orders sem payload) e veja o alerta disparar

---

## Quiz de Autoavaliação

**1. Qual o princípio central de DevOps?**  
a) Automatizar tudo com ferramentas  
b) You build it, you run it  
c) Separar times de dev e ops  
d) Fazer deploy uma vez por mês  

**Resposta:** b) You build it, you run it.

---

**2. Para que serve a opção `redact` no pino?**  
a) Colorir logs no terminal  
b) Remover campos sensíveis dos logs automaticamente  
c) Reduzir o tamanho dos logs  
d) Filtrar logs por nível  

**Resposta:** b) Remover campos sensíveis dos logs automaticamente.

---

**3. O que significa a sigla RED em métricas?**  
a) Read, Execute, Delete  
b) Rate, Errors, Duration  
c) Request, Error, Data  
d) Real-time, Event-driven, Distributed  

**Resposta:** b) Rate, Errors, Duration.

---

**4. Por que percentis (p95) são melhores que médias para medir latência?**  
a) Percentis são mais fáceis de calcular  
b) Médias escondem outliers — percentis mostram a distribuição real  
c) Percentis usam menos recursos  
d) Médias não funcionam com histogramas  

**Resposta:** b) Médias escondem outliers — percentis mostram a distribuição real.

---

**5. O que é um span no OpenTelemetry?**  
a) Um contador de requisições  
b) Uma unidade individual de trabalho dentro de um trace  
c) Um tipo de métrica  
d) Uma configuração do Prometheus  

**Resposta:** b) Uma unidade individual de trabalho dentro de um trace.

---

**6. Se o SLO é 99.5% e o mês tem 1 milhão de requisições, qual o error budget?**  
a) 500 falhas  
b) 5.000 falhas  
c) 50.000 falhas  
d) 995.000 falhas  

**Resposta:** b) 5.000 falhas (0.5% de 1 milhão).

---

**7. O que o Alertmanager faz além de receber alertas do Prometheus?**  
a) Coleta métricas  
b) Roteia alertas para canais de notificação (Slack, PagerDuty, e-mail)  
c) Armazena logs  
d) Gera dashboards  

**Resposta:** b) Roteia alertas para canais de notificação (Slack, PagerDuty, e-mail).

---

## Exercícios

### Exercício 1 (Fácil): Adicione uma Métrica de Negócio

No arquivo `src/infrastructure/metrics.ts`, crie uma métrica que conte o total de cancelamentos de pedido. Depois, no `CancelOrderUseCase`, incremente essa métrica quando o cancelamento for bem-sucedido.

**Gabarito:**

```typescript
// Em metrics.ts
export const ordersCancelledTotal = new client.Counter({
  name: "orders_cancelled_total",
  help: "Total de pedidos cancelados",
});

// Em CancelOrderUseCase.ts
import { ordersCancelledTotal } from "../../infrastructure/metrics";

export class CancelOrderUseCase {
  async execute(input: CancelOrderInput): Promise<void> {
    await this.orderRepository.cancel(input.orderId);
    ordersCancelledTotal.inc();
    logger.info({ orderId: input.orderId }, "Order cancelled");
  }
}
```

### Exercício 2 (Médio): Configure um Alerta de Latência

Crie uma regra de alerta no Prometheus que dispare quando a latência p95 do endpoint `POST /orders` ultrapassar 1 segundo por mais de 2 minutos.

**Gabarito:**

```yaml
# alerts.yml
- alert: CheckoutLatencyHigh
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/orders",method="POST"}[5m])) > 1.0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Latência do checkout acima de 1s"
    description: "POST /orders com p95 de {{ $value | humanizeDuration }}"
```

### Exercício 3 (Difícil): Debug de Incidente com Tracing

Você recebe um alerta: "HighLatency no endpoint GET /products". No Jaeger, você encontra o trace abaixo:

```
Trace: GET /products (4.2s total)
├── [10ms]  Middleware: auth
├── [50ms]  Controller: parse query
├── [4000ms] UseCase: ListProducts
│   ├── [3900ms] Repository: findAll
│   │   └── [3850ms] SELECT * FROM products JOIN inventory...
│   └── [100ms] Cache: set results
└── [40ms]  Presenter: format response
```

1. Qual o gargalo?
2. Que ação você tomaria?
3. Como evitaria que isso acontecesse de novo?

**Gabarito:**

1. **Gargalo:** A query SQL no `Repository.findAll` está levando 3.9s — 93% do tempo total da requisição. O `JOIN` com inventory sem índice adequado é a causa provável.
2. **Ação imediata:** Analisar o EXPLAIN da query, adicionar índices nas colunas usadas no JOIN, ou rever o N+1. Se for urgente, timeout na query para não travar o servidor.
3. **Prevenção:** Adicionar um span customizado na query mais pesada, criar um alerta de latência específico para esse endpoint (threshold: p95 > 500ms), e estabelecer um SLO de <200ms para o catálogo.

---

## Resumo

- **DevOps** é cultura de responsabilidade compartilhada, não ferramenta — "You build it, you run it"
- **Logs estruturados** com pino produzem JSON com níveis, requestId e contexto; `redact` protege dados sensíveis
- **Métricas RED** (Rate, Errors, Duration) são as três métricas essenciais por endpoint; percentis são mais honestos que médias
- **Métricas de negócio** (orders_created_total, revenue_total) complementam as métricas técnicas
- **Tracing distribuído** com OpenTelemetry + Jaeger revela gargalos via waterfall view de spans
- **Docker Compose** sobe a stack completa: API, PostgreSQL, Redis, Prometheus, Grafana, Jaeger, Alertmanager
- **Alertas** no Prometheus com Alertmanager notificam Slack/PagerDuty quando thresholds são violados
- **SLI** é o que medimos, **SLO** é a meta, **SLA** é o contrato; **error budget** guia decisões de deploy

---

## Próxima Aula — Aula 21: Qualidade & Pipeline Agêntico

Na Aula 21 você vai conectar qualidade com pipelines inteligentes: gates de qualidade automatizados, análise de impacto baseada em tracing, rollout progressivo com feature flags, e um pipeline agêntico que decide autonomamente se uma release pode ir para produção com base em métricas de observabilidade em tempo real.

---

## Referências

- *The DevOps Handbook* — Gene Kim, Jez Humble, Patrick Debois, John Willis
- *Site Reliability Engineering* — Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy
- *Accelerate* — Nicole Forsgren, Jez Humble, Gene Kim
- [pino Documentation](https://getpino.io/)
- [prom-client](https://github.com/siimon/prom-client)
- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [The RED Method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Practical Alerting: From SLOs to Error Budgets](https://grafana.com/blog/2020/12/17/practical-alerting-from-slos-to-error-budgets/)

---

## FAQ

**1. DevOps é a mesma coisa que SRE?**  
Não. DevOps é uma cultura de colaboração entre dev e ops. SRE (Site Reliability Engineering) é uma implementação prática de DevOps com foco em confiabilidade, usando engenharia de software para resolver problemas de operação.

**2. Preciso de logs, métricas e tracing ao mesmo tempo?**  
Comece pelos logs estruturados — é o pilar mais simples e que já traz muito valor. Depois métricas RED e, por último, tracing. Cada pilar é útil por si só.

**3. Pino vs Winston: qual escolher?**  
Pino é 5x mais rápido e produz JSON por padrão. Winston é mais flexível em transporte. Para alta throughput, pino é a melhor escolha.

**4. Preciso de um agregador de logs como Loki?**  
Para desenvolvimento local, stdout do Docker é suficiente. Em produção com múltiplas instâncias, você precisa de Loki (leve, integrado com Grafana) ou Elasticsearch.

**5. Prometheus é a única opção para métricas?**  
É o padrão do ecossistema. Alternativas incluem Datadog, New Relic, Grafana Mimir. O formato de métricas do Prometheus é universal.

**6. Vale a pena tracing em uma API monolítica?**  
Sim! Mesmo em um monolito, tracing mostra o tempo dentro de cada camada (controller, use case, repository). A waterfall view continua útil.

**7. O error budget acabou e preciso fazer deploy de segurança?**  
Error budget é diretriz, não lei. Para correções de segurança, documente como "deploy de emergência" e reavalie o SLO depois.

**8. Quantos painéis um dashboard deve ter?**  
Menos é mais. Comece com 4: Rate, Errors, Latência (p95), Negócio. Cada painel extra deve responder uma pergunta específica.

**9. Com que frequência revisar alertas?**  
Semanalmente ou após cada incidente. Alertas que nunca disparam ou disparam sem ação viram ruído.

**10. Postmortem deve culpar alguém?**  
Nunca. Postmortem sem culpa (blameless) foca em aprendizado: o que aconteceu, por que aconteceu, o que vamos fazer para não repetir.

---

## Glossário

| Termo | Definição |
|---|---|
| **Alertmanager** | Componente do Prometheus que gerencia e roteia alertas para canais de notificação |
| **DevOps** | Cultura de integração entre desenvolvimento e operações, baseada em "You build it, you run it" |
| **Error budget** | 1 - SLO; quantidade tolerável de falhas em um período |
| **Log estruturado** | Registro em JSON com campos padronizados (nível, timestamp, contexto) |
| **Métrica RED** | Rate, Errors, Duration — métricas essenciais por endpoint |
| **MTTD** | Mean Time to Detect — tempo entre o erro acontecer e ser detectado |
| **MTTR** | Mean Time to Resolve — tempo entre detectar o erro e corrigi-lo |
| **OpenTelemetry** | Framework padrão da indústria para instrumentação de tracing, métricas e logs |
| **Percentil (p95, p99)** | Valor abaixo do qual X% das observações se encontram |
| **Postmortem** | Análise pós-incidente focada em aprendizado, não em culpa |
| **SLA** | Service Level Agreement — contrato formal com o cliente |
| **SLI** | Service Level Indicator — métrica específica que mede um aspecto do serviço |
| **SLO** | Service Level Objective — meta interna para o valor de um SLI |
| **Span** | Unidade de trabalho dentro de um trace |
| **Trace** | Caminho completo de uma requisição através de múltiplos componentes |
| **Tracing distribuído** | Técnica de rastreamento de requisições que atravessam múltiplos serviços |
| **Waterfall view** | Visualização em cascata de spans e relações pai-filho |
