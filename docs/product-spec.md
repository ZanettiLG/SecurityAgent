# Vigia — Especificação do Produto (Dashboard)

## Visão

O Vigia não é uma API. É uma **central de segurança inteligente** com
personalidade. O usuário não "consulta logs" — ele **conversa** com o
Vigia enquanto assiste às câmeras.

A interface tem 3 zonas que coexistem na mesma tela:

```
┌──────────────────────────────────────────────────────────┐
│  🔴 AO VIVO — 00:41           Vigia        [⚙️] [🕭]   │
├────────────────────────────┬─────────────────────────────┤
│                            │                             │
│    ┌──────────────────┐    │  ┌───────────────────────┐  │
│    │                  │    │  │ 💬 Vigia              │  │
│    │   CÂMERA EXTERNA │    │  │                       │  │
│    │   Intelbras iM7  │    │  │ Detectei um veículo   │  │
│    │                  │    │  │ parado há 23 min em   │  │
│    │   [🟡 indicador] │    │  │ frente à residência.  │  │
│    │                  │    │  │ Você conhece?         │  │
│    └──────────────────┘    │  │                       │  │
│                            │  │ [Sim] [Não] [Ver foto]│  │
│    ┌──────────────────┐    │  └───────────────────────┘  │
│    │ CÂMERA INTERNA   │    │                             │
│    │ Yoosee (Sala)    │    │  📋 TIMELINE               │
│    │                  │    │  00:41 Movimento detectado │
│    │  ⚫ offline      │    │  00:23 Alarme ativado      │
│    └──────────────────┘    │  23:51 Carro suspeito      │
│                            │                             │
├────────────────────────────┴─────────────────────────────┤
│  🟢 Sistema ativo | 1/2 câmeras | 0 ameaças | 4 eventos │
└──────────────────────────────────────────────────────────┘
```

---

## Zona 1: Grid de Câmeras (70% da tela)

### Comportamento
- Exibe feed ao vivo das câmeras (atualização a cada ~1s)
- Câmeras offline aparecem com estado visual claro (cinza, ícone)
- O **agente pode desenhar** sobre as câmeras:
  - 🟡 Bounding box amarela: "pessoa desconhecida"
  - 🟢 Bounding box verde: "pessoa conhecida (Olinda)"
  - 🔴 Bounding box vermelha: "ameaça"
  - 🟠 Indicador pulsante: "atenção — veículo parado"
  - Linha tracejada: "trajetória suspeita" (múltiplas passagens)
  - Texto flutuante: anotações do agente ("23 min parado")

### Estados visuais por câmera
| Estado | Aparência |
|--------|-----------|
| Normal | Feed limpo, sem indicadores |
| Atenção | Moldura amarela pulsante + indicador do agente |
| Alerta | Moldura vermelha + bounding box + descrição |
| Offline | Cinza com ícone ⚫ e botão "Reconectar" |

### Interação
- Clique na câmera: expande para tela cheia
- Duplo clique: mostra último snapshot analisado pelo agente
- Hover: mostra info (resolução, fps, uptime)

---

## Zona 2: Chat com o Vigia (30% da tela, painel direito)

### Comportamento
- Chat em tempo real com o agente
- O agente **inicia** conversas (não espera o usuário perguntar)
- Mensagens têm **tipo e prioridade visual**:

| Tipo | Estilo | Exemplo |
|------|--------|---------|
| `info` | Cinza, pequeno | "Câmera externa reconectada" |
| `observation` | Azul | "Veículo sedan branco estacionado há 23 min" |
| `question` | Azul + botões de ação | "Você conhece este carro? [Sim] [Não]" |
| `alert` | Amarelo/laranja | "Padrão suspeito: 3 passagens em 6h" |
| `threat` | Vermelho, pulsante | "🚨 Mesmo veículo do roubo da Olinda" |
| `insight` | Roxo, com ícone 💡 | "Probabilidade de relacionamento próximo: 90%" |
| `social` | Rosa | "Dona Marlene: 97.4% de descobrir até sexta" |

### Ações inline
O usuário responde direto no chat, sem abrir modais:
- Botões: `[Sim]` `[Não]` `[Ver foto]` `[Chamar polícia]`
- Input livre: "É a dona Olinda" → o agente processa e aprende

### Tom
O chat **não é genérico**. Tem a personalidade do Vigia:
- "Manuel, detectei..." (usa o nome do usuário)
- "Não perigoso. Não criminoso. Extremamente interessante."
- Emojis estratégicos: 🚨 🔍 💡 📷 🟢 🟡 🔴

---

## Zona 3: Timeline de Eventos (painel direito inferior)

- Feed cronológico reverso (mais recente no topo)
- Cada evento é um card compacto:
  ```
  🟡 00:41 | Câmera Externa
  Veículo parado há 23 min
  ─────────────────────────
  🔴 23:15 | Câmera Externa
  Pessoa desconhecida no quintal
  ─────────────────────────
  🟢 18:30 | Câmera Externa
  Olinda chegou em casa
  ```
- Cores por severidade: 🟢 info, 🟡 atenção, 🟠 alerta, 🔴 ameaça
- Clique expande detalhes: foto do momento, avaliação do LLM, ações tomadas

---

## Zona 4: Barra de Status (rodapé)

```
🟢 Sistema ativo | 📷 1/2 câmeras | ⚠️ 0 ameaças | 📊 4 eventos hoje | 🧠 LLM: MiniCPM-V
```

---

## Funcionalidades Específicas do Vigia

### 1. O agente "desenha" nas câmeras

Quando o Vigia detecta algo, ele **anota visualmente** o feed:

```
Câmera Externa — 00:41
┌────────────────────────────┐
│                            │
│    🚗 ← "23 min parado"    │
│  ┌──────┐                  │
│  │sedan │                  │
│  │ branco│                 │
│  └──────┘                  │
│                            │
│                    🟡 pulsante
└────────────────────────────┘
```

Isso é implementado como **overlay HTML/CSS sobre o elemento `<img>`**, 
com coordenadas fornecidas pelo backend (no futuro: YOLO detections).

### 2. Raciocínio visível

Quando o agente está "pensando", o chat mostra:

```
🧠 Analisando...
   ├─ Comparando com baseline da câmera
   ├─ Verificando assinaturas comportamentais
   └─ Consultando MiniCPM-V
```

Isso dá transparência ao raciocínio e constrói confiança.

### 3. Evidências lado a lado

Quando o agente detecta um padrão, ele mostra comparação visual:

```
┌─────────────────────┐  ┌─────────────────────┐
│   HOJE — 00:41      │  │   ROUBO OLINDA      │
│   Carro cinza,      │  │   12.jun — 18:30    │
│   3 passagens       │  │   Carro cinza,      │
│                     │  │   3 passagens       │
│   Similaridade: 86% │  │                     │
└─────────────────────┘  └─────────────────────┘
```

---

## Modos de Visualização

### Modo Ao Vivo (default)
- Câmeras em tempo real
- Chat ativo
- Alertas aparecem como toast + mensagem no chat

### Modo Replay
- Slider de timeline (últimas 24h, 7d, 30d)
- Câmera mostra frame do momento selecionado
- Chat mostra conversas daquele período
- Eventos filtrados por data

### Modo Investigação
- Tela cheia com uma câmera
- Painel lateral com todas as detecções do agente
- Ferramentas: zoom, comparação lado a lado, exportar evidência

---

## Detalhes Técnicos (resumo)

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React (Vite) |
| Câmeras ao vivo | `<img>` com refresh a cada 1s (JPEG via endpoint HTTP) |
| Chat em tempo real | WebSocket → EventBus do agente |
| Overlays visuais | CSS absolute positioning sobre `<img>` |
| Timeline | Renderização client-side a partir de eventos |
| Estado | React Context + WebSocket events |
| Estilo | Tema escuro, inspirado em centrais de segurança |

---

## O que NÃO é o produto

- ❌ Não é um app mobile (por enquanto)
- ❌ Não é um dashboard genérico de câmeras (tipo Blue Iris)
- ❌ Não é um chatbot passivo
- ✅ É uma **central de segurança com um agente que conversa, desenha e alerta**

---

## Priorização do MVP

### Fase 1 — Essencial (agora)
- [ ] Servidor HTTP que serve o dashboard + snapshot JPEG das câmeras
- [ ] WebSocket que espelha o EventBus para o frontend
- [ ] Grid de câmeras ao vivo (refresh a cada 1s)
- [ ] Chat básico (texto, sem rich formatting ainda)
- [ ] Timeline de eventos

### Fase 2 — Interatividade
- [ ] Botões de ação inline no chat ([Sim] [Não] [Ver foto])
- [ ] Input livre no chat → QueryManager.processAnswer()
- [ ] Overlays visuais nas câmeras (bounding boxes)
- [ ] Alertas visuais (toast + pulsação na câmera)

### Fase 3 — Polimento
- [ ] Modo replay com slider de timeline
- [ ] Comparação lado a lado de evidências
- [ ] Raciocínio visível (step-by-step do agente)
- [ ] Temas (escuro/claro)
- [ ] Notificações desktop (Web Notification API)
