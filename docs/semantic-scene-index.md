# Unified Scene Semantic Index — Design Proposal

## Problema atual

O pipeline atual é puramente reativo: pixel-diff → evento de movimento. Não há **entendimento** do que está na cena — só "algo mudou". O PersonRegistry tem `faceEmbeddingCount` mas nunca gera embeddings de fato. O ChromaDB existe mas está vazio.

---

## Nova camada: `SceneObservation`

Cada observação relevante vira um objeto rico:

```typescript
interface SceneObservation {
  id: string;
  timestamp: Date;
  cameraId: string;
  snapshotPath: string;

  description: SceneDescription;
  textEmbedding?: number[];   // embed(narration) → vai pro ChromaDB
}

interface SceneDescription {
  narration: string;          // "Homem de camisa azul com mochila escura..."

  persons: {
    localId: string;
    personId?: string;         // match contra PersonRegistry
    appearance: {
      estimatedAge?: string;   // "30-40 anos"
      clothing: string;        // "calça jeans, camiseta branca"
      accessories: string[];   // ["mochila preta", "boné"]
      height?: string;
    };
    movement?: string;         // "caminhando", "parado", "olhando"
    appearsKnown: boolean;
  }[];

  vehicles: {
    type: string; color: string; plate?: string; parkedMinutes?: number;
  }[];

  objects: { type: string; relevance: "normal" | "suspicious" | "threat" }[];
  actions: string[];           // ["abrindo portão", "olhando para a janela"]
  intentions: string[];        // ["possível entrega", "observando residência"]
  anomalyFlags: string[];      // ["pessoa circulando repetidamente"]
}
```

---

## Fluxo de processamento

```
Frame JPEG
  │
  ├─► VisionPipeline (atual: pixel-diff) → MOTION_DETECTED event
  │                                        ↓
  │                           se motion > threshold E sample frame
  │
  └─► SceneAnalyzer (novo)
        │
        ├─ LLM Vision (GPT-4o-mini / LLaVA / Moondream)
        │   prompt: "Descreva esta cena em JSON estruturado"
        │   retorna: SceneDescription
        │
        ├─ Text embed de narration → ChromaDB: "scene_observations"
        ├─ Face embed (face-api.js ou desc-based) → ChromaDB: "person_faces"
        └─ SceneObservation salvo no SQLite (metadados completos)
```

---

## Unified Semantic Search

```typescript
interface SemanticQuery {
  text?: string;           // "homem com mochila preta"
  imageBuffer?: Buffer;    // frame de referência (CLIP future)
  personId?: string;       // busca por pessoa conhecida
  dateRange?: [Date, Date];
  cameraId?: string;
  topK?: number;
}

interface SemanticResult {
  observation: SceneObservation;
  score: number;
  matchedBy: ("text" | "face" | "metadata")[];
  highlights: string[];    // trechos relevantes da narration
}
```

A busca por texto embeda a query → cosine similarity contra `scene_observations`.
A busca por pessoa usa `personId` + face embeddings do `person_faces`.
As duas se fundem com score ponderado.

---

## Decisão de design: sem CLIP no MVP

Em vez de embeddings visuais (CLIP precisaria de infra Python), usamos
**LLM Vision → texto → text embedding**. Isso dá:

| O que o usuário quer buscar       | Como resolve                              |
|-----------------------------------|-------------------------------------------|
| "pessoa de camisa vermelha"       | text search → narration                   |
| "aquele cara de ontem de tarde"   | date filter + person re-id por aparência  |
| "quem estava na câmera 1 às 10h?" | camera filter + time filter + top results |
| "veículo suspeito parado"         | text search → anomalyFlags + vehicles     |
| reconhecimento facial             | face embedding (face-api.js) → person_faces |

CLIP pode entrar depois como coluna adicional no índice sem mudar a interface de busca.

---

## Novos arquivos

```
src/
  processing/
    scene-analyzer.ts      ← LLM vision → SceneDescription
  memory/
    scene-index.ts         ← SceneObservation store + ChromaDB
    semantic-search.ts     ← SemanticQuery → SemanticResult
  core/
    types.ts               ← + SceneObservation, SceneDescription, etc.
```

O `VisionPipeline` existente não muda — `SceneAnalyzer` roda em paralelo,
ativado pelo agente quando há motion acima do threshold.

---

## Prompt de visão (SceneAnalyzer)

```
Você é um analista de segurança. Analise esta imagem de câmera de segurança
e retorne APENAS um JSON com a seguinte estrutura:

{
  "narration": "descrição completa em texto corrido da cena",
  "persons": [
    {
      "localId": "person_1",
      "appearance": {
        "estimatedAge": "30-40 anos",
        "clothing": "camiseta branca, calça jeans",
        "accessories": ["mochila preta"],
        "height": "médio"
      },
      "movement": "caminhando lentamente",
      "appearsKnown": false
    }
  ],
  "vehicles": [],
  "objects": [],
  "actions": ["caminhando em direção ao portão"],
  "intentions": ["possível visitante"],
  "anomalyFlags": []
}

Se não houver pessoas ou objetos relevantes, retorne arrays vazios.
Seja objetivo e preciso. Use português.
```

---

## Integração no chat

Quando o usuário perguntar "quem estava aqui ontem?", o agente vai:
1. Extrair filtros (data, câmera) da pergunta
2. Chamar `SemanticSearch.search({ text: "pessoa", dateRange: [...] })`
3. Retornar as observações rankeadas com snapshots + descrições

Exemplos de queries suportadas:
- "mostra quem passou pela câmera externa hoje de manhã"
- "aquele homem de boné que apareceu semana passada"
- "quando foi a última vez que vi um veículo parado?"
- "tem alguém suspeito hoje?"

---

## Fases de implementação

### Fase 1 — SceneAnalyzer + types (base)
- Novos tipos em `core/types.ts`
- `SceneAnalyzer` com LLM vision (GPT-4o-mini ou Ollama/LLaVA)
- Integração no agente: dispara após motion acima do threshold

### Fase 2 — SceneIndex + SemanticSearch
- `SceneIndex` persiste observações no SQLite + embeds no ChromaDB
- `SemanticSearch` implementa a query unificada
- Endpoint REST `/api/search` no servidor

### Fase 3 — Face recognition
- face-api.js para detecção e embedding de rostos
- Re-identificação de pessoas ao longo do tempo
- Link entre SceneObservation e PersonRegistry

### Fase 4 — CLIP (opcional)
- Microserviço Python com `sentence-transformers` + CLIP
- Busca por imagem de referência
- Adiciona coluna `imageEmbedding` no índice sem mudar interface

---

## Extensão: Percepção Espacial (Depth + OCR)

### Motivação

Saber *o que* há na cena não é suficiente — precisamos saber *onde* e *a que distância*.
Com posicionamento espacial conseguimos inferir:
- "pessoa a 2m do portão" vs "pessoa a 15m na calçada"
- "veículo parado em frente à garagem" vs "veículo passando na rua"
- "pessoa se aproximando" vs "pessoa se afastando"

Isso muda completamente a qualidade das intentions e anomalyFlags.

### Depth Estimation (estimativa de profundidade monocular)

```
Frame JPEG
  └─► Depth Model (Depth Anything v2 / MiDaS)
        └─► Depth Map (mesma resolução, cada pixel = distância relativa)
              └─► Combinado com bounding boxes de pessoas/veículos
                    └─► posição3D: { x, y, distanceMeters }
```

**Modelos candidatos:**
| Modelo | Inferência | Precisão | Hardware |
|--------|-----------|----------|----------|
| Depth Anything v2 Small | ~50ms/frame | Alta | CPU ok |
| MiDaS v3.1 Small | ~30ms/frame | Boa | CPU ok |
| ZoeDepth | ~80ms/frame | Muito alta | GPU ideal |

**Output no SceneDescription:**
```typescript
interface SpatialPosition {
  relativeX: number;        // 0-1 (posição horizontal na cena)
  relativeY: number;        // 0-1 (posição vertical)
  estimatedDistanceM: number; // metros estimados
  zone: "immediate" | "near" | "mid" | "far";
  // immediate: <2m, near: 2-5m, mid: 5-15m, far: >15m
  locationDescription: string; // "perto do portão, lado direito"
}

// PersonObservation ganha:
interface PersonObservation {
  // ... existing fields
  spatialPosition?: SpatialPosition;
  movementDirection?: "approaching" | "departing" | "lateral" | "stationary";
  approachSpeed?: "slow" | "normal" | "fast";
}
```

**Narração com profundidade:**
> "Homem de camisa azul a ~3m do portão (zona imediata), se aproximando lentamente"

vs. hoje:
> "Homem de camisa azul"

### OCR (Leitura de texto na cena)

Casos de uso críticos:

| O que ler | Para quê | Modelo |
|-----------|----------|--------|
| Placas de veículos | Identificar veículos recorrentes | PaddleOCR / OpenALPR |
| Números de casa | Confirmar localização | Tesseract |
| Uniformes / crachás | Identificar prestadores de serviço | PaddleOCR |
| Letreiros de veículos | "Correios", "iFood", "SEDEX" | PaddleOCR |

```typescript
interface OcrResult {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  category: "license_plate" | "sign" | "uniform" | "other";
}

// VehicleObservation ganha:
interface VehicleObservation {
  // ... existing fields
  plate?: string;           // via OCR
  plateConfidence?: number;
  brandingText?: string;    // "Correios", "Rappi", "iFood"
  isDelivery?: boolean;     // inferido de brandingText
}
```

### Pipeline completo expandido

```
Frame JPEG (a cada motion event significativo)
  │
  ├─► [paralelo]
  │     ├─ LLM Vision     → SceneDescription base
  │     ├─ Depth Model    → DepthMap
  │     └─ OCR Pipeline   → OcrResult[]
  │
  └─► SceneFuser
        ├─ Projeta bounding boxes no depth map → distâncias
        ├─ Enriquece PersonObservation com spatialPosition
        ├─ Enriquece VehicleObservation com plate + brandingText
        └─ Gera narration final completa
              └─► Text embed → ChromaDB
```

### Narração final com tudo integrado

> "Veículo sedan prata (placa ABC-1234) parado a ~8m na frente da garagem há 12 minutos.
> Homem de aproximadamente 35-40 anos, camisa azul e boné, a ~2m do portão se aproximando.
> Outro indivíduo permanece dentro do veículo. Padrão atípico para este horário."

Esse nível de descrição é diretamente indexável e buscável semanticamente.

### Implementação (stack Python microservice)

Como depth e OCR exigem modelos pesados, a estratégia mais limpa é um
microserviço Python isolado:

```
src/services/
  perception-service/
    main.py          ← FastAPI (POST /analyze)
    depth.py         ← Depth Anything v2
    ocr.py           ← PaddleOCR
    requirements.txt
```

O `SceneAnalyzer` chama `POST http://localhost:8001/analyze` com o frame em base64
e recebe `{ depthMap, ocrResults }` de volta. Fallback: campos `null` se offline.

---

## Extensão: Controle de Câmeras via ONVIF

### Motivação

Com as câmeras controláveis (PTZ), o sistema pode:
- **Agente**: seguir automaticamente uma pessoa detectada
- **Usuário**: controlar a câmera pelo dashboard com joystick virtual

Já temos scripts ONVIF de discovery (`scripts/onvif-proper-discovery.ts`).
A câmera Intelbras iM7 externa provavelmente suporta PTZ.

### Capabilities ONVIF relevantes

| Capability | O que faz | Uso no Vigia |
|-----------|-----------|--------------|
| **PTZ Continuous Move** | Mover em direção (pan/tilt/zoom) | Joystick do usuário |
| **PTZ Absolute Move** | Ir para posição exata | Auto-track de pessoa |
| **PTZ Presets** | Posições salvas | "Portão", "Garagem", "Rua" |
| **PTZ Home** | Retornar à posição padrão | Reset após tracking |
| **Goto Preset** | Pular para preset | Agente muda de ângulo |
| **Image Settings** | Brilho, contraste, IR | Ajuste automático (noite) |
| **PTZ Stop** | Parar movimento | Ao soltar joystick |

### Novo módulo: `CameraController`

```typescript
// src/perception/camera-controller.ts

interface PtzVector {
  pan: number;    // -1.0 a 1.0
  tilt: number;   // -1.0 a 1.0
  zoom: number;   // 0.0 a 1.0
}

interface CameraPreset {
  token: string;
  name: string;
}

class CameraController {
  async continuousMove(cameraId: string, vector: PtzVector): Promise<void>;
  async absoluteMove(cameraId: string, position: PtzVector): Promise<void>;
  async stop(cameraId: string): Promise<void>;
  async gotoPreset(cameraId: string, presetToken: string): Promise<void>;
  async gotoHome(cameraId: string): Promise<void>;
  async listPresets(cameraId: string): Promise<CameraPreset[]>;
  async savePreset(cameraId: string, name: string): Promise<string>; // retorna token
  
  // Auto-track: move câmera para centralizar bounding box
  async trackTarget(cameraId: string, boundingBox: BoundingBox, frameSize: { w: number; h: number }): Promise<void>;
}
```

### Auto-tracking pelo agente

Quando o agente detecta pessoa suspeita + câmera PTZ disponível:

```
PersonObservation { boundingBox, spatialPosition }
  └─► CameraController.trackTarget()
        ├─ Calcula offset do centro da imagem
        ├─ Converte offset → PtzVector
        └─► PTZ Continuous Move (até centralizar)
              └─► SceneAnalyzer roda novamente na nova posição
```

Loop de tracking com PID simples:
```
offset_x = (bbox.centerX / frame.width) - 0.5  // -0.5 a +0.5
pan_speed = offset_x * gain                      // proporcional
```

### Controle pelo usuário no dashboard

Novos elementos no `CameraGrid`:

```
┌─────────────────────────────────┐
│  [CÂMERA EXTERNA] ● live        │
│                                 │
│  [imagem ao vivo]               │
│                                 │
│         ↑                       │
│      ←  ⊙  →     [+] [-]       │
│         ↓                       │
│                                 │
│  [Portão] [Garagem] [Rua] [🏠] │
└─────────────────────────────────┘
```

- **Joystick**: clique e arraste → PTZ Continuous Move
- **Soltar**: PTZ Stop
- **Presets**: botões para posições salvas
- **Home (🏠)**: retorna à posição padrão
- **Click-to-center**: clicar na imagem → câmera se move para centralizar aquele ponto

### Novos endpoints REST

```
POST /api/cameras/:id/ptz/move      { pan, tilt, zoom }
POST /api/cameras/:id/ptz/stop
POST /api/cameras/:id/ptz/preset    { presetToken }
POST /api/cameras/:id/ptz/home
GET  /api/cameras/:id/ptz/presets
POST /api/cameras/:id/ptz/save-preset { name }
```

### Segurança

- Controle PTZ autenticado (apenas usuário logado)
- Rate limiting: máximo N comandos/segundo por câmera
- O agente pode assumir controle e bloquear input do usuário durante auto-track
  → notifica no chat: "Câmera externa em modo tracking — [Retomar controle]"

### Novos arquivos (ONVIF control)

```
src/
  perception/
    camera-controller.ts   ← CameraController (PTZ via onvif npm)
  api/
    server.ts              ← + endpoints /ptz/*
dashboard/src/
  CameraGrid.tsx           ← + joystick PTZ + preset buttons
  hooks/
    usePtz.ts              ← hook para controle PTZ no frontend
```

---

## Arquitetura completa revisada

```
Frame JPEG
  │
  ├─► VisionPipeline (pixel-diff) ──────────────────► MOTION_DETECTED event
  │                                                            │
  │                                               se significativo:
  │                                                            │
  └─► SceneAnalyzer ◄─────────────────────────────────────────┘
        │
        ├─► [paralelo]
        │     ├─ LLM Vision (GPT-4o-mini/LLaVA) → SceneDescription
        │     ├─ Depth Service (Python)          → DepthMap
        │     └─ OCR Service (Python)            → plates, text
        │
        ├─► SceneFuser → SceneObservation completo
        │     ├─ persons[] com spatialPosition + distância
        │     ├─ vehicles[] com plate + brandingText
        │     └─ narration: "Sedan prata (ABC-1234) a 8m..."
        │
        ├─► SceneIndex.store(observation)
        │     ├─ SQLite (metadados + narration full-text)
        │     └─ ChromaDB (text embedding)
        │
        └─► Agent reasoning
              ├─ Avalia anomalyFlags + intentions
              ├─ Decide se alerta usuário
              └─ Se PTZ disponível + suspeito → CameraController.track()
```

### Stack de serviços

| Serviço | Tecnologia | Porta |
|---------|-----------|-------|
| Backend (agent) | Node.js / tsx | 5174 |
| Dashboard | Vite / React | 5173 |
| ChromaDB | Docker | 8000 |
| Perception Service | Python / FastAPI | 8001 |

O Perception Service é o único novo processo — depth + OCR rodam lá.
Tudo mais permanece em Node.js.
