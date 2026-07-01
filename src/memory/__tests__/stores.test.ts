/**
 * Tests for persistent stores (Issue #1 — Memória Persistente Multi-Sessão).
 *
 * Each store uses SQLite with WAL mode. Tests use :memory: database
 * for isolation and speed.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  SceneContextStore,
  createDefaultSceneContext,
} from "../scene-context-store.js";
import { PersistentKnowledgeGraph } from "../kg-store.js";
import { PersistentRoutineStore } from "../routine-store.js";
import { HypothesisStore } from "../hypothesis-store.js";
import { ConversationStore } from "../conversation-store.js";

// ── Helpers ──────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `vigia-test-${randomUUID().slice(0, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
});

function dbPath(name: string): string {
  return join(tmpDir, name);
}

// ── SceneContextStore ────────────────────────────────────────────

describe("SceneContextStore", () => {
  it("deve criar e recuperar um contexto de cena", async () => {
    const store = new SceneContextStore(dbPath("scene.db"));
    const ctx = createDefaultSceneContext("cam-1", "Entrada");
    await store.save(ctx);

    const loaded = await store.get("cam-1");
    expect(loaded).toBeDefined();
    expect(loaded!.cameraId).toBe("cam-1");
    expect(loaded!.label).toBe("Entrada");
    expect(loaded!.location).toBe("EXTERNAL");
    expect(loaded!.version).toBe(1);
  });

  it("deve listar todos os contextos", async () => {
    const store = new SceneContextStore(dbPath("scene.db"));
    await store.save(createDefaultSceneContext("cam-1"));
    await store.save(createDefaultSceneContext("cam-2"));

    const all = await store.getAll();
    expect(all).toHaveLength(2);
  });

  it("deve atualizar um contexto com incremento de versão", async () => {
    const store = new SceneContextStore(dbPath("scene.db"));
    await store.save(createDefaultSceneContext("cam-1"));

    const updated = await store.update("cam-1", {
      description: "Câmera da garagem",
    });
    expect(updated).toBeDefined();
    expect(updated!.description).toBe("Câmera da garagem");
    expect(updated!.version).toBe(2);
  });

  it("deve retornar undefined ao buscar contexto inexistente", async () => {
    const store = new SceneContextStore(dbPath("scene.db"));
    const result = await store.get("cam-inexistente");
    expect(result).toBeUndefined();
  });

  it("deve deletar um contexto", async () => {
    const store = new SceneContextStore(dbPath("scene.db"));
    await store.save(createDefaultSceneContext("cam-1"));
    await store.delete("cam-1");
    const result = await store.get("cam-1");
    expect(result).toBeUndefined();
  });
});

// ── PersistentKnowledgeGraph ─────────────────────────────────────

describe("PersistentKnowledgeGraph", () => {
  it("deve persistir e carregar nós entre instâncias", async () => {
    const path = dbPath("kg.db");

    const kg1 = new PersistentKnowledgeGraph(path);
    kg1.addNode({ id: "p1", type: "PERSON", label: "João", properties: {} });
    kg1.addNode({
      id: "v1",
      type: "VEHICLE",
      label: "Gol branco",
      properties: {},
    });
    kg1.addEdge("p1", "v1", "ASSOCIATED_WITH", { confidence: 0.9 });

    const kg2 = new PersistentKnowledgeGraph(path);
    await kg2.load();

    expect(kg2.getNode("p1")).toBeDefined();
    expect(kg2.getNode("v1")).toBeDefined();
    const edges = kg2.getEdges("p1");
    expect(edges).toHaveLength(1);
    expect(edges[0]!.type).toBe("ASSOCIATED_WITH");
  });

  it("deve adicionar nós únicos sem duplicação", async () => {
    const kg = new PersistentKnowledgeGraph(dbPath("kg.db"));
    kg.addNode({ id: "p1", type: "PERSON", label: "Maria", properties: {} });
    kg.addNode({ id: "p1", type: "PERSON", label: "Maria", properties: {} }); // sobrescreve

    const nodes = kg.findNodes("PERSON");
    expect(nodes).toHaveLength(1);
  });

  it("deve encontrar similaridade entre nós", async () => {
    const kg = new PersistentKnowledgeGraph(dbPath("kg.db"));
    // Três pessoas, duas com vizinhos em comum
    kg.addNode({ id: "p1", type: "PERSON", label: "Ana", properties: {} });
    kg.addNode({ id: "p2", type: "PERSON", label: "Bia", properties: {} });
    kg.addNode({ id: "p3", type: "PERSON", label: "Carlos", properties: {} });
    kg.addNode({ id: "v1", type: "VEHICLE", label: "Carro 1", properties: {} });
    kg.addNode({ id: "v2", type: "VEHICLE", label: "Carro 2", properties: {} });

    // Ana e Bia compartilham v1
    kg.addEdge("p1", "v1", "ASSOCIATED_WITH");
    kg.addEdge("p2", "v1", "ASSOCIATED_WITH");
    // Carlos só tem v2
    kg.addEdge("p3", "v2", "ASSOCIATED_WITH");

    const similar = kg.findSimilarNodes("p1", 0.3, 5);
    expect(similar).toHaveLength(1);
    expect(similar[0]!.node.id).toBe("p2");
  });
});

// ── PersistentRoutineStore ───────────────────────────────────────────

describe("PersistentRoutineStore", () => {
  it("deve salvar e carregar um perfil de rotina", async () => {
    const store = new PersistentRoutineStore(dbPath("routines.db"));

    const profile = {
      entityId: "person:joao",
      entityType: "person" as const,
      hourlyActivity: new Array(24).fill(0),
      dailyActivity: new Array(7).fill(0),
      typicalEvents: new Map(),
      totalObservations: 10,
      daysOfData: 3,
      lastUpdated: new Date(),
    };
    profile.hourlyActivity[14] = 0.8;
    profile.dailyActivity[1] = 0.6;

    await store.save(profile);
    const loaded = await store.loadAll();

    expect(loaded.size).toBe(1);
    const p = loaded.get("person:joao");
    expect(p).toBeDefined();
    expect(p!.hourlyActivity[14]).toBe(0.8);
    expect(p!.dailyActivity[1]).toBe(0.6);
    expect(p!.totalObservations).toBe(10);
  });
});

// ── HypothesisStore ──────────────────────────────────────────────

describe("HypothesisStore", () => {
  it("deve salvar e recuperar hipóteses ativas", async () => {
    const store = new HypothesisStore(dbPath("hyp.db"));

    const h1 = {
      hypothesisId: "h1",
      title: "Carro suspeito",
      description: "Veículo estacionado há 30min",
      probability: 0.7,
      status: "testing" as const,
      supportingEvidence: [],
      contradictingEvidence: [],
      relatedEntities: ["v1"],
      createdAt: new Date(),
      testedAt: null,
      resolvedAt: null,
      userFeedback: null,
    };

    const h2 = {
      hypothesisId: "h2",
      title: "Hóspede confirmado",
      description: "Pessoa já identificada",
      probability: 1.0,
      status: "user_confirmed" as const,
      supportingEvidence: [],
      contradictingEvidence: [],
      relatedEntities: ["p1"],
      createdAt: new Date(),
      testedAt: null,
      resolvedAt: null,
      userFeedback: null,
    };

    await store.save(h1);
    await store.save(h2);

    const active = await store.getActive();
    expect(active).toHaveLength(1);
    expect(active[0]!.hypothesisId).toBe("h1");
  });

  it("deve listar todas as hipóteses", async () => {
    const store = new HypothesisStore(dbPath("hyp.db"));
    const h = {
      hypothesisId: "h1",
      title: "Teste",
      description: "",
      probability: 0.5,
      status: "draft" as const,
      supportingEvidence: [],
      contradictingEvidence: [],
      relatedEntities: [],
      createdAt: new Date(),
      testedAt: null,
      resolvedAt: null,
      userFeedback: null,
    };
    await store.save(h);

    const all = await store.getAll();
    expect(all).toHaveLength(1);
  });
});

// ── ConversationStore ────────────────────────────────────────────

describe("ConversationStore", () => {
  it("deve inserir e recuperar conversas recentes em ordem", async () => {
    const store = new ConversationStore(dbPath("conv.db"));

    await store.insert({
      questionId: "q1",
      text: "Quem é esse?",
      answer: "Não sei",
      askedAt: new Date("2026-01-01T10:00:00"),
      answeredAt: new Date("2026-01-01T10:01:00"),
      priority: "medium",
      relatedEntities: [],
      relatedEventId: null,
    });

    await store.insert({
      questionId: "q2",
      text: "Conhece este carro?",
      answer: "Sim, é do vizinho",
      askedAt: new Date("2026-01-01T11:00:00"),
      answeredAt: new Date("2026-01-01T11:01:00"),
      priority: "high",
      relatedEntities: ["v1"],
      relatedEventId: "evt1",
    });

    const recent = await store.getRecent(5);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.questionId).toBe("q2"); // mais recente primeiro
    expect(recent[1]!.questionId).toBe("q1");

    // Busca por questionId
    const q = await store.getByQuestionId("q1");
    expect(q).toBeDefined();
    expect(q!.answer).toBe("Não sei");
  });
});
