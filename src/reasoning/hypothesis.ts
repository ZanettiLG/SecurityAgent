/**
 * Hypothesis Engine — Geração e teste de hipóteses.
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";

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
    private llmClient?: unknown,
    private memory?: unknown,
  ) {}

  async generateFromEvent(event: SecurityEvent, context: Record<string, unknown>): Promise<Hypothesis[]> {
    // TODO: Integrate with LLM to generate hypotheses
    logger.info({ eventId: event.eventId }, "Hypothesis generation triggered");
    return [];
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
      (h) => !["user_confirmed", "user_rejected", "rejected"].includes(h.status),
    );
  }
}
