---
titulo: "Aula 07 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 07: Padrões Estruturais — Adapter, Decorator, Facade, Composite, Proxy e Bridge"
data: 2026-06-20
---

# Aula 07 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo contém **questões práticas** que funcionam como checkpoint de domínio. O objetivo é verificar se você realmente sabe aplicar os 6 padrões estruturais — Adapter, Decorator, Facade, Composite, Proxy e Bridge — não apenas entender a teoria, mas implementá-los no seu projeto.

**Instruções:**

1. Complete cada questão por conta própria, sem reler a aula a cada passo
2. Crie uma pasta `entregas-aula-07/` no seu projeto para salvar os arquivos
3. Cada questão tem um template para você preencher e salvar
4. Só avance para a **Aula 08 — Padrões Comportamentais** quando conseguir completar todas as questões

---

## Questão 1: Diagrama de Relacionamento dos Padrões Estruturais

**Conceito-chave:** Aula 07, Seção 1 — O Problema do Acoplamento Estrutural

**Objetivo:** Demonstrar que você sabe classificar cada padrão estrutural pelo tipo de problema que resolve.

**Passos de Execução:**

1. Crie uma tabela com os 6 padrões estruturais (Adapter, Decorator, Facade, Composite, Proxy, Bridge)
2. Para cada padrão, descreva em 1 frase: o problema que resolve e uma metáfora
3. Para cada padrão, identifique se ele atua no nível de **interface** (muda a assinatura), **comportamento** (adiciona lógica) ou **estrutura** (muda a composição)

**Entrega:**

Crie o arquivo `questao01-classificacao-padroes.md` com o seguinte template preenchido:

```markdown
# Classificação dos Padrões Estruturais

| Padrão | Problema que Resolve | Metáfora | Nível de Atuação |
|---|---|---|---|
| Adapter | ... | ... | Interface / Comportamento / Estrutura |
| Decorator | ... | ... | ... |
| Facade | ... | ... | ... |
| Composite | ... | ... | ... |
| Proxy | ... | ... | ... |
| Bridge | ... | ... | ... |

## Pergunta de Reflexão

Qual destes padrões você considera mais versátil e por quê?

**Resposta:**
```

---

## Questão 2: Implementar Adapter para API de Frete

**Conceito-chave:** Aula 07, Seção 2 — Adapter

**Objetivo:** Demonstrar que você sabe construir um Adapter para isolar uma API externa de frete.

**Passos de Execução:**

1. Considere a interface `IShippingProvider` abaixo
2. A API fictícia `FreteRapidoAPI` retorna dados em formato diferente
3. Implemente `FreteRapidoAdapter` que traduz a API externa para o contrato esperado
4. O adapter deve: traduzir CEP (remover não-dígitos), calcular prazo em dias, converter custo para número

```typescript
interface IShippingProvider {
  calculate(cep: string, weightKg: number): Promise<{
    cost: number;
    deliveryDays: number;
    provider: string;
  }>;
}

// API externa (não modificável)
class FreteRapidoAPI {
  async quote(data: { cep_destino: string; peso_gramas: number }): Promise<string> {
    // Retorna XML simulado: "<cotacao><valor>25.50</valor><prazo>3</prazo></cotacao>"
    const cost = (Math.random() * 50 + 10).toFixed(2);
    const days = Math.floor(Math.random() * 5 + 1);
    return `<cotacao><valor>${cost}</valor><prazo>${days}</prazo></cotacao>`;
  }
}
```

**Entrega:**

```markdown
# Adapter — FreteRapidoAdapter

## Código do Adapter

```typescript
// Cole aqui sua implementação
```

## Teste Manual (simulação)

```typescript
// Cole aqui o código que testa o adapter
const adapter = new FreteRapidoAdapter();
const result = await adapter.calculate('01001-000', 2);
console.log(result);
// Deve imprimir: { cost: 25.50, deliveryDays: 3, provider: 'FreteRapido' }
```

## Pergunta de Reflexão

O que muda no código se você trocar de FreteRapidoAPI para uma nova transportadora?

**Resposta:**
```

---

## Questão 3: Empilhar Decorators no Gateway de Pagamento

**Conceito-chave:** Aula 07, Seção 3 — Decorator

**Objetivo:** Demonstrar que você sabe compor comportamentos usando Decorator.

**Passos de Execução:**

1. Crie a interface `IPaymentGateway` com `process(amount: number, cardToken: string): Promise<{ status: string; id: string }>`
2. Implemente `CreditCardGateway` concreto que simula processamento
3. Implemente 2 decorators:
   - `TimeoutDecorator` — cancela se a operação exceder 2 segundos
   - `RetryDecorator` — tenta novamente até 3 vezes em caso de falha
4. Componha: `new RetryDecorator(new TimeoutDecorator(new CreditCardGateway()))`

**Entrega:**

```markdown
# Decorator — Timeout e Retry

## Código da Interface e Gateway Base

```typescript
// Cole aqui
```

## Código dos Decorators

```typescript
// Cole aqui TimeoutDecorator e RetryDecorator
```

## Código da Composição

```typescript
// Mostre a composição e um exemplo de execução
```

## Pergunta de Reflexão

Por que a ordem dos decorators importa? O que aconteceria se TimeoutDecorator estivesse fora de RetryDecorator?

**Resposta:**
```

---

## Questão 4: Projetar um Facade para o Fluxo de Cancelamento

**Conceito-chave:** Aula 07, Seção 4 — Facade

**Objetivo:** Demonstrar que você sabe projetar um Facade que orquestra múltiplos serviços.

**Passos de Execução:**

1. Considere o fluxo de cancelamento de pedido que envolve 4 serviços:
   - `IOrderService` — buscar e atualizar status do pedido
   - `IPaymentService` — estornar pagamento
   - `IInventoryService` — devolver itens ao estoque
   - `INotificationService` — notificar cliente sobre o cancelamento
2. Projete um `CancellationFacade` com método `cancel(orderId: string): Promise<CancellationResult>`
3. O Facade deve tratar: pedido não encontrado, pedido já cancelado, falha no estorno
4. Defina as interfaces dos 4 serviços (elas podem ser simplificadas)

**Entrega:**

```markdown
# Facade — CancellationFacade

## Interfaces dos Serviços

```typescript
// Definição de IOrderService, IPaymentService, IInventoryService, INotificationService
```

## Código do CancellationFacade

```typescript
// Implementação completa com tratamento de erros
```

## Diagrama de Sequência (texto ou Mermaid)

Descreva a ordem das chamadas dentro do método `cancel()`:

**Resposta:**
```

---

## Questão 5: Composite para Menu de Navegação

**Conceito-chave:** Aula 07, Seção 5 — Composite

**Objetivo:** Demonstrar que você sabe modelar uma árvore de navegação usando Composite.

**Passos de Execução:**

1. Crie a interface `MenuItemComponent` com `render(): string` e `getUrl(): string`
2. Implemente `MenuLink` (leaf) — um link individual com URL e label
3. Implemente `MenuGroup` (composite) — um grupo que contém links e subgrupos
4. O `MenuGroup.render()` deve retornar uma lista aninhada em HTML ou Markdown
5. Construa a seguinte árvore de navegação:
   - Home (/)
   - Produtos (/produtos)
     - Eletrônicos (/produtos/eletronicos)
     - Roupas (/produtos/roupas)
   - Contato (/contato)

**Entrega:**

```markdown
# Composite — Menu de Navegação

## Código da Interface e Implementações

```typescript
// Cole aqui MenuItemComponent, MenuLink e MenuGroup
```

## Exemplo de Uso

```typescript
// Construa a árvore e chame render()
```

## Resultado Esperado

```
* [Home](/)
* [Produtos](/produtos)
  * [Eletrônicos](/produtos/eletronicos)
  * [Roupas](/produtos/roupas)
* [Contato](/contato)
```

## Pergunta de Reflexão

Como você adicionaria um novo tipo de componente (ex: `MenuDivider`) sem modificar o código existente?

**Resposta:**
```

---

## Questão 6: Proxy de Cache com TTL

**Conceito-chave:** Aula 07, Seção 6 — Proxy

**Objetivo:** Demonstrar que você sabe implementar um Cache Proxy com expiração.

**Passos de Execução:**

1. Considere a interface `IProductSearch` com `search(term: string): Promise<Product[]>`
2. Implemente `DatabaseProductSearch` que simula uma busca lenta (1 segundo)
3. Implemente `CachedProductSearch` (Proxy) com:
   - Cache em `Map<string, { data: Product[]; expiresAt: number }>`
   - TTL de 30 segundos
   - Cache Miss → busca no database, armazena no cache, retorna
   - Cache Hit → retorna imediato se dentro do TTL
   - Cache Expired → busca no database, atualiza cache, retorna

**Entrega:**

```markdown
# Proxy — CachedProductSearch

## Código da Interface e Implementação Real

```typescript
// Cole aqui
```

## Código do Proxy

```typescript
// Cole aqui a implementação completa com TTL
```

## Teste com Temporização

```typescript
// Simule: primeira chamada (lenta), segunda chamada (rápida), terceira após expirar
```

## Pergunta de Reflexão

Qual estratégia de cache você usaria para invalidar o cache quando um produto for atualizado?

**Resposta:**
```

---

## Questão 7: Bridge para Sistema de Exportação

**Conceito-chave:** Aula 07, Seção 7 — Bridge

**Objetivo:** Demonstrar que você sabe usar Bridge para separar formato de exportação do destino.

**Passos de Execução:**

1. Defina `ExportFormatter` (implementação) com `format(data: OrderData): string`
2. Implemente `CSVFormatter` e `JSONFormatter`
3. Defina `Exporter` (abstração) com `export(orderId: string): Promise<void>`
4. Implemente `FileExporter` (salva em arquivo) e `HttpExporter` (envia via HTTP)
5. Conecte via Bridge: `new FileExporter(new CSVFormatter())` exporta CSV para arquivo

Use esta interface de dados:

```typescript
interface OrderData {
  id: string;
  customer: string;
  items: Array<{ product: string; qty: number; price: number }>;
  total: number;
}
```

**Entrega:**

```markdown
# Bridge — Exportação de Pedidos

## Código dos Formatadores (Implementação)

```typescript
// CSVFormatter e JSONFormatter
```

## Código dos Exportadores (Abstração)

```typescript
// FileExporter e HttpExporter
```

## Exemplo de Combinações

```typescript
// Mostre pelo menos 3 combinações diferentes
const csvFile = new FileExporter(new CSVFormatter());
const jsonHttp = new HttpExporter(new JSONFormatter());
const csvHttp = new HttpExporter(new CSVFormatter());
```

## Pergunta de Reflexão

Quantas classes você teria sem Bridge para 3 formatos e 2 destinos? Quantas com Bridge?

**Resposta:**
```

---

## Questão 8: Integração de Múltiplos Padrões

**Conceito-chave:** Aula 07, Seções 8-13 — Aplicação no E-commerce

**Objetivo:** Demonstrar que você sabe integrar Adapter, Decorator e Facade no mesmo fluxo.

**Passos de Execução:**

1. Modele o fluxo de **reembolso** de um pedido no e-commerce
2. Incorpore ao menos **3 padrões estruturais** diferentes:
   - Adapter: para o gateway de pagamento externo (simule um)
   - Decorator: para logging e validação do reembolso
   - Facade: para orquestrar o fluxo completo
3. O fluxo de reembolso deve: validar dados → consultar pedido → estornar no gateway → devolver estoque → notificar cliente → auditar

**Entrega:**

```markdown
# Integração — Fluxo de Reembolso

## Interfaces do Domínio

```typescript
// Defina IRefundGateway (Adapter target), IOrderService, IInventoryService, INotificationService
```

## Implementação do Adapter

```typescript
// Simule um gateway externo e seu adapter
```

## Implementação dos Decorators

```typescript
// LoggingRefundDecorator e ValidationRefundDecorator
```

## Implementação do Facade

```typescript
// RefundFacade com método refund(orderId): Promise<RefundResult>
```

## Diagrama de Fluxo

Descreva (ou use Mermaid) a sequência de chamadas:

**Resposta:**
```

---

## Checklist Final: Pronto para a Aula 08?

Antes de avançar para **Aula 08 — Padrões Comportamentais**, verifique se você consegue:

- [ ] **Questão 1:** Classifiquei os 6 padrões estruturais por problema, metáfora e nível de atuação
- [ ] **Questão 2:** Implementei um Adapter que traduz API externa para o contrato do domínio
- [ ] **Questão 3:** Compus comportamentos com Decorator (Timeout + Retry) no gateway de pagamento
- [ ] **Questão 4:** Projetei um Facade para orquestrar o cancelamento de pedido com 4 serviços
- [ ] **Questão 5:** Modelei uma árvore de navegação com Composite (grupos e links uniformes)
- [ ] **Questão 6:** Implementei um Cache Proxy com TTL para busca de produtos
- [ ] **Questão 7:** Separei formato de exportação de destino usando Bridge
- [ ] **Questão 8:** Integrei Adapter + Decorator + Facade no fluxo de reembolso do e-commerce

> *Acertou todas? Você está pronto para a Aula 08 — Padrões Comportamentais, onde vai aprender Strategy, Observer, Command, State, Chain of Responsibility e Template Method. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
