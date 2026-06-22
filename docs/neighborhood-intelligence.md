# Inteligencia Ambiental Continua — O Conceito

> "Não perigoso. Não criminoso. Extremamente interessante."

## O Paradigma

Sistemas de seguranca tradicionais sao **reativos e binarios**: detectam ameacas
e disparam alarmes. O Vigia representa um paradigma diferente: **inteligencia
ambiental continua**.

A diferença nao esta nas tecnologias individuais (deteccao facial, tracking de
veiculos, LLM), mas na **postura cognitiva** do sistema:

| Seguranca Tradicional | Inteligencia Ambiental |
|---|---|
| "Ha uma ameaca?" | "O que esta acontecendo?" |
| Classifica: perigoso / seguro | Classifica: tipico / atipico / curioso / novo |
| Alerta o usuario | **Dialoga** com o usuario |
| Esquece o evento | **Acumula** conhecimento |
| Regras fixas | **Hipoteses** que evoluem |
| Foco no objeto | Foco nas **relacoes** |

---

## Os 5 Pilares do Conceito

### 1. Percepcao de Normalidade Estatistica

Nao se trata de regras do tipo "carro parado > 10min = alerta".
Trata-se de **aprender distribuicoes** para cada dimensao do contexto:

```
Para cada evento, o sistema avalia:
  - Este HORARIO é tipico para esta camera?
  - Este DIA DA SEMANA é tipico para esta pessoa?
  - Esta DURACAO é tipica para este tipo de evento?
  - Esta COMBINACAO de fatores ja foi observada antes?

A anomalia nao é um fato isolado — é a BAIXA PROBABILIDADE CONJUNTA
de todos os fatores simultaneamente.
```

O sistema constroi um **modelo probabilistico do "normal"** e mede o desvio
de cada nova observacao em relacao a esse modelo. Nao existe uma "regra de
ameaca" — existe uma **curva de curiosidade**:

```
Normal ──── Atipico ──── Curioso ──── Suspeito ──── Ameaca
(ignora)   (registra)   (pergunta)   (alerta)     (age)
```

### 2. Cross-Referencing Multi-Modal

A inteligencia emerge do **cruzamento de fatos** de diferentes fontes.
Nenhum fato isolado é relevante; o que importa é a **configuracao**:

```
FATO A: Carro associado a Olinda         (aprendido por feedback)
FATO B: Motorista nao é Olinda           (reconhecimento facial)
FATO C: Olinda no banco do passageiro    (deteccao no mesmo frame)
FATO D: 11 visitas em 38 dias            (memoria de longo prazo)
FATO E: Sempre noturno                   (padrao temporal)
FATO F: Motorista tem ~34 anos           (investigacao publica)
FATO G: Diferenca de idade: 31 anos      (cross-ref pessoas)

CRUZAMENTO: Nao é o CARRO que é anomalo.
            Nao é a PESSOA que é anomalo.
            É a CONFIGURACAO DOS FATOS que é estatisticamente curiosa.
```

Este é o salto qualitativo: de **deteccao** para **compreensao**.

### 3. Curiosidade Estruturada (Raciocinio Abdutivo)

O sistema nao para na deteccao da anomalia. Ele tenta **explica-la**,
gerando hipoteses e testando-as ativamente:

```
OBSERVACAO: Motorista != Olinda, mas Olinda presente

HIPOTESES GERADAS (por LLM + contexto estatistico):
  H1: Filho da Olinda      (prob 60% — explicacao mais simples)
  H2: Motorista de app     (prob 25% — compativel com horario)
  H3: Relacao amorosa      (prob 15% — explicacao menos provavel a priori)

TESTE ATIVO: Perguntar ao usuario
  Q: "Dona Olinda possui algum filho?"
  R: "Nao, nunca teve filhos"

REAVALIACAO:
  H1 → 5%  (rejeitada por evidencia)
  H3 → 70% (probabilidade sobe ao eliminar concorrente)

NOVA EVIDENCIA: 11 visitas em 38 dias, sempre noturno
  H3 → 90% ("Probabilidade elevada de relacionamento pessoal proximo")
```

Isso é **raciocinio abdutivo** (inferencia para a melhor explicacao), onde o
sistema:
1. Gera hipoteses compativeis com os fatos
2. Atribui probabilidades Bayesianas
3. Busca ativamente evidencias para discrimina-las
4. Pergunta ao humano quando necessario

### 4. Dialogo como Mecanismo de Aprendizado

O sistema nao é um monologo de alertas. É uma **conversa** onde o usuario
atua como **oraculo** que resolve incertezas:

```
Perguntas para RESOLUCAO DE INCERTEZA:
  "Voce conhece este carro?"           → associa veiculo a pessoa
  "Esta pessoa é conhecida?"           → nomeia unknown frequent
  "Dona Olinda possui algum filho?"    → elimina hipotese

Perguntas para ESCALADA:
  "Deseja autorizar investigacao?"     → expande busca
  "Deseja visualizar as evidencias?"   → compartilha descobertas

Perguntas para ACAO:
  "Pessoa desconhecida as 3h. Alarmar?" → decisao critica
```

Cada resposta do usuario é **aprendizado one-shot** que atualiza
permanentemente o modelo mental do sistema. Nao é necessario re-treinar
modelos — o feedback em linguagem natural basta.

### 5. Modelagem de Rede Social

O sistema entende que opera em um **grafo social** (vizinhanca, familia,
prestadores de servico) e que:

- **Pessoas tem relacoes** (visita junto com, é parente de, trabalha para)
- **Informacoes se propagam** (fofoca, descoberta social)
- **Comportamentos tem causas sociais** (visita frequente → relacao proxima)

Isso permite raciocinios como:
- "Frequencia de visitas > qualquer categoria normal → provavel relacao proxima"
- "Distancia social = 1, fator fofoca = 1.5 → 97.4% de propagacao em 3 dias"
- "Motorista diferente + pessoa conhecida no banco → provavel relacao pessoal"

---

## Implicacoes Arquiteturais

Para implementar este conceito, o sistema precisa de 3 capacidades que vao
alem de um sistema de seguranca tradicional:

### A. Memoria que Acumula (nao apenas armazena)

```
Nao basta guardar eventos. O sistema precisa:
  - Agregar eventos em perfis estatisticos (RoutineProfile)
  - Comparar novos eventos com baselines aprendidas
  - Detectar nao so anomalias pontuais, mas desvios de padrao
  - Recalcular probabilidades quando novas evidencias surgem
```

### B. Um Motor de Hipoteses (nao apenas um motor de regras)

```
Nao basta aplicar regras deterministicas. O sistema precisa:
  - Gerar multiplas explicacoes para uma observacao
  - Manter um espaco de hipoteses com probabilidades
  - Saber quando tem informacao suficiente para concluir
  - Saber quando PRECISA perguntar ao humano
```

### C. Um Gerenciador de Dialogo (nao apenas um sistema de alertas)

```
Nao basta enviar notificacoes. O sistema precisa:
  - Decidir O QUE perguntar e QUANDO perguntar
  - Priorizar perguntas (curiosidade vs seguranca)
  - Interpretar respostas em linguagem natural
  - Aprender permanentemente com cada resposta
  - Manter contexto de conversa entre sessoes
```

---

## Metrica de Sucesso

O Vigia nao é medido por "quantas ameacas detectou", mas por:

1. **Completude do modelo mental**: Quanto da rotina da vizinhanca o sistema compreende?
2. **Precisao das hipoteses**: As explicacoes geradas sao confirmadas pelo usuario?
3. **Relevancia das perguntas**: O usuario considera as perguntas uteis ou intrusivas?
4. **Antecipacao**: O sistema preve eventos antes que o usuario os perceba?
5. **Autonomia com respeito**: O sistema age sozinho quando pode, pergunta quando deve?
    → Quando sai: registra duração, atualiza baseline
```

### Exemplo da História
> "O Vigia percebeu um sedan branco estacionado em frente à casa.
> A maioria dos veículos ficavam menos de cinco [minutos].
> O carro permaneceu parado por mais de vinte minutos."

---

## 2. Aprendizado de Rotinas

### Capacidades
- Construir distribuições de atividade por hora/dia/semana
- Identificar eventos típicos ("carteiro às 10h")
- Detectar desvios de rotina
- Descrever rotinas em linguagem natural

### Modelo Estatístico
Cada entidade (câmera, pessoa, localização) tem um `RoutineProfile`:
- `hourly_activity[24]`: probabilidade de evento em cada hora
- `daily_activity[7]`: probabilidade em cada dia da semana
- `typical_events`: eventos frequentes por faixa horária
- Atualização: média móvel exponencial (α=0.05)

### Exemplos da História
| Observação | Rotina Aprendida |
|-----------|-----------------|
| "carteiro chegava às 10h" | `typical_events["10:00"]` = carteiro |
| "caminhão de gás toda terça" | `daily_activity[Tuesday]` ↑ |
| "Olinda visitava sábados de manhã" | `person:Olinda.hourly_activity[9-11]` ↑, `daily_activity[Saturday]` ↑ |

---

## 3. Mineração de Padrões de Longo Prazo

### Capacidades
- Comparar frequência de visitas com categorias de referência
- Detectar anomalias de frequência

### Algoritmo
```
1. Calcula frequência da pessoa (visitas/semana)
2. Compara com médias de categorias:
   - parentes: ~1.5/semana
   - entregadores: ~5/semana
   - vizinhos: ~3/semana
   - visitantes: ~0.5/semana
3. Se frequência >> referência → "Probabilidade elevada de relacionamento próximo"
```

### Exemplo da História
> "O indivíduo foi visto 11 vezes nos últimos 38 dias.
> Frequência superior à observada para parentes, entregadores e prestadores de serviço."

---

## 4. Geração de Hipóteses

### Capacidades
- Formular hipóteses a partir de observações
- Atribuir probabilidades Bayesianas
- Testar hipóteses com dados adicionais
- Perguntar ao usuário para validação

### Estados de uma Hipótese
```
DRAFT → TESTING → CONFIRMED (dados corroboram)
                 → REJECTED  (dados contradizem)
                 → USER_CONFIRMED (usuário confirma)
                 → USER_REJECTED  (usuário rejeita)
                 → INCONCLUSIVE   (dados insuficientes)
```

### Exemplo da História
> Sistema: "Dona Olinda possui algum filho?"
> Manuel: "Não. Nunca teve filhos. E é viúva há anos."
>
> Hipótese "é filho" → REJECTED
> Hipótese "é namorado" → TESTING (probabilidade sobe)

---

## 5. Perguntas Interativas

### Sistema de Diálogo
O Vigia mantém uma conversa contextual com o usuário:

| Prioridade | Quando usar | Exemplo |
|-----------|------------|---------|
| LOW | Curiosidade, melhoria de conhecimento | "Dona Olinda possui algum filho?" |
| MEDIUM | Informação relevante | "Você conhece este carro?" |
| HIGH | Potencial segurança | "Pessoa desconhecida às 3h. Autoriza alarme?" |
| CRITICAL | Emergência | "Invasão detectada. Chamar polícia?" |

### Templates Inspirados na História
```python
VIGIA_QUESTION_TEMPLATES = {
    "unknown_vehicle": "Detectei um veículo incomum... Você conhece este carro?",
    "unknown_driver": "A pessoa dirigindo não corresponde ao perfil habitual. Posso fazer uma pergunta?",
    "relationship_hypothesis": "{pessoa} possui algum filho?",
    "authorize_investigation": "Deseja autorizar investigação em fontes públicas?",
    "view_evidence": "Deseja visualizar as evidências públicas?",
}
```

---

## 6. Investigação em Fontes Públicas

### ⚠️ Princípios Éticos
1. **Autorização explícita**: Nunca investiga sem o usuário dizer "sim"
2. **Apenas fontes públicas**: Nada de hacking, logins, ou fontes privadas
3. **Transparência**: O usuário sempre sabe o que foi consultado
4. **Respeito à privacidade**: Dados sensíveis nunca saem do dispositivo

### Exemplo da História
> "Manuel autorizou uma investigação adicional utilizando fontes públicas.
> O sistema encontrou perfis em redes sociais compatíveis.
> Idade estimada: 34 anos. Diferença: 31 anos."

---

## 7. Predição Social

### Modelo de Propagação de Informação

O sistema modela como informações se propagam na vizinhança:

```
Fatores:
├── Distância social (graus de separação)
├── Frequência de interação
├── Fator de "fofoqueirice" (0.3 = discreto, 1.5 = fofoqueiro)
└── Proximidade geográfica

Probabilidade = base_prob × interaction_freq × gossip_factor
```

### Exemplo da História
> "Recomendo manter atenção à janela da cozinha.
> Existe alta probabilidade de a dona Marlene descobrir
> essa informação antes do final da semana."
>
> Manuel: "Qual a probabilidade?"
> Sistema: "97,4%."
>
> *Três dias depois:* "Previsão social confirmada."

---

## 8. Personalidade e Tom

O Vigia não é um sistema frio. Ele adapta o tom:

| Tom | Uso | Exemplo |
|-----|-----|---------|
| **Informativo** | Padrão, eventos normais | "Manuel, detectei um veículo..." |
| **Casual** | Insights sociais | "A dona Olinda é danada..." |
| **Humorístico** | Eventos inusitados | "Incidente classificado como: Extremamente interessante" |

### Categorias de Evento não-tradicionais
```python
# Além de INFO, LOW, MEDIUM, HIGH, CRITICAL:
"Extremamente interessante"  # Fofoca da vizinhança
"Previsão social confirmada"  # Quando a predição acerta
```

---

## 9. Integração com o Resto do Sistema

### Fluxo Completo
```
Câmera → Detecção facial + veicular
    → Vision Pipeline gera evento
    → Evento passa pelo RoutineLearner
    → Se atípico → HypothesisEngine gera hipóteses
    → Se necessário → QueryManager pergunta ao usuário
    → Se autorizado → SocialMediaInvestigator consulta fontes
    → SocialPredictionEngine prevê consequências
    → GOAP + Rules decidem ações de segurança
```

### Novos Eventos
| EventType | Gatilho |
|-----------|---------|
| `VEHICLE_DETECTED` | Veículo estacionado > baseline |
| `PATTERN_DEVIATION` | Evento em horário/dia atípico |
| `SOCIAL_INSIGHT` | Descoberta social relevante |
| `HYPOTHESIS_GENERATED` | Nova hipótese formulada |
| `USER_QUERY` | Pergunta enviada ao usuário |
| `USER_ANSWER` | Resposta recebida |
| `INVESTIGATION_RESULT` | Resultado de investigação pública |
| `PREDICTION_MADE` | Predição social registrada |
| `PREDICTION_VERIFIED` | Predição confirmada/refutada |
