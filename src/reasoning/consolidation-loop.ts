/**
 * Consolidation Loop — Ciclo de Auto-Aprendizado Contínuo LLM-Driven.
 *
 * Periodicamente "para e pensa" sobre o que foi observado, consolidando
 * conhecimento como um vigia humano faria:
 *   observa → relaciona → aprende → pergunta → atualiza modelo mental
 *
 * Três gatilhos disparam a consolidação:
 *   - Temporal: a cada 5 minutos
 *   - Quantitativo: 50+ eventos não-consolidados
 *   - Evento Crítico: severity >= HIGH
 */

import { logger } from "../core/logger.js";
import type { EventBus } from "../core/bus.js";
import type { SecurityEvent, Severity } from "../core/types.js";
import { Severity as Sev } from "../core/types.js";
import type { LlmClient } from "./llm/client.js";
import type { ContextCompiler } from "./context-compiler.js";
import type { MemorySystem } from "../memory/system.js";
import type { HypothesisEngine } from "./hypothesis.js";
import type { QueryManager } from "../actions/query_user.js";

// ── Types ────────────────────────────────────────────────────────

interface NewFact {
  type: string;
  description: string;
  confidence: number;
}

interface HypothesisUpdate {
  hypothesisId: string;
  newStatus: "confirmed" | "refuted" | "updated";
  reason: string;
}

interface Question {
  text: string;
  priority: "low" | "medium" | "high";
}

interface Summary {
  compactMemory: string;
}

interface ConsolidationResult {
  newFacts: NewFact[];
  hypothesisUpdates: HypothesisUpdate[];
  questions: Question[];
  summaries: Summary[];
}

export interface ConsolidationOptions {
  /** Intervalo entre consolidações temporais (ms). Padrão: 5 min */
  intervalMs?: number;
  /** Número de eventos não-consolidados que dispara consolidação. Padrão: 50 */
  eventThreshold?: number;
  /** Token budget total para o prompt de consolidação */
  tokenBudget?: number;
}

// ── Consolidation Loop ──────────────────────────────────────────

const CONSOLIDATION_PROMPT = [
  "Você é o Vigia, um agente de segurança com inteligência ambiental contínua.",
  "Você está revisando eventos recentes para consolidar conhecimento.",
  "",
  "Analise os eventos e responda APENAS em JSON:",
  "{",
  '  "newFacts": [',
  '    { "type": "entity|relation|pattern", "description": "...", "confidence": 0.0-1.0 }',
  "  ],",
  '  "hypothesisUpdates": [',
  '    { "hypothesisId": "id", "newStatus": "confirmed|refuted|updated", "reason": "..." }',
  "  ],",
  '  "questions": [',
  '    { "text": "pergunta para o usuário", "priority": "low|medium|high" }',
  "  ],",
  '  "summaries": [',
  '    { "compactMemory": "resumo de eventos antigos em 1-2 frases" }',
  "  ]",
  "}",
  "",
  "Regras:",
  "1. Se não houver fatos novos, retorne array vazio",
  "2. Se não houver hipóteses para atualizar, retorne array vazio",
  "3. Perguntas só se houver dúvida genuína que o usuário possa responder",
  "4. Sumários só para eventos que já foram processados e podem ser comprimidos",
  "5. Retorne APENAS o JSON, sem markdown ou texto extra",
].join("\n");

export class ConsolidationLoop {
  private interval: ReturnType<typeof setInterval> | null = null;
  private unconsolidatedCount = 0;
  private running = false;
  private options: Required<ConsolidationOptions>;

  constructor(
    private llmClient: LlmClient,
    private contextCompiler: ContextCompiler,
    private memory: MemorySystem,
    private hypothesisEngine: HypothesisEngine | null,
    private queryManager: QueryManager | null,
    private bus: EventBus,
    options?: ConsolidationOptions,
  ) {
    this.options = {
      intervalMs: options?.intervalMs ?? 5 * 60 * 1000,
      eventThreshold: options?.eventThreshold ?? 50,
      tokenBudget: options?.tokenBudget ?? 3000,
    };
  }

  // ── Lifecycle ───────────────────────────────────────────────

  /** Inicia o loop de consolidação */
  start(): void {
    if (this.running) return;
    this.running = true;

    // Gatilho temporal
    this.interval = setInterval(() => {
      void this.consolidate("temporal");
    }, this.options.intervalMs);

    // Gatilho por contagem de eventos
    this.bus.subscribe("vision.event", () => {
      this.unconsolidatedCount++;
      if (this.unconsolidatedCount >= this.options.eventThreshold) {
        void this.consolidate("quantitative");
      }
    });

    // Gatilho por evento crítico
    this.bus.subscribe("vision.event", (_topic, payload) => {
      const evt = payload as unknown as SecurityEvent;
      if (evt.severity >= Sev.HIGH) {
        void this.consolidate("critical");
      }
    });

    logger.info(
      {
        intervalMin: this.options.intervalMs / 60000,
        threshold: this.options.eventThreshold,
      },
      "ConsolidationLoop started",
    );
  }

  /** Para o loop de consolidação */
  stop(): void {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.bus.unsubscribeAll("vision.event");
    logger.info("ConsolidationLoop stopped");
  }

  // ── Core ────────────────────────────────────────────────────

  /**
   * Executa um ciclo de consolidação.
   * Monta prompt com eventos recentes + contexto, chama LLM,
   * parseia resposta e aplica ações nos subsistemas.
   */
  async consolidate(trigger: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Busca eventos recentes (últimos 30 min)
      const recentEvents = await this.memory.eventStore.getRecent(30);
      if (recentEvents.length === 0) {
        logger.debug("Consolidation: no recent events to consolidate");
        return;
      }

      // Cria um evento dummy para o ContextCompiler
      const dummyEvent: SecurityEvent = {
        eventId: `consolidation_${startTime}`,
        timestamp: new Date(),
        cameraId: null,
        eventType: "consolidated" as SecurityEvent["eventType"],
        severity: Sev.INFO as Severity,
        personsInvolved: [],
        description: "Ciclo de consolidação automática",
        snapshotPath: null,
        audioClipPath: null,
        payload: { trigger },
        actionsTaken: [],
        llmSummary: null,
        anomalyScore: 0,
        consolidated: false,
      };

      // Compila contexto usando ContextCompiler
      const context = await this.contextCompiler.compile(
        dummyEvent,
        this.options.tokenBudget,
      );

      // Monta prompt de consolidação
      const eventsText = recentEvents
        .slice(-30)
        .map((e) => {
          const sev =
            e.severity >= 4
              ? "🔴"
              : e.severity >= 3
                ? "🟡"
                : e.severity >= 2
                  ? "🔵"
                  : "⚪";
          return `${sev} ${e.timestamp.toISOString().slice(11, 19)} | ${e.eventType}: ${e.description}`;
        })
        .join("\n");

      const userPrompt = [
        `## EVENTOS RECENTES (últimos 30 min — ${recentEvents.length} eventos)`,
        eventsText,
        "",
        "## CONTEXTO ATUAL DO SISTEMA",
        context,
        "",
        CONSOLIDATION_PROMPT,
      ].join("\n");

      // Chama LLM
      const response = await this.llmClient.generateText(userPrompt);
      if (!response) {
        logger.warn("Consolidation: empty LLM response");
        return;
      }

      // Parse JSON
      const result = this.parseResponse(response);
      if (!result) return;

      // Aplica ações
      await this.applyActions(result, trigger);

      this.unconsolidatedCount = 0;

      logger.info(
        {
          trigger,
          durationMs: Date.now() - startTime,
          facts: result.newFacts.length,
          hypotheses: result.hypothesisUpdates.length,
          questions: result.questions.length,
          summaries: result.summaries.length,
        },
        "Consolidation cycle complete",
      );
    } catch (err) {
      logger.error({ err, trigger }, "Consolidation failed");
    }
  }

  // ── Private helpers ─────────────────────────────────────────

  /** Extrai e valida o JSON da resposta do LLM */
  private parseResponse(raw: string): ConsolidationResult | null {
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();

      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      return {
        newFacts: Array.isArray(parsed.newFacts)
          ? (parsed.newFacts as NewFact[])
          : [],
        hypothesisUpdates: Array.isArray(parsed.hypothesisUpdates)
          ? (parsed.hypothesisUpdates as HypothesisUpdate[])
          : [],
        questions: Array.isArray(parsed.questions)
          ? (parsed.questions as Question[])
          : [],
        summaries: Array.isArray(parsed.summaries)
          ? (parsed.summaries as Summary[])
          : [],
      };
    } catch {
      logger.warn(
        { raw: raw.slice(0, 200) },
        "Consolidation: failed to parse LLM JSON",
      );
      return null;
    }
  }

  /** Aplica as ações de consolidação nos subsistemas */
  private async applyActions(
    result: ConsolidationResult,
    trigger: string,
  ): Promise<void> {
    // 1. Novos fatos → log + KnowledgeGraph (quando disponível)
    for (const fact of result.newFacts) {
      logger.info(
        {
          type: fact.type,
          description: fact.description,
          confidence: fact.confidence,
        },
        "Consolidation: new fact discovered",
      );
      // TODO: integrar com KnowledgeGraph quando ele tiver API de escrita de fatos
    }

    // 2. Atualizações de hipóteses → HypothesisEngine
    if (this.hypothesisEngine) {
      for (const update of result.hypothesisUpdates) {
        const active = this.hypothesisEngine.getActiveHypotheses();
        const hyp = active.find(
          (h) => (h as unknown as { id: string }).id === update.hypothesisId,
        );
        if (hyp) {
          logger.info(
            { id: update.hypothesisId, status: update.newStatus },
            "Consolidation: hypothesis updated",
          );
          this.bus.publish("consolidation.hypothesis_update", {
            hypothesisId: update.hypothesisId,
            newStatus: update.newStatus,
            reason: update.reason,
          });
        }
      }
    }

    // 3. Perguntas → QueryManager
    if (this.queryManager) {
      for (const q of result.questions) {
        this.queryManager.createQuestion({
          text: q.text,
          priority: q.priority as "low" | "medium" | "high",
          expectedType: "text",
        });
      }
    }

    // 4. Sumários → marcar eventos como consolidados
    if (result.summaries.length > 0) {
      for (const s of result.summaries) {
        logger.info(
          { summary: s.compactMemory.slice(0, 120) },
          "Consolidation: compact memory created",
        );
      }
      // Marca eventos recentes como consolidados
      await this.memory.consolidate();
    }

    // Publica evento de consolidação concluída
    this.bus.publish("consolidation.complete", {
      trigger,
      newFacts: result.newFacts.length,
      hypothesisUpdates: result.hypothesisUpdates.length,
      questions: result.questions.length,
      summaries: result.summaries.length,
    });
  }
}
