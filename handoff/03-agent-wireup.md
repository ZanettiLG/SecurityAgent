# 03 — Agent Wire-up: Conectar Todos os Subsistemas

## Objetivo

O `src/core/agent.ts` tem a estrutura mas está cheio de `TODO`.
Esta tarefa conecta cada subsistema real e remove todos os placeholders.

## Pré-requisitos

Antes de começar, estas tarefas devem estar concluídas:
- `01-perception` — `VisionPipeline`, `MockConnector`
- `02-vehicle-tracker` — `VehicleTracker`
- `04-llm-client` — `LlmClient`
- `07-persistence` — `MemorySystem` com persistência real
- `08-behavioral-fixes` — `BehavioralPatternMatcher` com actorLevel

## Arquivo a modificar

```
src/core/agent.ts
```

## O que fazer

### 1. Substituir TODOs por instanciações reais

No método `setup()`, instanciar cada subsistema:

```typescript
async setup(): Promise<void> {
  // Core
  this.memory = new MemorySystem(this.config);
  await this.memory.initialize();

  this.visionPipeline = new VisionPipeline(this.bus, this.memory);
  this.llmClient = new LlmClient(this.config.llm);
  this.rulesEngine = new RulesEngine();

  const actions = createDefaultActions();
  this.goapPlanner = new GoapAgent(
    new GoapPlanner(actions),
    actions,
  );
  for (const goal of createDefaultGoals()) {
    this.goapPlanner.addGoal(goal);
  }

  // Vigia
  this.vehicleTracker = new VehicleTracker(this.memory, this.bus);
  this.routineLearner = new RoutineLearner(this.memory);
  this.patternMiner = new PatternMiner(this.memory, this.routineLearner);
  this.hypothesisEngine = new HypothesisEngine(this.llmClient, this.memory);
  this.behaviorMatcher = new BehavioralPatternMatcher();
  this.queryManager = new QueryManager(this.bus);

  // Registrar assinaturas padrão
  for (const sig of createDefaultSignatures()) {
    this.behaviorMatcher.registerSignature(sig);
  }

  logger.info("All subsystems initialized");
}
```

### 2. Substituir TODOs no `handleEvent`

Cada método privado deve chamar o subsistema real:

```typescript
async handleEvent(event: SecurityEvent): Promise<void> {
  // 1. Memória
  await this.memory.store(event);

  // 2. Rotina (3 camadas)
  if (this.routineLearner) {
    this.routineLearner.observe(event);
    const atypicalScore = this.routineLearner.scoreAtypical(event);
    if (atypicalScore > 0.5) {
      event.anomalyScore = Math.max(event.anomalyScore, atypicalScore);
    }
  }

  // 3. Behavioral Pattern Matching (Vigia)
  if (this.behaviorMatcher) {
    const match = this.behaviorMatcher.matchStreaming(event);
    if (match) {
      logger.warn({ match: match.evidenceSummary }, "Behavioral pattern matched");
      // Publica evento de match
      this.bus.publish("behavior.match", match);
    }
  }

  // 4. Rules engine
  const ruleActions = await this.rulesEngine.evaluate(event);
  for (const action of ruleActions) {
    await this.actions.execute(action);
  }

  // 5. World state
  this.updateWorldState(event);

  // 6. Anomaly
  event.anomalyScore = await this.memory.anomalyDetector.scoreEvent(event);
  if (event.anomalyScore > 0.6) {
    event.severity = Math.max(event.severity, Severity.MEDIUM);
  }

  // 7. Vehicle check
  if (event.eventType === EventType.VEHICLE_DETECTED && this.vehicleTracker) {
    const duration = (event.payload.durationSeconds as number) || 0;
    if (duration > 600 && !event.payload.identified) {
      this.queryManager.createQuestion({
        text: `Veículo parado há ${Math.floor(duration / 60)} min. Conhece?`,
        priority: "medium",
        expectedType: "person_name",
        relatedEventId: event.eventId,
      });
    }
  }

  // 8. LLM
  if (this.needsLlm(event)) {
    void this.llmEvaluate(event);
  }

  // 9. Hypotheses
  if (event.anomalyScore > 0.5 && this.hypothesisEngine) {
    void this.generateHypothesesForEvent(event);
  }
}
```

### 3. Implementar `llmEvaluate`

```typescript
private async llmEvaluate(event: SecurityEvent): Promise<void> {
  try {
    const context = await this.memory.getContextForLlm(event);
    const assessment = await this.llmClient.evaluate(event, context);
    this.bus.publish("llm.assessment", assessment);

    // Se LLM sugeriu ações, executa
    for (const action of assessment.suggestedActions) {
      await this.actions.execute(action);
    }
  } catch (err) {
    logger.error({ err, eventId: event.eventId }, "LLM evaluation failed");
  }
}
```

### 4. Implementar `_camera_loop` com câmeras reais

```typescript
async run(): Promise<void> {
  await this.setup();
  this.running = true;

  // Cria conectores de câmera da config
  this.cameras = this.config.cameras
    .filter(c => c.enabled)
    .map(c => createCameraConnector(c));

  // Event handler
  this.bus.subscribeMany(
    ["vision.event", "audio.event", "system.event"],
    (_topic, payload) => {
      if (payload && "eventType" in payload) {
        void this.handleEvent(payload as unknown as SecurityEvent);
      }
    },
  );

  // Behavior match handler
  this.bus.subscribe("behavior.match", (_topic, match) => {
    const m = match as BehaviorMatch;
    if (m.overallScore() > 0.7) {
      // Alerta elevado
      void this.actions.execute("alert_high", {
        message: `Padrão detectado: ${m.signature.name} — ${(m.overallScore() * 100).toFixed(0)}%`,
      });
    }
  });

  // Inicia streams de câmera
  const cameraTasks = this.cameras.map(camera =>
    this.runCameraLoop(camera),
  );

  // GOAP tick
  this.tickInterval = setInterval(() => {
    void this.goapTick();
  }, this.config.goap.tickIntervalMs);

  // Consolidação
  setInterval(() => {
    void this.memory.consolidate();
  }, 3_600_000);

  await Promise.all(cameraTasks);
}

private async runCameraLoop(connector: CameraConnector): Promise<void> {
  logger.info(`Starting camera: ${connector.cameraId}`);
  while (this.running) {
    try {
      await connector.connect();
      for await (const frame of connector.stream()) {
        const event = await this.visionPipeline.process(frame);
        if (event) {
          this.bus.publish("vision.event", event);
        }
        // Vehicle tracking (paralelo)
        if (this.vehicleTracker) {
          const vehicleEvents = await this.vehicleTracker.processFrame(frame.cameraId);
          for (const ve of vehicleEvents) {
            this.bus.publish("vision.event", ve);
          }
        }
      }
    } catch (err) {
      logger.error({ err, camera: connector.cameraId }, "Camera error, retrying in 5s");
      await sleep(5000);
    }
  }
}
```

### 5. Inicializar WorldState com valores da config

```typescript
this.worldState = new WorldState({
  system_mode: this.config.system.mode,
  alarm_active: false,
  perimeter_secured: true,
  people_inside: 0,
  people_at_door: 0,
  unknown_person_present: false,
  cameras_online: this.config.cameras.filter(c => c.enabled).length,
  threat_level: 0,
  intrusion_detected: false,
  main_door_locked: true,
  garage_door_closed: true,
  lights_on: false,
  time_of_day: this.timeOfDay(),
  recording_active: false,
});
```

### 6. Tipos dos subsistemas

Substituir `unknown` pelos tipos corretos:

```typescript
import { VisionPipeline } from "../processing/vision-pipeline.js";
import { VehicleTracker } from "../processing/vehicle-tracker.js";
import { MemorySystem } from "../memory/system.js";
import { RoutineLearner } from "../memory/routine_learner.js";
import { PatternMiner } from "../memory/pattern_miner.js";
import { GoapAgent, GoapPlanner } from "../reasoning/goap/planner.js";
import { RulesEngine } from "../reasoning/rules/engine.js";
import { LlmClient } from "../reasoning/llm/client.js";
import { HypothesisEngine } from "../reasoning/hypothesis.js";
import { BehavioralPatternMatcher, type BehaviorMatch } from "../reasoning/behavioral_pattern.js";
import { QueryManager } from "../actions/query_user.js";
import { ActionRegistry } from "../actions/registry.js";
import { createCameraConnector, type CameraConnector } from "../perception/camera-connector.js";
import { createDefaultSignatures } from "../reasoning/behavioral_pattern.js";
import { createDefaultActions, createDefaultGoals } from "../reasoning/goap/planner.js";
```

## Verificação

```bash
npm run typecheck  # Deve passar sem erros
npm run dev        # Deve iniciar e logar "All subsystems initialized"
```

## Dependências

- Todas as tarefas 01, 02, 04, 07, 08

## Entregáveis

- [ ] `src/core/agent.ts` sem TODOs
- [ ] Todos os subsistemas instanciados em `setup()`
- [ ] `handleEvent` completo com pipeline real
- [ ] `_camera_loop` funcional com conectores
- [ ] `run()` inicia todos os loops
- [ ] Imports tipados (sem `unknown`)
- [ ] `npm run typecheck` passa
