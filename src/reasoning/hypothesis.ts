/**
 * Hypothesis Engine — Geração e teste de hipóteses.
 *
 * Motor de raciocínio abdutivo do Vigia: observa eventos anômalos,
 * gera hipóteses sobre o que está acontecendo via LLM, e permite
 * que o usuário as confirme ou rejeite.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";
import type { LlmClient } from "./llm/client.js";
import type { MemorySystem } from "../memory/system.js";

export type HypothesisStatus =
  | "draft"
  | "testing"
  | "confirmed"
  | "rejected"
  | "inconclusive"
  | "user_confirmed"
  | "user_rejected";

export interface Hypothesis {
  hypothesisId: string;
  title: string;
  description: string;
  probability: number;
  status: HypothesisStatus;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  relatedEntities: string[];
  createdAt: Date;
  testedAt: Date | null;
  resolvedAt: Date | null;
  userFeedback: string | null;
}

export class HypothesisEngine {
  private hypotheses: Hypothesis[] = [];

  constructor(
    private llmClient?: LlmClient,
    private memory?: MemorySystem,
  ) {}

  /**
   * Gera hipóteses abdutivas a partir de um evento de segurança.
   *
   * Enriquece o contexto com:
   * - Observação de cena (narration do SceneAnalyzer, se disponível)
   * - Dados de pessoas conhecidas (PersonRegistry)
   *
   * Hipóteses com probability > 0.8 são automaticamente confirmadas.
   * Hipóteses com probability < 0.3 são descartadas.
   */
  async generateFromEvent(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<Hypothesis[]> {
    if (!this.llmClient) {
      logger.warn("HypothesisEngine: LLM client not available");
      return [];
    }

    try {
      // Enriquece o contexto com dados de cena e pessoas
      const enrichedContext = await this.enrichContext(event, context);

      // Chama o LLM para gerar hipóteses
      const rawHypotheses = await this.llmClient.generateHypotheses(
        event,
        enrichedContext,
      );

      // Mapeia para o modelo interno
      const newHypotheses: Hypothesis[] = rawHypotheses.map((h) => {
        const prob = Math.max(0, Math.min(1, h.probability));
        let status: Hypothesis["status"] = "draft";
        if (prob >= 0.8) status = "confirmed";
        else if (prob >= 0.5) status = "testing";

        return {
          hypothesisId: `hyp_${randomUUID().slice(0, 8)}`,
          title: h.title,
          description: h.description,
          probability: prob,
          status,
          supportingEvidence: [],
          contradictingEvidence: [],
          relatedEntities: event.personsInvolved,
          createdAt: new Date(),
          testedAt: null,
          resolvedAt: prob >= 0.8 ? new Date() : null,
          userFeedback: null,
        };
      });

      // Filtra hipóteses com probabilidade muito baixa
      const filtered = newHypotheses.filter((h) => h.probability >= 0.3);

      // Armazena no registro interno
      const maxActive = (context.maxActiveHypotheses as number) ?? 10;
      this.hypotheses.push(...filtered);
      if (this.hypotheses.length > maxActive) {
        this.hypotheses = this.hypotheses.slice(-maxActive);
      }

      logger.info(
        { eventId: event.eventId, count: filtered.length },
        "Hypotheses generated",
      );

      return filtered;
    } catch (err) {
      logger.error(
        { err, eventId: event.eventId },
        "Hypothesis generation failed",
      );
      return [];
    }
  }

  /**
   * Enriquece o contexto com dados adicionais para melhorar a qualidade das hipóteses.
   */
  private async enrichContext(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const enriched = { ...context };

    // Adiciona narração da cena se disponível no payload
    const sceneObservation = event.payload.sceneObservation as
      { description?: { narration?: string } } | undefined;
    if (sceneObservation?.description?.narration) {
      enriched.sceneNarration = sceneObservation.description.narration;
    }

    // Adiciona dados de pessoas conhecidas
    if (this.memory && event.personsInvolved.length > 0) {
      try {
        const personInfos: Array<{
          id: string;
          name: string | null;
          category: string;
          totalVisits: number;
        }> = [];
        for (const pid of event.personsInvolved.slice(0, 3)) {
          const person = await this.memory.personRegistry.get(pid);
          if (person) {
            personInfos.push({
              id: person.personId,
              name: person.name,
              category: person.category,
              totalVisits: person.totalVisits,
            });
          }
        }
        if (personInfos.length > 0) enriched.knownPersons = personInfos;
      } catch {
        /* Ignora erros do PersonRegistry */
      }
    }

    return enriched;
  }

  confirmByUser(hypothesisId: string, feedback = ""): void {
    const h = this.hypotheses.find((x) => x.hypothesisId === hypothesisId);
    if (h) {
      h.status = "user_confirmed";
      h.userFeedback = feedback;
      h.resolvedAt = new Date();
      h.probability = 1.0;
    }
  }

  rejectByUser(hypothesisId: string, feedback = ""): void {
    const h = this.hypotheses.find((x) => x.hypothesisId === hypothesisId);
    if (h) {
      h.status = "user_rejected";
      h.userFeedback = feedback;
      h.resolvedAt = new Date();
      h.probability = 0;
    }
  }

  getActiveHypotheses(): Hypothesis[] {
    return this.hypotheses.filter(
      (h) =>
        !["user_confirmed", "user_rejected", "rejected"].includes(h.status),
    );
  }
}
