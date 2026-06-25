---
titulo: "Padrões Criacionais — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 06 — Padrões Criacionais (Creational Patterns)"
data: 2026-06-21
---

# Aula 06 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo contém **questões práticas** que funcionam como checkpoint de domínio. O objetivo é verificar se você realmente entendeu os padrões criacionais apresentados na Aula 06 — não apenas a teoria, mas a capacidade de aplicar na prática com TypeScript no contexto do e-commerce.

A pergunta central é: **"eu realmente entendi a matéria a ponto de fazer sozinho?"**

**Instruções:**

1. Complete cada questão por conta própria, sem reler a aula a cada passo
2. Crie uma pasta `entregas-aula-06/` no seu projeto para salvar os arquivos
3. Cada questão indica o conceito-chave verificado e a seção correspondente da aula — se travar, releia apenas aquela seção
4. Só avance para a Aula 07 quando conseguir completar todas as questões sem consultar o código de exemplo
5. O gabarito comentado está na própria aula — use-o apenas para conferir depois de tentar

---

## Questão 1: Configuração de Provedores com Object Literal

**Conceito-chave:** Aula 06, Seção 2 — Object Literal: Shorthand, Destructuring e Spread

**Objetivo:** Demonstrar que você sabe criar e manipular objetos de configuração usando shorthand properties, destructuring e spread operator.

**Passos de Execução:**

1. Crie um objeto literal `shippingProviders` com três provedores de frete: `sedex` (taxa: 25.90, prazo: 1 dia), `pac` (taxa: 15.50, prazo: 5 dias), e `retirada` (taxa: 0, prazo: 0 dias). Use **shorthand properties** onde possível
2. Escreva uma função `getShippingSummary` que recebe o nome do provedor, faz **destructuring** do objeto e retorna apenas `{ name, rate, deadline }`
3. Use **spread operator** para criar uma versão promocional do provedor `sedex` com 50% de desconto na taxa e uma nova propriedade `promoExpiresAt: new Date()`
4. Use **destructuring com rest** para extrair a propriedade `rate` e agrupar o restante em `rest`

**Entrega:** crie `entregas-aula-06/questao01-object-literal.md`:

```markdown
# Questão 1 — Configuração de Provedores com Object Literal

## Provedores de Frete

```typescript
const shippingProviders = {
  // Implemente aqui com shorthand properties
};

// Dica: declare variáveis com os valores antes de montar o objeto
```

## Função getShippingSummary

```typescript
function getShippingSummary(type: keyof typeof shippingProviders) {
  // Use destructuring para extrair name, rate, deadline
}
```

## Versão Promocional (Spread)

```typescript
const sedexPromo = {
  // Use spread para copiar sedex e sobrescrever a taxa
};
```

## Destructuring com Rest

```typescript
// Extraia 'rate' e agrupe o resto em 'rest'
const { rate, ...rest } = shippingProviders.sedex;
```

## Perguntas de Reflexão

1. Por que usar Object Literal é mais adequado aqui do que criar uma classe `ShippingProvider`?
2. O que aconteceria se você usasse `Object.create(shippingProviders.sedex)` em vez de spread para criar a versão promocional?
3. Em que cenário você trocaria Object Literal por uma classe?
```

---

## Questão 2: Factory Method com Registry Pattern

**Conceito-chave:** Aula 06, Seção 3 — Factory Method e Registro Dinâmico de Builders

**Objetivo:** Demonstrar que você sabe implementar um Factory Method usando `Map` para registro dinâmico, seguindo o padrão visto com `PaymentGatewayFactory`.

**Passos de Execução:**

1. Implemente a interface `NotificationChannel` com o método `send(recipient: string, message: string): Promise<void>`
2. Implemente três canais concretos: `EmailChannel`, `SMSChannel`, `PushChannel` — cada um fazendo `console.log` simulando o envio
3. Crie a classe `NotificationFactory` com:
   - Um `Map` estático privado de builders
   - Método estático `register(type, builder)` para registrar canais
   - Método estático `create(type)` que busca o builder e executa, lançando erro se não encontrado
4. Registre os três canais na fábrica
5. Use a fábrica em uma função `sendNotification(type, recipient, message)` que cria o canal e envia

**Entrega:** crie `entregas-aula-06/questao02-factory-method.md`:

```markdown
# Questão 2 — Factory Method com Registry Pattern

## Interface e Implementações

```typescript
interface NotificationChannel {
  send(recipient: string, message: string): Promise<void>;
}

// Implemente EmailChannel, SMSChannel, PushChannel
```

## NotificationFactory

```typescript
type ChannelType = 'email' | 'sms' | 'push';
type ChannelBuilder = () => NotificationChannel;

class NotificationFactory {
  // Implemente o Map, register() e create()
}
```

## Registro e Uso

```typescript
// Registre os três canais
// Crie a função sendNotification
```

## Perguntas de Reflexão

1. Como você adicionaria um quarto canal (ex: `whatsapp`) sem modificar a classe `NotificationFactory`?
2. Qual a vantagem do `Map` sobre um `switch` para este cenário?
3. Como o Factory Method se relaciona com o OCP (Open-Closed Principle)?
```

---

## Questão 3: Abstract Factory para Temas

**Conceito-chave:** Aula 06, Seção 4 — Abstract Factory: Famílias de Objetos Relacionados

**Objetivo:** Demonstrar que você sabe construir uma Abstract Factory para criar famílias de componentes visuais (Button, Input, Modal) que variam por tema.

**Passos de Execução:**

1. Defina três interfaces de produto: `Button` (métodos `render(): string`, `onClick(cb)`) , `Input` (métodos `render(): string`, `getValue()`, `setValue(v)`) e `Modal` (métodos `render(): string`, `open()`, `close()`)
2. Defina a interface `UIThemeFactory` com métodos `createButton(label)`, `createInput(placeholder)`, `createModal(title, content)`
3. Implemente a família **LightThemeFactory**: `LightButton`, `LightInput`, `LightModal` — cada `render()` retorna um HTML com classe `*-light`
4. Implemente a família **DarkThemeFactory**: `DarkButton`, `DarkInput`, `DarkModal` — cada `render()` retorna um HTML com classe `*-dark`
5. Crie uma classe `SettingsPage` que recebe uma `UIThemeFactory` no construtor e tem um método `render()` que cria e renderiza button + input + modal

**Entrega:** crie `entregas-aula-06/questao03-abstract-factory.md`:

```markdown
# Questão 3 — Abstract Factory para Temas

## Interfaces dos Produtos

```typescript
// Defina Button, Input, Modal como interfaces
```

## Abstract Factory

```typescript
interface UIThemeFactory {
  // Defina createButton, createInput, createModal
}
```

## Implementação Light

```typescript
// Implemente LightButton, LightInput, LightModal, LightThemeFactory
```

## Implementação Dark

```typescript
// Implemente DarkButton, DarkInput, DarkModal, DarkThemeFactory
```

## Cliente: SettingsPage

```typescript
class SettingsPage {
  constructor(private ui: UIThemeFactory) {}

  render(): string {
    // Crie e renderize button + input + modal
  }
}
```

## Perguntas de Reflexão

1. Qual a diferença fundamental entre Abstract Factory e Factory Method? Dê um exemplo onde cada um se aplica.
2. Se você precisasse adicionar um terceiro tema (HighContrast), quais classes precisariam ser criadas? Quais não precisam ser modificadas?
3. O que acontece com a consistência visual se diferentes threads criassem elementos usando factories diferentes?
```

---

## Questão 4: Builder com Fluent API

**Conceito-chave:** Aula 06, Seção 5 — Builder: Construção Passo a Passo com Fluent API

**Objetivo:** Demonstrar que você sabe projetar um Builder com fluent API e validação final em lote.

**Passos de Execução:**

1. Defina as interfaces `Address` (street, city, state, zipCode) e `InvoiceItem` (description, quantity, unitPrice)
2. Implemente a classe `InvoiceBuilder` com os métodos fluentes:
   - `forCustomer(customerId)` — obrigatório
   - `addItem(description, quantity, unitPrice)` — obrigatório (pelo menos 1 item)
   - `withDueDate(date)` — opcional (padrão: 30 dias a partir de hoje)
   - `withNotes(notes)` — opcional
   - `shipTo(address)` — opcional
   - `build()` — valida e retorna o objeto final
3. Regras de validação no `build()`:
   - `customerId` é obrigatório
   - Deve haver pelo menos 1 item
   - Cada item deve ter `quantity > 0` e `unitPrice >= 0`
   - Se o total (quantity * unitPrice) for maior que 10000, `dueDate` deve ser no mínimo 60 dias a partir de hoje
4. Crie uma fatura simples (1 item, sem notas) e uma completa (3 itens, com endereço e notas)

**Entrega:** crie `entregas-aula-06/questao04-builder.md`:

```markdown
# Questão 4 — Builder com Fluent API

## Interfaces

```typescript
// Defina Address e InvoiceItem
```

## InvoiceBuilder

```typescript
class InvoiceBuilder {
  // Implemente com fluent API (return this)
  // Validações no build()
}
```

## Exemplo de Uso

```typescript
// Fatura simples
const simple = new InvoiceBuilder()
  .forCustomer('CUST-001')
  .addItem('Consultoria', 40, 150)
  .build();

// Fatura completa
const full = new InvoiceBuilder()
  .forCustomer('CUST-002')
  .addItem('Desenvolvimento', 80, 200)
  .addItem('Design', 20, 150)
  .addItem('Suporte', 10, 100)
  .withDueDate(new Date('2026-09-01'))
  .withNotes('Contrato mensal de agosto')
  .shipTo({ street: 'Rua X, 100', city: 'SP', state: 'SP', zipCode: '01001-000' })
  .build();
```

## Perguntas de Reflexão

1. Por que o Builder é preferível a um construtor com 7 parâmetros opcionais?
2. Qual a diferença entre validar no `build()` vs validar em cada método setter?
3. Em que cenário um Director (ex: `InvoiceDirector.urgentInvoice()`) faria sentido?
```

---

## Questão 5: Singleton e Testabilidade

**Conceito-chave:** Aula 06, Seção 6 — Singleton: Instância Única e Problemas de Testabilidade

**Objetivo:** Demonstrar que você sabe implementar um Singleton de duas formas (clássico e ES Module) e explicar os trade-offs de testabilidade.

**Passos de Execução:**

1. Implemente a classe `CacheManager` como Singleton clássico:
   - Construtor privado
   - Método estático `getInstance()`
   - Métodos `set(key, value)`, `get(key)`, `clear()` usando um `Map` interno
   - Propriedade `hitCount` que incrementa a cada `get()`
2. Implemente o mesmo `CacheManager` como ES Module (exporte um objeto literal `cacheManager`)
3. Escreva um teste hipotético para uma `ProductService` que usa o `CacheManager`
   - Mostre por que o Singleton clássico dificulta o teste
   - Mostre como a injeção de dependência resolveria o problema
4. Adicione um método `resetForTesting()` ao Singleton clássico

**Entrega:** crie `entregas-aula-06/questao05-singleton.md`:

```markdown
# Questão 5 — Singleton e Testabilidade

## Singleton Clássico

```typescript
class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, unknown>();
  private _hitCount = 0;

  private constructor() {}

  static getInstance(): CacheManager {
    // Implemente
  }

  set(key: string, value: unknown): void { /* ... */ }
  get(key: string): unknown { /* ... */ }
  clear(): void { /* ... */ }
  get hitCount(): number { return this._hitCount; }

  static resetForTesting(): void {
    // Permite recriar a instância em testes
  }
}
```

## Singleton via ES Module

```typescript
// cache-manager.ts
export const cacheManager = {
  // Implemente como objeto literal
};
```

## Problema de Testabilidade

Explique por que o seguinte teste é problemático:

```typescript
// Teste com Singleton clássico
describe('ProductService', () => {
  it('should cache product lookup', () => {
    const cache = CacheManager.getInstance();
    // Como mockar o cache? CacheManager.GetInstance() sempre retorna o mesmo objeto real
  });
});
```

## Solução com DI

```typescript
// Como a injeção de dependência resolveria o problema
// (apenas pseudocódigo + explicação)
```

## Perguntas de Reflexão

1. Por que ES Modules são considerados "Singletons naturais"?
2. Qual o maior risco de usar Singleton com estado mutável em um sistema concorrente?
3. Você usaria Singleton para um pool de banco de dados? E para um logger? Justifique.
```

---

## Questão 6: Prototype com Templates de Produto

**Conceito-chave:** Aula 06, Seção 7 — Prototype: Clone de Objetos com Object.create() e Spread

**Objetivo:** Demonstrar que você sabe clonar objetos protótipo usando `Object.create()` e spread operator, reconhecendo as diferenças entre eles.

**Passos de Execução:**

1. Crie um objeto `productTemplate` com as propriedades: `status: 'draft'`, `category: 'general'`, `tags: []`, `variations: []`, `createdAt: new Date()`
2. Use `Object.create(productTemplate)` para criar dois produtos: `productA` (nome: 'Notebook') e `productB` (nome: 'Mouse'). Adicione tags usando `push()`
3. Observe e documente: o que acontece com o array `tags` quando você modifica em um dos produtos? Por quê?
4. Use **spread operator** para criar `productC` e `productD` com os mesmos dados, mas cada um com seu próprio array `tags`
5. Crie uma função `createProduct(overrides: Partial<typeof productTemplate>)` que retorna um clone com spread + overrides

**Entrega:** crie `entregas-aula-06/questao06-prototype.md`:

```markdown
# Questão 6 — Prototype com Templates de Produto

## Template Base

```typescript
const productTemplate = {
  status: 'draft',
  category: 'general' as string,
  tags: [] as string[],
  variations: [] as string[],
  createdAt: new Date(),
};
```

## Clonagem com Object.create()

```typescript
const productA = Object.create(productTemplate);
productA.name = 'Notebook';
productA.tags.push('eletrônicos', 'informática');

const productB = Object.create(productTemplate);
productB.name = 'Mouse';
productB.tags.push('periféricos');

// Resultado observado
console.log(productA.tags); // ???
console.log(productB.tags); // ???
```

## Pergunta: Por que os arrays estão compartilhados?

Explique em 2-3 frases o que acontece com a cadeia de protótipos.

## Clonagem com Spread Operator

```typescript
const productC = { ...productTemplate, name: 'Notebook', tags: ['eletrônicos', 'informática'] };
const productD = { ...productTemplate, name: 'Mouse', tags: ['periféricos'] };

// Resultado observado
console.log(productC.tags); // ['eletrônicos', 'informática']
console.log(productD.tags); // ['periféricos'] — independente!
```

## Função createProduct

```typescript
function createProduct(overrides: Partial<typeof productTemplate>) {
  // Use spread para combinar template + overrides
}
```

## Perguntas de Reflexão

1. Em que cenário `Object.create()` é preferível ao spread operator?
2. O que é uma shallow copy e quais as limitações do spread para objetos aninhados?
3. Como o Prototype se diferencia de simplesmente reatribuir valores manualmente?
```

---

## Questão 7: Seleção do Padrão Criacional Correto

**Conceito-chave:** Aula 06, Seções 1-8 — Análise e Seleção de Padrões Criacionais

**Objetivo:** Demonstrar que você sabe analisar um problema e selecionar o padrão criacional mais adequado, justificando a escolha.

**Passos de Execução:**

Para cada cenário abaixo, identifique o padrão criacional mais adequado e justifique em 2-3 frases:

1. **Cenário A:** Uma aplicação precisa exibir notificações ao usuário. As notificações podem ser "toast", "banner" ou "modal". Cada tipo tem sua própria implementação de `render()`, `onClose()` e `setPriority()`. O código que cria as notificações não deve conhecer as classes concretas.

2. **Cenário B:** Um relatório financeiro precisa ser construído com seções opcionais (resumo executivo, gráficos, tabela de dados, assinatura digital). Cada seção é adicionada incrementalmente, e o relatório só pode ser gerado se todas as seções obrigatórias estiverem presentes.

3. **Cenário C:** Uma biblioteca de UI precisa fornecer componentes visuais (Card, Avatar, Badge, Alert) consistentes com a marca do cliente. Cada cliente tem cores, fontes e bordas diferentes, mas todos os componentes de um mesmo cliente devem usar o mesmo estilo.

4. **Cenário D:** 30 produtos em um catálogo compartilham a mesma estrutura base (nome, descrição, preço, imagens, variações), mas cada um difere em valores específicos. Criar cada um do zero é repetitivo e propenso a erro.

5. **Cenário E:** Um arquivo de configuração `appSettings.json` contém 20 propriedades (apiUrl, timeout, retryCount, features flag, etc.). Essas configurações são carregadas uma vez na inicialização e lidas por toda a aplicação.

**Entrega:** crie `entregas-aula-06/questao07-selecao-padrao.md`:

```markdown
# Questão 7 — Seleção do Padrão Criacional Correto

## Cenário A — Notificações

**Padrão escolhido:** [Factory Method / Abstract Factory / Builder / Singleton / Prototype / Object Literal]

**Justificativa:**

[Explique por que este padrão se aplica e por que os outros não são adequados]

---

## Cenário B — Relatório Financeiro

**Padrão escolhido:** [padrão]

**Justificativa:**

[Explique]

---

## Cenário C — Biblioteca de UI Multi-cliente

**Padrão escolhido:** [padrão]

**Justificativa:**

[Explique]

---

## Cenário D — Catálogo de Produtos

**Padrão escolhido:** [padrão]

**Justificativa:**

[Explique]

---

## Cenário E — Configuração de Aplicação

**Padrão escolhido:** [padrão]

**Justificativa:**

[Explique]

---

## Perguntas de Reflexão

1. Em qual cenário você usaria mais de um padrão juntos? Como eles se complementariam?
2. Releia o Cenário C. Se o cliente precisar de apenas 2 componentes personalizados (Card e Button) mas os outros 3 mantiverem o padrão, a Abstract Factory ainda é a melhor escolha? Por quê?
```

---

## Questão 8: Integração — Checkout com Múltiplos Patterns

**Conceito-chave:** Aula 06, Seção 8 — Implementação Integrada no E-commerce

**Objetivo:** Demonstrar que você sabe combinar Object Literal, Factory Method e Builder em um fluxo de checkout real.

**Passos de Execução:**

1. Crie um objeto literal `paymentConfigs` com configurações para dois provedores: `creditCard` (fee: 0.0399, maxInstallments: 12, active: true) e `pix` (fee: 0, maxInstallments: 1, active: true) — use **shorthand** onde possível
2. Implemente a interface `PaymentGateway` com métodos `process(amount: number): Promise<{ transactionId: string }>` e `getFee(): number`
3. Implemente `CreditCardGateway` e `PixGateway` conforme a interface
4. Crie a classe `CheckoutFactory` com método estático `createPaymentGateway(type)` que busca a config em `paymentConfigs`, valida se está ativo, e retorna o gateway
5. Crie a classe `OrderBuilder` simplificada com métodos `forCustomer(id)`, `addItem(prodId, qty)`, `withPayment(type)`, e `build()` que valida customerId, items e paymentType
6. Escreva a função `checkout(customerId, items, paymentType)` que:
   - Usa o `OrderBuilder` para construir o pedido
   - Usa o `CheckoutFactory` para criar o gateway
   - Processa o pagamento com o gateway
   - Retorna `{ order, payment }`

**Entrega:** crie `entregas-aula-06/questao08-integracao.md`:

```markdown
# Questão 8 — Integração: Checkout com Múltiplos Patterns

## Configuração (Object Literal)

```typescript
interface PaymentConfig {
  fee: number;
  maxInstallments: number;
  active: boolean;
}

const paymentConfigs = {
  // Use shorthand properties se aplicável
};
```

## Interface e Gateways (Factory Method)

```typescript
interface PaymentGateway {
  process(amount: number): Promise<{ transactionId: string }>;
  getFee(): number;
}

// Implemente CreditCardGateway e PixGateway
```

## CheckoutFactory

```typescript
class CheckoutFactory {
  static createPaymentGateway(type: string): PaymentGateway {
    // Busca config, valida se active, retorna gateway
  }
}
```

## OrderBuilder (Builder)

```typescript
interface Order {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentType: string;
  createdAt: Date;
}

class OrderBuilder {
  // Implemente com fluent API
  forCustomer(id: string): this { /* ... */ }
  addItem(productId: string, quantity: number): this { /* ... */ }
  withPayment(type: string): this { /* ... */ }
  build(): Order { /* valida e retorna */ }
}
```

## Função de Checkout

```typescript
interface CheckoutResult {
  order: Order;
  payment: { transactionId: string };
}

async function checkout(
  customerId: string,
  items: Array<{ productId: string; quantity: number }>,
  paymentType: string
): Promise<CheckoutResult> {
  // Use OrderBuilder + CheckoutFactory
}
```

## Exemplo de Uso

```typescript
const result = await checkout('CUST-001', [{ productId: 'PROD-01', quantity: 2 }], 'pix');
console.log(result);
```

## Perguntas de Reflexão

1. Qual padrão criacional está sendo usado em cada etapa do fluxo de checkout?
2. Como você adicionaria um novo meio de pagamento (boleto) sem modificar a função `checkout`?
3. Onde o Prototype e o Singleton poderiam ser incorporados neste fluxo? Que benefício trariam?
```

---

## Checklist Final: Pronto para a Aula 07?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Criar** um objeto de configuração usando shorthand properties e spread operator (Objetivo 1, 2)
- [ ] **Implementar** Factory Method com registro dinâmico via `Map`, respeitando OCP (Objetivo 3)
- [ ] **Distinguir** Factory Method (um produto) de Abstract Factory (família de produtos) em exemplos concretos (Objetivo 4)
- [ ] **Construir** uma Abstract Factory para criar famílias de componentes visuais por tema (Objetivo 5)
- [ ] **Projetar** um Builder com fluent API que valida todos os campos no `build()` (Objetivo 6)
- [ ] **Implementar** Singleton de duas formas (clássico e ES Module) e explicar quando evitar (Objetivo 7)
- [ ] **Clonar** objetos com spread operator e `Object.create()`, identificando o risco de compartilhamento de referências (Objetivo 8)
- [ ] **Selecionar** o padrão criacional correto analisando o problema e justificando a escolha (Objetivo 9)
- [ ] **Integrar** Object Literal + Factory Method + Builder em um fluxo de checkout real (Objetivo 10)
- [ ] **Explicar** os 4 problemas do `new` espalhado e como cada padrão criacional resolve um aspecto diferente (Objetivo 1)

> *Acertou todos? Você está pronto para a Aula 07 — Padrões Estruturais (Adapter, Decorator, Facade, Composite e Proxy), onde vai aprender a compor objetos e classes em estruturas maiores que definem **como** os objetos se relacionam. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
