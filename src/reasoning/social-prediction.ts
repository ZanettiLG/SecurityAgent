/**
 * Social Prediction Engine — Models how information propagates through
 * the neighborhood using gossip graphs, BFS social distance, and
 * probability-based timeframe estimation.
 *
 * Ported from the Python prototype (Capítulo 1 do Vigia).
 */

import { logger } from "../core/logger.js";
import type { MemorySystem } from "../memory/system.js";

// ── Interfaces ──────────────────────────────────────────────────

export interface SocialPrediction {
  predictionId: string;
  topic: string; // What will be discovered
  probability: number; // 0 to 1
  estimatedTimeframe: string; // e.g. "antes do final da semana"
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  keyActors: string[]; // People involved
  propagationPath: string[]; // Likely propagation route
  createdAt: Date;
  verified: boolean;
  verifiedAt: Date | null;
  outcome: string | null; // e.g. "Previsão social confirmada"
}

export interface GossipNode {
  personId: string;
  name: string | null;
  gossipFactor: number; // 0.3 = discreto, 1.5 = fofoqueiro
  interactionFrequency: Map<string, number>; // personId → frequency/week
}

export interface GossipEdge {
  from: string;
  to: string;
  frequency: number; // interactions per week
}

export interface GossipGraph {
  nodes: Map<string, GossipNode>;
  edges: Map<string, GossipEdge[]>;
}

// ── Baseline Probabilities ──────────────────────────────────────

const BASELINE_PROB: Record<number, number> = {
  0: 1.0,
  1: 0.9,
  2: 0.7,
  3: 0.4,
};
const DEFAULT_BASELINE_PROB = 0.1;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function baselineForDistance(distance: number): number {
  return BASELINE_PROB[distance] ?? DEFAULT_BASELINE_PROB;
}

// ── Engine ─────────────────────────────────────────────────────

export class SocialPredictionEngine {
  private predictions: SocialPrediction[] = [];
  private adjacencyGraph: Map<string, string[]> = new Map();
  private edgeFrequencies: Map<string, Map<string, number>> = new Map();

  constructor(
    private memory?: MemorySystem,
    private knowledgeGraph?: unknown,
  ) {}

  // ── Main Prediction ──────────────────────────────────────────

  /**
   * Predicts if and when information will reach a target person
   * through the neighborhood gossip network.
   */
  async predictInformationSpread(params: {
    secretTopic: string;
    whoKnows: string[]; // personIds that already know
    targetPerson: string; // who will find out?
    neighborhood: string[]; // personIds in the neighborhood
    maxDays?: number; // default 7
  }): Promise<SocialPrediction> {
    const {
      secretTopic,
      whoKnows,
      targetPerson,
      neighborhood,
      maxDays = 7,
    } = params;

    // 1. Build gossip graph (simulated: each person 2-4 random connections)
    this.buildGossipGraph(neighborhood);

    // 2. Calculate social distance + path via BFS
    const { distance, path } = this.socialDistanceWithPath(
      this.adjacencyGraph,
      whoKnows,
      targetPerson,
    );

    // 3. Average interaction frequency along the propagation path
    const interactionFreq = this.pathInteractionFrequency(path);

    // 4. Gossip factor of the target person
    const gossipFactor = await this.getGossipFactor(targetPerson);

    // 5. Probability = clip(baseProb * interactionFreq * gossipFactor, 0.01, 0.999)
    const bp = baselineForDistance(distance);
    let probability: number;
    if (distance === 0) {
      probability = 1.0; // target already knows — certainty
    } else {
      probability = clamp(bp * interactionFreq * gossipFactor, 0.01, 0.999);
    }

    // 6. Estimate timeframe
    const { estimatedTimeframe, estimatedDaysMin, estimatedDaysMax } =
      this.estimateTimeframe(probability, maxDays);

    // 7. Build prediction
    const prediction: SocialPrediction = {
      predictionId: crypto.randomUUID(),
      topic: secretTopic,
      probability,
      estimatedTimeframe,
      estimatedDaysMin,
      estimatedDaysMax,
      keyActors: [...new Set([...whoKnows, targetPerson, ...path])],
      propagationPath: path,
      createdAt: new Date(),
      verified: false,
      verifiedAt: null,
      outcome: null,
    };

    this.predictions.push(prediction);

    logger.info(
      {
        predictionId: prediction.predictionId,
        probability,
        distance,
        propagationPath: path,
      },
      `Social prediction: ${(probability * 100).toFixed(1)}% — "${secretTopic}" reaches ${targetPerson} in ${estimatedTimeframe}`,
    );

    return prediction;
  }

  // ── Verification ─────────────────────────────────────────────

  /**
   * Marks a prediction as verified (came true or not).
   */
  async verifyPrediction(
    predictionId: string,
    cameTrue: boolean,
  ): Promise<void> {
    const prediction = this.predictions.find(
      (p) => p.predictionId === predictionId,
    );
    if (!prediction) {
      logger.warn({ predictionId }, "Prediction not found for verification");
      return;
    }

    prediction.verified = true;
    prediction.verifiedAt = new Date();
    prediction.outcome = cameTrue
      ? "Previsão social confirmada"
      : "Previsão social não se concretizou";

    logger.info(
      { predictionId, cameTrue },
      `Prediction verified: ${prediction.outcome}`,
    );
  }

  // ── Active Predictions ───────────────────────────────────────

  /**
   * Returns all predictions that have not yet been verified.
   */
  getActivePredictions(): SocialPrediction[] {
    return this.predictions.filter((p) => !p.verified);
  }

  // ── Gossip Factor ────────────────────────────────────────────

  /**
   * Returns the gossip factor for a person based on their tags.
   * "discreto" → 0.3, "fofoqueiro" → 1.5, default → 1.0 (neutral).
   */
  async getGossipFactor(personId: string): Promise<number> {
    if (this.memory) {
      const person = await this.memory.personRegistry.get(personId);
      if (person) {
        if (person.tags.includes("discreto")) return 0.3;
        if (person.tags.includes("fofoqueiro")) return 1.5;
      }
    }
    return 1.0; // neutral
  }

  // ── Gossip Graph (Simulated) ─────────────────────────────────

  /**
   * Builds a simulated gossip graph where each person is connected
   * to 2-4 random neighbors with a random interaction frequency.
   */
  private buildGossipGraph(neighborhood: string[]): void {
    const graph = new Map<string, string[]>();
    const freq = new Map<string, Map<string, number>>();

    for (const person of neighborhood) {
      const connections: string[] = [];
      const others = neighborhood.filter((p) => p !== person);

      // 2-4 random connections
      const numConnections = 2 + Math.floor(Math.random() * 3);
      const shuffled = [...others].sort(() => Math.random() - 0.5);

      for (
        let i = 0;
        i < Math.min(numConnections, shuffled.length);
        i++
      ) {
        const friend = shuffled[i]!;
        connections.push(friend);

        // Random interaction frequency: 0.5 to 7 interactions per week
        const edgeFrequency = 0.5 + Math.random() * 6.5;

        if (!freq.has(person)) freq.set(person, new Map());
        freq.get(person)!.set(friend, edgeFrequency);

        // Make the edge bidirectional
        if (!freq.has(friend)) freq.set(friend, new Map());
        freq.get(friend)!.set(person, edgeFrequency);
      }

      graph.set(person, connections);
    }

    this.adjacencyGraph = graph;
    this.edgeFrequencies = freq;
  }

  // ── BFS with Path Reconstruction ─────────────────────────────

  /**
   * Computes the shortest social distance between any source and the
   * target using BFS. Also returns the propagation path.
   */
  private socialDistanceWithPath(
    graph: Map<string, string[]>,
    sources: string[],
    target: string,
  ): { distance: number; path: string[] } {
    if (sources.includes(target)) {
      return { distance: 0, path: [target] };
    }

    const visited = new Set(sources);
    const predecessor = new Map<string, string>();
    const queue: Array<[string, number]> = sources.map((s) => [s, 0]);

    for (const s of sources) {
      predecessor.set(s, "");
    }

    while (queue.length > 0) {
      const [current, dist] = queue.shift()!;
      if (current === target) {
        // Reconstruct path from target back to source
        const path: string[] = [];
        let node: string | undefined = target;
        while (node && node !== "") {
          path.unshift(node);
          node = predecessor.get(node);
        }
        return { distance: dist, path };
      }

      for (const neighbor of graph.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          predecessor.set(neighbor, current);
          queue.push([neighbor, dist + 1]);
        }
      }
    }

    return { distance: 999, path: [] }; // unreachable
  }

  // ── Path Interaction Frequency ───────────────────────────────

  /**
   * Computes the average interaction frequency along a propagation path.
   */
  private pathInteractionFrequency(path: string[]): number {
    if (path.length < 2) return 1.0;

    let totalFreq = 0;
    let edgeCount = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      const freq =
        this.edgeFrequencies.get(from)?.get(to) ??
        this.edgeFrequencies.get(to)?.get(from) ??
        1.0;
      totalFreq += freq;
      edgeCount++;
    }

    return edgeCount > 0 ? totalFreq / edgeCount : 1.0;
  }

  // ── Timeframe Estimation ─────────────────────────────────────

  /**
   * Estimates the timeframe for information spread based on probability.
   *
   * - prob > 0.9  → "nas próximas 24 horas"     (0-1 days)
   * - prob > 0.7  → "antes do final da semana"   (1-3 days)
   * - prob > 0.4  → "dentro de N dias"           (1-N days)
   * - else        → "provavelmente não antes de N*2 dias"
   */
  private estimateTimeframe(
    probability: number,
    maxDays: number,
  ): {
    estimatedTimeframe: string;
    estimatedDaysMin: number;
    estimatedDaysMax: number;
  } {
    if (probability > 0.9) {
      return {
        estimatedTimeframe: "nas próximas 24 horas",
        estimatedDaysMin: 0,
        estimatedDaysMax: 1,
      };
    }

    if (probability > 0.7) {
      return {
        estimatedTimeframe: "antes do final da semana",
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      };
    }

    const n = Math.max(1, Math.ceil(maxDays * (1 - probability)));

    if (probability > 0.4) {
      return {
        estimatedTimeframe: `dentro de ${n} dias`,
        estimatedDaysMin: 1,
        estimatedDaysMax: n,
      };
    }

    return {
      estimatedTimeframe: `provavelmente não antes de ${n * 2} dias`,
      estimatedDaysMin: n * 2,
      estimatedDaysMax: maxDays,
    };
  }
}
