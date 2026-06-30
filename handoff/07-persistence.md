# 07 — Persistence Layer: SQLite + ChromaDB + Full Multi-Session

## Objetivo

Substituir **todos** os stores in-memory por persistência real. Sem isso,
o sistema esquece tudo ao reiniciar — inaceitável para um Vigia.

**Novo direcionamento** ([Issue #1](https://github.com/ZanettiLG/SecurityAgent/issues/1)):
Persistência não só de eventos e pessoas, mas também do Knowledge Graph,
rotinas aprendidas, histórico de conversas, hipóteses e contexto de cena.

## Arquivos a criar/modificar

```
src/memory/
├── system.ts              # MODIFICAR — usar todos os stores persistentes
├── sqlite-event-store.ts  # NOVO — EventStore com SQLite (better-sqlite3)
├── chroma-vector-store.ts # NOVO — VectorStore com ChromaDB
├── person-store.ts        # NOVO — PersonRegistry com SQLite
├── kg-store.ts            # NOVO — KnowledgeGraph persistente (Issue #1)
├── routine-store.ts       # NOVO — RoutineProfile persistente (Issue #1)
├── hypothesis-store.ts    # NOVO — Hypothesis persistente (Issue #1)
├── conversation-store.ts  # NOVO — ConversationHistory persistente (Issue #1)
└── scene-context-store.ts # NOVO — SceneContext persistente (Issue #1)
```

## Tarefa 7.1: `src/memory/sqlite-event-store.ts`

### Requisitos

- Usa `better-sqlite3` (síncrono, rápido, sem dependências nativas complexas)
- Schema compatível com `db/init.sql`
- Implementa a mesma interface que `EventStore` atual

```typescript
import Database from "better-sqlite3";

export class SqliteEventStore {
  private db: Database.Database;
  private insertStmt: Database.Statement;
  private selectRecentStmt: Database.Statement;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.prepareStatements();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        camera_id TEXT,
        event_type TEXT NOT NULL,
        severity INTEGER NOT NULL DEFAULT 0,
        persons_involved TEXT DEFAULT '[]',
        description TEXT DEFAULT '',
        snapshot_path TEXT,
        audio_clip_path TEXT,
        payload TEXT DEFAULT '{}',
        actions_taken TEXT DEFAULT '[]',
        llm_summary TEXT,
        anomaly_score REAL DEFAULT 0.0,
        consolidated INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    `);
  }

  async insert(event: SecurityEvent): Promise<void> {
    this.insertStmt.run(
      event.eventId,
      event.timestamp.toISOString(),
      event.cameraId,
      event.eventType,
      event.severity,
      JSON.stringify(event.personsInvolved),
      event.description,
      event.snapshotPath,
      event.audioClipPath,
      JSON.stringify(event.payload),
      JSON.stringify(event.actionsTaken),
      event.llmSummary,
      event.anomalyScore,
      event.consolidated ? 1 : 0,
    );
  }

  async getRecent(minutes = 60): Promise<SecurityEvent[]> {
    const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
    const rows = this.selectRecentStmt.all(cutoff) as any[];
    return rows.map(rowToEvent);
  }

  // + getByDate, countSoundEvents, etc.
}
```

### Helper de serialização

```typescript
function rowToEvent(row: any): SecurityEvent {
  return {
    eventId: row.event_id,
    timestamp: new Date(row.timestamp),
    cameraId: row.camera_id,
    eventType: row.event_type as EventType,
    severity: row.severity as Severity,
    personsInvolved: JSON.parse(row.persons_involved),
    description: row.description,
    snapshotPath: row.snapshot_path,
    audioClipPath: row.audio_clip_path,
    payload: JSON.parse(row.payload),
    actionsTaken: JSON.parse(row.actions_taken),
    llmSummary: row.llm_summary,
    anomalyScore: row.anomaly_score,
    consolidated: row.consolidated === 1,
  };
}
```

## Tarefa 7.2: `src/memory/person-store.ts`

### Requisitos

- SQLite para `PersonRecord`
- Schema: `persons` table + `person_sightings` table
- Métodos: `get`, `save`, `getByName`, `all`, `recordVisit`

```typescript
export class SqlitePersonRegistry {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        person_id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT NOT NULL DEFAULT 'unknown',
        face_embedding_count INTEGER DEFAULT 0,
        voice_embedding_count INTEGER DEFAULT 0,
        first_seen TEXT,
        last_seen TEXT,
        total_visits INTEGER DEFAULT 0,
        avg_visit_duration REAL DEFAULT 0.0,
        common_hours TEXT DEFAULT '[]',
        common_days TEXT DEFAULT '[]',
        common_entrances TEXT DEFAULT '[]',
        importance REAL DEFAULT 0.5,
        threat_score REAL DEFAULT 0.0,
        tags TEXT DEFAULT '[]',
        notes TEXT,
        metadata TEXT DEFAULT '{}'
      );
    `);
  }
  // ... CRUD methods
}
```

## Tarefa 7.3: `src/memory/chroma-vector-store.ts`

### Requisitos

- Implementa a interface `VectorStore` usando `chromadb` npm package
- Coleções: `face_embeddings`, `voice_embeddings`
- Fallback para `InMemoryVectorStore` se ChromaDB offline

```typescript
import { ChromaClient } from "chromadb";

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collections = new Map<string, any>();
  private fallback = new InMemoryVectorStore();
  private online = false;

  constructor(host?: string) {
    this.client = new ChromaClient({ path: host ?? "http://localhost:8000" });
  }

  async initialize(): Promise<void> {
    try {
      await this.client.heartbeat();
      this.online = true;
      logger.info("ChromaDB connected");
    } catch {
      logger.warn("ChromaDB offline, using in-memory fallback");
      this.online = false;
    }
  }

  async search(
    collection: string,
    queryVector: number[],
    topK = 5,
  ): Promise<VectorMatch[]> {
    if (!this.online)
      return this.fallback.search(collection, queryVector, topK);

    const col = await this.getOrCreateCollection(collection);
    const results = await col.query({
      queryEmbeddings: [queryVector],
      nResults: topK,
    });
    // Mapeia resultado ChromaDB → VectorMatch[]
    return (results.ids[0] ?? []).map((id: string, i: number) => ({
      id,
      score: results.distances?.[0]?.[i] ?? 0,
      metadata: results.metadatas?.[0]?.[i] ?? {},
    }));
  }

  // ... insert, delete, count
}
```

## Tarefa 7.4: Modificar `src/memory/system.ts`

### Adicionar `initialize()` e usar stores reais

```typescript
export class MemorySystem {
  vectorStore: VectorStore;
  eventStore: SqliteEventStore;
  personRegistry: SqlitePersonRegistry;
  anomalyDetector: AnomalyDetector;
  knowledgeGraph?: KnowledgeGraph; // será adicionado na task 09

  constructor(config?: { dataDir?: string; chromaHost?: string }) {
    const dataDir = config?.dataDir ?? "./data";
    this.eventStore = new SqliteEventStore(`${dataDir}/events.db`);
    this.personRegistry = new SqlitePersonRegistry(`${dataDir}/persons.db`);

    const chromaVs = new ChromaVectorStore(config?.chromaHost);
    this.vectorStore = chromaVs;
    // chromaVs.initialize() é chamado em this.initialize()

    this.anomalyDetector = new AnomalyDetector(
      this.eventStore,
      this.personRegistry,
    );
  }

  async initialize(): Promise<void> {
    if (this.vectorStore instanceof ChromaVectorStore) {
      await this.vectorStore.initialize();
    }
    logger.info("Memory system initialized with persistence");
  }

  // Mantém os mesmos métodos públicos
  async store(event: SecurityEvent): Promise<void> {
    await this.eventStore.insert(event);
  }

  async getContextForLlm(
    event: SecurityEvent,
  ): Promise<Record<string, unknown>> {
    // Usa eventStore real
    const recent = await this.eventStore.getRecent(10);
    // ...
  }

  async consolidate(): Promise<void> {
    // Marca eventos como consolidated
    logger.info("Memory consolidation complete");
  }
}
```

## Dependências npm

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

`chromadb` já está no package.json.

## Verificação

```bash
# Teste manual
npx tsx -e "
import { MemorySystem } from './src/memory/system.js';
const mem = new MemorySystem({ dataDir: './data' });
await mem.initialize();

const event = createEvent({ eventType: 'person_detected', description: 'Teste' });
await mem.store(event);

const recent = await mem.eventStore.getRecent(1440);
console.log('Events stored:', recent.length);
"
```

## Dependências

- `better-sqlite3` (npm install)
- `chromadb` (já no package.json)
- `src/core/types.ts`
- `src/core/logger.ts`

## Entregáveis

- [ ] `src/memory/sqlite-event-store.ts`
- [ ] `src/memory/person-store.ts`
- [ ] `src/memory/chroma-vector-store.ts`
- [ ] `src/memory/system.ts` modificado — `initialize()`, stores reais
- [ ] Schema SQLite compatível com `db/init.sql`
- [ ] ChromaDB com fallback in-memory
- [ ] Compila com `tsc --noEmit`
- [ ] Teste manual: eventos persistem entre reinícios

---

## Tarefa 7.5: `src/memory/kg-store.ts` — Knowledge Graph Persistente (Issue #1)

### Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS kg_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- PERSON, VEHICLE, CAMERA, LOCATION, INCIDENT
  label TEXT NOT NULL,
  properties TEXT DEFAULT '{}', -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kg_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_node TEXT NOT NULL,
  to_node TEXT NOT NULL,
  type TEXT NOT NULL,           -- VISITED_WITH, ASSOCIATED_WITH, SEEN_AT, OWNS
  properties TEXT DEFAULT '{}', -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY (from_node) REFERENCES kg_nodes(id),
  FOREIGN KEY (to_node) REFERENCES kg_nodes(id)
);

CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON kg_edges(from_node);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON kg_edges(to_node);
CREATE INDEX IF NOT EXISTS idx_kg_edges_type ON kg_edges(type);
```

### Implementação

```typescript
export class PersistentKnowledgeGraph extends KnowledgeGraph {
  private db: Database.Database;

  constructor(dbPath: string) {
    super();
    this.db = new Database(dbPath);
  }

  async load(): Promise<void> {
    // Carrega todos os nodes e edges do SQLite para memória
    const nodes = this.db.prepare("SELECT * FROM kg_nodes").all();
    for (const row of nodes) {
      this.addNode({
        id: row.id,
        type: row.type as NodeType,
        label: row.label,
        properties: JSON.parse(row.properties),
      });
    }

    const edges = this.db.prepare("SELECT * FROM kg_edges").all();
    for (const row of edges) {
      this.edges.push({
        from: row.from_node,
        to: row.to_node,
        type: row.type as EdgeType,
        properties: JSON.parse(row.properties),
        createdAt: new Date(row.created_at),
      });
    }
  }

  override addNode(node: GraphNode): void {
    super.addNode(node);
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO kg_nodes (id, type, label, properties, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        node.id,
        node.type,
        node.label,
        JSON.stringify(node.properties),
        new Date().toISOString(),
        new Date().toISOString(),
      );
  }

  override addEdge(
    from: string,
    to: string,
    type: EdgeType,
    properties?: Record<string, unknown>,
  ): void {
    super.addEdge(from, to, type, properties);
    this.db
      .prepare(
        `
      INSERT INTO kg_edges (from_node, to_node, type, properties, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        from,
        to,
        type,
        JSON.stringify(properties ?? {}),
        new Date().toISOString(),
      );
  }
}
```

---

## Tarefa 7.6: `src/memory/routine-store.ts` — Routine Profiles Persistentes (Issue #1)

### Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS routine_profiles (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,    -- camera, person, vehicle, location, universal, category
  hourly_activity TEXT NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
  daily_activity TEXT NOT NULL DEFAULT '[0,0,0,0,0,0,0]',
  typical_events TEXT DEFAULT '{}', -- JSON map
  total_observations INTEGER DEFAULT 0,
  days_of_data INTEGER DEFAULT 0,
  last_updated TEXT
);
```

### Integração no RoutineLearner

- `initialize()`: carrega profiles do SQLite
- `updateProfile()`: write-through para SQLite
- `getProfile()`: cache em memória, fallback para SQLite

---

## Tarefa 7.7: `src/memory/conversation-store.ts` — Histórico de Conversas (Issue #1)

### Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS conversation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL,
  text TEXT NOT NULL,
  answer TEXT NOT NULL,
  asked_at TEXT NOT NULL,
  answered_at TEXT,
  priority TEXT DEFAULT 'medium',
  related_entities TEXT DEFAULT '[]',
  related_event_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_conv_ts ON conversation_history(asked_at);
```

### Integração no QueryManager

- `initialize()`: carrega últimas N conversas
- `createQuestion()`: persiste a pergunta
- `processAnswer()`: persiste a resposta
- `getConversationSummary()`: lê do SQLite em vez de array em memória

---

## Tarefa 7.8: `src/memory/hypothesis-store.ts` — Hipóteses Persistentes (Issue #1)

### Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS hypotheses (
  hypothesis_id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  probability REAL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, testing, confirmed, rejected, user_confirmed, user_rejected, inconclusive
  related_entities TEXT DEFAULT '[]',
  related_events TEXT DEFAULT '[]',
  evidence_for TEXT DEFAULT '[]',
  evidence_against TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Integração no HypothesisEngine

- `initialize()`: carrega hipóteses ativas (status = testing/draft)
- Cada mutation persiste no SQLite
- Hipóteses `confirmed` ou `rejected` com >30 dias podem ser arquivadas

---

## Tarefa 7.9: `src/memory/scene-context-store.ts` — Contexto de Cena Persistente (Issue #1)

### Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS scene_contexts (
  camera_id TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  spatial_layout TEXT DEFAULT '',
  known_persons TEXT DEFAULT '[]',
  known_vehicles TEXT DEFAULT '[]',
  zones TEXT DEFAULT '[]',
  acquired_facts TEXT DEFAULT '[]',
  confidence REAL DEFAULT 0.5,
  status TEXT DEFAULT 'uninitialized',  -- uninitialized, bootstrapped, active
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Integração

- `CameraConnector` ganha referência ao `SceneContext`
- No `agent.setup()`, carrega todos os SceneContexts
- No prompt do LLM, o SceneContext da câmera do evento é sempre injetado
- `SceneAnalyzer` (do semantic-scene-index) atualiza o SceneContext

---

## Verificação Final (Issue #1)

```bash
# Iniciar agente
npm run dev

# Verificar persistência pós-restart
# 1. Deixa o agente rodar por alguns minutos
# 2. Reinicia o agente
# 3. Verifica se:
#    - Knowledge Graph manteve nodes e edges
#    - RoutineLearner manteve perfis
#    - Histórico de conversas foi preservado
#    - Hipóteses ativas foram mantidas
#    - SceneContexts foram carregados
```
