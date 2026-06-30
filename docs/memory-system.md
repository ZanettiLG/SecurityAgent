# Sistema de Memória — SecurityAgent

## 1. Visão Geral

O sistema de memória é o que torna o SecurityAgent "inteligente" ao longo do tempo. Ele implementa um modelo inspirado na memória humana:

| Tipo                             | Duração       | Capacidade                  | Função                                                                                   |
| -------------------------------- | ------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| **Memória Sensorial**            | ~5 segundos   | Ilimitada (buffer circular) | Últimos frames de vídeo/áudio para contexto imediato                                     |
| **Memória de Curto Prazo (STM)** | ~5-30 minutos | ~300 eventos                | Eventos recentes para detecção de padrões de curto prazo                                 |
| **Memória de Longo Prazo (LTM)** | Indefinido    | Ilimitada (com compressão)  | Histórico consolidado, padrões, pessoas conhecidas, conhecimento acumulado entre sessões |
| **Memória Vetorial**             | Indefinido    | Ilimitada                   | Embeddings de rostos, vozes e cenas para matching                                        |
| **Memória Episódica**            | Indefinido    | Ilimitada                   | Eventos específicos com contexto rico (SceneObservation)                                 |
| **Memória Semântica**            | Indefinido    | Ilimitada                   | Fatos, regras, conhecimento sobre pessoas, relacionamentos                               |
| **Memória de Contexto**          | Indefinido    | Ilimitada                   | Contexto de cena por câmera, conhecimento "instintivo" do ambiente                       |

---

## 2. Arquitetura do Sistema de Memória

```
┌─────────────────────────────────────────────────────────────────┐
│                      MEMORY SYSTEM                               │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │ Sensory Buffer   │    │  Vector Store (ChromaDB/Qdrant)   │   │
│  │ (numpy ringbuf)  │    │  ┌─────────────┐ ┌─────────────┐ │   │
│  │                  │    │  │ face_index  │ │ voice_index │ │   │
│  │ Frames: 150      │    │  │ (768-dim)   │ │ (192-dim)   │ │   │
│  │ Audio: 5s        │    │  └─────────────┘ └─────────────┘ │   │
│  └──────────────────┘    └──────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │ Short-Term Memory     │  │ Event Store (PostgreSQL)      │    │
│  │ (Redis Streams)       │  │                               │    │
│  │                       │  │ schema: (id, ts, camera,      │    │
│  │ Eventos: últimos 300  │  │   event_type, severity,       │    │
│  │ TTL: 30 min           │  │   persons[], description,     │    │
│  │                       │  │   snapshot_url, actions[])    │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │ Knowledge Graph       │  │ Person Registry               │    │
│  │ (Neo4j / NetworkX)    │  │ (PostgreSQL + Vector Store)   │    │
│  │                       │  │                               │    │
│  │ (Pessoa)-[VISITOU]->  │  │ person_id, name, category,    │    │
│  │   (Pessoa)            │  │ embeddings[], metadata        │    │
│  │ (Pessoa)-[VISTO_EM]-> │  │ first_seen, last_seen,        │    │
│  │   (Camera)            │  │ visit_count, importance        │    │
│  │ (Veiculo)-[DE]->      │  │                               │    │
│  │   (Pessoa)            │  │                               │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Anomaly Detector                                          │   │
│  │ - Statistical baselines (horários, frequências)           │   │
│  │ - Pattern deviation scoring                               │   │
│  │ - Novelty detection (Isolation Forest, LOF)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Memória Vetorial (Rostos e Vozes)

### 3.1 Face Index

```python
class FaceIndex:
    """
    Índice vetorial para busca de rostos por similaridade de cosseno.

    Cada pessoa conhecida tem MÚLTIPLOS embeddings (diferentes ângulos,
    iluminações, expressões) para robustez.

    Pessoas "frequentemente vistas" (categoria FREQUENT_UNKNOWN) também
    têm embeddings armazenados, mas sem nome atribuído.
    """

    def __init__(self, vector_store: VectorStore):
        self.store = vector_store
        self.collection = "face_embeddings"
        self.threshold_known = 0.75      # Similaridade mínima para match conhecido
        self.threshold_frequent = 0.65   # Similaridade para "visitante frequente"

    async def identify(
        self, embedding: np.ndarray
    ) -> tuple[str | None, float, PersonCategory]:
        """
        Busca o embedding no índice.

        Returns:
            person_id ou None, confidence (0-1), category
        """
        results = await self.store.search(
            collection=self.collection,
            query_vector=embedding,
            top_k=5,
        )

        if not results:
            return None, 0.0, PersonCategory.UNKNOWN

        best = results[0]
        person = await self.person_registry.get(best.id)

        if best.score >= self.threshold_known:
            return person.person_id, best.score, person.category
        elif best.score >= self.threshold_frequent:
            # Match com visitante frequente não-nomeado
            return person.person_id, best.score, PersonCategory.FREQUENT_UNKNOWN
        else:
            return None, best.score, PersonCategory.UNKNOWN

    async def add_embedding(
        self, person_id: str, embedding: np.ndarray, source_frame: str
    ):
        """Adiciona um novo embedding para uma pessoa."""
        await self.store.insert(
            collection=self.collection,
            id=f"{person_id}:{uuid4()}",
            vector=embedding,
            metadata={
                "person_id": person_id,
                "source_frame": source_frame,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def merge_person(self, from_id: str, to_id: str):
        """
        Quando percebemos que duas pessoas são a mesma
        (ex: 'unknown_42' virou conhecida como 'João'),
        merge os embeddings e atualiza os metadados.
        """
        ...
```

### 3.2 Voice Index

Funciona de forma análoga ao Face Index, mas com embeddings de voz (ECAPA-TDNN, 192 dimensões).

```python
class VoiceIndex:
    def __init__(self, vector_store: VectorStore):
        self.collection = "voice_embeddings"
        self.threshold_known = 0.80
        self.threshold_frequent = 0.70

    async def identify(
        self, embedding: np.ndarray
    ) -> tuple[str | None, float]:
        """Identifica um locutor pelo embedding de voz."""
        ...

    async def add_embedding(
        self, person_id: str, embedding: np.ndarray, audio_snippet: str
    ):
        """Adiciona embedding de voz para uma pessoa."""
        ...
```

---

## 4. Registro de Pessoas

```python
@dataclass
class PersonRecord:
    person_id: str               # UUID
    name: str | None             # Nome (None = desconhecido)
    category: PersonCategory     # KNOWN, UNKNOWN, FREQUENT_UNKNOWN, THREAT

    # Embeddings (metadados, os vetores ficam no VectorStore)
    face_embedding_count: int
    voice_embedding_count: int

    # Estatísticas temporais
    first_seen: datetime
    last_seen: datetime
    total_visits: int
    avg_visit_duration: float    # Duração média das visitas (segundos)

    # Padrões de visita
    common_hours: list[int]      # Horas mais comuns (0-23)
    common_days: list[int]       # Dias mais comuns (0=Mon..6=Sun)
    common_entrances: list[str]  # Câmeras/entradas mais usadas

    # Metadados
    importance: float            # 0..1, decai com inatividade
    tags: list[str]              # "entregador", "vizinho", "família"
    notes: str | None            # Notas do usuário
    threat_score: float          # 0..1, score de ameaça

class PersonRegistry:
    """CRUD de pessoas + lógica de categorização."""

    async def register_new_person(
        self,
        face_embedding: np.ndarray | None = None,
        voice_embedding: np.ndarray | None = None,
        camera_id: str | None = None,
    ) -> PersonRecord:
        """Cria registro de pessoa desconhecida."""
        person = PersonRecord(
            person_id=f"unknown_{uuid4().hex[:8]}",
            name=None,
            category=PersonCategory.UNKNOWN,
            first_seen=datetime.now(),
            last_seen=datetime.now(),
            total_visits=1,
            ...
        )
        await self.save(person)
        if face_embedding is not None:
            await self.face_index.add_embedding(person.person_id, face_embedding)
        return person

    async def promote_to_frequent(self, person_id: str):
        """
        Quando uma pessoa desconhecida é vista muitas vezes,
        promove para FREQUENT_UNKNOWN.
        """
        person = await self.get(person_id)
        if person.total_visits >= 5:  # Threshold configurável
            person.category = PersonCategory.FREQUENT_UNKNOWN
            await self.save(person)
            # Notifica o dono: "Uma pessoa não identificada foi vista 5x.
            # Quer dar um nome a ela?"
            await self.bus.publish("person.promoted_to_frequent", person)

    async def mark_as_known(self, person_id: str, name: str):
        """Usuário deu nome a uma pessoa (conhecida ou frequent unknown)."""
        person = await self.get(person_id)
        person.name = name
        person.category = PersonCategory.KNOWN
        await self.save(person)

    async def mark_as_threat(self, person_id: str, reason: str):
        """Usuário marca pessoa como ameaça."""
        person = await self.get(person_id)
        person.category = PersonCategory.THREAT
        person.threat_score = 1.0
        person.tags.append("ameaça")
        person.notes = reason
        await self.save(person)

    async def decay_importance(self):
        """
        Roda periodicamente.
        Pessoas não vistas recentemente têm importância reduzida.
        importance *= exp(-lambda * days_since_last_seen)
        """
        ...
```

---

## 5. Memória de Curto Prazo (STM)

```python
class ShortTermMemory:
    """
    Buffer circular dos últimos N eventos.

    Funções:
    - Detectar padrões de curto prazo: "a mesma pessoa passou 3x em 5min"
    - Fornecer contexto imediato para o LLM
    - Pré-filtrar eventos antes de ir para LTM
    """

    def __init__(self, max_events: int = 300):
        self.events: deque[SecurityEvent] = deque(maxlen=max_events)
        self.person_tracks: dict[str, deque[PersonSighting]] = {}

    async def add(self, event: SecurityEvent):
        self.events.append(event)

        # Tracking por pessoa (para padrões de curto prazo)
        for person_id in event.persons_involved:
            if person_id not in self.person_tracks:
                self.person_tracks[person_id] = deque(maxlen=20)
            self.person_tracks[person_id].append(PersonSighting(
                timestamp=event.timestamp,
                camera_id=event.camera_id,
                event_id=event.event_id,
            ))

    def get_recent_context(self, seconds: float = 300) -> list[SecurityEvent]:
        """Retorna eventos dos últimos N segundos para contexto do LLM."""
        cutoff = datetime.now() - timedelta(seconds=seconds)
        return [e for e in self.events if e.timestamp > cutoff]

    def detect_loitering(self, person_id: str, window_seconds: int = 300) -> bool:
        """Pessoa está rondando? (múltiplos avistamentos em pouco tempo)"""
        sightings = self.person_tracks.get(person_id, [])
        if len(sightings) < 3:
            return False
        recent = [s for s in sightings
                  if (datetime.now() - s.timestamp).seconds < window_seconds]
        return len(recent) >= 3

    def detect_tailgating(self, window_seconds: int = 10) -> bool:
        """Duas pessoas entram muito próximas? (tailgating)"""
        ...
```

---

## 6. Memória de Contexto de Cena (Scene Context Store)

> **Novo**: Issue [#1](https://github.com/ZanettiLG/SecurityAgent/issues/1) — Fase 2

### 6.1 Conceito

A Memória de Contexto de Cena armazena o **modelo mental do ambiente** que o
agente constrói sobre cada câmera. É o que permite ao Vigia "saber" o que
está vendo sem precisar reanalisar cada frame do zero.

Diferente das outras memórias que armazenam eventos ou embeddings, o Scene
Context armazena **descrições persistentes e em evolução** do ambiente físico:

```
Câmera "externa_portao":
  ├── Descrição inicial (fornecida pelo usuário ou inferida por LLM Vision):
  │     "Câmera na área externa da residência, apontada para o portão.
  │      Vê: carro na garagem, portão de ferro, rua asfaltada,
  │      5 casas do outro lado, árvore na calçada."
  │
  ├── Residentes associados: ["João", "Maria"]
  ├── Veículos dos residentes: ["Gol branco ABC-1234", "HB20 prata DEF-5678"]
  ├── Zonas de interesse:
  │     - portão (entrada principal)
  │     - garagem (área interna)
  │     - rua (área pública)
  │     - calçada (transição)
  │
  └── Conhecimento adquirido (evolui com observações):
        - "Vizinha Fulana mora na casa azul à esquerda"
        - "Carteiro passa entre 10h-11h"
        - "Caminhão de gás toda terça-feira"
```

### 6.2 Estrutura de Dados

```typescript
interface SceneContext {
  cameraId: string;
  createdAt: Date;
  updatedAt: Date;

  // Descrição da cena
  description: string; // "Câmera externa, vê portão, rua, casas..."
  spatialLayout: string; // "Portão a 3m, rua a 8m, casas a 15m+"

  // Entidades conhecidas neste campo de visão
  knownPersons: string[]; // personIds de residentes e vizinhos
  knownVehicles: string[]; // vehicleIds associados
  zones: SceneZone[]; // Zonas de interesse na cena

  // Conhecimento adquirido (auto-aprendizado)
  acquiredFacts: AcquiredFact[]; // Fatos descobertos pelo agente
  confidence: number; // 0..1 — o quanto o agente confia neste modelo
}

interface SceneZone {
  name: string; // "portão", "garagem", "rua"
  type: "private" | "transition" | "public";
  description: string;
  distanceEstimateM?: number;
}

interface AcquiredFact {
  fact: string; // "Vizinha Fulana mora na casa azul"
  source: "user" | "llm_vision" | "inference" | "observation";
  confidence: number;
  discoveredAt: Date;
  validatedAt?: Date; // Quando foi confirmado pelo usuário
}
```

### 6.3 Fluxo de Bootstrapping

```
1. CÂMERA NOVA DETECTADA
   └─► SceneContextStore cria registro vazio com status "uninitialized"

2. PRIMEIRO FRAME — LLM Vision descreve a cena:
   ┌─────────────────────────────────────────────────────────┐
   │ Prompt: "Descreva esta cena de câmera de segurança.     │
   │          O que você vê? Quais zonas (portão, rua, etc)? │
   │          Há veículos? De que cores/modelos?"             │
   │                                                         │
   │ Resposta: "Vejo um portão de ferro preto, um carro      │
   │           branco (Gol) estacionado na garagem, uma rua  │
   │           asfaltada com 5 casas visíveis..."             │
   └─────────────────────────────────────────────────────────┘

3. USUÁRIO VALIDA/EDITA:
   └─► "O carro branco é meu Gol. A casa azul é da vizinha Fulana."

4. SCENE CONTEXT ATIVO:
   └─► Agora o agente "sabe" o que cada câmera vê.
       Este contexto é injetado no prompt do LLM em toda avaliação.
```

### 6.4 Atualização Contínua

O SceneContext **evolui** com o tempo. O agente adiciona `AcquiredFacts`
conforme aprende:

```
Evento: "Motorista desconhecido estaciona em frente à casa azul"
  → Agente consulta SceneContext: "casa azul = vizinha Fulana"
  → Agente infere: "Motorista pode ser associado à Fulana"
  → Se confirmado (pelo usuário ou por repetição), adiciona:
      AcquiredFact {
        fact: "Fulana recebe visitas de motorista (~34 anos, homem)",
        source: "inference",
        confidence: 0.7
      }
```

### 6.5 Persistência

```sql
CREATE TABLE scene_contexts (
  camera_id TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  spatial_layout TEXT DEFAULT '',
  known_persons TEXT DEFAULT '[]',     -- JSON array
  known_vehicles TEXT DEFAULT '[]',    -- JSON array
  zones TEXT DEFAULT '[]',             -- JSON array of SceneZone
  acquired_facts TEXT DEFAULT '[]',    -- JSON array of AcquiredFact
  confidence REAL DEFAULT 0.5,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 7. Memória de Longo Prazo & Consolidação

```python
class LongTermMemory:
    """
    Armazena eventos históricos, sumarizações, padrões aprendidos.

    Consolidação (roda a cada 1h ou à noite):
    1. Pega eventos da STM
    2. Filtra eventos de baixa importância
    3. Sumariza eventos similares (LLM)
    4. Armazena no EventStore
    5. Atualiza estatísticas das pessoas
    """

    async def consolidate(self, stm: ShortTermMemory):
        # Pega eventos novos da STM que ainda não foram consolidados
        new_events = [e for e in stm.events if not e.consolidated]

        if not new_events:
            return

        # Agrupa eventos por tipo e pessoas envolvidas
        groups = self._group_related_events(new_events)

        for group in groups:
            if len(group) == 1:
                # Evento isolado: armazena como está
                await self.event_store.insert(group[0])
            else:
                # Múltiplos eventos relacionados: sumariza com LLM
                summary = await self._llm_summarize(group)
                consolidated_event = SecurityEvent(
                    event_type=EventType.CONSOLIDATED,
                    description=summary,
                    persons_involved=list(set(
                        p for e in group for p in e.persons_involved
                    )),
                    llm_summary=summary,
                    ...
                )
                await self.event_store.insert(consolidated_event)

    async def _llm_summarize(self, events: list[SecurityEvent]) -> str:
        """Usa LLM para sumarizar eventos relacionados."""
        prompt = f"""
        Resuma os seguintes eventos de segurança em uma frase concisa:

        {chr(10).join(f'- {e.timestamp}: {e.description}' for e in events)}

        Exemplo: "João chegou em casa às 18h, foi para a sala e depois para o quarto."
        """
        return await self.llm.generate(prompt)

    async def get_daily_summary(self, date: date) -> str:
        """Gera resumo diário com LLM."""
        events = await self.event_store.get_by_date(date)
        prompt = f"""
        Gere um resumo do dia {date} com base nos eventos de segurança:

        {self._format_events(events)}

        Inclua:
        - Pessoas que entraram/saíram
        - Eventos incomuns ou suspeitos
        - Estatísticas (total de eventos, pessoas detectadas)
        """
        return await self.llm.generate(prompt)
```

---

## 8. Detecção de Anomalias

```python
class AnomalyDetector:
    """
    Detecta eventos que fogem do padrão normal.

    Técnicas:
    1. Baseline estatístico: compara com média histórica
    2. Detecção de novidade: evento nunca visto antes
    3. Padrão temporal: evento em horário atípico
    """

    async def score_event(self, event: SecurityEvent) -> float:
        """Retorna score de anomalia 0..1 (1 = muito anômalo)."""
        scores = []

        # 1. Pessoa desconhecida em horário atípico
        if event.event_type == EventType.PERSON_DETECTED:
            for pid in event.persons_involved:
                person = await self.person_registry.get(pid)
                if person and person.category == PersonCategory.UNKNOWN:
                    hour_score = self._hour_atypical_score(
                        event.timestamp.hour, person.common_hours
                    )
                    scores.append(hour_score)

        # 2. Evento de movimento em horário que normalmente não tem
        if event.event_type == EventType.MOTION_DETECTED:
            baseline = await self._get_hourly_baseline(
                event.camera_id, event.timestamp.hour
            )
            if baseline["avg_motion_events"] < 0.1:
                scores.append(0.8)  # Movimento em horário normalmente parado

        # 3. Som raro ou novo
        if event.event_type == EventType.SOUND_DETECTED:
            sound_class = event.payload.get("sound_class")
            frequency = await self.event_store.count_sound_events(
                sound_class, days=30
            )
            if frequency == 0:
                scores.append(0.9)  # Som nunca ouvido antes
            elif frequency < 3:
                scores.append(0.5)

        # 4. Pessoa nova no local (nunca vista antes em nenhuma câmera)
        if event.event_type == EventType.PERSON_DETECTED:
            for pid in event.persons_involved:
                person = await self.person_registry.get(pid)
                if person and person.total_visits == 1:
                    scores.append(0.7)  # Pessoa nunca vista antes

        return max(scores) if scores else 0.0

    async def should_alert(self, event: SecurityEvent) -> bool:
        """Decide se deve alertar baseado no score de anomalia."""
        score = await self.score_event(event)
        return score > 0.6  # Threshold configurável
```

---

## 8.5. Context Compiler — Montagem Hierárquica de Contexto para LLM

> **Novo**: Issue [#1](https://github.com/ZanettiLG/SecurityAgent/issues/1) — Fase 3

### Conceito

O Context Compiler é o componente que monta o prompt do agente de forma
**hierárquica e com priorização**, garantindo que o LLM receba todas as
informações relevantes sem estourar o token budget.

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────┐
│ SYSTEM PROMPT (fixo)                         │
│ "Você é o Vigia, um agente de segurança..."  │
├─────────────────────────────────────────────┤
│ SCENE CONTEXT (persistente)                  │
│ "Câmera externa: vê portão, rua, casas..."   │
│ "Residentes: João, Maria"                    │
│ "Veículos residentes: Gol branco, HB20"      │
├─────────────────────────────────────────────┤
│ KNOWLEDGE GRAPH CONTEXT (entidades relev.)   │
│ "Entidades detectadas neste evento:"         │
│ "  - Pessoa X: vizinha, 23 visitas, ..."     │
│ "  - Carro Y: associado a Pessoa X, ..."     │
├─────────────────────────────────────────────┤
│ ROUTINE CONTEXT (baselines aprendidas)       │
│ "Neste horário (14h), nesta câmera:"         │
│ "  - 85% dos eventos são entregas"           │
│ "  - 10% são visitas de vizinhos"            │
├─────────────────────────────────────────────┤
│ RECENT EVENTS (janela deslizante)            │
│ "Últimos 20 eventos relevantes..."           │
├─────────────────────────────────────────────┤
│ ACTIVE HYPOTHESES                            │
│ "Hipóteses em aberto sobre entidades..."     │
├─────────────────────────────────────────────┤
│ CONVERSATION HISTORY (últimas interações)    │
│ "Perguntas recentes e respostas..."          │
└─────────────────────────────────────────────┘
```

### Princípios de Design

| Princípio                     | Descrição                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **Hierarquia de importância** | Scene Context > KG > Routines > Events > Hypotheses > Conversations             |
| **Token budget consciente**   | Cada camada tem um limite de tokens; informações menos relevantes são truncadas |
| **Relevância por entidade**   | Se o evento é sobre pessoa X, o KG context foca em X e seus vizinhos no grafo   |
| **Compressão de histórico**   | Eventos antigos são sumarizados pelo LLM em "memórias compactas"                |
| **Cache inteligente**         | Scene Context e Routine Profiles mudam pouco → cacheados; Events mudam sempre   |

### Implementação

```typescript
interface ContextLayer {
  name: string;
  priority: number; // 0 (mais importante) a 100
  maxTokens: number; // Budget máximo desta camada
  build(event: SecurityEvent): Promise<string>;
}

class ContextCompiler {
  private layers: ContextLayer[] = [];

  registerLayer(layer: ContextLayer): void {
    this.layers.push(layer);
    this.layers.sort((a, b) => a.priority - b.priority);
  }

  async compile(event: SecurityEvent, totalBudget: number): Promise<string> {
    const sections: string[] = [];
    let remainingBudget = totalBudget;

    for (const layer of this.layers) {
      if (remainingBudget <= 0) break;

      const budget = Math.min(layer.maxTokens, remainingBudget);
      const content = await layer.build(event);
      const truncated = this.truncateToTokens(content, budget);

      if (truncated.length > 0) {
        sections.push(`### ${layer.name}\n${truncated}`);
        remainingBudget -= this.estimateTokens(truncated);
      }
    }

    return sections.join("\n\n");
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    // Trunca texto para caber no budget, preservando frases completas
  }
}
```

### Exemplo de Uso

```typescript
// No agent.ts, durante handleEvent():
const context = await this.contextCompiler.compile(event, 4000);
const prompt = `${SYSTEM_PROMPT}\n\n${context}\n\nAnalise o evento: ${event.description}`;
const response = await this.llmClient.generate(prompt);
```

---

## 9. Grafo de Conhecimento

```python
class KnowledgeGraph:
    """
    Rede de relacionamentos entre entidades.

    Exemplos de queries:
    - "Quem costuma visitar junto com João?"
    - "Qual carro está associado a cada pessoa?"
    - "Por quais entradas a pessoa X costuma entrar?"
    - "Pessoas que estiveram aqui nas últimas 24h"
    """

    # Node types: PERSON, CAMERA, VEHICLE, ZONE, DEVICE
    # Edge types: VISITED_WITH, SEEN_AT, OWNS, ENTERED_THROUGH

    async def add_visit(self, person_id: str, camera_id: str, timestamp: datetime):
        """Registra que pessoa foi vista em uma câmera."""
        await self.graph.merge_node("PERSON", person_id)
        await self.graph.merge_node("CAMERA", camera_id)
        await self.graph.create_edge(
            person_id, camera_id, "SEEN_AT",
            properties={"timestamp": timestamp.isoformat()}
        )

    async def add_co_visit(self, person_a: str, person_b: str):
        """Registra que duas pessoas foram vistas juntas."""
        await self.graph.create_edge(
            person_a, person_b, "VISITED_WITH",
            properties={"count": 1},  # Incrementa se já existe
        )

    async def get_frequent_visitors(self, camera_id: str, days: int = 30) -> list:
        """Pessoas mais frequentes em uma câmera."""
        ...

    async def get_visitor_network(self, person_id: str) -> dict:
        """Grafo de pessoas relacionadas a uma pessoa."""
        ...

    async def find_unusual_pattern(self) -> list[str]:
        """
        Detecta padrões incomuns no grafo:
        - Pessoa X e Y nunca foram vistas juntas, mas hoje foram
        - Pessoa entrou por uma entrada que nunca usa
        """
        ...
```

---

## 10. Ciclo de Vida de uma Pessoa no Sistema

```
┌──────────┐     N visits     ┌──────────────────┐    User names    ┌──────────┐
│ UNKNOWN  │ ───────────────→ │ FREQUENT_UNKNOWN │ ───────────────→ │  KNOWN   │
│ (visita  │   (threshold:    │ ("visitante       │   "Esse é o     │ ("João") │
│   nº 1)  │    5 visits)     │  frequente")      │    João!"       │          │
└──────────┘                  └──────────────────┘                 └──────────┘
     │                                │                                  │
     │ User marks                    │ User marks                       │ User marks
     │ as threat                     │ as threat                        │ as threat
     ▼                                ▼                                  ▼
┌──────────┐                  ┌──────────────────┐                 ┌──────────┐
│  THREAT  │                  │     THREAT        │                 │  THREAT  │
│ (anônimo)│                  │  (visitante freq) │                 │ (João)   │
└──────────┘                  └──────────────────┘                 └──────────┘

Decaimento de importância:
  KNOWN: importance decai lentamente (meia-vida = 90 dias sem visita)
  FREQUENT_UNKNOWN: decai mais rápido (meia-vida = 30 dias)
  UNKNOWN: decai muito rápido (meia-vida = 7 dias)
  THREAT: NUNCA decai (sempre relevante)
```

---

## 11. Consultas Típicas do LLM à Memória

O LLM pode "consultar" a memória através de funções (tool calling):

```python
# Funções expostas ao LLM para consulta de memória
MEMORY_TOOLS = [
    {
        "name": "get_person_info",
        "description": "Busca informações sobre uma pessoa pelo nome ou ID",
        "parameters": {"person_id_or_name": "string"}
    },
    {
        "name": "get_recent_events",
        "description": "Retorna eventos dos últimos N minutos",
        "parameters": {"minutes": "int", "camera_id": "string (optional)"}
    },
    {
        "name": "get_visit_history",
        "description": "Histórico de visitas de uma pessoa",
        "parameters": {"person_id": "string", "days": "int"}
    },
    {
        "name": "get_co_visitors",
        "description": "Pessoas que costumam visitar junto com a pessoa X",
        "parameters": {"person_id": "string"}
    },
    {
        "name": "check_similar_event",
        "description": "Busca eventos similares no histórico",
        "parameters": {"description": "string", "days": "int"}
    },
    {
        "name": "get_hourly_pattern",
        "description": "Padrão de atividade por hora em uma câmera",
        "parameters": {"camera_id": "string", "days": "int"}
    },
]
```

---

## 12. Ciclo de Consolidação Contínua (Continuous Self-Learning Loop)

> **Novo**: Issue [#1](https://github.com/ZanettiLG/SecurityAgent/issues/1) — Fase 4

### Conceito

O Ciclo de Consolidação Contínua é o mecanismo que transforma o Vigia de um
sistema **reativo** (processa evento → responde) para um sistema **reflexivo**
(observa → relaciona → aprende → pergunta → atualiza modelo mental).

Em vez de tratar cada evento isoladamente, o agente periodicamente "para e pensa"
sobre o que observou, consolidando conhecimento como um vigia humano faria.

### Arquitetura do Ciclo

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Novos Eventos │ ──▶ │ Context Compiler │ ──▶ │ LLM Consolidation │
│ (buffer)      │     │ (monta prompt    │     │ ("O que aprendi   │
│               │     │  com eventos     │     │  de novo?")       │
│               │     │  recentes + KG)  │     │                   │
└──────────────┘     └─────────────────┘     └────────┬──────────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────┐
│ Ações de Consolidação                                         │
│                                                               │
│ ✅ Novo fato: "Carro ABC é associado à vizinha Fulana"        │
│    → update KnowledgeGraph                                    │
│                                                               │
│ ✅ Padrão: "Carteiro agora vem às 11h em vez de 10h"          │
│    → update RoutineLearner                                    │
│                                                               │
│ ✅ Hipótese atualizada: "Motorista ≠ Olinda" (confirmado)     │
│    → update HypothesisEngine                                  │
│                                                               │
│ ❓ Dúvida: "Quem é a pessoa de boné azul?"                    │
│    → criar Question para o usuário                            │
│                                                               │
│ 🔄 Sumarização: eventos antigos → memória compacta             │
│    → salvar em long_term_memories                             │
└──────────────────────────────────────────────────────────────┘
```

### Gatilhos de Consolidação

O ciclo é disparado por **três tipos de gatilhos**:

| Gatilho                  | Condição                              | Exemplo                                           |
| ------------------------ | ------------------------------------- | ------------------------------------------------- |
| **Temporal**             | A cada N minutos                      | A cada 5 minutos, consolida eventos novos         |
| **Quantitativo**         | Após N eventos não-consolidados       | 50 eventos novos → dispara consolidação           |
| **Evento significativo** | Evento de alta severidade ou anomalia | Pessoa desconhecida às 3h → consolidação imediata |

### Prompt de Consolidação

```
Você é o Vigia, um agente de segurança com inteligência ambiental contínua.
Revise os eventos recentes e o conhecimento atual para aprender.

## CONHECIMENTO ATUAL
{scene_context}
{knowledge_graph_summary}
{active_hypotheses}

## EVENTOS RECENTES (últimos {N} minutos)
{recent_events}

## PERGUNTAS PENDENTES
{pending_questions}

## TAREFA
Analise os eventos recentes e:

1. IDENTIFIQUE NOVOS FATOS:
   - Alguma entidade nova foi observada? (pessoa, veículo)
   - Alguma relação foi descoberta? (pessoa X associada a veículo Y)
   - Algum padrão mudou? (carteiro agora vem em horário diferente)

2. ATUALIZE HIPÓTESES:
   - Alguma hipótese foi confirmada pelos novos eventos?
   - Alguma hipótese foi refutada?
   - Novas hipóteses devem ser criadas?

3. IDENTIFIQUE DÚVIDAS:
   - O que você gostaria de perguntar ao usuário?
   - Há informação que poderia ser útil para entender melhor os eventos?

4. SUMARIZE:
   - Eventos antigos que podem ser comprimidos em uma memória compacta

Responda em JSON estruturado.
```

### Output Esperado

```json
{
  "newFacts": [
    {
      "type": "vehicle_person_association",
      "description": "Carro prata XYZ-9999 parece estar associado à vizinha Fulana",
      "confidence": 0.65,
      "action": "update_knowledge_graph"
    }
  ],
  "hypothesisUpdates": [
    {
      "hypothesisId": "hyp_abc123",
      "newStatus": "confirmed",
      "reason": "Motorista foi visto 5x com a mesma pessoa, compatível com H3"
    }
  ],
  "questions": [
    {
      "text": "A vizinha Fulana tem algum parente que dirige um carro prata?",
      "priority": "low",
      "context": "Carro prata visto 3x esta semana em frente à casa azul"
    }
  ],
  "summaries": [
    {
      "eventIds": ["evt_old_1", "evt_old_2"],
      "compactMemory": "Carteiro visitou diariamente entre 10h-11h por 30 dias consecutivos"
    }
  ]
}
```

### Implementação no Agent

```typescript
class ConsolidationLoop {
  private interval: ReturnType<typeof setInterval> | null = null;
  private unconsolidatedCount = 0;

  constructor(
    private agent: SecurityAgent,
    private options: {
      intervalMs: number; // 5 * 60 * 1000
      eventThreshold: number; // 50
    },
  ) {}

  start(): void {
    this.interval = setInterval(() => {
      this.consolidate();
    }, this.options.intervalMs);

    // Também dispara por contagem de eventos
    this.agent.bus.on("event.*", () => {
      this.unconsolidatedCount++;
      if (this.unconsolidatedCount >= this.options.eventThreshold) {
        this.consolidate();
      }
    });

    // Dispara imediatamente em eventos críticos
    this.agent.bus.on("event.*", (event: SecurityEvent) => {
      if (event.severity >= Severity.HIGH) {
        this.consolidate();
      }
    });
  }

  async consolidate(): Promise<void> {
    const context = await this.agent.contextCompiler.compileForConsolidation();
    const prompt = this.buildConsolidationPrompt(context);
    const result = await this.agent.llmClient.generate(prompt);
    const actions = JSON.parse(result);

    // Executa ações de consolidação
    for (const fact of actions.newFacts) {
      await this.applyNewFact(fact);
    }
    for (const update of actions.hypothesisUpdates) {
      await this.agent.hypothesisEngine.update(update);
    }
    for (const question of actions.questions) {
      this.agent.queryManager.createQuestion(question);
    }
    for (const summary of actions.summaries) {
      await this.agent.memory.storeCompactMemory(summary);
    }

    this.unconsolidatedCount = 0;
    logger.info(
      { facts: actions.newFacts.length, questions: actions.questions.length },
      "Consolidation cycle complete",
    );
  }
}
```

---

## 13. Referência Cruzada com o GitHub Issue

A implementação completa destas novas capacidades de memória está
rastreada no **[Issue #1 — Memória Persistente Multi-Sessão e Compreensão
Contextual Instintiva do Ambiente](https://github.com/ZanettiLG/SecurityAgent/issues/1)**.
