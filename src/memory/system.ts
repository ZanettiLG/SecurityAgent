/**
 * Memory System — Vetorial, Eventos, Pessoas, Curto/Longo Prazo.
 */

import { logger } from "../core/logger.js";
import {
  PersonCategory,
  type PersonRecord,
  type SecurityEvent,
  type EventType,
  type SceneContext,
} from "../core/types.js";
import { SqliteEventStore } from "./sqlite-event-store.js";
import { SqlitePersonRegistry } from "./person-store.js";
import { ChromaVectorStore } from "./chroma-vector-store.js";
import { KnowledgeGraph } from "./knowledge-graph.js";
import { SceneContextStore } from "./scene-context-store.js";
import { PersistentKnowledgeGraph } from "./kg-store.js";
import { RoutineStore } from "./routine-store.js";
import { HypothesisStore } from "./hypothesis-store.js";
import { ConversationStore } from "./conversation-store.js";
import { ContextCompiler } from "./context-compiler.js";

// ── Vector Store ─────────────────────────────────────────────────

export interface VectorMatch {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorStore {
  search(
    collection: string,
    queryVector: number[],
    topK?: number,
  ): Promise<VectorMatch[]>;
  insert(
    collection: string,
    id: string,
    vector: number[],
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  count(collection: string): Promise<number>;
}

export class InMemoryVectorStore implements VectorStore {
  private collections: Map<
    string,
    Map<string, { vector: number[]; metadata: Record<string, unknown> }>
  > = new Map();

  async search(
    collection: string,
    queryVector: number[],
    topK = 5,
  ): Promise<VectorMatch[]> {
    const col = this.collections.get(collection);
    if (!col) return [];

    const results: VectorMatch[] = [];
    for (const [id, { vector, metadata }] of col) {
      const similarity = this.cosineSimilarity(queryVector, vector);
      results.push({ id, score: similarity, metadata });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async insert(
    collection: string,
    id: string,
    vector: number[],
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Map());
    }
    this.collections.get(collection)!.set(id, { vector, metadata });
  }

  async delete(collection: string, id: string): Promise<void> {
    this.collections.get(collection)?.delete(id);
  }

  async count(collection: string): Promise<number> {
    return this.collections.get(collection)?.size ?? 0;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * (b[i] ?? 0);
      normA += a[i]! * a[i]!;
      normB += (b[i] ?? 0) * (b[i] ?? 0);
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
}

// ── Anomaly Detector ─────────────────────────────────────────────

export class AnomalyDetector {
  constructor(
    private eventStore: SqliteEventStore,
    private personRegistry: SqlitePersonRegistry,
  ) {}

  async scoreEvent(event: SecurityEvent): Promise<number> {
    const scores: number[] = [];

    if (event.eventType === "person_detected") {
      for (const pid of event.personsInvolved) {
        const person = await this.personRegistry.get(pid);
        if (person) {
          if (
            person.category === PersonCategory.UNKNOWN &&
            person.totalVisits === 1
          ) {
            scores.push(0.7); // Pessoa nunca vista antes
          } else if (person.category === PersonCategory.THREAT) {
            scores.push(1.0);
          }
        }
      }
    }

    if (event.eventType === "sound_detected") {
      const soundClass = (event.payload.soundClass as string) || "";
      const frequency = await this.eventStore.countSoundEvents(soundClass, 30);
      if (frequency === 0) scores.push(0.9);
      else if (frequency < 3) scores.push(0.5);
    }

    return scores.length > 0 ? Math.max(...scores) : 0;
  }
}

// ── Memory Facade ────────────────────────────────────────────────

export class MemorySystem {
  vectorStore: VectorStore;
  eventStore: SqliteEventStore;
  personRegistry: SqlitePersonRegistry;
  anomalyDetector: AnomalyDetector;
  knowledgeGraph: PersistentKnowledgeGraph;
  sceneContextStore: SceneContextStore;
  routineStore: RoutineStore;
  hypothesisStore: HypothesisStore;
  conversationStore: ConversationStore;
  contextCompiler: ContextCompiler;

  constructor(config?: { dataDir?: string; chromaHost?: string }) {
    const dataDir = config?.dataDir ?? "./data";
    this.eventStore = new SqliteEventStore(`${dataDir}/events.db`);
    this.personRegistry = new SqlitePersonRegistry(`${dataDir}/persons.db`);

    const chromaVs = new ChromaVectorStore(config?.chromaHost);
    this.vectorStore = chromaVs;

    this.knowledgeGraph = new PersistentKnowledgeGraph(
      `${dataDir}/knowledge-graph.db`,
    );
    this.sceneContextStore = new SceneContextStore(
      `${dataDir}/scene-contexts.db`,
    );
    this.routineStore = new RoutineStore(`${dataDir}/routines.db`);
    this.hypothesisStore = new HypothesisStore(`${dataDir}/hypotheses.db`);
    this.conversationStore = new ConversationStore(
      `${dataDir}/conversations.db`,
    );
    this.contextCompiler = new ContextCompiler();

    this.anomalyDetector = new AnomalyDetector(
      this.eventStore,
      this.personRegistry,
    );
  }

  async initialize(): Promise<void> {
    if (this.vectorStore instanceof ChromaVectorStore) {
      await this.vectorStore.initialize();
    }
    await this.knowledgeGraph.load();
    logger.info("Memory system initialized with full persistence");
  }

  async store(event: SecurityEvent): Promise<void> {
    await this.eventStore.insert(event);
  }

  async getContextForLlm(
    event: SecurityEvent,
    sceneContext?: SceneContext,
  ): Promise<string> {
    return this.contextCompiler.compile({
      event,
      sceneContext,
      memory: this,
    });
  }

  async consolidate(): Promise<void> {
    // Marca eventos antigos como consolidated
    const recent = await this.eventStore.getRecent(24 * 60);
    for (const event of recent.slice(0, -100)) {
      event.consolidated = true;
    }
    logger.info("Memory consolidation complete");
  }

  async close(): Promise<void> {
    this.eventStore.close();
    this.personRegistry.close();
    logger.info("Memory system closed");
  }
}
