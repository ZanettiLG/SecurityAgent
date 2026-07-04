# 10 — Scene Context Bootstrapping

## Objetivo

Fazer o Vigia **lembrar o que é normal em cada câmera** — não só detectar
movimento, mas entender semanticamente o contexto da cena para comparar o
presente com o passado e detectar anomalias reais (ex: "esse carro nunca
fica parado aqui às 3h da manhã").

**Issue**: [#1 — Fase 2](https://github.com/ZanettiLG/SecurityAgent/issues/1)

## Dependências

- ✅ 07-persistence (SceneIndex com SQLite + ChromaDB)
- ✅ 04-llm-client (SceneAnalyzer usa LLM Vision)

## Arquivos a criar/modificar

```
src/memory/scene-context-store.ts  # NOVO — Context-aware wrapper sobre SceneIndex
src/core/agent.ts                  # MODIFICAR — Wire SceneIndex + SceneContextStore
src/memory/system.ts               # MODIFICAR — scene context no getContextForLlm()
handoff/10-scene-context.md        # NOVO — este arquivo
```

---

## Design

### Fluxo de Dados

```
Camera Loop
  │
  ├─► VisionPipeline → motion event
  │
  └─► SceneAnalyzer.analyze(frame, motionScore)
        │
        ├─ LLM Vision → SceneDescription JSON
        ├─ Cria SceneObservation
        ├─ bus.publish("scene.observation", obs)  ← já existe
        │
        └─► [NOVO] bus.subscribe("scene.observation")
              │
              ├─► SceneIndex.store(obs)     ← SQLite + ChromaDB
              └─► SceneContextStore.ingest(obs) ← in-memory context
```

### SceneContextStore

Mantém um buffer rotativo de contexto por câmera em memória:

```typescript
class SceneContextStore {
  // Por câmera: últimas N observações (mais recentes primeiro)
  private contexts: Map<string, SceneObservation[]> = new Map();
  private readonly MAX_PER_CAMERA = 50;

  // Injeta nova observação no contexto
  ingest(obs: SceneObservation): void { ... }

  // Boot context: carrega observações recentes do SceneIndex no startup
  async bootstrap(sceneIndex: SceneIndex, cameraIds: string[]): Promise<void> { ... }

  // Gera um sumário textual para o LLM (contexto de cena)
  getLlmContext(cameraId: string): string { ... }

  // Detecta anomalias semânticas comparando com baseline
  detectAnomaly(obs: SceneObservation): { isAnomaly: boolean; reason: string } { ... }
}
```

### getLlmContext() — formato de saída

```
[Contexto da câmera "externa" últimas 2h]
- 5 observações registradas
- Pessoas vistas: 2 (1 conhecida, 1 desconhecida)
- Veículos: 1 sedan prata estacionado há ~30min
- Ações: "caminhando", "entregando pacote"
- Anomalias anteriores: 0
- Padrão do horário: movimento baixo, típico para 23h
```

---

## Tarefa 10.1: `src/memory/scene-context-store.ts`

### Interface

```typescript
export class SceneContextStore {
  ingest(observation: SceneObservation): void;
  async bootstrap(sceneIndex: SceneIndex, cameraIds: string[]): Promise<void>;
  getLlmContext(cameraId: string): string;
  getPersonSummary(cameraId: string): { known: number; unknown: number };
  detectAnomaly(obs: SceneObservation): { isAnomaly: boolean; reason: string };
}
```

### Comportamento

- `ingest()`: adiciona no início do array, trunca em MAX_PER_CAMERA
- `bootstrap()`: carrega últimas 20 observações por câmera do SceneIndex
- `getLlmContext()`: gera texto estruturado com estatísticas das últimas observações
- `detectAnomaly()`: compara persons/vehicles/actions do obs atual com baseline

---

## Tarefa 10.2: Wiring no `agent.ts`

### Subscriber

Após `bus.subscribe("behavior.match", ...)`:

```typescript
this.bus.subscribe("scene.observation", (_topic, payload) => {
  const obs = payload as unknown as SceneObservation;
  if (obs && this.memory) {
    void this.memory.sceneIndex.store(obs);
    void this.sceneContextStore?.ingest(obs);

    // Detecta anomalia semântica e publica se encontrada
    const anomaly = this.sceneContextStore?.detectAnomaly(obs);
    if (anomaly?.isAnomaly) {
      this.bus.publish("scene.anomaly", {
        cameraId: obs.cameraId,
        reason: anomaly.reason,
        observation: obs,
      });
    }
  }
});
```

### Bootstrap no startup

No final de `setup()`, após inicializar SceneContextStore:

```typescript
this.sceneContextStore = new SceneContextStore();
await this.sceneContextStore.bootstrap(
  this.memory.sceneIndex,
  this.config.cameras.filter((c) => c.enabled).map((c) => c.id),
);
```

---

## Tarefa 10.3: `MemorySystem.getContextForLlm()` aprimorado

Adicionar `sceneContext` ao retorno:

```typescript
async getContextForLlm(event: SecurityEvent): Promise<Record<string, unknown>> {
  // ... existing code ...
  return {
    recentEvents: ...,
    personsInvolved: ...,
    sceneContext: event.cameraId
      ? this.sceneContextStore?.getLlmContext(event.cameraId) ?? null
      : null,
  };
}
```

---

## ✅ Acceptance Criteria

- [ ] `SceneContextStore` criado com ingest + bootstrap + getLlmContext
- [ ] `scene.observation` events automaticamente armazenados no SceneIndex
- [ ] Bootstrap carrega contexto histórico no startup
- [ ] `getContextForLlm()` inclui scene context quando cameraId disponível
- [ ] `detectAnomaly()` compara observação atual com baseline
- [ ] `scene.anomaly` publicado quando anomalia semântica detectada
- [ ] Build TypeScript limpo (`npx tsc --noEmit`)
