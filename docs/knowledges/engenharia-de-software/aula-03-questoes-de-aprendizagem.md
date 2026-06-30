---
titulo: "Aula 03 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 03: Refactoring — Catálogo e Prática"
data: 2026-06-21
---

# Aula 03 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é seu **checkpoint de domínio**. A pergunta central é: *"eu consigo aplicar o catálogo de refactorings sem consultar a aula?"*

Cada questão a seguir verifica um conceito-chave da Aula 03. Você deve executá-las **sem reler o conteúdo principal** — se travar, isso indica qual seção revisar antes de avançar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-03/` no seu projeto de e-commerce
2. Resolva cada questão na ordem apresentada
3. Para cada questão, crie um arquivo separado: `q01-classificacao-smells.md`, `q02-arvore-decisao.md`, etc.
4. Preencha os templates Markdown fornecidos em cada questão
5. Ao final, revise o Checklist Final antes de iniciar a Aula 04

**Dica:** Se você travar em uma questão por mais de 5 minutos, é sinal de que precisa revisar a seção correspondente da aula principal. Anote qual seção e volte depois.

---

## Questão 1: Classificação de Code Smells no Controller

**Conceito-chave:** Aula 03, Seção 1 (Bloaters), Seção 2 (Abusers + Change Preventers), Seção 3 (Dispensables)

**Objetivo:** Demonstrar que você consegue classificar code smells reais no código do e-commerce.

**Passos de Execução:**

1. Abra o arquivo `src/controllers/order.controller.ts` do seu projeto
2. Identifique pelo menos 5 code smells diferentes, um de cada categoria (Bloater, Abuser, Change Preventer, Dispensable) + 1 extra
3. Classifique cada um com a categoria e o nome exato do smell

**Entrega:**

Crie `entregas-aula-03/q01-classificacao-smells.md` com o seguinte template preenchido:

```markdown
# Questão 01: Classificação de Code Smells

## Código Analisado
`src/controllers/order.controller.ts` (versão atual do meu projeto)

## Smells Identificados

| # | Linha(s) | Código | Categoria | Nome do Smell | Refactoring Sugerido |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

## Reflexão

- Qual smell foi mais fácil de identificar? Por quê?
- Qual smell você ainda não tinha percebido no seu código?
- Algum smell se repetiu em mais de um lugar? Isso indicaria o quê?
```

---

## Questão 2: Decisão de Refactoring

**Conceito-chave:** Aula 03, Seção 4 (Refactoring Catalog) + Árvore de Decisão (diagrama Mermaid)

**Objetivo:** Demonstrar que você sabe navegar a árvore de decisão para escolher o refactoring correto.

**Passos de Execução:**

1. Para cada cenário abaixo, identifique o smell e escolha o refactoring
2. Justifique sua escolha com base no que foi ensinado no catálogo

**Cenários:**

a) Uma função `calculateInvoice` tem 65 linhas, misturando validação de cliente, cálculo de itens, aplicação de descontos e formatação da resposta.

b) As classes `OrderCsvExporter`, `OrderPdfExporter` e `OrderXmlExporter` compartilham um método `exportHeader()` idêntico, copiado e colado em cada uma.

c) Uma classe `PaymentService` tem um campo `private pixKey?: string` que só é preenchido quando o método de pagamento é Pix. Nos outros 90% do tempo, o campo é `undefined`.

d) Para adicionar um novo campo `phone` ao pedido, você precisa alterar `CreateOrderUseCase`, `OrderController`, `PostgresOrderRepository`, `OrderResponseFormatter` e `CreateOrderDto`.

**Entrega:**

Crie `entregas-aula-03/q02-arvore-decisao.md`:

```markdown
# Questão 02: Decisão de Refactoring

## Cenário A
- **Smell identificado:**
- **Refactoring escolhido:**
- **Justificativa:**

## Cenário B
- **Smell identificado:**
- **Refactoring escolhido:**
- **Justificativa:**

## Cenário C
- **Smell identificado:**
- **Refactoring escolhido:**
- **Justificativa:**

## Cenário D
- **Smell identificado:**
- **Refactoring escolhido:**
- **Justificativa:**
```

---

## Questão 3: Extract Method na Prática

**Conceito-chave:** Aula 03, Seção 4.1 (Extract Method), Seção 1.1 (Long Method)

**Objetivo:** Aplicar Extract Method para resolver um Long Method real.

**Passos de Execução:**

1. Copie o trecho abaixo
2. Extraia pelo menos 3 funções nomeadas com responsabilidades únicas
3. O resultado deve ter uma função principal com no máximo 10 linhas, composta por chamadas às funções extraídas

```typescript
function processReturn(returnData: any) {
  if (!returnData.orderId) throw new Error('OrderId required');
  if (!returnData.items || returnData.items.length === 0) throw new Error('Items required');
  if (!returnData.reason) throw new Error('Reason required');

  let totalRefund = 0;
  for (const item of returnData.items) {
    const originalOrder = await db.orders.findById(returnData.orderId);
    const originalItem = originalOrder.items.find((i: any) => i.productId === item.productId);
    if (!originalItem) throw new Error('Item not found in original order');
    totalRefund += originalItem.price * item.quantity;
  }

  if (totalRefund > 1000) {
    totalRefund *= 0.95; // taxa de restocking de 5%
  }

  console.log(`Refund for order ${returnData.orderId}: ${totalRefund}`);
  return { orderId: returnData.orderId, refund: totalRefund, reason: returnData.reason };
}
```

**Entrega:**

Crie `entregas-aula-03/q03-extract-method.md`:

````markdown
# Questão 03: Extract Method

## Função Principal Refatorada

```typescript
// Sua função principal com no máximo 10 linhas
```

## Funções Extraídas

### 1. `validateReturnData`
```typescript
// Código da função
```

### 2. `[nome da sua função]`
```typescript
// Código da função
```

### 3. `[nome da sua função]`
```typescript
// Código da função
```

## Reflexão

- Quantas funções você extraiu? Quais critérios usou para decidir onde cortar?
- O nome da função principal ficou mais claro depois da extração?
````

---

## Questão 4: Rename — Nomes que Revelam Intenção

**Conceito-chave:** Aula 03, Seção 4.5 (Rename), Seção 1 (todos os Bloaters)

**Objetivo:** Demonstrar domínio do refactoring Rename, identificando nomes genéricos e propondo alternativas.

**Passos de Execução:**

1. Analise o código abaixo e identifique TODOS os nomes que violam o princípio de "nomes que revelam intenção"
2. Para cada um, proponha um nome melhor e justifique
3. Aplique também Extract Variable onde expressões precisam de nome

```typescript
async function getData(req: Request, res: Response) {
  const u = req.params.id;
  const d = await db.query('SELECT * FROM users WHERE id = $1', [u]);
  if (!d.rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const x = d.rows[0];
  const o = await db.query(
    'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
    [u]
  );
  const r = {
    user: { id: x.id, name: x.name, email: x.email },
    recentOrders: o.rows.map((row: any) => ({
      id: row.id,
      total: row.total,
      date: row.created_at,
    })),
    totalOrders: o.rows.length,
  };
  res.json(r);
}
```

**Entrega:**

Crie `entregas-aula-03/q04-rename.md`:

```markdown
# Questão 04: Rename

## Tabela de Renomeação

| Nome Original | Linha | Novo Nome | Justificativa |
|---|---|---|---|
| `getData` | 1 | | |
| `u` | 2 | | |
| `d` | 3 | | |
| `x` | 9 | | |
| `o` | 10 | | |
| `r` | 14 | | |

## Expressões que Extraí (Extract Variable)

| Expressão Original | Nome da Variável | Justificativa |
|---|---|---|
| | | |

## Código Refatorado (opcional — versão completa com todos os Renames aplicados)
```

---

## Questão 5: Caracterização com Testes

**Conceito-chave:** Aula 03, Seção 5.2 (Characterization Tests)

**Objetivo:** Escrever characterization tests para o controller de busca de produtos do Exercício 3 da aula principal.

**Passos de Execução:**

1. Copie o controller de busca de produtos (versão original, não refatorada) para um arquivo `src/controllers/product-search.controller.ts`
2. Escreva pelo menos 3 characterization tests usando supertest
3. Os testes devem capturar: caso feliz (busca com resultados), caso vazio (busca sem resultados), e caso de erro (parâmetros inválidos)

**Entrega:**

Crie `entregas-aula-03/q05-characterization-tests.md`:

````markdown
# Questão 05: Characterization Tests

## Controller Testado
`src/controllers/product-search.controller.ts`

## Testes Implementados

```typescript
import request from 'supertest';
import app from '../../app';

describe('GET /products/search — Characterization Tests', () => {

  it('deve retornar produtos quando a busca encontra resultados', async () => {
    // Implemente aqui
    // ...
  });

  it('deve retornar array vazio quando a busca não encontra resultados', async () => {
    // Implemente aqui
    // ...
  });

  it('deve tratar parâmetros inválidos sem lançar exceção', async () => {
    // Implemente aqui
    // ...
  });

});
```

## Resultado da Execução

```
# Cole o output do npx jest aqui
```

## Reflexão

- Os testes passaram na primeira execução? Se não, o que ajustou?
- Algum teste capturou um comportamento inesperado (possível bug)?
- Esses testes seriam suficientes para refatorar o controller com segurança?
````

---

## Questão 6: Extraindo uma Classe — Data Clumps

**Conceito-chave:** Aula 03, Seção 1.4 (Data Clumps), Seção 4.2 (Extract Class)

**Objetivo:** Identificar um Data Clump no projeto de e-commerce e extraí-lo para uma classe Value Object.

**Passos de Execução:**

1. No seu projeto de e-commerce, encontre um grupo de campos que aparecem juntos em pelo menos 3 lugares diferentes
2. Crie uma classe ou interface para encapsular esses dados
3. Atualize os 3 lugares para usar a nova classe
4. Documente a mudança

**Entrega:**

Crie `entregas-aula-03/q06-extract-class.md`:

```markdown
# Questão 06: Extract Class — Data Clump

## Data Clump Identificado

- **Campos:** `[campos que aparecem juntos]`
- **Onde aparece (pelo menos 3 lugares):**
  1. `[arquivo:linha]` — contexto
  2. `[arquivo:linha]` — contexto
  3. `[arquivo:linha]` — contexto

## Classe Criada

```typescript
interface [NomeDaClasse] {
  // campos
}
```

## Código Antes e Depois

### Antes (em um dos lugares):
```typescript
// código original
```

### Depois (usando a nova classe):
```typescript
// código refatorado
```

## Reflexão

- A extração tornou o código mais legível? O que melhorou?
- Você encontrou mais usos do data clump depois de criar a classe?
```

---

## Questão 7: Aplicando Replace Conditional with Polymorphism

**Conceito-chave:** Aula 03, Seção 2.1 (Switch Statements — Abuser)

**Objetivo:** Substituir uma cadeia de condicionais por polimorfismo.

**Passos de Execução:**

1. No sistema de e-commerce, encontre um `switch` ou `if-else if` que testa o mesmo campo/valor
2. Crie uma interface e implementações para substituir a cadeia
3. Se não houver um no projeto, use o exemplo do cálculo de frete por região (que já foi refatorado na aula, mas pode haver novos métodos de frete)

**Entrega:**

Crie `entregas-aula-03/q07-polymorphism.md`:

```markdown
# Questão 07: Replace Conditional with Polymorphism

## Código Original

```typescript
// Cole aqui o código com o switch/if-else original
```

## Interface e Implementações

### Interface:
```typescript

```

### Implementações:
```typescript

```

## Código Refatorado

```typescript
// Versão que usa polimorfismo
```

## Benefícios Observados

- [ ] Eliminei condicionais duplicados em outros lugares do código
- [ ] Posso adicionar novos casos sem modificar código existente (OCP)
- [ ] Cada implementação é testável isoladamente
```

---

## Questão 8: Plano de Refatoração para uma Feature

**Conceito-chave:** Aula 03, Seções 4 e 5 (catálogo completo + aplicação)

**Objetivo:** Planejar uma sequência de refatorações atômicas para preparar o código para uma nova feature.

**Passos de Execução:**

1. Escolha uma feature que você planeja implementar no e-commerce (ex: "adicionar cálculo de frete por peso", "adicionar notificação por WhatsApp", "adicionar desconto progressivo")
2. Antes de implementar, planeje quais refactorings são necessários para deixar o código pronto
3. Liste os passos em ordem, com commits atômicos

**Cenário sugerido:** *"Adicionar suporte a múltiplos métodos de pagamento (Pix, boleto e criptomoeda) no fluxo de criação de pedido"*

**Entrega:**

Crie `entregas-aula-03/q08-plano-refatoracao.md`:

```markdown
# Questão 08: Plano de Refatoração

## Feature Escolhida
`[descrição da feature]`

## Refactorings Necessários (em ordem)

| Passo | Refactoring | Arquivo(s) | Smell que elimina | Resultado esperado |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

## Validação

Após cada passo:
- [ ] `npx jest` passa
- [ ] `git diff` mostra apenas as mudanças esperadas para esse passo
- [ ] O comportamento da API não mudou (testes de integração)

## Estimativa de Impacto

- Total de arquivos modificados: `[N]`
- Total de novos arquivos criados: `[N]`
- Risco estimado: `[Baixo / Médio / Alto]`
```

---

## Checklist Final: Pronto para a Aula 04?

Antes de seguir para a Aula 04, verifique se você:

- [ ] **Questão 1:** Classificou pelo menos 1 smell de cada categoria (Bloater, Abuser, Change Preventer, Dispensable) no seu controller real
- [ ] **Questão 2:** Decidiu o refactoring correto para 4 cenários diferentes usando a árvore de decisão
- [ ] **Questão 3:** Aplicou Extract Method transformando uma função de 20+ linhas em funções menores com nomes reveladores
- [ ] **Questão 4:** Renomeou nomes genéricos e aplicou Extract Variable em expressões
- [ ] **Questão 5:** Escreveu characterization tests para um controller sem testes
- [ ] **Questão 6:** Identificou um Data Clump e extraiu para uma classe Value Object
- [ ] **Questão 7:** Substituiu uma cadeia de condicionais por polimorfismo
- [ ] **Questão 8:** Planejou uma sequência de refatorações atômicas para preparar o código para uma nova feature

**Se você marcou 7+ checks, parabéns — está pronto para a Aula 04!**

**Se marcou menos de 7, revise as seções correspondentes da Aula 03 antes de continuar.**

---

**Teaser da Aula 04:** Na Aula 04 vamos mergulhar nos três primeiros princípios SOLID — SRP, OCP e LSP — aprofundando casos reais onde o catálogo de refactorings desta aula é a ferramenta que materializa cada princípio. Você vai pegar o controller refatorado e transformá-lo em um design orientado a interfaces, polimorfismo e responsabilidades únicas.
