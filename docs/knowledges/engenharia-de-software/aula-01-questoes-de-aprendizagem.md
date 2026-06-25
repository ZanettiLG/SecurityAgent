---
titulo: "Aula 01 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 01: Introdução à Engenharia de Software"
data: 2026-06-20
---

# Aula 01 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de aprendizagem**. A pergunta central é: *"eu realmente entendi a matéria?"*

Cada questão verifica um conceito-chave da aula. Você deve fazê-las **depois** de estudar o conteúdo principal, sem reler a aula a cada passo. Se travar, a seção indicada em **Conceito-chave** mostra onde consultar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-01/` no seu diretório de estudos
2. Faça as questões em ordem — cada uma se apoia na anterior
3. Para cada questão, crie o arquivo de entrega indicado e preencha o template
4. Ao final, revise o **Checklist Final** e marque o que você consegue fazer sem consultar a aula

---

## Questão 1: Engenheiro vs Programador

**Conceito-chave:** Diferença entre programador e engenheiro de software (Aula 01, Seção 1).

**Objetivo:** Demonstrar que você compreende a diferença de mentalidade entre programar e fazer engenharia de software.

**Passos de Execução:**

1. Sem consultar a aula, escreva com suas palavras a diferença entre um programador e um engenheiro de software
2. Dê um exemplo concreto de uma situação onde a mentalidade de engenheiro teria evitado um problema
3. Explique por que essa diferença importa para o custo total de um sistema

**Entrega:** crie `entregas-aula-01/01-engenheiro-vs-programador.md`:

```markdown
# Questão 1 — Engenheiro vs Programador

## Minha definição da diferença

[Escreva aqui com suas palavras]

## Exemplo concreto

[Descreva uma situação real ou hipotética]

## Por que isso importa para o custo do sistema?

[Explique a relação com os 85% de custo de manutenção]

## Conclusão

Em 2-3 frases: o que você leva desta distinção para sua prática diária?
```

---

## Questão 2: As fases do ciclo de vida

**Conceito-chave:** Ciclo de vida do software (Aula 01, Seção 2).

**Objetivo:** Verificar se você memorizou e consegue explicar as 7 fases do ciclo de vida e o propósito de cada uma.

**Passos de Execução:**

1. Liste as 7 fases do ciclo de vida na ordem correta
2. Para cada fase, escreva uma frase sobre o que acontece nela
3. Identifique em qual fase você está mais confortável e em qual tem mais dificuldade

**Entrega:** crie `entregas-aula-01/02-ciclo-de-vida.md`:

```markdown
# Questão 2 — As fases do ciclo de vida

## Lista das 7 fases

1. [Fase 1] — [descrição]
2. [Fase 2] — [descrição]
3. [Fase 3] — [descrição]
4. [Fase 4] — [descrição]
5. [Fase 5] — [descrição]
6. [Fase 6] — [descrição]
7. [Fase 7] — [descrição]

## Minha fase mais forte

[Fase] — [por que você se sente confortável aqui?]

## Minha fase mais desafiadora

[Fase] — [por que você sente dificuldade?]

## Conclusão

Em 2-3 frases: como o entendimento do ciclo de vida muda sua visão sobre o desenvolvimento de software?
```

---

## Questão 3: Custo exponencial de correção

**Conceito-chave:** Curva de custo de correção de bugs (Aula 01, Seção 2).

**Objetivo:** Comprovar que você entende a relação entre o momento de descoberta de um bug e seu custo de correção.

**Passos de Execução:**

1. Desenhe (mentalmente ou no papel) a curva do custo de correção ao longo das fases
2. Explique por que um bug em produção custa 100x mais que no design
3. Descreva uma estratégia para detectar bugs o mais cedo possível no ciclo

**Entrega:** crie `entregas-aula-01/03-custo-correcao.md`:

```markdown
# Questão 3 — Custo exponencial de correção

## A curva de custo

| Fase | Custo relativo | Por que aumenta? |
|---|---|---|
| Design | 1x | |
| Implementação | 10x | |
| Testes | 30x | |
| Produção | 100x | |

## Por que produção é 100x mais cara?

[Explique os fatores que multiplicam o custo]

## Estratégia para detecção precoce

[Descreva pelo menos 2 práticas que ajudam a encontrar bugs cedo]

## Conclusão

Em 2-3 frases: como essa curva influencia suas decisões de desenvolvimento?
```

---

## Questão 4: Dívida técnica — definição e tipos

**Conceito-chave:** Dívida técnica (Aula 01, Seção 3).

**Objetivo:** Verificar se você compreende o conceito de dívida técnica e consegue classificar exemplos reais.

**Passos de Execução:**

1. Defina dívida técnica com suas palavras
2. Explique a metáfora financeira (principal vs juros)
3. Classifique 3 exemplos que você cria ou encontra no dia a dia nos 3 tipos (deliberada, acidental, bit rot)

**Entrega:** crie `entregas-aula-01/04-divida-tecnica.md`:

```markdown
# Questão 4 — Dívida técnica

## Definição

[Defina com suas palavras]

## A metáfora financeira

[Explique principal, juros e juros compostos]

## 3 exemplos classificados

| Exemplo | Tipo | Por que é esse tipo? | Impacto estimado |
|---|---|---|---|
| 1. | | | |
| 2. | | | |
| 3. | | | |

## Conclusão

Em 2-3 frases: como você pretende lidar com dívida técnica a partir de agora?
```

---

## Questão 5: Ciclo vicioso da dívida técnica

**Conceito-chave:** Impacto da dívida técnica na velocidade do time (Aula 01, Seção 3).

**Objetivo:** Demonstrar que você entende como a dívida técnica se realimenta e degrada a produtividade.

**Passos de Execução:**

1. Descreva o ciclo vicioso da dívida técnica em 4-5 passos
2. Identifique um ponto de ruptura — onde o time poderia interromper o ciclo
3. Explique como este módulo ensina a pagar a dívida

**Entrega:** crie `entregas-aula-01/05-ciclo-vicioso.md`:

```markdown
# Questão 5 — Ciclo vicioso da dívida técnica

## Descrição do ciclo

1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
4. [Passo 4]
5. [Passo 5]

## Ponto de ruptura

[Onde o time poderia interromper o ciclo?]

## Como este módulo ensina a pagar a dívida

[Cite pelo menos 2 áreas do módulo que atacam a dívida técnica]

## Conclusão

Em 2-3 frases: o que você faria diferente no seu próximo projeto para evitar o ciclo vicioso?
```

---

## Questão 6: Stack do projeto progressivo

**Conceito-chave:** Stack do projeto de E-commerce (Aula 01, Seção 4).

**Objetivo:** Comprovar que você conhece as tecnologias do projeto e entende o papel de cada uma.

**Passos de Execução:**

1. Liste as tecnologias da stack e classifique cada uma em: runtime/linguagem, framework, banco, frontend, teste, infraestrutura, qualidade
2. Explique por que TypeScript strict mode foi escolhido
3. Descreva a diferença entre o ponto de partida (esta aula) e o ponto de chegada (Aula 21)

**Entrega:** crie `entregas-aula-01/06-stack-projeto.md`:

```markdown
# Questão 6 — Stack do projeto

## Tecnologias por categoria

| Categoria | Tecnologia | Para que serve |
|---|---|---|
| Runtime/Linguagem | | |
| Framework | | |
| Banco de dados | | |
| Frontend | | |
| Testes | | |
| Infraestrutura | | |
| Qualidade | | |

## Por que TypeScript strict mode?

[Explique os benefícios]

## Ponto de partida vs ponto de chegada

| Aspecto | Aula 01 | Aula 21 |
|---|---|---|
| Organização do código | | |
| Testes | | |
| Pipeline | | |
| Observabilidade | | |
| Agentes | | |

## Conclusão

Em 2-3 frases: o que mais te anima no ponto de chegada?
```

---

## Questão 7: Verificação do setup

**Conceito-chave:** Setup do projeto progressivo (Aula 01, Seção 4 — Mão na Massa).

**Objetivo:** Validar que você configurou corretamente o repositório base e os endpoints funcionam.

**Passos de Execução:**

1. Execute `npm run build` e `npm run lint` e registre os resultados
2. Teste os endpoints GET /health e POST /orders com curl ou seu cliente HTTP favorito
3. Documente qualquer erro encontrado e como resolveu

**Entrega:** crie `entregas-aula-01/07-setup-verificacao.md`:

```markdown
# Questão 7 — Verificação do setup

## Build e Lint

- `npm run build`: [passou / erro — descreva]
- `npm run lint`: [passou / erro — descreva]

## Teste dos endpoints

### GET /health

**Comando usado:**
```bash

```

**Resposta recebida:**
```json

```

### POST /orders

**Comando usado:**
```bash

```

**Resposta recebida:**
```json

```

## Erros encontrados

| Erro | Causa | Solução |
|---|---|---|
| | | |

## Conclusão

Em 2-3 frases: o setup está funcionando? O que você aprendeu configurando o projeto?
```

---

## Questão 8: Os 5 blocos do módulo

**Conceito-chave:** Estrutura do módulo (Aula 01, Seção 5).

**Objetivo:** Verificar se você compreende a organização do módulo em blocos e o que esperar de cada um.

**Passos de Execução:**

1. Liste os 5 blocos com suas aulas correspondentes
2. Para cada bloco, escreva uma frase sobre o principal aprendizado
3. Identifique qual bloco você mais espera e por quê

**Entrega:** crie `entregas-aula-01/08-blocos-modulo.md`:

```markdown
# Questão 8 — Os 5 blocos do módulo

## Blocos

| Bloco | Aulas | Principal aprendizado |
|---|---|---|
| A — Fundamentos | 01-04 | |
| B — Design Patterns | 05-09 | |
| C — Domínio & Arquitetura | 10-13 | |
| D — Qualidade & Especificação | 14-17 | |
| E — Entrega, Operação & Agentes | 18-21 | |

## Bloco que mais me interessa

[Bloco] — [por que você está animado com este bloco?]

## Filosofia do módulo

[Explique com suas palavras a filosofia "experiência antes da explicação"]

## Conclusão

Em 2-3 frases: o que você espera alcançar ao final das 21 aulas?
```

---

## Checklist Final: Pronto para a Aula 02?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Consigo explicar a diferença entre programador e engenheiro de software com exemplos concretos
- [ ] Sei listar as 7 fases do ciclo de vida do software na ordem correta
- [ ] Entendo por que corrigir um bug em produção custa 100x mais do que corrigi-lo no design
- [ ] Consigo definir dívida técnica e classificar exemplos nos 3 tipos (deliberada, acidental, bit rot)
- [ ] Sei explicar como a dívida técnica se acumula em ciclo vicioso e impacta a velocidade do time
- [ ] Reconheço o SWEBOK como referência e sei qual seu propósito
- [ ] Consigo descrever os 5 blocos do módulo e o que aprenderei em cada um
- [ ] Configurei o repositório base do projeto progressivo com TypeScript strict, Express e ESLint
- [ ] Criei e testei os endpoints GET /health e POST /orders com respostas verificadas
- [ ] Entendo a filosofia de 2 arquivos por aula e o propósito do projeto progressivo

> *Acertou todos? Você está pronto para a **Aula 02: Clean Code — Nomes, Funções e Estrutura**, onde você refatorará o controller Express em funções pequenas e nomeadas. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
