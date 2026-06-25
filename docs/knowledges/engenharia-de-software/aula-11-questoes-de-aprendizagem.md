---
titulo: "Aula 11 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 11: Domain-Driven Design — Padrões Táticos"
data: 2026-06-21
---

# Aula 11 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o **checkpoint de aprendizagem** da Aula 11. A pergunta central é: *"eu realmente domino os padrões táticos do DDD?"*

Cada questão verifica um conceito-chave da aula. Leia o enunciado, execute os passos e preencha o template de entrega. Crie uma pasta `entregas-aula11/` no seu diretório de estudos e salve cada entrega como `questao-N-titulo.md`.

**Importante:** não consulte a aula principal enquanto resolve. Se travar, o campo **Conceito-chave** indica qual seção revisar. Só avance para a Aula 12 quando conseguir completar todas as questões por conta própria.

---

## Questão 1: Entity ou Value Object?

**Conceito-chave:** Entities vs Value Objects — critério de identidade (Aula 11, FUNDAMENTOS, Seção 1 e 2).

**Objetivo:** Aplicar o critério de identidade vs valor para classificar conceitos de domínio.

**Passos de Execução:**

1. Analise cada conceito abaixo e classifique como **Entity** ou **Value Object**
2. Justifique cada classificação com base no critério de identidade
3. Indique se o objeto deve ter ID, se é imutável e se a igualdade é por identidade ou valor

Conceitos: `Invoice`, `InvoiceNumber`, `PhoneNumber`, `CustomerTier`, `Category`, `DiscountCoupon`, `TrackingCode`, `ReturnRequest`

**Entrega:** crie `entregas-aula11/01-entity-vs-vo.md`:

```markdown
# Questão 1 — Entity ou Value Object?

## Tabela de Classificação

| Conceito | Entity ou VO? | Justificativa |
|---|---|---|
| Invoice |  |  |
| InvoiceNumber |  |  |
| PhoneNumber |  |  |
| CustomerTier |  |  |
| Category |  |  |
| DiscountCoupon |  |  |
| TrackingCode |  |  |
| ReturnRequest |  |  |

## Pergunta de Reflexão

Qual desses foi mais difícil de classificar? O que tornou a decisão ambígua?
```

---

## Questão 2: Value Object Money com Cotação

**Conceito-chave:** Value Objects — imutabilidade e operações (Aula 11, APLICAÇÃO, Seção 5).

**Objetivo:** Estender o Value Object `Money` com suporte a conversão entre moedas usando taxa de câmbio.

**Passos de Execução:**

1. Crie um método `convertTo(targetCurrency: string, exchangeRate: number): Money` na classe `Money`
2. O método deve retornar um **novo** `Money` (nunca modificar o original)
3. Valide que `exchangeRate > 0`
4. Valide que `targetCurrency` é ISO 4217 (3 letras maiúsculas)
5. Adicione o método `isGreaterThan(other: Money): boolean` para comparacão entre valores

**Entrega:** crie `entregas-aula11/02-money-conversion.md`:

```markdown
# Questão 2 — Money com Conversão de Moeda

## Código Implementado

```typescript
// Cole aqui sua implementacao completa da classe Money
// com os métodos convertTo e isGreaterThan
```

## Exemplo de Uso

```typescript
const totalEmDolar = Money.of(100, 'USD');
const totalEmReal = totalEmDolar.convertTo('BRL', 5.20);
console.log(totalEmReal.toString()); // BRL 520.00
console.log(totalEmDolar.toString()); // USD 100.00 (inalterado)
```

## Testes

Quais testes você escreveria para garantir que a imutabilidade foi preservada?
```

---

## Questão 3: Identificando Invariantes

**Conceito-chave:** Aggregates — invariantes de negócio (Aula 11, FUNDAMENTOS, Seção 3).

**Objetivo:** Identificar e modelar invariantes para um aggregate de carrinho de compras (`Cart`).

**Passos de Execução:**

1. Analise as regras de negócio abaixo para um carrinho de compras
2. Identifique quais são invariantes (sempre verdadeiras) vs regras transitórias
3. Implemente o aggregate `Cart` com as invariantes identificadas

Regras de negócio:
- Carrinho pertence a um único cliente
- Carrinho pode estar vazio (diferente de Order, que exige pelo menos 1 item)
- Quantidade de cada item deve ser positiva
- Quantidade máxima por item é 99
- Carrinho não pode ter mais de 50 itens distintos
- Frete é calculado no fechamento, não é invariante do carrinho

**Entrega:** crie `entregas-aula11/03-cart-invariants.md`:

```markdown
# Questão 3 — Invariantes do Carrinho

## Invariantes Identificadas

1. [Carrinho pertence a um único cliente] — invariante? (sim/não)
2. [Carrinho pode estar vazio] — invariante?
3. [Quantidade positiva] — invariante?
4. [Quantidade máxima 99 por item] — invariante?
5. [Máximo 50 itens distintos] — invariante?
6. [Frete calculado no fechamento] — invariante?

## Código do Aggregate Cart

```typescript
// Implemente aqui o aggregate Cart com as invariantes
```

## Teste de Invariantes

Descreva um cenário onde uma invariante seria violada se não houvesse proteção no aggregate.
```

---

## Questão 4: Refatorando Tipos Primitivos para VOs

**Conceito-chave:** Value Objects — substituição de tipos primitivos (Aula 11, APLICAÇÃO, Seção 5).

**Objetivo:** Refatorar código legado baseado em tipos primitivos para usar Value Objects.

**Passos de Execução:**

1. Analise a classe `Product` abaixo, que usa tipos primitivos para tudo
2. Identifique quais campos deveriam ser Value Objects
3. Crie os VOs necessários (`Email`, `Money`, `CPF`, `URL`, etc.)
4. Refatore a classe para usar os VOs

```typescript
// Código legado — tipos primitivos
export class Seller {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,        // deveria ser Email
    public readonly commission: number,   // deveria ser Money (percentual?)
    public readonly commissionCurrency: string,
    public readonly cpf: string,          // deveria ser CPF
    public readonly website: string,      // deveria ser URL
    public readonly phone: string,        // deveria ser PhoneNumber
    public readonly tier: string          // deveria ser enum ou VO
  ) {}
}
```

**Entrega:** crie `entregas-aula11/04-refactor-primitives.md`:

```markdown
# Questão 4 — Refatoração para Value Objects

## Value Objects Criados

| Campo | VO Criado | Validacões |
|---|---|---|
| email |  |  |
| commission |  |  |
| cpf |  |  |
| website |  |  |
| phone |  |  |
| tier |  |  |

## Código Refatorado

```typescript
// Implemente aqui a classe Seller refatorada com VOs
```

## Antes vs Depois

Compare: o que mudou na seguranca do código? Quais bugs potenciais foram eliminados?
```

---

## Questão 5: Implementando um Domain Event

**Conceito-chave:** Domain Events — dispatter e handlers (Aula 11, APLICAÇÃO, Seção 7).

**Objetivo:** Implementar o domain event `StockReserved` e seu handler no Bounded Context de Estoque.

**Passos de Execução:**

1. Crie a interface `DomainEvent` e a classe `StockReserved` com `orderId`, `items` e metadados do evento
2. Crie o handler `ReserveStockHandler` que reduz o estoque disponível
3. Integre o disparo do evento no método `confirm()` do `Order`
4. Registre o handler no `EventDispatcher`

**Entrega:** crie `entregas-aula11/05-domain-event-stock.md`:

```markdown
# Questão 5 — Domain Event StockReserved

## Interface DomainEvent

```typescript
// Sua implementação da interface DomainEvent
```

## Classe StockReserved

```typescript
// Sua implementação do evento
```

## ReserveStockHandler

```typescript
// Handler que processa o evento
```

## Integração no Order.confirm()

```typescript
// Como o Order.confirm() dispara o evento
```

## Diagrama de Fluxo

Descreva o fluxo completo desde `Order.confirm()` até a execução do handler.
```

---

## Questão 6: Repository Interface vs Implementação

**Conceito-chave:** Repositories — interface no domínio, implementação na infra (Aula 11, APLICAÇÃO, Seção 8).

**Objetivo:** Projetar a interface `IProductCatalogRepository` e duas implementações (Postgres e InMemory).

**Passos de Execução:**

1. Defina a interface no domínio com métodos: `findById`, `findBySku`, `searchByName`, `save`, `delete`
2. Implemente `InMemoryProductCatalogRepository` usando um `Map` (para testes)
3. Implemente `PostgresProductCatalogRepository` usando queries SQL (esboço, sem conexão real)
4. Explique por que a interface vive no domínio e a implementação na infra

**Entrega:** crie `entregas-aula11/06-repository-pattern.md`:

```markdown
# Questão 6 — Repository: Interface e Implementações

## Interface (Domínio)

```typescript
// Interface IProductCatalogRepository
```

## Implementação InMemory

```typescript
// InMemoryProductCatalogRepository
```

## Implementação Postgres (esboço)

```typescript
// PostgresProductCatalogRepository
```

## Análise

Por que a interface pertence ao domínio e não à infraestrutura? Como isso se conecta com o DIP (Dependency Inversion Principle)?
```

---

## Questão 7: Domain Service — Calculadora de Frete

**Conceito-chave:** Domain Services — lógica entre aggregates (Aula 11, APLICAÇÃO, Seção 9).

**Objetivo:** Implementar um Domain Service `ShippingCalculator` que calcula frete com base em regras de negócio.

**Passos de Execução:**

1. Crie `ShippingCalculator` com método `calculate(order: Order): Money`
2. Regras: frete grátis para pedidos acima de R$ 200; frete fixo de R$ 15 para Sudeste; R$ 25 para demais regiões
3. O cálculo depende do `Address` (VO) do pedido e do `total` (Money)
4. O service não tem estado — é pura lógica de negócio

**Entrega:** crie `entregas-aula11/07-shipping-calculator.md`:

```markdown
# Questão 7 — Domain Service: ShippingCalculator

## Código do Domain Service

```typescript
// Implemente ShippingCalculator
```

## Teste de Mesa

| Cenário | Total do Pedido | Região | Frete Esperado |
|---|---|---|---|
| Abaixo de R$200, Sudeste | R$ 50,00 | SP | R$ 15,00 |
| Acima de R$200, Sudeste | R$ 250,00 | RJ | R$ 0,00 |
| Abaixo de R$200, Nordeste | R$ 80,00 | BA | R$ 25,00 |
| Acima de R$200, Norte | R$ 300,00 | PA | R$ 0,00 |

## Reflexão

Por que `ShippingCalculator` é um Domain Service e não um método no `Order`?
```

---

## Questão 8: Desafio — Projetando um Aggregate Completo

**Conceito-chave:** Todos os padrões táticos — integração (Aula 11, APLICAÇÃO, Seções 4 a 9).

**Objetivo:** Projetar um aggregate completo `WarrantyClaim` (solicitação de garantia) que integre todos os padrões táticos.

**Passos de Execução:**

1. Modele a Entity raiz `WarrantyClaim` com: `id`, `orderId`, `productId`, `reason`, `status`, `createdAt`
2. Crie o Value Object `WarrantyReason` (categoria + descrição, imutável)
3. Defina as invariantes: status só avança (OPEN → IN_REVIEW → APPROVED → REPAIRED | REPLACED → CLOSED)
4. Crie o Domain Event `WarrantyApproved` com dados relevantes
5. Crie o Repository `IWarrantyClaimRepository` com `findById`, `save`, `findByCustomer`
6. Crie o Domain Service `WarrantyEligibilityService` que verifica se o produto está no prazo de garantia

**Entrega:** crie `entregas-aula11/08-warranty-claim.md`:

```markdown
# Questão 8 — Aggregate WarrantyClaim

## Estrutura do Aggregate

- **Aggregate Root:** WarrantyClaim (Entity)
- **Value Objects:** WarrantyReason
- **Domain Events:** WarrantyApproved, WarrantyRejected
- **Repository:** IWarrantyClaimRepository
- **Domain Service:** WarrantyEligibilityService

## Código

```typescript
// Implemente aqui:
// 1. WarrantyClaim (Entity + Aggregate Root)
// 2. WarrantyReason (Value Object)
// 3. WarrantyApproved (Domain Event)
// 4. IWarrantyClaimRepository (interface)
// 5. WarrantyEligibilityService (Domain Service)
```

## Diagrama

```
Flowchart:
WarrantyClaim (Aggregate Root)
├── WarrantyReason (VO)
├── WarrantyStatus (enum — invariante de transição)
├── ProductId (referência externa)
└── OrderId (referência externa)
```

## Pergunta Final

Qual das invariantes foi mais desafiadora de implementar? Por quê?
```

---

## Checklist Final: Pronto para a Aula 12?

Antes de avançar para **Arquitetura de Software (Aula 12)**, verifique se você consegue fazer cada um dos itens abaixo sem consultar a aula:

- [ ] **Questão 1:** Classifiquei corretamente Entity vs Value Object para 8 conceitos usei o critério de identidade
- [ ] **Questão 2:** Implementei `convertTo` e `isGreaterThan` no Money preservando imutabilidade
- [ ] **Questão 3:** Identifiquei invariantes de negócio e implementei o aggregate Cart protegendo-as
- [ ] **Questão 4:** Refatorei tipos primitivos para Value Objects com validação na criação
- [ ] **Questão 5:** Modelei Domain Event + handler + integração no aggregate
- [ ] **Questão 6:** Diferenciei interface (domínio) de implementação (infra) no Repository pattern
- [ ] **Questão 7:** Implementei Domain Service com regras de negócio sem estado
- [ ] **Questão 8 (desafio):** Projetei um aggregate completo integrando todos os padrões táticos
- [ ] **Próximo módulo:** Sei que a Aula 12 vai conectar os padrões táticos com estilos arquiteturais (Clean Architecture, Hexagonal, Onion)

**Teaser da Aula 12:** Os `Order`, `Money`, `Payment` e `WarrantyClaim` que você implementou aqui são o núcleo do domínio. Na Aula 12 você vai organizá-los em camadas, aplicar Ports & Adapters e estruturar módulos por Bounded Context. O domínio já está pronto — agora falta a arquitetura que o protege.
