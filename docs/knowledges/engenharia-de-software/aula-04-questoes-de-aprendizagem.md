---
titulo: "Aula 04 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 04: SOLID — SRP, OCP, LSP"
data: 2026-06-20
---

# Aula 04 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é seu **checkpoint de aprendizagem**. A pergunta central é: *"eu realmente entendi os três primeiros princípios SOLID?"*

Cada questão a seguir verifica um conceito-chave da Aula 04. Você deve executá-las **sem reler o conteúdo principal** — se travar, isso indica qual seção revisar antes de avançar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-04/` no seu projeto de e-commerce
2. Resolva cada questão na ordem apresentada
3. Para cada questão, crie o arquivo de entrega indicado no template
4. Ao final, marque os itens do **Checklist Final**
5. Só avance para a Aula 05 quando conseguir marcar todos os itens sem consultar a aula

**Conexão com o projeto:** todas as questões partem do código que você construiu nas Aulas 01-03 (estrutura inicial com controllers, services e repositories). Você vai refatorar aplicando SRP, OCP e LSP.

---

## Questão 1: Detectando Violações de SRP

**Conceito-chave:** Single Responsibility Principle (Aula 04, Seção 1).

**Objetivo:** Analisar uma classe que viola SRP, identificar cada responsabilidade e propor a separação em classes coesas.

**Passos de Execução:**

1. Analise a classe `CustomerService` abaixo e liste todas as responsabilidades que ela acumula
2. Para cada responsabilidade, desenhe uma classe separada com métodos públicos
3. Proponha o `CreateCustomerUseCase` (orquestrador) que compõe as novas classes
4. Verifique: cada nova classe pode ser descrita em uma frase sem "e" ou "ou"?

```typescript
class CustomerService {
  constructor(private db: Database) {}

  async createCustomer(data: CustomerData): Promise<Customer> {
    if (!data.email.includes('@')) throw new Error('Email inválido');
    if (!data.cpf.match(/^\d{11}$/)) throw new Error('CPF inválido');

    const customer = { id: generateId(), ...data, createdAt: new Date() };
    await this.db.save('customers', customer);

    const token = jwt.sign({ id: customer.id }, 'secret');
    await this.sendWelcomeEmail(data.email, data.name);

    return customer;
  }

  async getCustomer(id: string): Promise<Customer | null> {
    return this.db.find('customers', id);
  }

  async updateCustomer(id: string, data: Partial<CustomerData>): Promise<Customer> {
    const customer = await this.getCustomer(id);
    if (!customer) throw new Error('Cliente não encontrado');
    const updated = { ...customer, ...data, updatedAt: new Date() };
    await this.db.save('customers', updated);
    return updated;
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`Bem-vindo ao sistema, ${name}!`);
  }
}
```

**Entrega:** crie `entregas-aula-04/01-srp-detection.md` com este conteúdo:

```markdown
# Questão 1 — Detectando Violações de SRP

## Responsabilidades encontradas

| # | Responsabilidade | Métodos envolvidos |
|---|---|---|
| 1 | ? | ? |
| 2 | ? | ? |
| 3 | ? | ? |
| 4 | ? | ? |

## Novas classes propostas

| Classe | Responsabilidade | Métodos públicos |
|---|---|---|
| ? | ? | ? |
| ? | ? | ? |
| ? | ? | ? |
| ? | ? | ? |

## Orquestrador

[Insira aqui o código do CreateCustomerUseCase em TypeScript]

## Reflexão

- Quantas linhas de código cada nova classe tem? Qual o tamanho ideal?
- Se a regra de validação de CPF mudar, quais classes são afetadas?
```

---

## Questão 2: Refatorando um Switch com OCP

**Conceito-chave:** Open/Closed Principle (Aula 04, Seção 2).

**Objetivo:** Refatorar um switch de tipos de desconto para uma hierarquia OCP-compliant com interface + implementações.

**Passos de Execução:**

1. Identifique as variações de desconto no switch abaixo
2. Defina a interface `DiscountStrategy` com método `apply(amount: number): number`
3. Implemente `PercentageDiscount`, `FixedDiscount`, `FreeShippingDiscount` e `NoDiscount`
4. Crie a classe `DiscountCalculator` que recebe uma `DiscountStrategy` e delega o cálculo
5. Verifique: adicionar um novo tipo de desconto exige modificar o `DiscountCalculator`?

```typescript
function calculateDiscount(type: string, amount: number): number {
  switch (type) {
    case 'percentage':
      return amount * 0.9; // 10% off
    case 'fixed':
      return Math.max(0, amount - 50); // R$50 off
    case 'free_shipping':
      return amount; // frete grátis não altera o valor
    default:
      return amount; // sem desconto
  }
}
```

**Entrega:** crie `entregas-aula-04/02-ocp-refactoring.md` com este conteúdo:

```markdown
# Questão 2 — Refatorando um Switch com OCP

## Código refatorado

[Insira aqui a interface DiscountStrategy, implementações e DiscountCalculator em TypeScript]

## Comparação

| Aspecto | Antes (switch) | Depois (OCP) |
|---|---|---|
| Adicionar novo desconto | ? | ? |
| Testar cada desconto | ? | ? |
| Risco de quebrar descontos existentes | ? | ? |

## Reflexão

- Quantas classes você criou para eliminar o switch?
- O que acontece se precisar de um desconto de "compre 3, leve 4" — quantas linhas mudam no código existente?
```

---

## Questão 3: Identificando Violações de LSP

**Conceito-chave:** Liskov Substitution Principle (Aula 04, Seção 3).

**Objetivo:** Analisar uma hierarquia de classes que viola LSP, identificar os problemas e redesenhar com interfaces segregadas.

**Passos de Execução:**

1. Analise a hierarquia abaixo e identifique onde o LSP é violado
2. Explique por que cada violação quebra o contrato da superclasse
3. Redesenhe usando interfaces segregadas (sem herança forçada)
4. Escreva exemplos de código que quebrariam com a violação e funcionariam com o redesign

```typescript
class Payment {
  constructor(
    public amount: number,
    public fee: number
  ) {}

  process(): boolean {
    console.log(`Processando pagamento de R$${this.amount}`);
    return true;
  }

  calculateFinalAmount(): number {
    return this.amount + this.fee;
  }
}

class CreditCardPayment extends Payment {
  process(): boolean {
    if (this.amount > 10000) throw new Error('Limite excedido');
    return super.process();
  }
}

class FreePayment extends Payment {
  constructor(amount: number) {
    super(amount, 0);
  }

  calculateFinalAmount(): number {
    throw new Error('Pagamento gratuito não tem taxa');
  }
}
```

**Entrega:** crie `entregas-aula-04/03-lsp-violation.md` com este conteúdo:

```markdown
# Questão 3 — Identificando Violações de LSP

## Violações encontradas

| Classe problemática | Tipo de violação | Explicação |
|---|---|---|
| `CreditCardPayment` | ? | ? |
| `FreePayment` | ? | ? |

## Redesign com interfaces segregadas

[Insira aqui o código refatorado com interfaces em TypeScript]

## Código que quebrava antes e funciona depois

[Insira aqui exemplos de código que demonstram a melhoria]

## Reflexão

- Como o redesign elimina a necessidade de `instanceof` no código cliente?
- A herança ainda faz sentido em algum dos casos?
```

---

## Questão 4: SRP + OCP Combinados

**Conceito-chave:** SRP e OCP combinados (Aula 04, Seções 4 e 5).

**Objetivo:** Refatorar um serviço de processamento de pedidos aplicando SRP (separar responsabilidades) e OCP (tornar comportamentos extensíveis).

**Passos de Execução:**

1. Analise a classe `CheckoutService` abaixo
2. Aplique SRP: extraia cada responsabilidade para uma classe separada
3. Aplique OCP: crie interfaces para os comportamentos que variam (frete, pagamento, desconto)
4. Monte o orquestrador que compõe as dependências

```typescript
class CheckoutService {
  async checkout(cart: Cart, paymentType: string, coupon?: string): Promise<OrderResult> {
    // 1. Valida carrinho
    if (cart.items.length === 0) throw new Error('Carrinho vazio');

    // 2. Aplica cupom
    let discount = 0;
    if (coupon === 'BLACK20') discount = cart.total * 0.2;
    else if (coupon === 'FRETEGRATIS') discount = 30;

    // 3. Calcula frete
    let shipping = 0;
    if (cart.total > 300) shipping = 0;
    else shipping = cart.items.length * 10;

    // 4. Processa pagamento
    const total = cart.total - discount + shipping;
    let paymentResult;
    if (paymentType === 'credit') paymentResult = this.chargeCredit(total);
    else if (paymentType === 'pix') paymentResult = this.generatePix(total);
    else throw new Error('Tipo de pagamento inválido');

    // 5. Notifica
    await this.sendEmail(cart.customerEmail, total);

    return { total, discount, shipping, paymentResult };
  }

  private chargeCredit(amount: number): string { return `CC-${amount}`; }
  private generatePix(amount: number): string { return `PIX-${amount}`; }
  private sendEmail(email: string, total: number): void {
    console.log(`Email para ${email}: total R$${total}`);
  }
}
```

**Entrega:** crie `entregas-aula-04/04-srp-ocp-combined.md` com este conteúdo:

```markdown
# Questão 4 — SRP + OCP Combinados

## Interfaces definidas

| Interface | Propósito | Métodos |
|---|---|---|
| `CartValidator` | ? | ? |
| `DiscountStrategy` | ? | ? |
| `ShippingStrategy` | ? | ? |
| `PaymentGateway` | ? | ? |
| `Notifier` | ? | ? |

## Implementações

[Insira aqui cada implementação das interfaces acima em TypeScript]

## Orquestrador final

[Insira aqui o CheckoutService refatorado em TypeScript]

## Reflexão

- Quantas classes existem agora? Quantas existiam antes?
- O que muda se for necessário adicionar um novo tipo de cupom? Quantas classes são criadas e quantas são modificadas?
```

---

## Questão 5: LSP com Produtos do E-commerce

**Conceito-chave:** LSP aplicado a produtos (Aula 04, Seção 6).

**Objetivo:** Redesenhar a hierarquia de produtos do e-commerce para respeitar LSP, separando o que é transportável do que é apenas comprável.

**Passos de Execução:**

1. Analise a hierarquia atual no seu projeto — `Product` tem `weight` e `shippingCost()` para todos os tipos?
2. Identifique violações de LSP: produtos digitais que herdam métodos de frete mas deveriam lançar exceção ou retornar 0
3. Crie interfaces segregadas: `Product` (base), `PhysicalProduct` e `DigitalProduct` como implementações separadas
4. Refatore o código de checkout e cálculo de frete para usar as interfaces corretas

**Entrega:** crie `entregas-aula-04/05-lsp-products.md` com este conteúdo:

```markdown
# Questão 5 — LSP com Produtos do E-commerce

## Hierarquia atual (antes)

[Insira aqui o código atual da sua hierarquia de produtos]

## Violações identificadas

| Classe | Problema | Consequência |
|---|---|---|
| ? | ? | ? |

## Hierarquia redesenhada (depois)

[Insira aqui o código refatorado com Product, Shippable, PhysicalProduct e DigitalProduct em TypeScript]

## Mapeamento de código cliente

| Função | Antes (com violação) | Depois (LSP) |
|---|---|---|
| `calculateFreight` | Recebia `Product[]` e... | ? |
| `checkout` | Recebia `Product[]` e... | ? |

## Reflexão

- Quantos `instanceof` ou condicionais de tipo você eliminou?
- Se surgir um novo tipo de produto (ex: `ServiceProduct` — um serviço, não um item físico), como ele se encaixa no design?
```

---

## Questão 6: OCP no Mundo Real — Gateways de Pagamento

**Conceito-chave:** OCP com gateways de pagamento (Aula 04, Seção 5).

**Objetivo:** Implementar um sistema de pagamentos extensível com OCP, e depois adicionar um novo gateway sem modificar código existente para provar que o princípio foi aplicado.

**Passos de Execução:**

1. Defina a interface `PaymentGateway` com `process(amount: number): Promise<PaymentResult>`
2. Implemente `CreditCardGateway`, `PixGateway` e `BoletoGateway`
3. Crie `ProcessPaymentService` que recebe `PaymentGateway` no construtor
4. **Sem modificar** `ProcessPaymentService`, adicione `ApplePayGateway` e `CryptoGateway`
5. Documente que o `ProcessPaymentService` não foi alterado — prova de OCP

**Entrega:** crie `entregas-aula-04/06-ocp-gateways.md` com este conteúdo:

```markdown
# Questão 6 — OCP no Mundo Real

## Interface e implementações

[Insira aqui PaymentGateway e as 3 implementações em TypeScript]

## ProcessPaymentService

[Insira aqui o service em TypeScript]

## Novos gateways adicionados (sem modificar o service)

| Gateway | Método de pagamento | Lógica específica |
|---|---|---|
| `ApplePayGateway` | Apple Pay | ? |
| `CryptoGateway` | Criptomoedas | ? |

## Prova de OCP

- O `ProcessPaymentService` foi modificado para adicionar Apple Pay? [Sim/Não]
- Quantas linhas do código existente foram alteradas? [Número]

## Reflexão

- Se o `ProcessPaymentService` usasse um `switch` em vez de interface, quantas linhas seriam alteradas para adicionar Apple Pay?
- Qual é o custo de aplicar OCP desde o início (mais código inicial) vs o custo de refatorar depois?
```

---

## Questão 7: Revisão — Identifique o Princípio

**Conceito-chave:** SRP, OCP, LSP (Aula 04, Seções 1-6).

**Objetivo:** Dado um cenário de código problemático, identificar qual princípio SOLID foi violado e propor a correção adequada.

**Passos de Execução:**

1. Leia cada cenário abaixo
2. Identifique qual princípio (SRP, OCP ou LSP) foi violado
3. Explique por que é uma violação
4. Proponha a correção com esboço de código

**Cenário A:** `OrderReportService` gera relatórios em PDF e CSV, envia por e-mail, salva no histórico e publica no dashboard. Cada mudança de layout de PDF exige alterar a classe, e cada novo formato de saída também.

**Cenário B:** `NotificationService` tem um método `send(type, message)` com um `if (type === 'email') ... else if (type === 'sms') ... else if (type === 'push') ...`. Adicionar notificação por WhatsApp exige adicionar mais um else-if.

**Cenário C:** `Account` tem método `withdraw(amount: number)`. `SavingsAccount` estende `Account` e lança `InsufficientFundsError` quando o saldo fica negativo. `CheckingAccount` estende `Account` e permite saldo negativo até R$ 1.000. O código que usa `Account` e espera `withdraw` nunca lançar exceção quebra com `SavingsAccount`.

**Entrega:** crie `entregas-aula-04/07-identify-principle.md` com este conteúdo:

```markdown
# Questão 7 — Identifique o Princípio

## Cenário A: OrderReportService

**Princípio violado:** ?
**Explicação:** ?
**Correção proposta:** ?

[Esboço de código em TypeScript]

## Cenário B: NotificationService

**Princípio violado:** ?
**Explicação:** ?
**Correção proposta:** ?

[Esboço de código em TypeScript]

## Cenário C: Account / SavingsAccount / CheckingAccount

**Princípio violado:** ?
**Explicação:** ?
**Correção proposta:** ?

[Esboço de código em TypeScript]
```

---

## Questão 8: Refatoração Guiada — Projeto Real

**Conceito-chave:** SRP, OCP e LSP aplicados ao projeto do e-commerce (Aula 04, Seções 4-6).

**Objetivo:** Aplicar os três princípios em conjunto no código real do seu projeto de e-commerce, refatorando as classes que você construiu nas Aulas 01-03.

**Passos de Execução:**

1. Abra seu projeto de e-commerce e liste as classes de `services/` atuais
2. Para cada service, aplique o "teste do 'e'": descreva sua responsabilidade em uma frase
3. Se a frase tiver "e", refatore seguindo SRP: crie uma classe para cada responsabilidade
4. Identifique switches ou condicionais de tipo → refatore com OCP (interface + implementações)
5. Identifique heranças que forçam métodos sem sentido → refatore com LSP (interfaces segregadas)
6. Crie um arquivo de sumário mostrando o antes e depois de cada classe

**Entrega:** crie `entregas-aula-04/08-full-refactoring.md` com este conteúdo:

```markdown
# Questão 8 — Refatoração Guiada

## Diagnóstico inicial

| Classe | Responsabilidade declarada | "Teste do 'e'" | Responsabilidades reais |
|---|---|---|---|
| ? | ? | Passa/Falha | ? |

## Refatorações aplicadas

### SRP

| Classe original | Classes resultantes |
|---|---|
| ? | ?, ?, ? |

### OCP

| Switch/Condicional original | Interface criada | Implementações |
|---|---|---|
| ? | ? | ?, ? |

### LSP

| Hierarquia original | Problema | Interfaces segregadas |
|---|---|---|
| ? | ? | ? |

## Resultado final

- Total de classes antes: ?
- Total de classes depois: ?
- Total de `switch`/`if-else` de tipo eliminados: ?
- Total de `instanceof` eliminados: ?

## Reflexão

- O código está mais fácil ou mais difícil de entender com mais classes?
- Se você precisar adicionar uma nova feature (ex: frete expresso), quantas classes precisam ser criadas e quantas modificadas?
```

---

## Checklist Final: Pronto para a Aula 05?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **SRP — Detecção:** Consigo identificar quando uma classe tem mais de uma responsabilidade usando o "teste do 'e'"
- [ ] **SRP — Refatoração:** Sei extrair responsabilidades de uma classe monolítica em classes coesas separadas
- [ ] **OCP — Conceito:** Entendo o que significa "aberto para extensão, fechado para modificação"
- [ ] **OCP — Aplicação:** Sei eliminar switches de tipo usando interfaces + implementações
- [ ] **LSP — Conceito:** Entendo que subtipos devem ser substituíveis por seus tipos base sem quebrar o programa
- [ ] **LSP — Aplicação:** Sei redesenhar hierarquias de classes usando interfaces segregadas para evitar violações
- [ ] **SOLID combinado:** Consigo aplicar SRP, OCP e LSP em conjunto no mesmo código, com cada classe tendo responsabilidade única, comportamento extensível e substituibilidade segura
- [ ] **Reconhecimento de violações:** Sei identificar em código alheio (ou no meu próprio) quando SRP, OCP ou LSP foram violados
- [ ] **Trade-offs:** Entendo que SOLID não é absoluto — sei quando vale a pena violar um princípio por pragmatismo
- [ ] **Projeto e-commerce:** Refatorei o código do e-commerce aplicando os três princípios, reduzindo acoplamento e eliminando condicionais de tipo

> *Acertou todos? Você está pronto para a Aula 05: SOLID — ISP, DIP + Dependency Injection, onde vai fechar o SOLID com segregação de interfaces, inversão de dependências e o contêiner tsyringe. Travou em algum? Releia a seção indicada no **Conceito-chave** da questão correspondente antes de avançar.*