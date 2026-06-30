# Sistema de Segurança Inteligente — Diagramas de Fluxo

## 1. Diagrama Geral do Sistema

```mermaid
flowchart TB
    subgraph Perception["👁️ Percepção"]
        CAM1["Câmera RTSP"]
        CAM2["Câmera ONVIF"]
        MIC1["Microfone"]
        CAM1 --> SM["Stream Manager"]
        CAM2 --> SM
        MIC1 --> AB["Audio Buffer"]
    end

    subgraph Processing["⚙️ Processamento"]
        SM --> VP["Vision Pipeline"]
        AB --> AP["Audio Pipeline"]

        subgraph Vision["Visão"]
            VP --> FD["Face Detector\n(YOLOv8-face)"]
            FD --> FR["Face Recognizer\n(ArcFace)"]
            VP --> OD["Object Detector\n(YOLOv8)"]
            VP --> MD["Motion Detector\n(Bg Subtraction)"]
            VP --> PT["Person Tracker\n(DeepSORT)"]
        end

        subgraph Audio["Áudio"]
            AP --> VAD["Voice Activity Detector\n(Silero VAD)"]
            VAD --> SE["Speaker Embedder\n(ECAPA-TDNN)"]
            AP --> SC["Sound Classifier\n(YAMNet)"]
            AP --> ST["Speech Transcriber\n(Whisper)"]
        end
    end

    subgraph Memory["🧠 Memória"]
        VS["Vector Store\n(ChromaDB)"]
        ES["Event Store\n(PostgreSQL)"]
        PR["Person Registry"]
        STM["Short-Term Memory\n(Redis)"]
        KG["Knowledge Graph\n(Neo4j)"]
        AD["Anomaly Detector"]
    end

    subgraph Reasoning["🤔 Raciocínio"]
        RE["Rules Engine\n(< 5ms)"]
        GP["GOAP Planner\n(A* Search)"]
        LLM["LlmClient<br/>(vLLM OpenAI-compatible)"]
    end

    subgraph Actions["⚡ Ações"]
        NOT["Notificações\n(Telegram/Push)"]
        ALM["Alarmes\n(Sirene/Luzes)"]
        IOT["Smart Home\n(MQTT/Z-Wave)"]
        REC["Gravação\n(Cloud)"]
        EMG["Emergência\n(Chamada)"]
    end

    FR --> VS
    SE --> VS
    VP --> ES
    AP --> ES
    ES --> AD
    ES --> STM
    STM --> AD
    PR --> KG

    ES --> RE
    ES --> GP
    STM --> GP
    AD --> GP
    ES --> LLM
    STM --> LLM
    VS --> LLM
    PR --> LLM

    RE --> NOT
    RE --> ALM
    GP --> NOT
    GP --> ALM
    GP --> IOT
    GP --> REC
    GP --> EMG
    LLM --> GP
    LLM --> NOT

    style Perception fill:#1a1a2e,stroke:#16213e,color:#fff
    style Processing fill:#0f3460,stroke:#16213e,color:#fff
    style Memory fill:#533483,stroke:#3b2e5a,color:#fff
    style Reasoning fill:#e94560,stroke:#c23152,color:#fff
    style Actions fill:#16a085,stroke:#117a65,color:#fff
```

## 2. Fluxo de Detecção e Identificação de Pessoa

```mermaid
sequenceDiagram
    participant Cam as 📷 Câmera
    participant VP as Vision Pipeline
    participant FD as Face Detector
    participant FR as Face Recognizer
    participant VS as Vector Store
    participant PR as Person Registry
    participant STM as Short-Term Mem
    participant AD as Anomaly Detector
    participant Bus as Event Bus

    Cam->>VP: Frame (30fps, skip=3)
    VP->>FD: Detect faces
    FD-->>VP: [(bbox, landmarks), ...]

    alt Rosto detectado
        VP->>FR: Extract embedding (768d)
        FR->>VS: Search similar embeddings (top_k=5)
        VS-->>FR: [VectorMatch(id, score), ...]

        alt Match ≥ 0.75 (KNOWN)
            FR->>PR: Get person by ID
            PR-->>FR: PersonRecord(name="João", category=KNOWN)
            FR->>PR: Record visit (update stats)
            FR-->>VP: person_id, name="João", category=KNOWN

        else Match ≥ 0.65 (FREQUENT_UNKNOWN)
            FR->>PR: Get person by ID
            PR-->>FR: PersonRecord(name=None, category=FREQUENT_UNKNOWN)
            FR-->>VP: person_id, name=None, category=FREQUENT_UNKNOWN

        else Sem match
            FR->>PR: Register new person
            PR-->>FR: PersonRecord(id="unknown_abc", category=UNKNOWN)
            FR->>VS: Insert embedding
            FR-->>VP: person_id="unknown_abc", category=UNKNOWN
        end

        VP->>Bus: Publish SecurityEvent(PERSON_DETECTED)
        Bus->>STM: Store event
        Bus->>AD: Score anomaly

        alt Pessoa é THREAT
            AD-->>Bus: anomaly_score=1.0
        else Pessoa nova (1ª visita)
            AD-->>Bus: anomaly_score=0.7
        else Visita normal
            AD-->>Bus: anomaly_score=0.0
        end
    end
```

## 3. Fluxo de Decisão GOAP

```mermaid
flowchart TD
    EVT["📨 Evento Recebido"] --> WS["Atualiza WorldState"]
    WS --> EVAL["Reavalia Goals"]

    EVAL --> SEL{"Goal prioritário<br/>não satisfeito?"}
    SEL -->|Não| WAIT["Aguardar próximo evento"]
    SEL -->|Sim| PLAN["A* Planner"]

    PLAN --> FOUND{"Plano encontrado?"}
    FOUND -->|Não| LLMG["LLM sugere novo Goal"]
    LLMG --> EVAL

    FOUND -->|Sim| CRIT{"Contém ação<br/>crítica? (cost ≥ 15)"}
    CRIT -->|Sim| LLMV["LLM valida plano"]
    LLMV --> APPR{"Aprovado?"}
    APPR -->|Não| LLMG
    APPR -->|Sim| EXEC["Executa ações"]
    CRIT -->|Não| EXEC

    EXEC --> CHECK{"Ação OK?"}
    CHECK -->|Falha| REPLAN["Replaneja"]
    REPLAN --> PLAN
    CHECK -->|OK| MORE{"Mais ações?"}
    MORE -->|Sim| EXEC
    MORE -->|Não| DONE["✅ Goal satisfeito"]

    style EVT fill:#4a9,stroke:#333
    style SEL fill:#f96,stroke:#333
    style CRIT fill:#f96,stroke:#333
    style DONE fill:#4a9,stroke:#333
```

## 4. Ciclo de Vida de uma Pessoa

```mermaid
stateDiagram-v2
    [*] --> Unknown: 1ª detecção

    Unknown --> FrequentUnknown: ≥ 5 visitas
    Unknown --> Threat: Usuário marca
    Unknown --> Known: Usuário nomeia

    FrequentUnknown --> Known: Usuário nomeia
    FrequentUnknown --> Threat: Usuário marca
    FrequentUnknown --> Unknown: Decai (30d sem visita)

    Known --> Threat: Usuário marca
    Known --> FrequentUnknown: Decai (90d sem visita)

    Threat --> Known: Usuário desmarca
    Threat --> [*]: Nunca decai

    note right of FrequentUnknown
        "Visitante frequente não identificado"
        Sistema pergunta ao dono:
        "Essa pessoa foi vista 5x.
         Quer dar um nome?"
    end note

    note right of Unknown
        Importância decai em 7 dias
        sem novas visitas
    end note
```

## 5. Modos de Operação

```mermaid
flowchart LR
    subgraph Home["🏠 HOME"]
        direction TB
        H1["Alarme: Desativado"]
        H2["Câmeras: Monitorando"]
        H3["Notificações: Apenas anômalo"]
        H4["Ações: Leves"]
    end

    subgraph Away["🚗 AWAY"]
        direction TB
        A1["Alarme: Ativo"]
        A2["Câmeras: Full scan"]
        A3["Notificações: Qualquer movimento"]
        A4["Ações: Lockdown total"]
    end

    subgraph Night["🌙 NIGHT"]
        direction TB
        N1["Alarme: Ativo (perimetral)"]
        N2["Câmeras: Infravermelho"]
        N3["Notificações: Movimento externo"]
        N4["Ações: Moderadas"]
    end

    subgraph Vacation["✈️ VACATION"]
        direction TB
        V1["Alarme: Máximo"]
        V2["Câmeras: Full + gravação"]
        V3["Notificações: Tudo"]
        V4["Ações: Máximas + emergência"]
    end

    Home --> Away: Usuário sai
    Away --> Home: Usuário chega
    Home --> Night: Horário noturno
    Night --> Home: Amanhecer
    Away --> Vacation: Modo férias
    Vacation --> Away: Retorno
```
