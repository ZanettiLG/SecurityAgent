# Sistema de Memória — SecurityAgent

## 1. Visão Geral

O sistema de memória é o que torna o SecurityAgent "inteligente" ao longo do tempo. Ele implementa um modelo inspirado na memória humana:

| Tipo | Duração | Capacidade | Função |
|------|---------|------------|--------|
| **Memória Sensorial** | ~5 segundos | Ilimitada (buffer circular) | Últimos frames de vídeo/áudio para contexto imediato |
| **Memória de Curto Prazo (STM)** | ~5-30 minutos | ~300 eventos | Eventos recentes para detecção de padrões de curto prazo |
| **Memória de Longo Prazo (LTM)** | Indefinido | Ilimitada (com compressão) | Histórico, padrões, pessoas conhecidas |
| **Memória Vetorial** | Indefinido | Ilimitada | Embeddings de rostos e vozes para matching |
| **Memória Episódica** | Indefinido | Ilimitada | Eventos específicos com contexto rico |
| **Memória Semântica** | Indefinido | Ilimitada | Fatos, regras, conhecimento sobre pessoas |

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

## 6. Memória de Longo Prazo & Consolidação

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

## 7. Detecção de Anomalias

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

## 8. Grafo de Conhecimento

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

## 9. Ciclo de Vida de uma Pessoa no Sistema

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

## 10. Consultas Típicas do LLM à Memória

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
