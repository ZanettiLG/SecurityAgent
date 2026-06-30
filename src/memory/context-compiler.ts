/**
 * Context Compiler — Montagem hierárquica de contexto para o LLM.
 *
 * Compila múltiplas fontes de conhecimento em um prompt otimizado:
 * - SceneContext (descrição da cena, residentes, veículos)
 * - KnowledgeGraph (entidades relacionadas ao evento)
 * - Routine profiles (baselines de comportamento)
 * - Eventos recentes (janela deslizante)
 * - Hipóteses ativas
 * - Histórico de conversas
 *
 * Cada camada tem um token budget e prioridade definidos.
 * Ordem de prioridade: SceneContext > KG > Routines > Events > Hypotheses > Conversations
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent, SceneContext } from "../core/types.js";
import type { MemorySystem } from "./system.js";

// ── Configuration ────────────────────────────────────────────────

export interface ContextCompilerConfig {
  maxTokens: number;
  layerBudgets: {
    sceneContext: number;
    knowledgeGraph: number;
    routines: number;
    recentEvents: number;
    activeHypotheses: number;
    conversationHistory: number;
  };
}

const DEFAULT_CONFIG: ContextCompilerConfig = {
  maxTokens: 4000,
  layerBudgets: {
    sceneContext: 500,
    knowledgeGraph: 800,
    routines: 400,
    recentEvents: 1000,
    activeHypotheses: 500,
    conversationHistory: 300,
  },
};

// ── Rough token counter (4 chars ≈ 1 token) ──────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function truncateToBudget(text: string, budget: number): string {
  if (estimateTokens(text) <= budget) return text;
  const targetChars = budget * 4;
  return text.slice(0, targetChars) + "\n[...truncated]";
}

// ── Context Compiler ─────────────────────────────────────────────

export class ContextCompiler {
  private config: ContextCompilerConfig;

  constructor(config?: Partial<ContextCompilerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async compile(params: {
    event: SecurityEvent;
    sceneContext?: SceneContext;
    memory: MemorySystem;
  }): Promise<string> {
    const { event, sceneContext, memory } = params;
    const layers: string[] = [];

    // Layer 1: Scene Context (highest priority)
    if (sceneContext) {
      const sceneBlock = this.buildSceneContextBlock(sceneContext);
      layers.push(
        truncateToBudget(sceneBlock, this.config.layerBudgets.sceneContext),
      );
    }

    // Layer 2: Knowledge Graph context
    const kgBlock = this.buildKnowledgeGraphBlock(event, memory);
    if (kgBlock) {
      layers.push(
        truncateToBudget(kgBlock, this.config.layerBudgets.knowledgeGraph),
      );
    }

    // Layer 3: Recent events
    const eventsBlock = await this.buildRecentEventsBlock(event, memory);
    if (eventsBlock) {
      layers.push(
        truncateToBudget(eventsBlock, this.config.layerBudgets.recentEvents),
      );
    }

    // Layer 4: Active hypotheses
    const hypothesesBlock = await this.buildHypothesesBlock(memory);
    if (hypothesesBlock) {
      layers.push(
        truncateToBudget(
          hypothesesBlock,
          this.config.layerBudgets.activeHypotheses,
        ),
      );
    }

    // Layer 5: Conversation history
    const convBlock = await this.buildConversationBlock(memory);
    if (convBlock) {
      layers.push(
        truncateToBudget(
          convBlock,
          this.config.layerBudgets.conversationHistory,
        ),
      );
    }

    return layers.join("\n\n");
  }

  private buildSceneContextBlock(ctx: SceneContext): string {
    const lines = [
      "## Contexto de Cena",
      `Câmera: ${ctx.label}`,
      `Descrição: ${ctx.description}`,
      `Local: ${ctx.location}`,
    ];

    if (ctx.knownResidents.length > 0) {
      lines.push("Residentes conhecidos:");
      for (const r of ctx.knownResidents) {
        lines.push(`  - ${r.name} (${r.relationship})`);
      }
    }

    if (ctx.knownVehicles.length > 0) {
      lines.push("Veículos conhecidos:");
      for (const v of ctx.knownVehicles) {
        lines.push(`  - ${v.description}${v.plate ? ` (${v.plate})` : ""}`);
      }
    }

    if (ctx.zones.length > 0) {
      lines.push("Zonas:");
      for (const z of ctx.zones) {
        lines.push(`  - ${z.name}: ${z.description} [${z.importance}]`);
      }
    }

    if (ctx.routines.length > 0) {
      lines.push("Rotinas conhecidas:");
      for (const r of ctx.routines) {
        lines.push(`  - ${r}`);
      }
    }

    return lines.join("\n");
  }

  private buildKnowledgeGraphBlock(
    event: SecurityEvent,
    memory: MemorySystem,
  ): string {
    const lines: string[] = ["## Knowledge Graph Context"];
    let hasContent = false;

    for (const pid of event.personsInvolved) {
      const ctx = memory.knowledgeGraph.getFullContext(pid);
      if (ctx.entity) {
        hasContent = true;
        const entity = ctx.entity as Record<string, unknown>;
        lines.push(`Pessoa: ${String(entity.label ?? pid)}`);
        const neighbors = ctx.neighbors as
          Array<Record<string, unknown>> | undefined;
        if (neighbors && neighbors.length > 0) {
          lines.push("  Relacionamentos:");
          for (const neighbor of neighbors.slice(0, 5)) {
            lines.push(
              `    - ${String(neighbor.label)} (${String(neighbor.type)})`,
            );
          }
        }
      }
    }

    const vehicleId = event.payload.vehicleId as string | undefined;
    if (vehicleId) {
      const ctx = memory.knowledgeGraph.getFullContext(vehicleId);
      if (ctx.entity) {
        hasContent = true;
        const entity = ctx.entity as Record<string, unknown>;
        lines.push(`Veículo: ${String(entity.label ?? vehicleId)}`);
        const neighbors = ctx.neighbors as
          Array<Record<string, unknown>> | undefined;
        if (neighbors && neighbors.length > 0) {
          lines.push("  Associado a:");
          for (const neighbor of neighbors) {
            lines.push(
              `    - ${String(neighbor.label)} (${String(neighbor.type)})`,
            );
          }
        }
      }
    }

    return hasContent ? lines.join("\n") : "";
  }

  private async buildRecentEventsBlock(
    event: SecurityEvent,
    memory: MemorySystem,
  ): Promise<string> {
    const recent = await memory.eventStore.getRecent(30);
    if (recent.length === 0) return "";

    const lines = ["## Eventos Recentes"];
    const relevant = recent
      .filter((e) => e.eventId !== event.eventId)
      .slice(-15);

    for (const e of relevant) {
      const time = e.timestamp.toLocaleTimeString("pt-BR");
      const persons =
        e.personsInvolved.length > 0
          ? ` [pessoas: ${e.personsInvolved.join(", ")}]`
          : "";
      lines.push(`  ${time} | ${e.eventType} | ${e.description}${persons}`);
    }

    return lines.join("\n");
  }

  private async buildHypothesesBlock(memory: MemorySystem): Promise<string> {
    const hypotheses = await memory.hypothesisStore.getActive();
    if (hypotheses.length === 0) return "";

    const lines = ["## Hipóteses Ativas"];
    for (const h of hypotheses.slice(0, 5)) {
      lines.push(`  - [${(h.probability * 100).toFixed(0)}%] ${h.title}`);
      if (h.description) {
        lines.push(`    ${h.description.slice(0, 100)}`);
      }
    }

    return lines.join("\n");
  }

  private async buildConversationBlock(memory: MemorySystem): Promise<string> {
    const recent = await memory.conversationStore.getRecent(5);
    if (recent.length === 0) return "";

    const lines = ["## Conversa Recente"];
    for (const entry of recent) {
      lines.push(`  Q: ${entry.text.slice(0, 80)}`);
      lines.push(`  R: ${entry.answer.slice(0, 80)}`);
    }

    return lines.join("\n");
  }
}
