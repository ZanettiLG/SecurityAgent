---
titulo: "Aula 02 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 02: Setup, Instalação e Primeiros Passos no VS Code"
data: 2026-06-20
---

# Aula 02 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o seu **checkpoint de domínio**. A pergunta central é: "eu realmente entendi a matéria?".

Cada questão tem um **Objetivo** (o que você precisa demonstrar), **Passos de Execução** (como fazer) e uma **Entrega** (o que produzir e salvar). Você deve completar as questões NA ORDEM, sem consultar a aula principal — se travar, a seção indicada em "Conceito-chave" é onde revisar.

Crie a pasta `entregas-aula02/` na raiz do seu projeto e salve cada entrega como um arquivo separado.

> *Pronto? Mãos ao código!*

---

## Questão 1: Instalação e Verificação

**Conceito-chave:** Ciclo universal de setup — instalar, autenticar, verificar (Aula 02, Seção 5).

**Objetivo:** Demonstrar que você completou o ciclo de setup do GitHub Copilot no VS Code, documentando cada etapa.

**Passos de Execução:**

1. Se o Copilot já está instalado: abra uma janela limpa do VS Code, verifique o badge na status bar e confirme que o Chat responde. Se não estiver instalado: execute o fluxo completo (Marketplace → Install → Sign in → Verificar).
2. Abra o Chat (Ctrl+Shift+I) e pergunte: "Qual é o meu nome de usuário no GitHub?"
3. Abra o Chat novamente e pergunte: "Liste 3 funcionalidades que você oferece como coding agent."
4. Documente cada etapa no template de entrega, incluindo o estado do badge, a resposta do Chat e screenshots descritivos.

**Entrega:** crie `entregas-aula02/01-instalacao-verificacao.md`:

```markdown
# Questão 1 — Instalação e Verificação

## Estado do Badge
- [ ] Badge verde na status bar
- [ ] Badge cinza (não resolveu — descreva abaixo o troubleshooting)

## Resposta do Chat — "Qual é o meu nome de usuário?"
<!-- Cole a resposta exata do Copilot -->

## Resposta do Chat — "Liste 3 funcionalidades"
<!-- Cole a resposta exata do Copilot -->

## Prints Descritivos
<!-- Descreva o que cada print mostra. Ex: "Print 1: VS Code com badge verde na status bar" -->

## Dificuldades Encontradas
<!-- Se houve algum problema, descreva aqui como resolveu -->
```

---

## Questão 2: Escolha de Plano

**Conceito-chave:** Modelos de precificação de coding agents e créditos (Aula 02, Seções 3 e 5).

**Objetivo:** Demonstrar que você entende a relação entre planos Copilot, créditos e necessidades de uso, analisando três cenários.

**Passos de Execução:**

1. Leia os três cenários abaixo.
2. Para cada cenário, escolha o plano Copilot mais adequado (Free, Pro, Pro+ ou Max) e justifique com base em: necessidade de créditos, acesso a modelos premium, autocomplete ilimitado e orçamento.
3. Para cada escolha, explique por que os outros planos seriam inadequados.

**Cenário A:** Estudante fazendo o curso de 12 aulas. Usa principalmente autocomplete e Chat básico. Orçamento zero.
**Cenário B:** Desenvolvedora freelancer que usa Copilot 8h/dia. Precisa de Chat com modelos premium (Claude Opus, GPT-5.5) para revisão de código. Aceita pagar mensalidade.
**Cenário C:** Empresa com 50 desenvolvedores. Precisa de faturamento centralizado, políticas de uso e relatórios de consumo.

**Entrega:** crie `entregas-aula02/02-escolha-plano.md`:

```markdown
# Questão 2 — Escolha de Plano

## Cenário A — Estudante
**Plano escolhido:**
**Justificativa:**
**Por que os outros planos não se encaixam:**

## Cenário B — Freelancer
**Plano escolhido:**
**Justificativa:**
**Por que os outros planos não se encaixam:**

## Cenário C — Empresa
**Plano escolhido:**
**Justificativa:**
**Por que os outros planos não se encaixam:**
```

---

## Questão 3: Autocomplete na Prática

**Conceito-chave:** Uso de autocomplete inline, navegação entre alternativas e aceitação parcial (Aula 02, Seção 6).

**Objetivo:** Demonstrar domínio do autocomplete inline criando 3 funções JavaScript usando APENAS sugestões do Copilot, sem digitar o corpo das funções manualmente.

**Passos de Execução:**

1. Crie um arquivo `teste-autocomplete.js` na raiz do projeto.
2. Para cada função abaixo, digite APENAS o comentário descritivo e pressione Enter. O Copilot deve sugerir o corpo. Aceite com Tab.
3. Quando o Copilot mostrar múltiplas alternativas (Ctrl+→), experimente cada uma antes de escolher.
4. Documente quantas sugestões o Copilot ofereceu para cada função, qual você escolheu e por quê.

**Funções para criar:**

```javascript
// Função 1: Filtra um array de projetos por status, retornando apenas os que têm o status informado

// Função 2: Formata uma data ISO (AAAA-MM-DD) para o formato brasileiro (DD/MM/AAAA)

// Função 3: Conta quantos projetos em um array têm prioridade 'alta'
```

**Entrega:** crie `entregas-aula02/03-autocomplete-pratica.md`:

```markdown
# Questão 3 — Autocomplete na Prática

## Código Gerado
<!-- Cole o conteúdo completo de teste-autocomplete.js -->

## Tabela de Sugestões
| Função | Alternativas oferecidas | Escolhida | Motivo da escolha |
|---|---|---|---|
| filtrarPorStatus | N | N da X | ... |
| formatarData | N | N da X | ... |
| contarPrioridadeAlta | N | N da X | ... |

## Reflexão
- Em alguma das funções você rejeitou a primeira sugestão? Por quê?
- As sugestões do Copilot estavam corretas ou precisaram de ajustes?
```

---

## Questão 4: Chat Ask vs Edit

**Conceito-chave:** Distinção entre modos Ask, Edit e Agent do Copilot Chat (Aula 02, Seção 7).

**Objetivo:** Demonstrar que você sabe quando usar Ask vs Edit, executando ambos os modos e documentando as diferenças.

**Passos de Execução:**

1. Com o `index.html` do Portal aberto no VS Code, mude o Chat para modo **Ask**.
2. Pergunte: "Explique a estrutura de tags HTML que estou usando e sugira melhorias de acessibilidade."
3. Copie a resposta para sua entrega.
4. Mude o Chat para modo **Edit**.
5. Prompt: "/edit Adicione atributos de acessibilidade ao header e footer (role, aria-label)."
6. Observe o diff — aceite (Keep) ou rejeite (Undo) parcialmente.
7. Documente as diferenças de comportamento entre Ask e Edit.

**Entrega:** crie `entregas-aula02/04-chask-ask-edit.md`:

```markdown
# Questão 4 — Chat Ask vs Edit

## Resposta do Modo Ask
<!-- Cole a resposta do Copilot para a pergunta sobre acessibilidade -->

## Diff do Modo Edit
<!-- Descreva as mudanças que o Copilot aplicou no modo Edit -->
<!-- Inclua: quais atributos foram adicionados? Em quais tags? -->

## Análise Comparativa
| Aspecto | Ask | Edit |
|---|---|---|
| O Copilot editou arquivos? | | |
| Você viu um diff? | | |
| Quanto controle você teve sobre o resultado? | | |
| Em que situação você usaria cada um? | | |

## Conclusão
<!-- Em 2-3 frases: qual modo você usaria para cada tipo de tarefa? -->
```

---

## Questão 5: Anatomia da Semente

**Conceito-chave:** Anatomia do arquivo de instruções permanentes e seu papel como semente do harness (Aula 02, Seções 4 e 8).

**Objetivo:** Demonstrar que você entende o papel de cada seção do `copilot-instructions.md` e é capaz de propor regras adicionais para cada uma.

**Passos de Execução:**

1. Releia mentalmente as 4 seções do `copilot-instructions.md` (Stack, Estilo, Convenções, Restrições).
2. Para cada seção, explique brevemente seu propósito.
3. Para cada seção, crie UMA regra adicional que você ADICIONARIA para tornar o harness mais eficaz. A regra deve ser específica e verificável.
4. Justifique por que cada regra adicional é necessária para o seu contexto.

**Entrega:** crie `entregas-aula02/05-anatomia-semente.md`:

```markdown
# Questão 5 — Anatomia da Semente

## Seção: Stack
**Propósito:**
**Regra adicional que eu adicionaria:**
**Justificativa:**

## Seção: Estilo de Código
**Propósito:**
**Regra adicional que eu adicionaria:**
**Justificativa:**

## Seção: Convenções
**Propósito:**
**Regra adicional que eu adicionaria:**
**Justificativa:**

## Seção: Restrições
**Propósito:**
**Regra adicional que eu adicionaria:**
**Justificativa:**
```

---

## Questão 6: Portal de Projetos Dev

**Conceito-chave:** Construção da estrutura inicial do Portal usando Copilot Chat (Aula 02, Seção 8 + Projeto Progressivo).

**Objetivo:** Demonstrar que você consegue usar o Copilot (modo Edit) para evoluir o Portal de forma incremental, adicionando funcionalidades que respeitam as instruções do harness.

**Passos de Execução:**

1. Certifique-se de que o `index.html`, `styles.css` e `app.js` existem e funcionam (3 cards visíveis no navegador).
2. Abra o Chat no modo Edit.
3. Prompt: "/edit Adicione uma barra de busca textual no topo da página. Conforme o usuário digita, os cards devem ser filtrados pelo nome do projeto (ignorando maiúsculas/minúsculas). Siga as instruções em .github/copilot-instructions.md."
4. Revise o código gerado. O Copilot seguiu as regras? (CSS Grid, kebab-case, sem frameworks?)
5. Teste no navegador: digite um nome e verifique se o filtro funciona.
6. Prompt adicional (modo Edit): "/edit Adicione um contador de projetos visíveis: 'Mostrando N de 3 projetos'. E se não houver projetos correspondentes, mostre uma mensagem de estado vazio."

**Entrega:** crie `entregas-aula02/06-portal-projetos.md`:

```markdown
# Questão 6 — Portal de Projetos Dev

## Código Gerado
### Barra de busca
<!-- Descreva as mudanças no HTML, CSS e JS -->

### Contador e estado vazio
<!-- Descreva as mudanças -->

## Verificação de Instruções
- [ ] O Copilot usou CSS Grid (conforme instruído)?
- [ ] As classes estão em kebab-case?
- [ ] Usou `const`/`let` em vez de `var`?
- [ ] Não adicionou frameworks ou CDNs externas?
- [ ] Comentários estão em português?

## Dificuldades
<!-- O Copilot seguiu todas as instruções corretamente? Se não, descreva o que ignorou. -->
```

---

## Questão 7: Verificação do Harness

**Conceito-chave:** Verificação de que o Copilot realmente segue as instruções do arquivo de instruções (Aula 02, Seção 8).

**Objetivo:** Demonstrar que você sabe testar e verificar o comportamento do harness, modificando intencionalmente as instruções e observando a resposta do Copilot.

**Passos de Execução:**

1. Faça uma cópia de segurança do seu `copilot-instructions.md` atual.
2. Modifique temporariamente o arquivo: troque "CSS Grid" por "Flexbox para tudo" e "português (Brasil)" por "inglês".
3. Abra o Chat no modo Edit e peça: "/edit Adicione um novo card no layout do Portal."
4. Observe: o Copilot usou Flexbox (nova regra) ou Grid (regra original)?
5. Restaure o arquivo original.
6. Documente em quais situações o Copilot "obedeceu" vs "desobedeceu" às instruções modificadas.

**Entrega:** crie `entregas-aula02/07-verificacao-harness.md`:

```markdown
# Questão 7 — Verificação do Harness

## Instrução Original vs Modificada
| Instrução | Original | Modificada |
|---|---|---|
| Layout | CSS Grid | Flexbox para tudo |
| Idioma | português (Brasil) | inglês |

## Resultado do Teste
- O Copilot seguiu a instrução modificada? [Sim / Não / Parcialmente]
- Se seguiu: qual instrução (layout ou idioma) foi respeitada?
- Se não seguiu: qual instrução original ele manteve?

## Análise
<!-- Descreva em quais situações o Copilot obedeceu e em quais desobedeceu -->
<!-- Ex: "Na geração do CSS ele usou Flexbox, mas nos comentários manteve português" -->

## Conclusão
<!-- O que este teste revela sobre como o Copilot interpreta instruções? -->
```

---

## Checklist Final: Pronto para a Aula 03?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Sei instalar e autenticar o GitHub Copilot no VS Code, incluindo troubleshooting básico
- [ ] Entendo os 3 padrões de instalação de coding agents e o ciclo universal de setup (instalar → autenticar → verificar)
- [ ] Consigo explicar a diferença entre OAuth device flow, API key e token com escopo, e sei qual o Copilot usa
- [ ] Sei comparar planos de coding agents (Free, Pro, Enterprise) e explicar o que são créditos e o que consome vs não consome
- [ ] Domino autocomplete inline (aceitar, rejeitar, navegar entre alternativas) e Next Edit Suggestions
- [ ] Sei quando usar Ask, Edit e Agent no Copilot Chat — e consigo explicar a diferença com exemplos concretos
- [ ] Criei e testei meu `.github/copilot-instructions.md` com stack, estilo, convenções e restrições
- [ ] Construí a estrutura inicial do Portal de Projetos Dev (HTML + CSS + JS funcionais com 3 cards)
- [ ] Verifiquei que o Copilot respeita minhas instruções ao gerar código (e identifiquei falhas)
- [ ] Entendo que esta é a semente — o harness crescerá nas próximas 10 aulas com instruções condicionais, skills, agentes e MCP

> *Acertou todos? Você está pronto para a Aula 03, onde seu `copilot-instructions.md` de 20 linhas vai se transformar em um sistema de governança com instruções condicionais, regras por tipo de arquivo e níveis de escopo. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*