/**
 * LLM Client — Integração com OpenAI, Anthropic Claude e Ollama (local).
 *
 * Fornece avaliação de eventos de segurança, geração de hipóteses
 * e sumários diários usando LLMs. Suporta fallback determinístico
 * quando nenhuma API key está configurada.
 */

import OpenAI from "openai";
import type { SecurityEvent } from "../../core/types.js";
import { EventType, Severity, createEvent } from "../../core/types.js";
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
  provider: "openai" | "anthropic" | "ollama";
  model: string;
  apiKey?: string;
  baseUrl?: string;
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
      maxTokens: 1000,
      temperature: 0.3,
      ...config,
    };
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Avalia um evento de segurança e retorna uma avaliação estruturada.
   */
  async evaluate(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<LlmAssessment> {
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
  ): Promise<Array<{ title: string; description: string; probability: number }>> {
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
      logger.warn({ raw: response.slice(0, 200) }, "Failed to parse hypotheses response");
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
   * Gera uma resposta do LLM usando o provedor configurado.
   * Suporta OpenAI, Anthropic Claude e Ollama.
   * Retorna fallback determinístico quando nenhuma API key está configurada.
   */
  private async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    // ── Fallback: sem API key (exceto Ollama que é local) ──
    if (!this.config.apiKey && this.config.provider !== "ollama") {
      logger.warn("No API key configured, using fallback responses");
      return JSON.stringify({
        assessment: "LLM não configurado — usando fallback",
        threat_level: 0,
        suggested_actions: [],
        explanation: "Configure uma API key para avaliações reais.",
        anomaly_score: 0,
      });
    }

    switch (this.config.provider) {
      case "openai":
        return this.generateOpenAI(systemPrompt, userPrompt);
      case "anthropic":
        return this.generateAnthropic(systemPrompt, userPrompt);
      case "ollama":
        return this.generateOllama(systemPrompt, userPrompt);
      default:
        logger.warn({ provider: this.config.provider }, "Unknown provider, using fallback");
        return JSON.stringify({
          assessment: "Provedor desconhecido",
          threat_level: 0,
          suggested_actions: [],
          explanation: `Provider "${this.config.provider}" não suportado.`,
          anomaly_score: 0,
        });
    }
  }

  /**
   * Chamada à API da OpenAI com JSON mode forçado.
   */
  private async generateOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const client = new OpenAI({ apiKey: this.config.apiKey });

    const response = await client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content ?? "";
  }

  /**
   * Chamada à API Anthropic (Claude).
   * O SDK é importado dinamicamente pois é uma dependência opcional.
   */
  private async generateAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
    let Anthropic: new (config: { apiKey: string }) => {
      messages: {
        create: (params: {
          model: string;
          max_tokens: number;
          temperature?: number;
          system: string;
          messages: Array<{ role: "user"; content: string }>;
        }) => Promise<{
          content: Array<{ type: string; text?: string }>;
        }>;
      };
    };

    try {
      const mod = await import("@anthropic-ai/sdk");
      Anthropic = mod.default ?? mod.Anthropic;
    } catch {
      logger.error("@anthropic-ai/sdk is not installed. Install it as an optional dependency.");
      return JSON.stringify({
        assessment: "SDK Anthropic não instalado",
        threat_level: 0,
        suggested_actions: [],
        explanation: "Instale @anthropic-ai/sdk para usar o Claude.",
        anomaly_score: 0,
      });
    }

    const client = new Anthropic({ apiKey: this.config.apiKey! });

    const response = await client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 1000,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0]?.type === "text" ? (response.content[0].text ?? "") : "";

    return text;
  }

  /**
   * Chamada à API Ollama (local) via fetch.
   */
  private async generateOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    const baseUrl = this.config.baseUrl ?? "http://localhost:11434";

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        options: { temperature: this.config.temperature },
      }),
    });

    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        "Ollama API request failed",
      );
      return JSON.stringify({
        assessment: "Erro na comunicação com Ollama",
        threat_level: 0,
        suggested_actions: [],
        explanation: `Ollama retornou status ${response.status}: ${response.statusText}`,
        anomaly_score: 0,
      });
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content ?? "";
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
