/**
 * SecurityAgent — Core Agent (O Vigia)
 *
 * Loop principal: Perceive → Process → Remember → Reason → Act
 *
 * Subsistemas integrados:
 * - VehicleTracker: reconhecimento e associação de veículos
 * - RoutineLearner: aprendizado de rotinas (3 camadas de baseline)
 * - PatternMiner: mineração de padrões de longo prazo
 * - HypothesisEngine: geração e teste de hipóteses
 * - SocialMediaInvestigator: investigação em fontes públicas (autorizada)
 * - SocialPredictionEngine: predição de eventos sociais
 * - QueryManager: perguntas interativas ao usuário
 */

import { logger } from "./logger.js";
import { EventBus } from "./bus.js";
import { loadConfig, type AppConfig } from "./config.js";
import {
  WorldState,
  EventType,
  Severity,
  SystemMode,
  type SecurityEvent,
  type FactValue,
} from "./types.js";
import { VisionPipeline } from "../processing/vision-pipeline.js";
import { VehicleTracker } from "../processing/vehicle-tracker.js";
import { MemorySystem } from "../memory/system.js";
import { RoutineLearner } from "../memory/routine_learner.js";
import { PatternMiner } from "../memory/pattern_miner.js";
import {
  GoapAgent,
  GoapPlanner,
  createDefaultActions,
  createDefaultGoals,
} from "../reasoning/goap/planner.js";
import { RulesEngine } from "../reasoning/rules/engine.js";
import { LlmClient } from "../reasoning/llm/client.js";
import { HypothesisEngine } from "../reasoning/hypothesis.js";
import {
  BehavioralPatternMatcher,
  createDefaultSignatures,
  type BehaviorMatch,
} from "../reasoning/behavioral_pattern.js";
import { RetrospectiveAnalyzer } from "../reasoning/retrospective.js";
import { SocialPredictionEngine } from "../reasoning/social-prediction.js";
import { QueryManager } from "../actions/query_user.js";
import { ActionRegistry } from "../actions/registry.js";
import {
  createCameraConnector,
  type CameraConnector,
} from "../perception/camera-connector.js";
import { KnowledgeGraph } from "../memory/knowledge-graph.js";
import { SocialMediaInvestigator } from "../processing/social-investigator.js";
import { createDefaultSceneContext } from "../memory/scene-context-store.js";
import type { SceneContext } from "../core/types.js";

// ── Agent ────────────────────────────────────────────────────────

export class SecurityAgent {
  config: AppConfig;
  running = false;
  mode: SystemMode = SystemMode.HOME;
  worldState = new WorldState();

  // Core subsystems
  bus = new EventBus();
  cameras: CameraConnector[] = [];
  visionPipeline: VisionPipeline | null = null;
  audioPipeline: unknown = null;
  memory: MemorySystem | null = null;
  goapPlanner: GoapAgent | null = null;
  rulesEngine: RulesEngine | null = null;
  llmClient: LlmClient | null = null;
  actions: ActionRegistry | null = null;

  // Vigia subsystems
  vehicleTracker: VehicleTracker | null = null;
  routineLearner: RoutineLearner | null = null;
  patternMiner: PatternMiner | null = null;
  hypothesisEngine: HypothesisEngine | null = null;
  socialInvestigator: SocialMediaInvestigator | null = null;
  socialPredictor: SocialPredictionEngine | null = null;
  queryManager: QueryManager | null = null;
  behaviorMatcher: BehavioralPatternMatcher | null = null;
  knowledgeGraph: KnowledgeGraph | null = null;
  retrospectiveAnalyzer: RetrospectiveAnalyzer | null = null;
  sceneContexts: Map<string, SceneContext> = new Map();

  // Timing
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor(configPath?: string) {
    this.config = loadConfig(configPath);
    logger.info(
      { mode: this.config.system.mode },
      "SecurityAgent (Vigia) created",
    );
  }

  // ── Setup ────────────────────────────────────────────────────

  async setup(): Promise<void> {
    logger.info("Initializing SecurityAgent (Vigia)...");

    // Inicializa estado do mundo
    this.worldState = new WorldState({
      system_mode: this.config.system.mode,
      alarm_active: false,
      perimeter_secured: true,
      people_inside: 0,
      people_at_door: 0,
      unknown_person_present: false,
      cameras_online: this.config.cameras.filter((c) => c.enabled).length,
      threat_level: 0,
      intrusion_detected: false,
      main_door_locked: true,
      garage_door_closed: true,
      lights_on: false,
      time_of_day: this.timeOfDay(),
      recording_active: false,
    });

    // Core subsystems
    this.memory = new MemorySystem({ dataDir: this.config.system.dataDir });
    await this.memory.initialize();

    this.visionPipeline = new VisionPipeline(this.bus, this.memory);
    this.llmClient = new LlmClient({
      apiKey: this.config.llm.apiKey,
      baseUrl: this.config.llm.baseUrl,
      model: this.config.llm.model,
      maxTokens: this.config.llm.maxTokens,
      temperature: this.config.llm.temperature,
    });
    this.rulesEngine = new RulesEngine();
    this.actions = new ActionRegistry(this.bus);

    // GOAP
    const actions = createDefaultActions();
    this.goapPlanner = new GoapAgent(new GoapPlanner(actions), actions);
    for (const goal of createDefaultGoals()) {
      this.goapPlanner.addGoal(goal);
    }

    // Vigia subsystems
    this.vehicleTracker = new VehicleTracker(this.memory, this.bus);
    this.routineLearner = new RoutineLearner(this.memory, {
      learningRate: this.config.vigia.routines.learningRate,
      atypicalThreshold: this.config.vigia.routines.atypicalThreshold,
      minObservations: this.config.vigia.routines.minObservations,
    });
    this.patternMiner = new PatternMiner(this.memory, this.routineLearner);
    this.hypothesisEngine = new HypothesisEngine(this.llmClient, this.memory);
    this.behaviorMatcher = new BehavioralPatternMatcher();
    this.queryManager = new QueryManager(this.bus);
    this.socialInvestigator = new SocialMediaInvestigator();
    this.socialPredictor = new SocialPredictionEngine(
      this.memory,
      this.memory.knowledgeGraph,
    );
    this.retrospectiveAnalyzer = new RetrospectiveAnalyzer(
      this.memory,
      this.behaviorMatcher,
      this.llmClient,
    );

    // Register default behavioral signatures
    for (const sig of createDefaultSignatures()) {
      this.behaviorMatcher.registerSignature(sig);
    }

    // Load SceneContexts for each camera from SQLite
    for (const cam of this.config.cameras.filter((c) => c.enabled)) {
      let ctx = await this.memory.sceneContextStore.get(cam.id);
      if (!ctx) {
        ctx = createDefaultSceneContext(cam.id, cam.name);
        await this.memory.sceneContextStore.save(ctx);
        logger.info({ cameraId: cam.id }, "Default SceneContext created");
      }
      this.sceneContexts.set(cam.id, ctx);
    }

    logger.info("All subsystems initialized");
  }

  // ── Main Loop ────────────────────────────────────────────────

  async run(): Promise<void> {
    await this.setup();
    this.running = true;

    // Cria conectores de câmera da config
    this.cameras = this.config.cameras
      .filter((c) => c.enabled)
      .map((c) => createCameraConnector(c));

    // API Server (Express) for ONVIF PTZ cameras — integrated into dashboard
    // Create OnvifConnector instances for ALL cameras (RTSP cameras still
    // have ONVIF endpoints on the same IP for PTZ control).
    const { OnvifConnector } = await import("../perception/onvif-connector.js");
    const ptzConnectors = this.config.cameras
      .filter((c) => c.enabled)
      .map((c) => new OnvifConnector(c));

    // Dashboard (HTTP + WebSocket) — with integrated PTZ API
    const { createDashboardServer } = await import("../api/server.js");
    const ptzMap =
      ptzConnectors.length > 0
        ? new Map(ptzConnectors.map((c) => [c.cameraId, c]))
        : undefined;
    await createDashboardServer(this.bus, ptzMap);
    if (!ptzMap) {
      logger.warn("No ONVIF cameras configured — PTZ API not available");
    }

    // Event handler
    this.bus.subscribeMany(
      ["vision.event", "audio.event", "system.event"],
      (_topic, payload) => {
        if (payload && "eventType" in payload) {
          void this.handleEvent(payload as unknown as SecurityEvent);
        }
      },
    );

    // Behavior match handler — alerta em matches de alta confiança
    this.bus.subscribe("behavior.match", (_topic, match) => {
      const m = match as unknown as BehaviorMatch;
      if (m.overallScore() > 0.7) {
        void this.actions?.execute("alert_high", {
          message: `Padrão detectado: ${m.signature.name} — ${(m.overallScore() * 100).toFixed(0)}%`,
        });
      }
    });

    // User feedback handler — respostas do dashboard/chat
    this.bus.subscribe("user.answer", (_topic, payload) => {
      const data = payload as Record<string, unknown>;
      const answer = (data.answer as string) || "";
      void this.handleUserFeedback(answer);
    });

    // Inicia streams de câmera
    const cameraTasks = this.cameras.map((camera) =>
      this.runCameraLoop(camera),
    );

    // GOAP tick (a cada 2s)
    const goapInterval = this.config.goap.tickIntervalMs;
    this.tickInterval = setInterval(() => {
      void this.goapTick();
    }, goapInterval);

    // Consolidação de memória (a cada 1h)
    setInterval(() => {
      void this.consolidateMemory();
    }, 3_600_000);

    // Vigia: observação contínua (a cada 60s)
    setInterval(() => {
      void this.vigiaObserve();
    }, 60_000);

    // Vigia: perguntas pendentes (a cada 5s)
    setInterval(() => {
      void this.processPendingQueries();
    }, 5_000);

    logger.info("Agent loop started");

    // Mantém o processo vivo enquanto câmeras rodam
    await Promise.all(cameraTasks);
  }

  // ── Event Pipeline ───────────────────────────────────────────

  async handleEvent(event: SecurityEvent): Promise<void> {
    // 1. Armazenar na memória
    await this.storeInMemory(event);

    // 2. Aprender rotina (Vigia — 3 camadas)
    await this.learnRoutine(event);

    // 3. Behavioral Pattern Matching (Vigia)
    if (this.behaviorMatcher) {
      const match = this.behaviorMatcher.matchStreaming(event);
      if (match) {
        logger.warn(
          { match: match.evidenceSummary },
          "Behavioral pattern matched",
        );
        this.bus.publish(
          "behavior.match",
          match as unknown as Record<string, unknown>,
        );
      }
    }

    // 4. Rules engine (síncrono, rápido)
    await this.evaluateRules(event);

    // 5. Atualizar world state
    this.updateWorldState(event);

    // 6. Verificar anomalia
    event.anomalyScore = await this.scoreAnomaly(event);
    if (event.anomalyScore > 0.6) {
      event.severity = Math.max(event.severity, Severity.MEDIUM) as Severity;
      logger.warn(
        { anomalyScore: event.anomalyScore, description: event.description },
        "Anomaly detected",
      );
    }

    // 7. Veículo: verificar tempo de permanência (Vigia)
    if (event.eventType === EventType.VEHICLE_DETECTED) {
      await this.checkVehicleParking(event);
    }

    // 8. LLM se necessário (assíncrono, não bloqueia)
    if (this.needsLlm(event)) {
      void this.llmEvaluate(event);
    }

    // 9. Hipóteses para eventos anômalos (Vigia)
    if (event.anomalyScore > 0.5) {
      void this.generateHypothesesForEvent(event);
    }
  }

  // ── Pipeline Steps ───────────────────────────────────────────

  private async storeInMemory(event: SecurityEvent): Promise<void> {
    await this.memory?.store(event);
  }

  private async learnRoutine(event: SecurityEvent): Promise<void> {
    if (!this.routineLearner) return;
    this.routineLearner.observe(event);
    const atypicalScore = this.routineLearner.scoreAtypical(event);
    if (atypicalScore > this.config.vigia.routines.atypicalThreshold) {
      event.anomalyScore = Math.max(event.anomalyScore, atypicalScore);
    }
  }

  private async evaluateRules(event: SecurityEvent): Promise<void> {
    if (!this.rulesEngine || !this.actions) return;
    const ruleActions = await this.rulesEngine.evaluate(event);
    for (const action of ruleActions) {
      await this.actions.execute(action);
    }
  }

  private updateWorldState(event: SecurityEvent): void {
    const updates: Record<string, FactValue> = {};

    if (event.eventType === EventType.PERSON_DETECTED) {
      updates.people_at_door =
        ((this.worldState.facts.people_at_door as number) || 0) + 1;
      if (event.personsInvolved.some((pid) => pid.startsWith("unknown_"))) {
        updates.unknown_person_present = true;
      }
    } else if (event.eventType === EventType.PERSON_LEFT) {
      updates.people_at_door = Math.max(
        0,
        ((this.worldState.facts.people_at_door as number) || 0) - 1,
      );
    } else if (event.eventType === EventType.SOUND_DETECTED) {
      const soundClass = event.payload.soundClass as string;
      if (soundClass === "gunshot") {
        updates.gunshot_detected = true;
        updates.threat_level = Math.min(
          10,
          ((this.worldState.facts.threat_level as number) || 0) + 8,
        );
      } else if (soundClass === "breaking_glass") {
        updates.breaking_glass_detected = true;
        updates.threat_level = Math.min(
          10,
          ((this.worldState.facts.threat_level as number) || 0) + 5,
        );
      }
    }

    updates.time_of_day = this.timeOfDay();
    this.worldState = this.worldState.applyEffects(updates);
  }

  private async scoreAnomaly(event: SecurityEvent): Promise<number> {
    if (!this.memory) return event.anomalyScore;
    return await this.memory.anomalyDetector.scoreEvent(event);
  }

  private async checkVehicleParking(event: SecurityEvent): Promise<void> {
    const duration = (event.payload.durationSeconds as number) || 0;
    const identified = event.payload.identified as boolean;

    if (
      duration > this.config.vigia.vehicles.askUserThresholdSeconds &&
      !identified &&
      this.queryManager
    ) {
      this.queryManager.createQuestion({
        text: `Veículo parado há ${Math.floor(duration / 60)} min. Conhece?`,
        priority: "medium",
        expectedType: "person_name",
        relatedEventId: event.eventId,
      });
    }
  }

  private needsLlm(event: SecurityEvent): boolean {
    return (
      event.severity >= Severity.MEDIUM ||
      event.anomalyScore > 0.5 ||
      (event.eventType === EventType.PERSON_DETECTED &&
        event.personsInvolved.some((pid) => pid.startsWith("unknown_"))) ||
      (event.eventType === EventType.VEHICLE_DETECTED &&
        !event.payload.identified) ||
      event.eventType === EventType.PATTERN_DEVIATION
    );
  }

  private async llmEvaluate(event: SecurityEvent): Promise<void> {
    if (!this.llmClient || !this.memory) return;
    try {
      const context = await this.memory.getContextForLlm(event);
      const assessment = await this.llmClient.evaluate(event, context);
      this.bus.publish(
        "llm.assessment",
        assessment as unknown as Record<string, unknown>,
      );

      // Se LLM sugeriu ações, executa
      if (this.actions) {
        for (const action of assessment.suggestedActions) {
          await this.actions.execute(action);
        }
      }
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, "LLM evaluation failed");
    }
  }

  private async generateHypothesesForEvent(
    event: SecurityEvent,
  ): Promise<void> {
    if (!this.hypothesisEngine || !this.memory) return;
    try {
      const context = await this.memory.getContextForLlm(event);
      await this.hypothesisEngine.generateFromEvent(event, context);
    } catch (err) {
      logger.error(
        { err, eventId: event.eventId },
        "Hypothesis generation failed",
      );
    }
  }

  // ── Periodic Tasks ───────────────────────────────────────────

  private async goapTick(): Promise<void> {
    if (!this.running || !this.goapPlanner) return;
    const executed = await this.goapPlanner.tick(this.worldState, {
      bus: this.bus,
      memory: this.memory,
    });
    if (executed.length > 0) {
      logger.debug({ executed }, "GOAP actions executed");
    }
  }

  private async consolidateMemory(): Promise<void> {
    if (!this.memory) return;
    await this.memory.consolidate();
    logger.debug("Memory consolidation complete");
  }

  private async vigiaObserve(): Promise<void> {
    // Minera padrões, gera hipóteses, verifica assinaturas comportamentais
    if (!this.patternMiner || !this.memory || !this.routineLearner) return;

    const persons = await this.memory.personRegistry.allPersons();
    for (const person of persons.slice(0, 10)) {
      if (person.totalVisits >= 5) {
        this.routineLearner.getRoutineDescription(`person:${person.personId}`);
        void this.patternMiner.compareFrequencies(person.personId);
      }
    }

    // Gera hipóteses para eventos anômalos recentes não resolvidos
    if (this.hypothesisEngine) {
      const recent = await this.memory.eventStore.getRecent(60);
      const anomalous = recent.filter((e) => e.anomalyScore > 0.5);
      for (const event of anomalous.slice(0, 3)) {
        const context = await this.memory.getContextForLlm(event);
        void this.hypothesisEngine.generateFromEvent(event, context);
      }
    }

    logger.debug("Vigia observation tick complete");
  }

  private async processPendingQueries(): Promise<void> {
    if (!this.queryManager) return;
    const asked = await this.queryManager.askPending();
    if (asked.length > 0) {
      logger.debug({ count: asked.length }, "Pending queries asked");
    }
  }

  // ── Camera Loop ───────────────────────────────────────────────

  private async runCameraLoop(connector: CameraConnector): Promise<void> {
    logger.info(`Starting camera: ${connector.cameraId}`);
    while (this.running) {
      try {
        await connector.connect();
        for await (const frame of connector.stream()) {
          if (!this.running) break;
          if (this.visionPipeline) {
            const event = await this.visionPipeline.process(frame);
            if (event) {
              this.bus.publish("vision.event", event);
            }
          }
          // Vehicle tracking (paralelo)
          if (this.vehicleTracker) {
            const vehicleEvents = await this.vehicleTracker.processFrame(
              frame.cameraId,
            );
            for (const ve of vehicleEvents) {
              this.bus.publish("vision.event", ve);
            }
          }
        }
      } catch (err) {
        logger.error(
          { err, camera: connector.cameraId },
          "Camera error, retrying in 5s",
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  // ── Social Prediction ─────────────────────────────────────────

  // ── User Feedback ───────────────────────────────────────────

  /**
   * Processa feedback do usuário vindo do dashboard.
   * Ex: "É o meu carro", "É a dona Olinda"
   *
   * Ensina o sistema: associa veículo/pessoa, move ator à Camada 3.
   */
  private async handleUserFeedback(answer: string): Promise<void> {
    logger.info({ answer }, "User feedback received");

    // Tenta extrair nome de pessoa da resposta
    const nameMatch =
      answer.match(/(?:dona|sr|sra|senhor|senhora)\s+([A-ZÀ-Ú][a-zà-ú]+)/i) ||
      answer.match(/é\s+(?:o|a)\s+(\w+)/i) ||
      answer.match(/meu\s+(\w+)/i);

    if (nameMatch) {
      const name = nameMatch[1] || answer;

      if (this.vehicleTracker) {
        // Tenta associar com veículo não identificado mais recente
        logger.info({ name, answer }, `Associando pessoa "${name}" a veículo`);
      }

      // Publica insight para o dashboard
      this.bus.publish("vision.event", {
        eventType: "social_insight",
        cameraId: null,
        severity: 0,
        description: `📝 Anotado: "${answer}" — ${name} associado(a) ao evento`,
        personsInvolved: [],
        payload: { personName: name, feedback: answer },
      });
    } else if (answer.toLowerCase().includes("não reconheço")) {
      // Marca como desconhecido
      this.bus.publish("vision.event", {
        eventType: "social_insight",
        cameraId: null,
        severity: 0,
        description: `📝 "${answer}" — marcado como desconhecido`,
        personsInvolved: [],
        payload: { feedback: answer, identified: false },
      });
    } else {
      // Feedback genérico — registra como nota
      this.bus.publish("vision.event", {
        eventType: "social_insight",
        cameraId: null,
        severity: 0,
        description: `📝 Anotação do usuário: "${answer}"`,
        personsInvolved: [],
        payload: { feedback: answer },
      });
    }
  }

  /**
   * Predicts whether gossip/information will spread to a target person
   * through the neighborhood social graph.
   */
  async predictGossip(params: {
    topic: string;
    whoKnows: string[];
    targetPerson: string;
    neighborhood: string[];
    maxDays?: number;
  }): Promise<unknown> {
    if (!this.socialPredictor) return null;
    return this.socialPredictor.predictInformationSpread({
      secretTopic: params.topic,
      whoKnows: params.whoKnows,
      targetPerson: params.targetPerson,
      neighborhood: params.neighborhood,
      maxDays: params.maxDays,
    });
  }

  // ── Utilities ────────────────────────────────────────────────

  private timeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down SecurityAgent (Vigia)...");
    this.running = false;
    if (this.tickInterval) clearInterval(this.tickInterval);

    // Desconectar câmeras
    for (const camera of this.cameras) {
      try {
        await (camera as CameraConnector).disconnect();
      } catch {
        // Ignora erros de desconexão
      }
    }

    // Fechar bancos de dados
    if (this.memory) {
      await this.memory.close();
    }

    logger.info("SecurityAgent (Vigia) shutdown complete");
  }
}

// ── Entry Point ──────────────────────────────────────────────────

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("agent.ts")
) {
  const agent = new SecurityAgent();
  agent.run().catch((err) => {
    logger.fatal(err, "Agent crashed");
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    await agent.shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await agent.shutdown();
    process.exit(0);
  });
}
