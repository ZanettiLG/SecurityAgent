/**
 * LLM Client — OpenAI-compatible API (vLLM, OpenAI, OpenRouter, etc.).
 *
 * Fornece avaliação de eventos de segurança, geração de hipóteses
 * e sumários diários usando LLMs. Usa exclusivamente o SDK OpenAI
 * com baseURL configurável — compatível com qualquer servidor
 * que exponha a API /v1/chat/completions.
 */

import OpenAI from "openai";
import type { SecurityEvent } from "../../core/types.js";
import { Severity } from "../../core/types.js";
import { logger } from "../../core/logger.js";

// ── Types ────────────────────────────────────────────────────────

export interface LlmAssessment {
  assessment: string;
  threatLevel: number; // 0-10
  suggestedActions: string[];
  explanation: string;
  anomalyScore: number; // 0-1
  personIdentification?: Record<string, string>;
}

export interface LlmClientConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// ── System Prompt ────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um agente de segurança residencial inteligente (Vigia).
Você analisa eventos de câmeras, áudio e sensores para avaliar situações.
Seu objetivo é proteger a residência, identificar ameaças e ajudar os moradores.

Regras:
1. Seja conservador: na dúvida, alerte.
2. Priorize a segurança das pessoas.
3. Considere o contexto (horário, frequência, padrões).
4. Responda SEMPRE em JSON estruturado quando solicitado.
5. Qualquer pessoa não identificada à noite é suspeita.
6. Entregadores e prestadores de serviço durante o dia são normais.
7. Seja conciso e informativo. Use português.`;

// ── Severity label helper ────────────────────────────────────────

function severityLabel(severity: number): string {
  const labels: Record<number, string> = {
    [Severity.INFO]: "INFO",
    [Severity.LOW]: "LOW",
    [Severity.MEDIUM]: "MEDIUM",
    [Severity.HIGH]: "HIGH",
    [Severity.CRITICAL]: "CRITICAL",
  };
  return labels[severity] ?? "UNKNOWN";
}

// ── LlmClient ────────────────────────────────────────────────────

export class LlmClient {
  private config: LlmClientConfig;

  constructor(config: LlmClientConfig) {
    this.config = {
      maxTokens: 4096,
      temperature: 0.3,
      ...config,
    };
  }

  /** Retorna true se o modelo é do tipo thinking/reasoning. */
  private isThinkingModel(): boolean {
    return (
      this.config.model.includes("thinking") ||
      this.config.model.includes("reasoning") ||
      this.config.model.includes("deepseek-r1")
    );
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Avalia um evento de segurança e retorna uma avaliação estruturada.
   * O contexto pode incluir `kgContext` (Knowledge Graph enrichment)
   * e `sceneContext` (SceneContext do agente) para análise enriquecida.
   */
  async evaluate(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<LlmAssessment> {
    const enrichedLines: string[] = [];

    // Add SceneContext if present
    const sceneCtx = context.sceneContext as
      Record<string, unknown> | undefined;
    if (sceneCtx) {
      enrichedLines.push("## Contexto de Cena");
      enrichedLines.push(`Local: ${sceneCtx.label ?? "N/A"}`);
      enrichedLines.push(`Descrição: ${sceneCtx.description ?? ""}`);
      const residents = sceneCtx.knownResidents as
        Array<{ name: string; relationship: string }> | undefined;
      if (residents?.length) {
        enrichedLines.push(
          `Residentes: ${residents.map((r) => `${r.name} (${r.relationship})`).join(", ")}`,
        );
      }
      enrichedLines.push("");
    }

    // Add KG enrichment if present
    const kgCtx = event.payload.kgContext as
      Record<string, unknown> | undefined;
    if (kgCtx) {
      enrichedLines.push("## Knowledge Graph Context");
      for (const [entityId, entityCtx] of Object.entries(kgCtx)) {
        const ctx = entityCtx as Record<string, unknown>;
        const entity = ctx.entity as Record<string, unknown> | undefined;
        if (entity) {
          enrichedLines.push(
            `Entidade: ${entity.label as string} (${entity.type as string})`,
          );
          const neighbors = ctx.neighbors as
            Array<Record<string, unknown>> | undefined;
          if (neighbors?.length) {
            enrichedLines.push(
              `  Relacionamentos: ${neighbors.map((n) => `${n.label as string} (${n.type as string})`).join(", ")}`,
            );
          }
        }
      }
      enrichedLines.push("");
    }

    const userPrompt = [
      "Analise o seguinte evento de segurança:",
      "",
      `Evento: ${event.description}`,
      `Tipo: ${event.eventType}`,
      `Gravidade: ${severityLabel(event.severity)}`,
      `Câmera: ${event.cameraId ?? "N/A"}`,
      `Timestamp: ${event.timestamp.toISOString()}`,
      `Pessoas envolvidas: ${event.personsInvolved.join(", ") || "nenhuma"}`,
      `Payload: ${JSON.stringify(event.payload)}`,
      "",
      ...enrichedLines,
      "Contexto adicional:",
      JSON.stringify(context, null, 2),
      "",
      `Retorne APENAS um JSON com:
{
  "assessment": "avaliação da situação em português",
  "threat_level": 0-10,
  "suggested_actions": ["ação1", "ação2"],
  "explanation": "explicação detalhada",
  "anomaly_score": 0.0-1.0,
  "person_identification": {"personId": "nome_sugerido"} (opcional)
}`,
    ].join("\n");

    const response = await this.generate(SYSTEM_PROMPT, userPrompt);
    return this.parseAssessment(response);
  }

  /**
   * Gera hipóteses sobre o que pode estar acontecendo em um evento.
   */
  async generateHypotheses(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<
    Array<{ title: string; description: string; probability: number }>
  > {
    const userPrompt = [
      "Gere hipóteses sobre o seguinte evento de segurança:",
      "",
      `Evento: ${event.description}`,
      `Tipo: ${event.eventType}`,
      `Gravidade: ${severityLabel(event.severity)}`,
      `Câmera: ${event.cameraId ?? "N/A"}`,
      `Timestamp: ${event.timestamp.toISOString()}`,
      `Pessoas envolvidas: ${event.personsInvolved.join(", ") || "nenhuma"}`,
      `Payload: ${JSON.stringify(event.payload)}`,
      "",
      "Contexto adicional:",
      JSON.stringify(context, null, 2),
      "",
      `Retorne APENAS um JSON com uma lista de hipóteses no formato:
{
  "hypotheses": [
    {
      "title": "título curto da hipótese",
      "description": "descrição detalhada em português",
      "probability": 0.0-1.0
    }
  ]
}`,
    ].join("\n");

    const response = await this.generate(SYSTEM_PROMPT, userPrompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const data = JSON.parse(jsonMatch?.[0] ?? response);
      const hypotheses = data.hypotheses ?? [];
      return hypotheses.map((h: Record<string, unknown>) => ({
        title: String(h.title ?? ""),
        description: String(h.description ?? ""),
        probability: Number(h.probability ?? 0),
      }));
    } catch {
      logger.warn(
        { raw: response.slice(0, 200) },
        "Failed to parse hypotheses response",
      );
      return [];
    }
  }

  /**
   * Gera um resumo diário dos eventos de segurança.
   */
  async generateDailySummary(
    events: SecurityEvent[],
    date: string,
  ): Promise<string> {
    if (events.length === 0) {
      return `Nenhum evento registrado em ${date}.`;
    }

    const eventsText = events
      .map(
        (e, i) =>
          `${i + 1}. [${severityLabel(e.severity)}] ${e.eventType}: ${e.description} ` +
          `(${e.timestamp.toISOString()}) — Câmera: ${e.cameraId ?? "N/A"}`,
      )
      .join("\n");

    const userPrompt = [
      `Resuma os seguintes eventos de segurança do dia ${date}:`,
      "",
      eventsText,
      "",
      "Forneça um resumo conciso em português destacando:",
      "- Total de eventos",
      "- Eventos mais relevantes (ameaças, anomalias)",
      "- Padrões observados",
      "- Recomendações (se houver)",
      "",
      "Retorne apenas o texto do resumo, sem JSON.",
    ].join("\n");

    const response = await this.generate(SYSTEM_PROMPT, userPrompt);
    return response.trim();
  }

  // ── Private: LLM generation ──────────────────────────────────

  /**
   * Gera resposta do LLM usando SDK OpenAI com baseURL configurável.
   * Compatível com vLLM, OpenAI, OpenRouter — qualquer servidor
   * que exponha /v1/chat/completions.
   */
  private async generate(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const client = new OpenAI({
      apiKey: this.config.apiKey ?? "not-needed",
      baseURL: this.config.baseUrl,
    });

    const response = await client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      ...(this.isThinkingModel()
        ? { extra_body: { enable_thinking: true } }
        : {}),
    });

    return response.choices[0]?.message?.content ?? "";
  }

  // ── Public: Simple text generation ──────────────────────────

  /**
   * Gera texto livre a partir de um prompt de usuário.
   * Usa o system prompt padrão do Vigia.
   */
  async generateText(userPrompt: string): Promise<string> {
    return this.generate(SYSTEM_PROMPT, userPrompt);
  }

  // ── Private: Response parsing ─────────────────────────────────

  /**
   * Faz o parse da resposta do LLM para um `LlmAssessment`.
   *
   * É robusto contra:
   * - JSON envolto em markdown code blocks (```json ... ```)
   * - JSON com texto antes/depois
   * - Campos snake_case (da API) mapeados para camelCase (interno)
   */
  private parseAssessment(raw: string): LlmAssessment {
    try {
      // Remove markdown code blocks se presentes
      let cleaned = raw.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch?.[1]) {
        cleaned = codeBlockMatch[1].trim();
      }

      // Extrai o primeiro objeto JSON do texto
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const data = JSON.parse(jsonMatch?.[0] ?? cleaned);

      return {
        assessment: data.assessment ?? "",
        threatLevel:
          typeof data.threat_level === "number"
            ? data.threat_level
            : typeof data.threatLevel === "number"
              ? data.threatLevel
              : 0,
        suggestedActions: data.suggested_actions ?? data.suggestedActions ?? [],
        explanation: data.explanation ?? "",
        anomalyScore:
          typeof data.anomaly_score === "number"
            ? data.anomaly_score
            : typeof data.anomalyScore === "number"
              ? data.anomalyScore
              : 0,
        personIdentification:
          data.person_identification ?? data.personIdentification ?? undefined,
      };
    } catch {
      logger.warn({ raw: raw.slice(0, 200) }, "Failed to parse LLM response");
      return {
        assessment: "Erro ao processar resposta do LLM",
        threatLevel: 0,
        suggestedActions: [],
        explanation: raw.slice(0, 500),
        anomalyScore: 0,
      };
    }
  }
}
