# Arquitetura Detalhada — SecurityAgent

## 1. Visão Macro

O SecurityAgent é um agente cognitivo autônomo que implementa o ciclo **Perceive → Process → Remember → Reason → Act** em loop contínuo, operando em tempo real sobre múltiplos streams de vídeo e áudio.

### Princípios de Design

| Princípio                 | Descrição                                                                     |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Assíncrono por padrão** | Cada câmera/mic é um stream independente processado em paralelo               |
| **Event-driven**          | Comunicação interna via barramento de eventos (pub/sub)                       |
| **Modular desacoplado**   | Camadas comunicam-se apenas pelo barramento; cada módulo pode ser substituído |
| **Latency-aware**         | Processamento em tiers: rápido (local) → lento (LLM cloud)                    |
| **Graceful degradation**  | Se LLM está offline, rules engine assume; se GPU falha, CPU fallback          |

---

## 2. Percepção (Perception Layer)

### 2.1 Conectores de Câmera

```
src/perception/camera/
├── __init__.py
├── base_connector.py       # Interface abstrata
├── rtsp_connector.py       # Câmeras IP via RTSP
├── onvif_connector.py      # Câmeras ONVIF (PTZ, etc)
├── usb_connector.py        # Webcams USB
├── reolink_connector.py    # Específico: Reolink
├── hikvision_connector.py  # Específico: Hikvision
└── stream_manager.py       # Gerencia múltiplos streams
```

**Interface base:**

```python
class CameraConnector(ABC):
    camera_id: str
    source: str              # URL RTSP ou device path
    status: CameraStatus     # ONLINE, OFFLINE, DEGRADED

    @abstractmethod
    async def connect(self) -> bool: ...
    @abstractmethod
    async def get_frame(self) -> np.ndarray | None: ...
    @abstractmethod
    async def get_audio_chunk(self) -> np.ndarray | None: ...
    @abstractmethod
    def get_stream_info(self) -> StreamInfo: ...
    @abstractmethod
    async def reconnect(self) -> bool: ...
```

### 2.2 Captura de Áudio

```
src/perception/audio/
├── __init__.py
├── microphone.py           # Captura de microfone local
├── stream_audio.py         # Áudio embutido no stream RTSP
└── audio_buffer.py         # Ring buffer para os últimos N segundos
```

---

## 3. Processamento (Processing Layer)

### 3.1 Pipeline de Visão

```
src/processing/vision/
├── __init__.py
├── pipeline.py             # Orquestrador do pipeline de visão
├── face_detector.py        # Detecção facial (YOLOv8-face, RetinaFace)
├── face_recognizer.py      # Extração de embedding + matching (ArcFace, AdaFace)
├── object_detector.py      # Detecção de objetos (YOLOv8)
├── person_tracker.py       # Tracking multi-pessoa (DeepSORT, ByteTrack)
├── motion_detector.py      # Detecção de movimento (background subtraction)
├── scene_analyzer.py       # Análise de cena (mudanças, zonas de interesse)
└── preprocessor.py         # Redimensionamento, normalização, etc.
```

**Fluxo de processamento por frame:**

```
Frame → Motion? → Face Detect → Face Embedding → Match DB → Track ID
                → Object Detect → Object List
                → Scene Descriptor (LLM opcional a cada N frames)
```

### 3.2 Pipeline de Áudio

```
src/processing/audio/
├── __init__.py
├── pipeline.py             # Orquestrador do pipeline de áudio
├── vad.py                  # Voice Activity Detection (Silero VAD)
├── speaker_embedder.py     # Embedding de voz (ECAPA-TDNN, SpeechBrain)
├── speaker_recognizer.py   # Matching de voz
├── sound_classifier.py     # Classificação de sons (YAMNet, AST)
│                           #   vidro_quebrando, tiro, alarme, choro, latido
├── speech_transcriber.py   # Transcrição de fala (Whisper)
└── audio_preprocessor.py   # Resample, denoise, normalização
```

**Fluxo de processamento de áudio:**

```
Audio Chunk → VAD → Voice? → Speaker Embedding → Match DB → Speaker ID
                      → Speech-to-Text (Whisper) → Texto
                   → Sound Classification → Evento sonoro
```

---

## 4. Memória (Memory Layer)

> Ver documento dedicado: `docs/memory-system.md`

```
src/memory/
├── __init__.py
├── types.py                # Data classes: Person, Event, FaceEmbedding, etc.
├── vector_store.py         # Abstração sobre ChromaDB/Qdrant
│                           #   - face_embeddings (768-dim ArcFace)
│                           #   - voice_embeddings (192-dim ECAPA)
├── event_store.py          # PostgreSQL: eventos com timestamp
│                           #   schema: (id, ts, camera_id, event_type, payload, importance)
├── knowledge_graph.py      # NetworkX/Neo4j: relações entre entidades
│                           #   (Pessoa)-[VISITOU_COM]->(Pessoa)
│                           #   (Pessoa)-[VISTO_EM]->(Camera)
│                           #   (Veiculo)-[PERTENCE_A]->(Pessoa)
├── short_term.py           # Buffer circular: últimos 300 eventos (5 min)
├── long_term.py            # Decaimento de importância + sumarização
├── consolidation.py        # Consolida STM → LTM (rodado periodicamente)
└── anomaly_detector.py     # Detecta desvios do padrão histórico
```

### 4.1 Modelos de Dados

```python
@dataclass
class Person:
    person_id: str
    name: str | None              # None = desconhecido
    category: PersonCategory      # KNOWN, UNKNOWN, FREQUENT_UNKNOWN, THREAT
    face_embeddings: list[np.ndarray]  # Múltiplos embeddings (ângulos)
    voice_embeddings: list[np.ndarray]
    first_seen: datetime
    last_seen: datetime
    visit_count: int
    importance: float             # 0..1, decai com tempo
    metadata: dict                # tags, notas, informações

@dataclass
class SecurityEvent:
    event_id: str
    timestamp: datetime
    camera_id: str
    event_type: EventType         # PERSON_DETECTED, SOUND_DETECTED, MOTION, etc.
    severity: Severity            # INFO, LOW, MEDIUM, HIGH, CRITICAL
    persons_involved: list[str]   # person_ids
    description: str              # Descrição NL gerada por LLM
    snapshot_path: str | None     # Frame capturado
    audio_clip_path: str | None
    actions_taken: list[str]      # IDs das ações executadas
    llm_summary: str | None       # Sumarização do LLM
```

---

## 5. Raciocínio e Decisão (Reasoning Layer)

> Ver documento dedicado: `docs/goap-design.md`

### 5.1 Motor de Regras (Baixa Latência)

Para ameaças óbvias e imediatas, sem passar pelo LLM:

```yaml
rules:
  - name: "pessoa_ameacadora_detectada"
    condition:
      event_type: PERSON_DETECTED
      person_category: THREAT
    action: alert_critical

  - name: "som_de_tiro"
    condition:
      event_type: SOUND_DETECTED
      sound_class: gunshot
    action: alert_critical

  - name: "movimento_madrugada"
    condition:
      event_type: MOTION_DETECTED
      time_range: "23:00-05:00"
      zone: "perimeter"
    action: alert_and_lockdown
```

### 5.2 GOAP Planner

O GOAP opera com:

- **World State**: conjunto de fatos atuais (pessoas em casa, hora, alarme ativo, etc.)
- **Goals**: objetivos de segurança (manter perímetro seguro, verificar pessoa desconhecida)
- **Actions**: ações com preconditions e effects
- **Planner**: A* search para encontrar sequência de ações que satisfaz o goal

### 5.3 LLM Client (via vLLM / OpenAI-compatible API)

O Vigia usa um **único cliente LLM** compatível com qualquer servidor
que exponha a API `/v1/chat/completions` (vLLM, OpenAI, OpenRouter, etc.).

**Arquitetura do cliente:**

```
src/reasoning/llm/client.ts
  → LlmClient({ baseUrl, apiKey, model, maxTokens, temperature })
    → new OpenAI({ baseURL, apiKey })
      → chat.completions.create({ model, messages })
```

**Princípios:**

- **Provider-less**: não há enum de providers. O `baseUrl` define o servidor.
- **Single model**: o container vLLM carrega 1 modelo; o código envia exatamente esse nome.
- **Caminho único**: sem switch/case por provider — um método `generate()` para tudo.
- **Thinking auto-detect**: se o nome do modelo contém `thinking`, `reasoning`, ou `deepseek-r1`, o cliente envia `extra_body: { enable_thinking: true }`.

**Métodos expostos:**

- `evaluate(event, context)` → `LlmAssessment` (avaliação de ameaça)
- `generateHypotheses(event, context)` → hipóteses causais
- `generateDailySummary(events, date)` → resumo diário
- `generateText(prompt)` → texto livre

**Configuração (`.env`):**

```bash
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=minicpm-v4.6
LLM_API_KEY=                       # opcional para vLLM local
```

**Fallback determinístico:** se o servidor LLM estiver offline, o sistema
continua operando com o motor de regras (rules engine). As avaliações
retornam valores padrão conservadores.

---

## 6. Ações (Action Layer)

```
src/actions/
├── __init__.py
├── base_action.py          # Interface Action
├── notifications.py        # Push, SMS, email, Telegram, WhatsApp
├── smart_home.py           # Home Assistant, MQTT, Z-Wave
├── alarms.py               # Alarmes sonoros, luzes
├── recording.py            # Iniciar/parar gravação, upload para nuvem
├── emergency.py            # Chamar polícia, ambulância (API)
├── access_control.py       # Trancar/destrancar portas, portões
└── action_registry.py      # Registro de ações disponíveis
```

---

## 7. Núcleo do Agente

```
src/core/
├── __init__.py
├── agent.py                # Loop principal do agente
├── bus.py                  # Event bus interno (Redis pub/sub + asyncio Queue local)
├── config.py               # Carregamento de config (YAML)
├── scheduler.py            # Agendador de tarefas periódicas
└── telemetry.py            # Métricas e logging
```

### 7.1 Loop Principal

```python
class SecurityAgent:
    """Agente principal — loop eterno de percepção → ação"""

    async def run(self):
        # Inicializa todos os subsistemas
        await self._init_perception()   # Conecta câmeras, microfones
        await self._init_processing()   # Carrega modelos CV/audio
        await self._init_memory()       # Conecta DBs
        await self._init_reasoning()    # Inicia GOAP, LLM client
        await self._init_actions()      # Conecta integrações

        # Tasks concorrentes
        async with asyncio.TaskGroup() as tg:
            for camera in self.cameras:
                tg.create_task(self._camera_loop(camera))
            for mic in self.microphones:
                tg.create_task(self._audio_loop(mic))
            tg.create_task(self._goap_loop())        # Reavalia goals periodicamente
            tg.create_task(self._consolidation_loop()) # Consolida memória
            tg.create_task(self._health_check_loop())

    async def _camera_loop(self, camera):
        async for frame in camera.stream():
            event = await self.vision_pipeline.process(camera.id, frame)
            if event:
                await self.bus.publish("vision.event", event)

    async def _event_handler(self, event: SecurityEvent):
        # 1. Armazena na memória
        await self.memory.store(event)

        # 2. Rules engine (síncrono, rápido)
        rule_actions = self.rules.evaluate(event)
        for action in rule_actions:
            await self.actions.execute(action)

        # 3. GOAP: atualiza world state
        await self.goap.update_world_state(event)

        # 4. Se necessário, consulta LLM (assíncrono, lento)
        if event.needs_llm_evaluation():
            llm_result = await self.llm.evaluate(event)
            await self.bus.publish("llm.assessment", llm_result)
```

---

## 8. Topologia de Deployment

```
┌──────────────────────────────────────────────────────────────┐
│                      Edge Device (Casa/Escritório)            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Perception  │  │  Processing  │  │  Memory (STM/Local) │   │
│  │ (Câmeras,   │→│  (CV, Audio,  │→│  ChromaDB, SQLite,  │   │
│  │  Microfones)│  │   GPU Local)  │  │  Redis)             │   │
│  └─────────────┘  └──────┬───────┘  └─────────┬──────────┘   │
│                          │                     │              │
│                          ▼                     ▼              │
│                   ┌──────────────┐    ┌──────────────────┐    │
│                   │   Reasoning  │←──→│    Actions        │    │
│                   │ (Rules+GOAP) │    │ (IoT, Alarms,etc) │    │
│                   └──────┬───────┘    └──────────────────┘    │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │ Internet (HTTPS)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      Cloud Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  LLM API     │  │  Long-Term   │  │  Notification      │   │
│  │ GPT-4o/Claude│  │  Storage     │  │  Push/SMS/Email    │   │
│  └──────────────┘  │ PostgreSQL   │  └───────────────────┘   │
│                    │ + backups    │                           │
│                    └──────────────┘                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Considerações de Performance

### Latency Budget

| Etapa                | Latência Alvo        | Local |
| -------------------- | -------------------- | ----- |
| Captura de frame     | < 33ms (30fps)       | Edge  |
| Detecção facial      | < 50ms (GPU)         | Edge  |
| Extração embedding   | < 20ms (GPU)         | Edge  |
| Match no VectorDB    | < 10ms               | Edge  |
| Classificação de som | < 100ms              | Edge  |
| Rules engine         | < 5ms                | Edge  |
| GOAP planning        | < 50ms (tipicamente) | Edge  |
| LLM evaluation       | 500ms-3s             | Cloud |
| Execução de ação     | < 100ms              | Edge  |

### Otimizações

- **Frame skipping**: processar 1 a cada N frames para detecção facial (rostos não se movem tão rápido)
- **Resolução adaptativa**: reduzir resolução para detecção, aumentar para reconhecimento
- **Model quantization**: INT8/FP16 para inferência GPU
- **Embedding cache**: cache LRU para embeddings consultados frequentemente
- **Batch processing**: agrupar frames de múltiplas câmeras para GPU

---

## 10. Segurança e Privacidade

- **Dados sensíveis no edge**: rostos, vozes e eventos ficam no dispositivo local
- **Anonimização para cloud**: LLM recebe apenas descrições textuais, nunca imagens
- **Criptografia**: TLS para todas as comunicações externas
- **Retenção configurável**: política de deleção automática de gravações
- **Modo privacidade**: zonas de exclusão onde câmeras não processam (ex: vizinhos)
