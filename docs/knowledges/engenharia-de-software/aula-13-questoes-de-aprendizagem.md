---
titulo: "Aula 13 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 13: Clean Architecture na Prática"
data: 2026-06-20
---

# Aula 13 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de aprendizagem** da Aula 13. A pergunta central é: *"eu realmente entendi Clean Architecture na prática?"*

Cada questão verifica um conceito-chave da aula. Você deve fazê-las **depois** de estudar o conteúdo principal, sem reler a aula a cada passo. Se travar, a seção indicada em **Conceito-chave** mostra onde consultar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-13/` no seu diretório de estudos
2. Faça as questões em ordem — cada uma se apoia na anterior
3. Para cada questão, crie o arquivo de entrega indicado e preencha o template
4. Ao final, revise o **Checklist Final** e marque o que você consegue fazer sem consultar a aula

---

## Questão 1: Mapeamento da Estrutura de Pastas

**Conceito-chave:** Estrutura de 4 camadas e regras de importação (Aula 13, Seção 1).

**Objetivo:** Verificar se você compreende a organização das 4 camadas e quais dependências são permitidas entre elas.

**Passos de Execução:**

1. Liste as 4 camadas da Clean Architecture e o propósito de cada uma
2. Explique a Regra da Dependência: o que cada camada pode e não pode importar
3. Desenhe (em texto ou diagrama ASCII) o fluxo de dependências entre as camadas

**Entrega:** crie `entregas-aula-13/01-estrutura-de-pastas.md`:

```markdown
# Questão 1 — Estrutura de Pastas

## As 4 Camadas

| Camada | Propósito | Exemplos de arquivos |
|---|---|---|
| domain/ | | |
| application/ | | |
| infrastructure/ | | |
| interface/ | | |

## Regra da Dependência

[Explique com suas palavras: o que cada camada pode importar e o que não pode]

## Diagrama de Dependências

[Descreva ou desenhe o fluxo de dependências entre as camadas]

## Pergunta de Reflexão

Por que a camada `domain` é a única que não importa nada externo? O que aconteceria se ela importasse `pg` ou `express`?
```

---

## Questão 2: Domain — Value Objects e Invariantes

**Conceito-chave:** Value Objects e invariantes na camada domain (Aula 13, Seção 2).

**Objetivo:** Verificar se você sabe implementar um Value Object com regras de validação (invariantes) no domínio puro.

**Passos de Execução:**

1. Crie um Value Object `Email` que valide o formato do endereço (contenha `@`)
2. Crie um Value Object `CPF` que valide o formato (11 dígitos)
3. Ambos devem ser imutáveis (usar `readonly`)
4. Ambos devem lançar erro se o valor for inválido

**Entrega:** crie `entregas-aula-13/02-value-objects.md`:

```markdown
# Questão 2 — Value Objects e Invariantes

## Código do Value Object Email

\```typescript
// Escreva aqui o código do Email
\```

## Código do Value Object CPF

\```typescript
// Escreva aqui o código do CPF
\```

## Pergunta de Reflexão

Por que Value Objects devem ser imutáveis? O que poderia dar errado se `Email` tivesse um setter público?
```

---

## Questão 3: Domain — Interface de Repositório

**Conceito-chave:** Interfaces de repositório no domínio (Aula 13, Seção 2).

**Objetivo:** Verificar se você sabe definir contratos de repositório que usam apenas tipos do domínio.

**Passos de Execução:**

1. Defina a interface `IProductRepository` na camada `domain/repositories/`
2. Inclua métodos: `findById`, `findAllByIds`, `save`, `decrementStock`
3. Certifique-se de que todos os tipos usados estão no domínio

**Entrega:** crie `entregas-aula-13/03-interface-repositorio.md`:

```markdown
# Questão 3 — Interface de Repositório

## Código da Interface IProductRepository

\```typescript
// Escreva aqui a interface
\```

## Pergunta de Reflexão

Por que a interface fica no domínio e não na infraestrutura? O que o DIP (Inversão de Dependência) tem a ver com isso?
```

---

## Questão 4: Application — Use Case com Injeção de Dependência

**Conceito-chave:** Use cases na camada application com DI (Aula 13, Seção 3).

**Objetivo:** Verificar se você sabe criar um use case que orquestra contratos sem conhecer implementações concretas.

**Passos de Execução:**

1. Crie um `CalculateShippingUseCase` na camada `application/use-cases/`
2. Ele deve receber `IShippingService` (interface) e `IOrderRepository` via construtor com `@inject()`
3. O método `execute` recebe `orderId` e `zipCode`, calcula frete e retorna o valor

**Entrega:** crie `entregas-aula-13/04-use-case-shipping.md`:

```markdown
# Questão 4 — Use Case de Frete

## Código do CalculateShippingUseCase

\```typescript
import { injectable, inject } from 'tsyringe';
// Complete o código...
\```

## Interface IShippingService (necessária no domínio)

\```typescript
// Defina a interface que o use case espera
\```

## Pergunta de Reflexão

Como você testaria este use case sem chamar a API dos Correios de verdade?
```

---

## Questão 5: Infrastructure — Implementação Concreta

**Conceito-chave:** Adaptadores concretos na camada infrastructure (Aula 13, Seção 4).

**Objetivo:** Verificar se você sabe implementar uma interface do domínio com tecnologia real.

**Passos de Execução:**

1. Implemente `InMemoryOrderRepository` que implementa `IOrderRepository`
2. Use um `Map<string, Order>` como armazenamento em memória
3. Implemente `findById`, `save` e `findByCustomerId`

**Entrega:** crie `entregas-aula-13/05-repositorio-in-memory.md`:

```markdown
# Questão 5 — Repositório InMemory

## Código do InMemoryOrderRepository

\```typescript
import { injectable } from 'tsyringe';
// Complete o código...
\```

## Pergunta de Reflexão

Para que serve um repositório em memória? Em quais cenários ele é útil (testes? desenvolvimento? produção?)
```

---

## Questão 6: Interface — Controller e DTOs

**Conceito-chave:** Controllers e DTOs na camada interface (Aula 13, Seção 5).

**Objetivo:** Verificar se você sabe construir um controller que chama use cases e usa DTOs para isolar o domínio da API.

**Passos de Execução:**

1. Crie um `ShippingController` com método `calculate`
2. O controller deve resolver o `CalculateShippingUseCase` do container tsyringe
3. Crie um DTO de resposta `ShippingResponseDTO`
4. Use um mapper para converter o resultado do domínio para o DTO

**Entrega:** crie `entregas-aula-13/06-controller-shipping.md`:

```markdown
# Questão 6 — Controller de Frete

## Código do ShippingController

\```typescript
// Complete o código...
\```

## DTO ShippingResponseDTO

\```typescript
// Defina o DTO
\```

## Pergunta de Reflexão

O que muda no controller se você trocar Express por Fastify? O que NÃO muda?
```

---

## Questão 7: DI com tsyringe — Composition Root

**Conceito-chave:** Composition Root e registro de dependências (Aula 13, Seção 6).

**Objetivo:** Verificar se você sabe configurar o container de DI e conectar todas as camadas.

**Passos de Execução:**

1. Escreva o `container.ts` completo que registra todas as dependências do projeto
2. Inclua `IOrderRepository`, `IPaymentGateway`, `IInventoryService` e `IShippingService`
3. Indique qual implementação concreta cada um usa
4. Explique a diferença entre `registerSingleton` e `registerTransient`

**Entrega:** crie `entregas-aula-13/07-composition-root.md`:

```markdown
# Questão 7 — Composition Root

## Código do Container

\```typescript
import { container } from 'tsyringe';
// Complete o código com todos os registros...
\```

## Singleton vs Transient

| Método | Comportamento | Quando usar |
|---|---|---|
| registerSingleton | | |
| registerTransient | | |

## Pergunta de Reflexão

Por que o Composition Root precisa ser o primeiro arquivo executado? O que acontece se um use case for resolvido antes dos registros?
```

---

## Questão 8: Testes de Arquitetura com dependency-cruiser

**Conceito-chave:** Testes de arquitetura automatizados (Aula 13, Seção 7).

**Objetivo:** Verificar se você sabe configurar e interpretar testes de arquitetura com dependency-cruiser.

**Passos de Execução:**

1. Escreva as regras do `.dependency-cruiser.json` para:
   - `domain` não importar nada de `node_modules`
   - `domain` não importar `application`, `infrastructure` ou `interface`
   - `application` não importar `infrastructure` ou `interface`
   - `infrastructure` não importar `interface`
2. Explique o que cada regra protege
3. Descreva o que acontece na pipeline de CI se uma violação for detectada

**Entrega:** crie `entregas-aula-13/08-testes-arquitetura.md`:

```markdown
# Questão 8 — Testes de Arquitetura

## Regras do dependency-cruiser

\```json
{
  "forbidden": [
    // Escreva as 4 regras aqui
  ]
}
\```

## O Que Cada Regra Protege

| Regra | Protege contra | Consequência da violação |
|---|---|---|
| domain-no-external-deps | | |
| domain-cannot-import-other-layers | | |
| application-cannot-import-infrastructure-or-interface | | |
| infrastructure-cannot-import-interface | | |

## Pipeline de CI

[Descreva como o teste de arquitetura se integra ao CI/CD e o que acontece se falhar]

## Pergunta de Reflexão

Por que confiar apenas na disciplina do time não é suficiente para manter a Regra da Dependência?
```

---

## Checklist Final: Pronto para a Aula 14?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Eu sei estruturar um projeto nas 4 camadas (domain, application, infrastructure, interface) com suas regras de importação
- [ ] Eu consigo implementar Value Objects puros com invariantes de validação na camada domain
- [ ] Eu sei definir interfaces de repositório no domínio sem mencionar tecnologia externa
- [ ] Eu consigo criar um use case na camada application que orquestra contratos via injeção de dependência
- [ ] Eu sei implementar adaptadores concretos na camada infrastructure (repositórios, gateways)
- [ ] Eu consigo construir um controller Express na camada interface que resolve use cases do container
- [ ] Eu sei configurar o Composition Root com tsyringe, conectando contratos a implementações
- [ ] Eu consigo escrever e executar testes de arquitetura com dependency-cruiser
- [ ] Eu entendo por que a Regra da Dependência é o pilar da Clean Architecture

> *Acertou todos? Você está pronto para a Aula 14 — Engenharia de Requisitos, onde vai aprender a elicitar, especificar e priorizar funcionalidades com User Stories, Casos de Uso e critérios de aceitação. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
