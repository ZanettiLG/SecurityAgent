---
titulo: "Aula 09 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 09: Module Pattern, Composição & Patterns Web/React"
data: 2026-06-21
---

# Aula 09 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o **checkpoint de aprendizagem** da Aula 09. A pergunta central é: *"eu realmente entendi Module Pattern, Composição & Patterns Web/React?"*

Cada questão testa um conceito-chave da aula, na ordem em que foram apresentados. Você deve:

1. Criar uma pasta `entregas-aula-09/` no seu diretório de trabalho
2. Completar as questões em ordem — cada uma constrói sobre a anterior
3. Para cada questão, siga os **Passos de Execução** e preencha o template de **Entrega**
4. Só consulte a aula principal se travar em um conceito (cada questão indica a seção exata)

**Regra importante:** não olhe o gabarito antes de tentar. O objetivo é você descobrir o que sabe e o que precisa revisar. Ao final, o **Checklist Final** confirma se você está pronto para a Aula 10.

---

## Questão 1: Refatorar IIFE para ES Module

**Conceito-chave:** Module Pattern — de IIFE a ES Modules (Aula 09, Seção 1).

**Objetivo:** Demonstrar que você compreende a transição do Module Pattern baseado em IIFE para ES Modules nativos, mantendo o encapsulamento.

**Passos de Execução:**

1. Analise o código abaixo que usa IIFE com Revealing Module Pattern
2. Identifique quais variáveis/funções são privadas e quais são públicas
3. Converta para ES Modules em um arquivo `modules/pagamento.ts`
4. Crie um barrel export em `modules/index.ts`

Código original:

```typescript
const ModuloPagamento = (function () {
  const TAXA_PADRAO = 0.03;
  const taxasEspeciais = { premium: 0.01, estudante: 0.0 };
  const transacoes: Array<{ valor: number; tipo: string }> = [];

  function calcularTaxa(valor: number, tipoCliente: string): number {
    return valor * (taxasEspeciais[tipoCliente] ?? TAXA_PADRAO);
  }

  function processar(valor: number, tipoCliente: string): string {
    const taxa = calcularTaxa(valor, tipoCliente);
    transacoes.push({ valor, tipo: tipoCliente });
    const liquido = valor - taxa;
    return `Processado R$${valor}. Taxa: R$${taxa}. Líquido: R$${liquido}`;
  }

  function historico() {
    return transacoes.map(t => `R$${t.valor} (${t.tipo})`);
  }

  return { processar, historico };
})();
```

**Entrega:** crie `entregas-aula-09/09-01-module-pattern.md`:

```markdown
# Questão 1 — Refatorar IIFE para ES Module

## Análise do Encapsulamento

| Nome | Público ou Privado? | Como identificar? |
|---|---|---|
| `TAXA_PADRAO` | | |
| `taxasEspeciais` | | |
| `transacoes` | | |
| `calcularTaxa` | | |
| `processar` | | |
| `historico` | | |

## ES Module — `modules/pagamento.ts`

```typescript
// Cole aqui seu código convertido para ES Module
```

## Barrel Export — `modules/index.ts`

```typescript
// Cole aqui o barrel export
```

## Pergunta de Reflexão

O que muda no encapsulamento entre a IIFE e o ES Module? Há alguma diferença prática na proteção dos dados privados?
```

---

## Questão 2: Composição vs Herança — Sistema de Notificações

**Conceito-chave:** Composition vs Inheritance — HOFs e Mixins (Aula 09, Seção 2).

**Objetivo:** Demonstrar a diferença prática entre herança e composição, refatorando uma hierarquia de classes para funções compostas.

**Passos de Execução:**

1. Analise a hierarquia de classes abaixo que sofre de "explosão de classes"
2. Identifique quantas classes seriam necessárias para 4 comportamentos (email, SMS, log, retry)
3. Refatore para funções compostas usando Higher-Order Functions

```typescript
class Notificador {
  enviar(mensagem: string): string {
    return `Enviando: ${mensagem}`;
  }
}

class NotificadorComEmail extends Notificador {
  enviar(mensagem: string): string {
    return `[Email] ${super.enviar(mensagem)}`;
  }
}

class NotificadorComSMS extends Notificador {
  enviar(mensagem: string): string {
    return `[SMS] ${super.enviar(mensagem)}`;
  }
}

class NotificadorComLog extends NotificadorComEmail {
  enviar(mensagem: string): string {
    console.log(`LOG: ${mensagem}`);
    return super.enviar(mensagem);
  }
}
```

**Entrega:** crie `entregas-aula-09/09-02-composicao.md`:

```markdown
# Questão 2 — Composição vs Herança

## Análise da Explosão de Classes

Com 4 comportamentos (email, SMS, log, retry), quantas classes seriam necessárias para cobrir todas as combinações? Explique.

## Refatoração para Composição

```typescript
type NotificadorFn = (mensagem: string) => string;

function notificadorBase(mensagem: string): string {
  return `Enviando: ${mensagem}`;
}

// Implemente as funções de composição:
// 1. comEmail — adiciona prefixo [Email]
// 2. comSMS — adiciona prefixo [SMS]
// 3. comLog — adiciona console.log
// 4. comRetry — tenta 3 vezes antes de falhar

// Combinações:
// const notificadorCompleto = comLog(comEmail(comRetry(notificadorBase)));
// const apenasSMS = comSMS(notificadorBase);
```

## Pergunta de Reflexão

Por que a composição com HOFs escala melhor que herança quando o número de comportamentos cresce?
```

---

## Questão 3: Implementar HOC withErrorHandler

**Conceito-chave:** HOC — Higher-Order Components (Aula 09, Seção 3).

**Objetivo:** Implementar um HOC que captura erros de componentes React e exibe uma UI de fallback.

**Passos de Execução:**

1. Crie um HOC `withErrorHandler` que:
   - Recebe um componente e um componente de fallback opcional
   - Usa um estado `hasError` para controlar se houve erro
   - Retorna o fallback se `hasError` for true, senão renderiza o componente original
2. Use TypeScript com generics
3. Crie uma versão composta: `withErrorHandler(withAuth(CheckoutPage))`

**Entrega:** crie `entregas-aula-09/09-03-hoc.md`:

```markdown
# Questão 3 — HOC withErrorHandler

## Implementação

```typescript
import React from "react";

// Defina a interface para o fallback
interface ErrorHandlerProps {
  // props injetadas pelo HOC
}

function withErrorHandler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<{ error: Error }>
): React.ComponentType<P> {
  // Implemente aqui
}
```

## Composição

```typescript
// Mostre como compor withErrorHandler com withAuth
// const CheckoutSeguro = withErrorHandler(withAuth(CheckoutPage));
```

## Pergunta de Reflexão

Qual a diferença entre um HOC com Error Boundary (componentDidCatch) e um simples try/catch no componente?
```

---

## Questão 4: Render Props com DataFetcher Genérico

**Conceito-chave:** Render Props (Aula 09, Seção 4).

**Objetivo:** Implementar um componente `DataFetcher` usando Render Props e depois refatorá-lo para usar um custom hook, comparando as duas abordagens.

**Passos de Execução:**

1. Implemente o componente `DataFetcher` com Render Props (genérico)
2. Implemente o mesmo comportamento como um custom hook `useFetch`
3. Compare as duas abordagens: quando cada uma é mais adequada?

**Entrega:** crie `entregas-aula-09/09-04-render-props.md`:

```markdown
# Questão 4 — Render Props vs Custom Hook

## DataFetcher com Render Props

```typescript
interface DataFetcherProps<T> {
  url: string;
  render: (dados: { data: T | null; loading: boolean; error: Error | null }) => React.ReactNode;
}

// Implemente o componente
```

## useFetch como Custom Hook

```typescript
// Implemente o hook
function useFetch<T>(url: string) {
  // ...
}
```

## Comparação

| Critério | Render Props | Custom Hook |
|---|---|---|
| Aninhamento no JSX | | |
| Testabilidade isolada | | |
| Reutilização entre componentes | | |
| Controle do ciclo de vida | | |

## Pergunta de Reflexão

Em que cenário você ainda escolheria Render Props em vez de um custom hook?
```

---

## Questão 5: Custom Hook useFormulario

**Conceito-chave:** Hooks Pattern — Custom Hooks (Aula 09, Seção 5).

**Objetivo:** Criar um custom hook `useFormulario` que gerencia estado de formulários genéricos com validação.

**Passos de Execução:**

1. Crie o hook `useFormulario<T>` que:
   - Recebe um objeto `valoresIniciais` do tipo `T` e uma função `validar`
   - Mantém estado dos valores, erros e "foi tocado" (touched)
   - Expõe funções: `setValor(campo, valor)`, `setTouched(campo)`, `enviar()`, `reset()`
   - `enviar()` valida todos os campos e retorna `{ valido: boolean; valores: T }`
2. Use TypeScript com generics
3. Exemplo de uso no formulário de checkout

**Entrega:** crie `entregas-aula-09/09-05-hook-formulario.md`:

```markdown
# Questão 5 — Custom Hook useFormulario

## Implementação

```typescript
interface UseFormularioReturn<T> {
  valores: T;
  erros: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  setValor: (campo: keyof T, valor: T[keyof T]) => void;
  setTouched: (campo: keyof T) => void;
  enviar: () => { valido: boolean; valores: T };
  reset: () => void;
}

function useFormulario<T extends Record<string, any>>(
  valoresIniciais: T,
  validar?: (valores: T) => Partial<Record<keyof T, string>>
): UseFormularioReturn<T> {
  // Implemente aqui
}
```

## Uso no Checkout

```typescript
interface CheckoutForm {
  nome: string;
  email: string;
  endereco: string;
  cep: string;
}

function CheckoutForm() {
  const { valores, erros, setValor, enviar } = useFormulario<CheckoutForm>(
    { nome: "", email: "", endereco: "", cep: "" },
    (v) => {
      const erros: Partial<Record<keyof CheckoutForm, string>> = {};
      if (!v.nome) erros.nome = "Nome é obrigatório";
      if (!v.email.includes("@")) erros.email = "Email inválido";
      return erros;
    }
  );

  // Implemente o JSX do formulário
}
```

## Pergunta de Reflexão

Por que custom hooks são considerados a forma mais pura de composição no React? Como eles se comparam a HOCs e Render Props nesse aspecto?
```

---

## Questão 6: Compound Components — Accordion

**Conceito-chave:** Compound Components (Aula 09, Seção 6).

**Objetivo:** Implementar um componente Accordion composto (Accordion + Accordion.Item + Accordion.Content) usando Context API.

**Passos de Execução:**

1. Crie o componente composto `Accordion` que:
   - Mantém um estado `aberto` (qual item está expandido)
   - Usa Context para compartilhar o estado com os filhos
   - Permite que apenas um item fique aberto por vez
   - Expõe `Accordion.Item` (header clicável) e `Accordion.Content` (painel expansível)
2. Use TypeScript
3. Exemplo de uso com FAQ do e-commerce

**Entrega:** crie `entregas-aula-09/09-06-compound-accordion.md`:

```markdown
# Questão 6 — Accordion Composto

## Implementação

```typescript
// Context
interface AccordionContextType {
  aberto: string | null;
  toggle: (id: string) => void;
}

// Accordion principal
function Accordion({ children }: { children: React.ReactNode }) {
  // Implemente
}

Accordion.Item = function AccordionItem({ id, children }: { id: string; children: React.ReactNode }) {
  // Implemente
};

Accordion.Content = function AccordionContent({ id, children }: { id: string; children: React.ReactNode }) {
  // Implemente
};
```

## Uso no FAQ do E-commerce

```tsx
<Accordion>
  <Accordion.Item id="entrega">
    <Accordion.Content id="entrega">
      Prazos de entrega variam de 3 a 15 dias úteis...
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item id="pagamento">
    <Accordion.Content id="pagamento">
      Aceitamos cartão de crédito, boleto e Pix...
    </Accordion.Content>
  </Accordion.Item>
</Accordion>
```

## Pergunta de Reflexão

Por que a abordagem de Compound Components é mais flexível que receber um array de itens como prop? Em que cenários a abordagem por props seria melhor?
```

---

## Questão 7: Context + Provider — Tema Personalizado

**Conceito-chave:** Context + Provider (Aula 09, Seção 7).

**Objetivo:** Implementar um sistema de temas (claro/escuro) usando Context + Provider, com persistência no localStorage.

**Passos de Execução:**

1. Crie o `ThemeContext` com `ThemeProvider`
2. O provider deve:
   - Manter o estado do tema (claro/escuro)
   - Persistir a preferência no localStorage
   - Detectar a preferência do sistema (prefers-color-scheme) como fallback
   - Expor `tema`, `toggleTema`, `setTema`
3. Crie o hook `useTheme()` com validação de contexto
4. Use no App do e-commerce: aplique classe CSS condicional no elemento `<html>`

**Entrega:** crie `entregas-aula-09/09-07-context-theme.md`:

```markdown
# Questão 7 — Sistema de Temas com Context

## Implementação

```typescript
type Tema = "claro" | "escuro";

interface ThemeContextType {
  tema: Tema;
  toggleTema: () => void;
  setTema: (tema: Tema) => void;
}

// Implemente ThemeProvider e useTheme
```

## Uso no App

```typescript
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            {/* Rotas do e-commerce */}
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

// Componente que usa o tema
function Header() {
  const { tema, toggleTema } = useTheme();
  return (
    <header className={`header-${tema}`}>
      <button onClick={toggleTema}>
        {tema === "claro" ? "🌙" : "☀️"}
      </button>
    </header>
  );
}
```

## Pergunta de Reflexão

Por que o hook `useTheme` deve lançar um erro se chamado fora do `ThemeProvider`? Qual o risco de retornar um valor default silenciosamente?
```

---

## Questão 8: Integração Final — Carrinho com Context + Persistência

**Conceito-chave:** Integração de múltiplos patterns (Aula 09, Seções 3-7).

**Objetivo:** Integrar CartContext, useFetch custom hook e HOC de autenticação em uma tela de checkout completa.

**Passos de Execução:**

1. Crie o `CartProvider` (junto com o hook `useCart`) que persiste no localStorage
2. Crie um hook `useProdutos` usando `useFetch` internamente para listar produtos do catálogo
3. Crie uma página `CheckoutPage` que:
   - Usa `useCart()` para acessar o carrinho
   - Usa `useAuth()` (da Questão 7) para verificar se o usuário está logado
   - Exibe os itens do carrinho, o total e um botão "Finalizar Pedido"
4. Exporte a página com `withAuth` (protegida) e `withErrorHandler` (da Questão 3)

**Entrega:** crie `entregas-aula-09/09-08-integracao-final.md`:

```markdown
# Questão 8 — Integração Final

## CartContext + CartProvider

```typescript
// Implemente ou integre o CartContext da Seção 7 da aula
```

## useProdutos (Custom Hook com useFetch)

```typescript
function useProdutos(filtro?: string) {
  // Implemente usando useFetch
}
```

## CheckoutPage

```typescript
function CheckoutPage() {
  // Use useCart() e useAuth()
  // Exiba os itens, total e formulário de checkout
}
```

## Exportação

```typescript
// Componha os HOCs
export default withErrorHandler(withAuth(CheckoutPage));
```

## Pergunta de Reflexão

Como a composição de patterns (Context + Hooks + HOCs) se compara à abordagem de herança que vimos no início da aula? Quais problemas a composição resolve que a herança não resolveria?
```

---

## Checklist Final: Pronto para a Aula 10?

Antes de avançar para a **Aula 10: DDD — Modelagem Estratégica**, verifique se você consegue fazer cada item abaixo sem consultar o material. Marque com `[x]` os que já domina e revise os que ainda estão pendentes.

- [ ] **Questão 1 — Module Pattern**: Refatorei uma IIFE para ES Modules, identificando corretamente o que é público e privado
- [ ] **Questão 2 — Composição vs Herança**: Expliquei a explosão de classes e implementei composição com HOFs
- [ ] **Questão 3 — HOC**: Implementei um HOC com TypeScript generics e comprei com outro HOC
- [ ] **Questão 4 — Render Props**: Implementei DataFetcher com Render Props e refatorei para custom hook, comparando as abordagens
- [ ] **Questão 5 — Custom Hooks**: Criei um hook genérico useFormulario com validação e TypeScript
- [ ] **Questão 6 — Compound Components**: Implementei Accordion composto com Context e entendi a diferença para props configuráveis
- [ ] **Questão 7 — Context + Provider**: Implementei ThemeContext com persistência e fallback de preferência do sistema
- [ ] **Questão 8 — Integração Final**: Integrei CartContext, useFetch, HOCs e hooks em uma tela de checkout funcional
- [ ] **Composição de patterns**: Sei combinar HOCs + Hooks + Context em uma mesma aplicação
- [ ] **TypeScript**: Usei generics, tipos e interfaces em todos os patterns implementados

**Se você marcou 8 ou mais itens, está pronto para a Aula 10!** Na próxima aula, vamos aplicar Domain-Driven Design na modelagem estratégica do e-commerce, mapeando Bounded Contexts, Entidades e Agregados. Os patterns de composição que você aprendeu aqui serão a base para conectar o domínio de negócio com a implementação no frontend.

**Se marcou menos de 8:** revise as seções correspondentes na aula principal e refaça as questões. Não pule para a Aula 10 com lacunas — os conceitos desta aula são pré-requisito direto para o que vem a seguir.
