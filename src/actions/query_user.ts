/**
 * Query Manager — Perguntas interativas ao usuário.
 */

import { logger } from "../core/logger.js";
import type { EventBus } from "../core/bus.js";

export type QuestionPriority = "low" | "medium" | "high" | "critical";
export type QuestionStatus = "pending" | "asked" | "answered" | "ignored" | "expired";

export interface Question {
  questionId: string;
  text: string;
  priority: QuestionPriority;
  context: string;
  options: string[] | null;
  expectedAnswerType: "text" | "yes_no" | "choice" | "person_name";
  status: QuestionStatus;
  createdAt: Date;
  askedAt: Date | null;
  answeredAt: Date | null;
  answer: string | null;
  relatedEntities: string[];
  relatedEventId: string | null;
  onAnswer: ((answer: string, processed: unknown) => Promise<void>) | null;
}

export const VIGIA_QUESTIONS = {
  unknownVehicle: {
    text: "Detectei um veículo incomum parado há {duration} minutos. Você conhece este carro?",
    priority: "medium" as QuestionPriority,
    expectedType: "person_name" as const,
  },
  unknownDriver: {
    text: "A pessoa dirigindo não corresponde ao perfil habitual de {personName}. Posso fazer uma pergunta?",
    priority: "low" as QuestionPriority,
    expectedType: "yes_no" as const,
  },
  relationshipHypothesis: {
    text: "{personName} possui algum filho?",
    priority: "low" as QuestionPriority,
    expectedType: "yes_no" as const,
  },
  authorizeInvestigation: {
    text: "Deseja autorizar investigação em fontes públicas sobre {personName}?",
    priority: "low" as QuestionPriority,
    expectedType: "yes_no" as const,
  },
};

export class QueryManager {
  private pendingQuestions: Question[] = [];
  private askedQuestions = new Map<string, Question>();
  private conversationHistory: Array<{ questionId: string; text: string; answer: string; ts: Date }> = [];
  private tone: "informative" | "casual" | "humoristico" = "informative";

  constructor(
    private bus?: EventBus,
  ) {}

  createQuestion(params: {
    text: string;
    priority?: QuestionPriority;
    context?: string;
    options?: string[];
    expectedType?: Question["expectedAnswerType"];
    onAnswer?: Question["onAnswer"];
    relatedEntities?: string[];
    relatedEventId?: string;
  }): Question {
    const question: Question = {
      questionId: `q_${crypto.randomUUID().slice(0, 8)}`,
      text: params.text,
      priority: params.priority ?? "medium",
      context: params.context ?? "",
      options: params.options ?? null,
      expectedAnswerType: params.expectedType ?? "text",
      status: "pending",
      createdAt: new Date(),
      askedAt: null,
      answeredAt: null,
      answer: null,
      relatedEntities: params.relatedEntities ?? [],
      relatedEventId: params.relatedEventId ?? null,
      onAnswer: params.onAnswer ?? null,
    };

    this.pendingQuestions.push(question);
    this.pendingQuestions.sort((a, b) => {
      const order = ["critical", "high", "medium", "low"];
      return order.indexOf(a.priority) - order.indexOf(b.priority);
    });

    return question;
  }

  async askPending(): Promise<Question[]> {
    const asked: Question[] = [];
    for (const q of this.pendingQuestions) {
      const formatted = this.formatQuestion(q);
      q.status = "asked";
      q.askedAt = new Date();
      this.askedQuestions.set(q.questionId, q);
      this.bus?.publish("query.user", { questionId: q.questionId, text: formatted, priority: q.priority });
      asked.push(q);
      logger.info(`Question asked: ${formatted.slice(0, 80)}...`);
    }
    this.pendingQuestions = [];
    return asked;
  }

  async processAnswer(questionId: string, answer: string): Promise<unknown> {
    const q = this.askedQuestions.get(questionId);
    if (!q) {
      logger.warn(`Question ${questionId} not found`);
      return null;
    }

    q.answer = answer;
    q.answeredAt = new Date();
    q.status = "answered";

    const processed = await this.processAnswerByType(q, answer);
    this.conversationHistory.push({ questionId, text: q.text, answer, ts: new Date() });

    if (q.onAnswer) {
      await q.onAnswer(answer, processed);
    }

    return processed;
  }

  private async processAnswerByType(q: Question, answer: string): Promise<unknown> {
    if (q.expectedAnswerType === "yes_no") {
      const lower = answer.toLowerCase();
      return ["sim", "s", "yes", "y", "claro", "pode"].includes(lower);
    }
    return answer;
  }

  private formatQuestion(q: Question): string {
    const parts: string[] = [];
    if (q.context) parts.push(q.context);
    parts.push(q.text);
    if (q.options) parts.push(...q.options.map((o) => `  • ${o}`));
    return parts.join("\n");
  }

  getConversationSummary(): string {
    if (!this.conversationHistory.length) return "Nenhuma pergunta nesta sessão.";
    const lines = ["Resumo da conversa:"];
    for (const entry of this.conversationHistory.slice(-10)) {
      lines.push(`  Q: ${entry.text.slice(0, 60)}...`);
      lines.push(`  R: ${entry.answer.slice(0, 60)}...`);
    }
    return lines.join("\n");
  }

  get pendingCount(): number {
    return this.pendingQuestions.length;
  }
}
