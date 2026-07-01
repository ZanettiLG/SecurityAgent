/**
 * Consolidation Engine — Ciclo de auto-aprendizado contínuo.
 *
 * Roda periodicamente para:
 * 1. Consolidar eventos antigos em memórias compactas
 * 2. Atualizar o KnowledgeGraph com novos relacionamentos
 * 3. Atualizar perfis de rotina com padrões observados
 * 4. Gerar e testar hipóteses sobre comportamentos anômalos
 * 5. Identificar dúvidas para perguntar ao usuário
 *
 * Usa o LLM para análise semântica quando disponível, com fallback
 * para extração rule-based de relacionamentos.
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";
import { EventType } from "../core/types.js";
import type { MemorySystem } from "./system.js";
import type { LlmClient } from "../reasoning/llm/client.js";

// ── Types ────────────────────────────────────────────────────────

export interface ConsolidationResult {
  newFacts: Array<{
    type:
      | "relationship"
      | "routine_update"
      | "hypothesis"
      | "question"
      | "memory_compression";
    description: string;
    entities: string[];
  }>;
  memoryCompressed: number;
  timestamp: Date;
}

// ── Consolidation Engine ─────────────────────────────────────────

export class ConsolidationEngine {
  private intervalMs: number;
  private lastRun: Date | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private memory: MemorySystem,
    private llmClient?: LlmClient,
    config?: { intervalMs?: number },
  ) {
    this.intervalMs = config?.intervalMs ?? 300_000; // 5 min default
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.runConsolidation();
    }, this.intervalMs);
    logger.info(
      { intervalMs: this.intervalMs },
      "Consolidation engine started",
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info("Consolidation engine stopped");
  }

  async runConsolidation(): Promise<ConsolidationResult> {
    const start = Date.now();
    const result: ConsolidationResult = {
      newFacts: [],
      memoryCompressed: 0,
      timestamp: new Date(),
    };

    try {
      // 1. Consolidate old events (mark as consolidated)
      const compressed = await this.consolidateOldEvents();
      result.memoryCompressed = compressed;

      // 2. Rule-based relationship extraction (always runs)
      const newEvents = await this.memory.eventStore.getRecent(30);
      const unconsolidated = newEvents.filter((e) => !e.consolidated);

      if (unconsolidated.length >= 1) {
        const facts = this.extractRelationships(unconsolidated);
        result.newFacts.push(...facts);
      }

      // 3. LLM-driven analysis if available (optional enhancement)
      if (this.llmClient && unconsolidated.length >= 3) {
        try {
          const llmFacts = await this.llmAnalyze(unconsolidated);
          result.newFacts.push(...llmFacts);
        } catch (err) {
          logger.warn(
            { err },
            "LLM consolidation analysis failed, using rule-based only",
          );
        }
      }

      this.lastRun = new Date();
      const elapsed = Date.now() - start;
      logger.info(
        {
          elapsed: `${elapsed}ms`,
          facts: result.newFacts.length,
          compressed: result.memoryCompressed,
        },
        "Consolidation cycle complete",
      );
    } catch (err) {
      logger.error({ err }, "Consolidation cycle failed");
    }

    return result;
  }

  private async consolidateOldEvents(): Promise<number> {
    const recent = await this.memory.eventStore.getRecent(24 * 60);
    const toConsolidate = recent.filter((e) => !e.consolidated);

    if (toConsolidate.length === 0) return 0;

    const oneHourAgo = new Date(Date.now() - 3_600_000);
    let count = 0;

    for (const event of toConsolidate) {
      if (event.timestamp < oneHourAgo) {
        event.consolidated = true;
        await this.memory.eventStore.insert(event);
        count++;
      }
    }

    if (count > 0) {
      logger.info({ count }, "Events consolidated");
    }

    return count;
  }

  private extractRelationships(
    events: SecurityEvent[],
  ): ConsolidationResult["newFacts"] {
    const facts: ConsolidationResult["newFacts"] = [];

    for (const event of events) {
      // Use centralized method from KnowledgeGraph (no duplication)
      this.memory.knowledgeGraph.ensureEdgesForEvent(event);

      // Log facts about created relationships
      const vehicleId = event.payload.vehicleId as string | undefined;
      if (event.cameraId) {
        for (const pid of event.personsInvolved) {
          facts.push({
            type: "relationship",
            description: `Pessoa ${pid} vista na câmera ${event.cameraId}`,
            entities: [pid, event.cameraId],
          });
        }
      }
      if (vehicleId) {
        for (const pid of event.personsInvolved) {
          facts.push({
            type: "relationship",
            description: `Pessoa ${pid} associada ao veículo ${vehicleId}`,
            entities: [pid, vehicleId],
          });
        }
      }
    }

    return facts;
  }

  private async llmAnalyze(
    events: SecurityEvent[],
  ): Promise<ConsolidationResult["newFacts"]> {
    if (!this.llmClient) return [];

    const facts: ConsolidationResult["newFacts"] = [];

    const eventsSummary = events
      .map(
        (e) =>
          `[${e.timestamp.toLocaleTimeString("pt-BR")}] ${e.eventType}: ${e.description}`,
      )
      .join("\n");

    const prompt = [
      "Analise os seguintes eventos de segurança e extraia:",
      "1. Relacionamentos entre pessoas e veículos",
      "2. Padrões de comportamento (horários, frequências)",
      "3. Dúvidas que deveriam ser perguntadas ao usuário",
      "4. Hipóteses sobre situações anômalas",
      "",
      "Eventos:",
      eventsSummary,
      "",
      "Retorne APENAS um JSON array:",
      '[{"type": "relationship|pattern|question|hypothesis", "description": "...", "entities": ["id1", "id2"]}]',
    ].join("\n");

    try {
      const response = await this.llmClient.generateText(
        `Você é um analisador de padrões de segurança residencial. Seja conciso.\n\n${prompt}`,
      );

      const parsed = JSON.parse(response) as Array<{
        type: string;
        description: string;
        entities: string[];
      }>;

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            item.type &&
            item.description &&
            ["relationship", "pattern", "question", "hypothesis"].includes(
              item.type,
            )
          ) {
            facts.push({
              type: item.type as ConsolidationResult["newFacts"][0]["type"],
              description: item.description,
              entities: item.entities ?? [],
            });
          }
        }
      }
    } catch {
      logger.warn("Failed to parse LLM consolidation response");
    }

    return facts;
  }
}
