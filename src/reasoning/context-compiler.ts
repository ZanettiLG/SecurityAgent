/**
 * Context Compiler — Montagem Hierárquica de Contexto para LLM.
 *
 * Compila múltiplas fontes de contexto em um prompt otimizado,
 * respeitando token budget e priorizando camadas por relevância.
 *
 * Arquitetura:
 *   0. SYSTEM_PROMPT    (fixo, prioridade máxima)
 *   1. SCENE_CONTEXT    (SceneContextStore → "o que é normal nesta câmera")
 *   2. KNOWLEDGE_GRAPH  (KnowledgeGraph → entidades relacionadas)
 *   3. ROUTINE_CONTEXT  (RoutineLearner → baselines horárias)
 *   4. RECENT_EVENTS    (EventStore → janela deslizante)
 *   5. ACTIVE_HYPOTHESES (HypothesisEngine → hipóteses em aberto)
 *   6. CONVERSATION     (ConversationStore → últimas interações)
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";

// ── Interfaces ──────────────────────────────────────────────────

export interface ContextLayer {
  /** Nome descritivo da camada (aparece como heading no prompt) */
  name: string;
  /** Prioridade: 0 = mais importante, vai primeiro no prompt */
  priority: number;
  /** Budget máximo de tokens para esta camada */
  maxTokens: number;
  /** Constrói o conteúdo textual da camada para um evento */
  build(event: SecurityEvent): Promise<string>;
}

export interface ContextCompilerConfig {
  /** Token budget total do prompt (padrão: 3500 para MiniCPM) */
  totalBudget: number;
  /** System prompt fixo — sempre vai primeiro */
  systemPrompt: string;
}

// ── Context Compiler ────────────────────────────────────────────

export class ContextCompiler {
  private layers: ContextLayer[] = [];
  private systemPrompt: string;
  private totalBudget: number;

  constructor(config: ContextCompilerConfig) {
    this.systemPrompt = config.systemPrompt;
    this.totalBudget = config.totalBudget;
  }

  /** Registra uma camada de contexto. Ordena automaticamente por prioridade. */
  registerLayer(layer: ContextLayer): void {
    this.layers.push(layer);
    this.layers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Compila o prompt completo para um evento.
   *
   * @param event Evento de segurança atual
   * @param budgetOverride Opcional — sobrescreve o budget total
   * @returns Prompt completo (system + todas as camadas)
   */
  async compile(
    event: SecurityEvent,
    budgetOverride?: number,
  ): Promise<string> {
    const totalBudget = budgetOverride ?? this.totalBudget;

    // System prompt sempre primeiro (conta contra o budget)
    const systemTokens = estimateTokens(this.systemPrompt);
    let remaining = totalBudget - systemTokens;

    const sections: string[] = [this.systemPrompt];

    for (const layer of this.layers) {
      if (remaining <= 0) break;

      const budget = Math.min(layer.maxTokens, remaining);
      if (budget <= 10) continue; // não vale a pena incluir

      try {
        const content = await layer.build(event);
        if (!content || content.trim().length === 0) continue;

        const truncated = truncateToTokens(content, budget);
        if (truncated.length === 0) continue;

        const heading = layer.name.length > 0 ? `\n### ${layer.name}\n` : "\n";
        sections.push(`${heading}${truncated}`);
        remaining -= estimateTokens(heading + truncated);
      } catch (err) {
        logger.warn(
          { err, layer: layer.name },
          "ContextCompiler: layer build failed, skipping",
        );
      }
    }

    return sections.join("\n");
  }

  /** Retorna estatísticas do contexto (para debug/logging) */
  getStats(): {
    layers: Array<{ name: string; priority: number; maxTokens: number }>;
    totalBudget: number;
  } {
    return {
      layers: this.layers.map((l) => ({
        name: l.name,
        priority: l.priority,
        maxTokens: l.maxTokens,
      })),
      totalBudget: this.totalBudget,
    };
  }
}

// ── Helpers exportados ──────────────────────────────────────────

/** Estima número de tokens baseado em comprimento de caracteres (~4 chars/token) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Trunca texto para caber em `maxTokens`, preservando frases completas.
 * Corta no último `\n` antes do limite para não truncar no meio de uma linha.
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  if (text.length === 0) return "";

  const maxChars = maxTokens * 4;

  if (text.length <= maxChars) return text;

  // Trunca e volta até o último \n (preserva integridade das linhas)
  let truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf("\n");

  if (lastNewline > maxChars * 0.5) {
    // Só usa o corte no \n se não perder metade do conteúdo
    truncated = truncated.slice(0, lastNewline);
  } else {
    // Corta na última palavra completa
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxChars * 0.5) {
      truncated = truncated.slice(0, lastSpace);
    }
  }

  return truncated + "\n[...truncado]";
}

// ── Built-in Layers ─────────────────────────────────────────────

/**
 * Cria uma layer de contexto a partir de um getter simples.
 * Útil para camadas que já têm métodos de contexto prontos.
 */
export function createLayer(
  name: string,
  priority: number,
  maxTokens: number,
  buildFn: (event: SecurityEvent) => Promise<string>,
): ContextLayer {
  return { name, priority, maxTokens, build: buildFn };
}

/**
 * Cria uma layer de SCENE_CONTEXT a partir do SceneContextStore.
 */
export function createSceneContextLayer(
  getLlmContext: (cameraId: string) => string,
): ContextLayer {
  return createLayer("CONTEXTO DA CENA", 10, 500, async (event) => {
    if (!event.cameraId) return "";
    return getLlmContext(event.cameraId);
  });
}

/**
 * Cria uma layer de RECENT_EVENTS a partir do EventStore.
 */
export function createRecentEventsLayer(
  getRecentEvents: () => Promise<
    Array<{
      timestamp: string;
      type: string;
      description: string;
      severity: number;
    }>
  >,
): ContextLayer {
  return createLayer("EVENTOS RECENTES", 40, 600, async () => {
    const events = await getRecentEvents();
    if (events.length === 0) return "Nenhum evento recente registrado.";

    return events
      .map((e) => {
        const sevLabel =
          e.severity >= 4
            ? "🔴"
            : e.severity >= 3
              ? "🟡"
              : e.severity >= 2
                ? "🔵"
                : "⚪";
        return `${sevLabel} ${e.timestamp.slice(11, 19)} | ${e.type}: ${e.description}`;
      })
      .join("\n");
  });
}

/**
 * Cria uma layer de ACTIVE_HYPOTHESES a partir do HypothesisEngine.
 */
export function createActiveHypothesesLayer(
  getActiveHypotheses: () => Array<{
    title: string;
    description: string;
    probability: number;
  }>,
): ContextLayer {
  return createLayer("HIPÓTESES ATIVAS", 50, 300, async () => {
    const hypotheses = getActiveHypotheses();
    if (hypotheses.length === 0) return "Nenhuma hipótese ativa.";

    return hypotheses
      .map(
        (h) =>
          `- ${h.title} (${(h.probability * 100).toFixed(0)}%): ${h.description}`,
      )
      .join("\n");
  });
}

/**
 * Cria uma layer stub para KNOWLEDGE_GRAPH (dados ainda não disponíveis).
 */
export function createKnowledgeGraphStubLayer(): ContextLayer {
  return createLayer("GRAFO DE CONHECIMENTO", 20, 400, async () => {
    return "[Grafo de conhecimento não inicializado — nenhuma entidade registrada]";
  });
}

/**
 * Cria uma layer stub para ROUTINE_CONTEXT (dados ainda não disponíveis).
 */
export function createRoutineContextStubLayer(): ContextLayer {
  return createLayer("CONTEXTO DE ROTINA", 30, 400, async () => {
    return "[Rotinas ainda não aprendidas — baseline insuficiente]";
  });
}

/**
 * Cria uma layer stub para CONVERSATION_HISTORY (dados ainda não disponíveis).
 */
export function createConversationHistoryStubLayer(): ContextLayer {
  return createLayer("HISTÓRICO DE CONVERSA", 60, 300, async () => {
    return "[Nenhuma conversa registrada nesta sessão]";
  });
}
