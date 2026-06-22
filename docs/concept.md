# O Conceito: Inteligencia Ambiental Continua

## Definicao

**Inteligencia Ambiental Continua** e a capacidade de um sistema autonomo de:

1. **Observar** um ambiente continuamente atraves de multiplos sensores
2. **Aprender** o que e normal para cada ator em cada contexto (horario, dia, local)
3. **Perceber** desvios — nao como fatos isolados, mas como combinacoes de comportamento e ator
4. **Explicar** esses desvios gerando hipoteses causais
5. **Reconhecer padroes** comportamentais que se repetem, entre atores ou pelo mesmo ator
6. **Dialogar** com humanos para resolver incertezas que o sistema nao consegue resolver sozinho
7. **Acumular** conhecimento permanentemente — cada resposta do usuario ensina o sistema

---

## O Insight Central: Comportamento no Contexto do Ator

Um comportamento nunca e intrinsecamente "normal" ou "suspeito". Ele so
tem significado **em relacao a quem o executa**.

O Vigia entende isso intuitivamente. Considere tres carros reduzindo a
velocidade em frente a uma casa:

| Ator | Comportamento | O que o Vigia sabe | Interpretacao |
|------|--------------|-------------------|---------------|
| Vizinha Celia | Reduz na frente da propria casa | E a casa dela. Ela sempre faz isso. | ✅ Normal — e a baseline dela |
| Carro do roubo da Olinda | Reduz observando outras casas | Este carro foi usado em um crime ha 1 semana. | 🚨 Mesmo ator, mesmo padrao pre-crime. Reincidencia. |
| Carro desconhecido | Reduz observando casas, 3x em 6h | Nao sei quem e. Mas o comportamento e identico ao do carro do roubo. | ⚠️ Padrao suspeito cross-ator. Possivel novo crime. |

O mesmo comportamento. Tres significados completamente diferentes.
A diferenca nao esta no comportamento — esta **no que o sistema sabe sobre o ator**.

Isso significa que o sistema opera em **tres niveis de baseline** que
se aplicam a QUALQUER ator, conhecido ou desconhecido:

```
CAMADA 1 — Baseline universal (todos os veiculos/pessoas neste local)
  "Veiculos nesta rua tipicamente fazem o que?"
  → Passam em velocidade normal, estacionam <5min, vao embora
  → Aprendido de TODOS os veiculos que passam, sem distincao

CAMADA 2 — Baseline por categoria (entregadores, vizinhos, visitantes)
  "Veiculos de entrega nesta rua tipicamente fazem o que?"
  → Param 2-3min, deixam pacote, vao embora
  → Vizinhos: podem estacionar por horas, e normal
  → Aprendido agrupando veiculos com caracteristicas similares

CAMADA 3 — Baseline por ator especifico (ESTE carro, ESTA pessoa)
  "Como ESTE carro especifico costuma se comportar?"
  → So existe se o ator ja foi visto antes
  → A vizinha Celia: reduz na propria porta (normal dela)
  → O carro do roubo: reduz observando outras casas (baseline criminosa)
```

Quando um carro DESCONHECIDO aparece, ele NAO tem baseline na Camada 3
(ator especifico). Mas tem baseline nas Camadas 1 e 2 — e e contra elas
que o sistema avalia:

```
Carro desconhecido + reduz velocidade + observa casas + 3x em 6h

Contra Camada 1 (todos os veiculos):
  "Veiculos em geral NAO fazem isso" → ATIPICO

Contra Camada 2 (categoria mais proxima):
  "Nao se parece com entregador, nem vizinho, nem visita" → ATIPICO

Contra assinaturas de crime (cross-ator):
  "Este comportamento e identico ao do carro do roubo" → MATCH → ALERTA
```

O baseline universal e o que permite ao sistema detectar anomalias
**sem nunca ter visto o ator antes**. E o que faz um carro completamente
novo ser flagado na primeira vez que aparece com comportamento suspeito.

---

## Por que isso importa

### O problema do "alarme que grita lobo"

Um sistema de seguranca tradicional que alerta sobre todo movimento noturno
gera fadiga de alertas. O usuario aprende a ignora-lo.

Um sistema com inteligencia ambiental **aprende a rotina de cada ator**:
- Sabe que o gato do vizinho passa no jardim as 3h → nao alerta
- Sabe que o carteiro chega as 10h → nao pergunta
- Sabe que a vizinha Celia reduz na porta dela → e a baseline dela
- Sabe que carro parado 5min e normal → nao registra
- Mas o MESMO carro do roubo da Olinda passando de novo → **alerta maximo**
- E um carro DESCONHECIDO com o mesmo padrao → **alerta elevado**

A diferenca e que o sistema **ganha credibilidade** porque so interrompe
o usuario quando ha genuina incerteza ou quando reconhece um padrao que
ja foi associado a perigo.

### Por que padroes importam mais que identidades (e por que identidades tambem importam)

A historia do roubo da Olinda revela algo fundamental sobre comportamento
criminoso: **criminosos repetem padroes** — mesmo quando trocam de carro,
de placa, de rosto.

O Vigia detectou 3 passagens do carro cinza. Nao sabia quem eram. Nao
reconheceu os rostos. Mas quando o roubo aconteceu, ele fez algo crucial:
**revisao retrospectiva**. Comparou o comportamento pre-crime com milhares
de horas de gravacoes, ocorrencias policiais publicas, noticias locais —
e descobriu que aquele padrao (passar, reduzir, observar, repetir) aparecia
em muitos crimes.

Quando uma semana depois um carro DIFERENTE repetiu o MESMO padrao, o
sistema nao precisou reconhecer o carro. Precisou reconhecer **a assinatura
comportamental** — e comparar com o que aprendeu.

Mas quando o carro ERA o mesmo? Identidade IMPORTA. Saber que e o mesmo
veiculo do crime anterior transforma "suspeito" em "confirmado". A placa
pode ser trocada — mas o sistema que reconhece o veiculo por features
visuais (nao so placa) mantem a continuidade da identidade.

**Identidade e padrao nao sao opostos. Sao duas camadas da mesma analise.**
Quanto mais camadas batem, mais forte o sinal.

### O valor alem da seguranca

A historia do Manuel mostra que o sistema entrega valor mesmo sem ameacas:
- Descobre que a vizinha esta namorando (informacao social)
- Preve que a fofoca vai se espalhar (antecipacao)
- Gera entretenimento ("Extremamente interessante")

Isso transforma o sistema de "custo necessario" (seguranca) para "presenca
valorizada" (companhia inteligente).

---

## Principios de Design

### 1. Tres camadas de baseline

Nao existe "anormal" absoluto. Um comportamento e anormal **em relacao a**
tres camadas de baseline sobrepostas:

| Camada | Aprendida de | Responde a pergunta |
|--------|-------------|-------------------|
| **Universal** | Todos os veiculos/pessoas que passam | "Veiculos nesta rua tipicamente fazem o que?" |
| **Categoria** | Grupos com caracteristicas similares | "Entregadores nesta rua tipicamente fazem o que?" |
| **Ator especifico** | Este veiculo/pessoa especifica | "Como ESTE carro costuma se comportar?" |

A tabela com a licao dos dois capitulos:

| Ator | Comportamento | Camada usada | Interpretacao |
|------|--------------|-------------|---------------|
| Entregador | Pessoa na porta 14h | Camada 2 (entregadores) + Camada 3 (este) | Normal |
| Desconhecido | Pessoa na porta 3h | Camada 1 (todos) → "pessoas nao fazem isso as 3h" | Anormal |
| Qualquer um | Carro parado 2min | Camada 1 → "normal, todo mundo faz" | Normal |
| Desconhecido | Carro parado 23min | Camada 1 → "veiculos em geral ficam <5min" | Curioso |
| Vizinha Celia | Carro parado 23min na propria porta | Camada 3 → "sempre faz isso" | Normal |
| Desconhecido | Reduz + observa casas 3x em 6h | Camada 1 → "veiculos em geral NAO fazem isso" | ⚠️ Suspeito |
| Carro do roubo | Reduz + observa casas | Camada 3 → "este carro fez isso antes do crime" | 🚨 Alerta maximo |
| Carro diferente | Reduz + observa casas 3x em 6h | Camada 1 → atipico + Assinatura cross-ator match | ⚠️ Alerta elevado |

**A Camada 1 (universal) e a que permite detectar anomalias em atores**
**completamente novos.** Um carro que o sistema nunca viu ainda e avaliado
contra "como veiculos em geral se comportam nesta rua". Se o comportamento
desvia do universal, dispara atencao — mesmo sem Camada 3.

**A Camada 3 (ator especifico) e a que evita falsos positivos.** A vizinha
Celia reduz na porta dela todo santo dia. A Camada 1 diria "reduzir e atipico",
mas a Camada 3 diz "para ELA, e totalmente normal". O sistema usa a camada
mais especifica disponivel — e so recorre a camadas mais genericas quando
nao tem dados suficientes do ator.

### 2. Reconhecer assinaturas, nao apenas anomalias

Alem de detectar "isto desvia da baseline", o sistema precisa detectar
"isto e igual a algo perigoso que ja vi antes".

```
ANOMALIA: "Este comportamento desvia da baseline (Camada 1, 2 ou 3)"
          → Detectado em tempo real, dispara atencao

ASSINATURA: "Esta sequencia de eventos e similar a padroes
            que precederam crimes confirmados"
          → Comparacao contra catalogo de assinaturas conhecidas
```

O reconhecimento de assinaturas opera sobre **eventos desidentificados**
(reduzidos ao comportamento puro: "vehicle_pass", "speed_reduction",
"observation") e os compara com um catalogo de padroes conhecidos —
aprendidos de incidentes confirmados, dados policiais publicos e
analise retrospectiva.

A **forca do sinal** depende de quantas camadas batem simultaneamente:

```
So Camada 1 (universal):
  "Veiculos em geral nao fazem isso" → ⚠️ Atencao

Camada 1 + Assinatura cross-ator:
  "Veiculos nao fazem isso E isso se parece com padrao pre-crime"
  → 🚨 Alerta elevado (86% similaridade)

Camada 1 + Assinatura + Camada 3 (mesmo ator):
  "Veiculos nao fazem isso E e o mesmo carro do roubo E o padrao e identico"
  → 🚨🚨 Alerta maximo — acao imediata
```

### 3. Aprendizado retrospectivo

O sistema nao aprende so em tempo real. Apos um incidente confirmado
(como o roubo da Olinda), ele realiza **analise retrospectiva**:

```
1. Revisa horas de gravacao anteriores ao crime
2. Extrai a sequencia de eventos que precedeu o incidente
3. Compara com outras ocorrencias (dados publicos, noticias, BOs)
4. Identifica o padrao comportamental comum
5. Cria uma assinatura: "Reconhecimento Pre-Invasao"
6. Aplica essa assinatura daqui para frente
```

Isso significa que o sistema **fica mais inteligente a cada incidente**,
mesmo que o incidente tenha sido uma falha de deteccao. O crime que
aconteceu ontem ensina o sistema a prevenir o crime de amanha.

### 4. Observar antes de agir (com escalation proporcional)

A maioria dos eventos nao requer acao imediata. Requer **observacao**
e **acumulo de evidencias**. A resposta escala conforme quantas camadas
disparam e com que intensidade:

```
1a passagem → Desvia da Camada 1? → Registra, continua observando
2a passagem → Confirma o desvio → Intensifica atencao
3a passagem → Match com assinatura? → Pergunta ou alerta
             Match de Camada 3 (reincidencia)? → Alerta imediato

Apos incidente → Analise retrospectiva → Nova assinatura
Proximo evento → Match com assinatura → Alerta mais rapido e mais forte
```

### 5. Perguntar e aprender

Cada pergunta tem 2 funcoes:
1. **Resolver a duvida imediata** ("Este carro e conhecido?")
2. **Ensinar o sistema permanentemente** (associacao veiculo ↔ pessoa)

O feedback humano e o mecanismo mais eficiente de aprendizado porque:
- Nao requer dados rotulados
- Nao requer re-treinamento
- Resolve ambiguidades que levariam semanas de observacao
- Constroi confianca entre humano e sistema

E crucial: quando o usuario responde "E a dona Olinda", o sistema nao
apenas associa o carro a pessoa. Ele tambem **move esse ator para a**
**Camada 3**, permitindo que comportamentos futuros desse ator sejam
avaliados contra sua propria baseline — em vez da baseline universal.

### 6. Explicar, nao apenas alertar

Quando o sistema detecta algo, ele deve explicar **por que** aquilo e relevante:

```
Ruim:  "⚠️ Alerta: movimento detectado"
Bom:   "Detectei um veiculo realizando multiplas passagens pela rua.
        Tres ocorrencias nas ultimas seis horas.
        O comportamento e compativel com observacao de rotina residencial."
Otimo: "Detectei comportamento semelhante ao observado no roubo da Olinda.
        Frequencia de passagens: 5. Velocidade reduzida em pontos especificos.
        Similaridade com eventos anteriores: 86%."
```

### 7. Curiosidade com limites

O sistema deve ser curioso, mas respeitar:

| Limite | Regra |
|--------|-------|
| Privacidade | Nunca investigar sem autorizacao explicita |
| Pertinencia | So perguntar quando a resposta muda decisoes |
| Frequencia | Nao interromper o usuario a cada 5 minutos |
| Relevancia | Priorizar seguranca sobre curiosidade social |
| Transparencia | Sempre explicar POR QUE esta perguntando |

---

## Metricas de Qualidade

Um sistema com inteligencia ambiental deve ser avaliado por:

| Metrica | O que mede |
|---------|-----------|
| **Precisao de normalidade** | Quao bem o sistema aprendeu as 3 camadas de baseline |
| **Precisao de assinaturas** | Match de assinatura comportamental → crime confirmado? |
| **Antecipacao de ameacas** | Crimes evitados por deteccao pre-invasao |
| **Taxa de descoberta** | Quantos insights novos o sistema gerou |
| **Relevancia de perguntas** | % de perguntas que o usuario considerou uteis |
| **Resolucao de hipoteses** | % de hipoteses confirmadas ou rejeitadas |
| **Aprendizado por incidente** | Quantas assinaturas novas por incidente confirmado |
| **Confianca do usuario** | Disposicao do usuario em autorizar investigacoes e acatar alertas |

---

## Estado da Arte e Lacunas

### O que existe hoje

| Capacidade | Estado Atual |
|-----------|-------------|
| Deteccao facial | Madura (ArcFace, FaceNet) |
| Tracking de objetos | Madura (DeepSORT, ByteTrack) |
| LLMs para raciocinio | Emergente (GPT-4o, Claude) |
| Baseline universal (Camada 1) | **Lacuna** — sistemas nao aprendem "o normal" do local |
| Baseline por ator (Camada 3) | **Lacuna** — sistemas nao tem perfil comportamental por entidade |
| Assinaturas comportamentais | **Lacuna** — matching de padroes temporais cross-ator |
| Aprendizado retrospectivo | **Lacuna** — sistemas nao revisam o passado apos incidentes |
| Geracao de hipoteses | **Lacuna** — sistemas nao tentam explicar observacoes |
| Dialogo proativo | **Lacuna** — sistemas so respondem, nao perguntam |
| Raciocinio social | **Lacuna** — sistemas nao modelam relacoes humanas |

### O que este projeto propoe

Preencher essas lacunas com uma arquitetura de **inteligencia ambiental**
**continua** que opera em 3 camadas de baseline + catalogo de assinaturas:

- **RoutineLearner**: Camadas 1, 2 e 3 — aprendizado estatistico por ator, categoria e universal
- **BehavioralPatternMatcher**: Matching de assinaturas comportamentais cross-ator
- **RetrospectiveAnalyzer**: Aprendizado pos-incidente que gera novas assinaturas
- **HypothesisEngine**: Raciocinio abdutivo com LLM para explicar anomalias
- **QueryManager**: Dialogo proativo para resolver incertezas e promover atores a Camada 3
- **SocialPredictionEngine**: Modelagem de propagacao em redes sociais
- **KnowledgeGraph**: Acumulo permanente de relacoes entre atores
