/**
 * Retrospective Analyzer — Aprendizado pós-incidente.
 *
 * "Após o incidente, o sistema iniciou uma análise retrospectiva.
 *  Revisou milhares de horas de gravações. Centenas de ocorrências
 *  policiais públicas."
 *
 * Analisa eventos anteriores a um crime/incidente confirmado,
 * extrai a assinatura comportamental que o precedeu e a registra
 * para detecção futura.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";
import {
  BehavioralPatternMatcher,
  type BehavioralEvent,
  type BehavioralSignature,
} from "./behavioral_pattern.js";
import type { MemorySystem } from "../memory/system.js";
import type { LlmClient } from "./llm/client.js";

// ── Interfaces ───────────────────────────────────────────────────

export interface IncidentReport {
  incidentId: string;
  incidentType: string; // "burglary", "theft", "vandalism", "suspicious"
  location: string; // "casa da dona Olinda"
  timestamp: Date; // Quando o crime ocorreu
  confirmedBy: string; // "user", "police", "news"
  preludeEvents: SecurityEvent[]; // Eventos que antecederam o crime
  learnedSignatureId: string | null; // Assinatura aprendida
}

export interface RetrospectiveResult {
  incidentId: string;
  signaturesCreated: number;
  patternsFound: number;
  summary: string;
}

// ── Constants ────────────────────────────────────────────────────

const GROUP_WINDOW_MINUTES = 30;

// ── RetrospectiveAnalyzer ────────────────────────────────────────

export class RetrospectiveAnalyzer {
  private incidents = new Map<string, IncidentReport>();

  constructor(
    private memory: MemorySystem,
    private behaviorMatcher: BehavioralPatternMatcher,
    private llmClient?: LlmClient,
  ) {}

  // ── Análise retrospectiva ────────────────────────────────────

  /**
   * Analisa retrospectivamente os eventos que antecederam um incidente.
   *
   * 1. Busca eventos no EventStore nas {lookbackHours}h anteriores ao crime.
   * 2. Filtra eventos da(s) câmera(s) próximas à localização.
   * 3. Extrai comportamentos (BehavioralEvent[]) de cada SecurityEvent.
   * 4. Busca sequências repetidas (mesmo tipo de evento, mesma câmera).
   * 5. Se LLM disponível, pede para identificar o padrão.
   * 6. Cria BehavioralSignature com a sequência extraída.
   * 7. Registra no BehavioralPatternMatcher.
   */
  async analyzeIncident(
    incidentTime: Date,
    location: string,
    lookbackHours = 72,
  ): Promise<RetrospectiveResult> {
    const incidentId = `incident_${randomUUID().slice(0, 12)}`;

    logger.info(
      { incidentTime, location, lookbackHours },
      "Starting retrospective analysis",
    );

    // 1. Busca eventos no EventStore na janela de lookback antes do incidente
    const lookbackStart = new Date(
      incidentTime.getTime() - lookbackHours * 3_600_000,
    );

    // getRecent() busca a partir de "now" para trás — usamos uma janela
    // generosa e filtramos manualmente pelo intervalo [lookbackStart, incidentTime]
    const totalMinutesBack = Math.ceil(
      (Date.now() - lookbackStart.getTime()) / 60_000,
    );
    const allRecent = await this.memory.eventStore.getRecent(totalMinutesBack);

    const windowEvents = allRecent.filter(
      (e) => e.timestamp >= lookbackStart && e.timestamp <= incidentTime,
    );

    logger.info(
      { total: allRecent.length, inWindow: windowEvents.length },
      "Events in lookback window",
    );

    // 2. Filtra eventos de câmeras próximas à localização
    const nearbyEvents = this.filterNearbyCameras(windowEvents, location);

    logger.info(
      { filtered: nearbyEvents.length },
      "Events near location after camera filter",
    );

    if (nearbyEvents.length === 0) {
      return {
        incidentId,
        signaturesCreated: 0,
        patternsFound: 0,
        summary: `Nenhum evento encontrado nas ${lookbackHours}h anteriores ao incidente próximo a "${location}".`,
      };
    }

    // 3-4. Extrai a sequência de prelúdio (comportamentos repetidos)
    const preludeSequence = this.extractPreludeSequence(nearbyEvents);

    logger.info(
      { preludeCount: preludeSequence.length },
      "Prelude sequence extracted",
    );

    // 5. Se LLM disponível, pede para identificar o padrão
    let llmPattern: string | null = null;
    if (this.llmClient && preludeSequence.length >= 2) {
      try {
        llmPattern = await this.askLlmForPattern(preludeSequence, location);
      } catch (err) {
        logger.warn({ err }, "LLM pattern identification failed, continuing");
      }
    }

    // 6-7. Cria e registra a assinatura comportamental
    let signaturesCreated = 0;

    if (preludeSequence.length >= 2) {
      const description = llmPattern
        ? `Padrão identificado por LLM: ${llmPattern}`
        : `Reconhecimento pré-invasão — ${location}`;

      const signature = this.behaviorMatcher.learnFromIncident(
        nearbyEvents,
        "pre_invasion_reconnaissance",
        description.slice(0, 80),
        "high",
      );

      // Marca o incidente como origem da assinatura
      signature.learnedFromIncidentId = incidentId;

      // Atualiza o IncidentReport com a assinatura aprendida
      const existingReport = this.incidents.get(incidentId);
      if (existingReport) {
        existingReport.learnedSignatureId = signature.signatureId;
        existingReport.preludeEvents = nearbyEvents;
      }

      signaturesCreated = 1;
    }

    const result: RetrospectiveResult = {
      incidentId,
      signaturesCreated,
      patternsFound: preludeSequence.length,
      summary:
        signaturesCreated > 0
          ? `Análise concluída: ${preludeSequence.length} eventos de prelúdio identificados, 1 assinatura criada para "${location}".`
          : `Análise concluída: ${nearbyEvents.length} eventos analisados, mas sequência insuficiente para criar assinatura.`,
    };

    logger.info(result, "Retrospective analysis complete");
    return result;
  }

  // ── Registro manual ─────────────────────────────────────────

  /**
   * Registra um incidente manualmente no sistema.
   * Cria e armazena um IncidentReport, e faz log do registro.
   */
  async registerIncident(
    incidentType: string,
    location: string,
    timestamp: Date,
    confirmedBy = "user",
  ): Promise<IncidentReport> {
    const incidentId = `incident_${randomUUID().slice(0, 12)}`;

    const report: IncidentReport = {
      incidentId,
      incidentType,
      location,
      timestamp,
      confirmedBy,
      preludeEvents: [],
      learnedSignatureId: null,
    };

    this.incidents.set(incidentId, report);

    logger.info(
      { incidentId, incidentType, location, timestamp, confirmedBy },
      "Incident registered",
    );

    return report;
  }

  // ── Busca de padrões em dados públicos ──────────────────────

  /**
   * Busca padrões comportamentais em dados públicos de criminalidade.
   *
   * STUB — será expandido quando houver integração com:
   * - Google Alerts para notícias de crime no bairro
   * - APIs de ocorrências policiais (onde disponível)
   * - RSS feeds de jornais locais
   */
  async searchPublicPatterns(
    incidentType: string,
  ): Promise<BehavioralSignature[]> {
    logger.info(
      { incidentType },
      "Public pattern search not yet implemented",
    );
    return [];
  }

  // ── Extração de sequência de prelúdio ───────────────────────

  /**
   * Converte SecurityEvents em BehavioralEvents e extrai a sequência
   * limpa de comportamentos repetidos que antecederam o incidente.
   *
   * Algoritmo:
   * 1. Converte todos para BehavioralEvent usando behaviorMatcher.extractBehavior()
   * 2. Agrupa por (cameraId, eventType) em janelas de 30min
   * 3. Filtra grupos com >= 2 ocorrências
   * 4. Ordena por timestamp
   * 5. Remove ruído (eventos isolados sem repetição)
   */
  private extractPreludeSequence(events: SecurityEvent[]): BehavioralEvent[] {
    if (events.length === 0) return [];

    // 1. Converte todos para BehavioralEvent
    const behaviors: Array<{
      behavioral: BehavioralEvent;
      timestamp: Date;
      cameraId: string | null;
    }> = events.map((e) => ({
      behavioral: this.behaviorMatcher.extractBehavior(e),
      timestamp: e.timestamp,
      cameraId: e.cameraId,
    }));

    // 2. Agrupa por (cameraId, eventType) em janelas de 30min
    const groupKey = (b: (typeof behaviors)[number]): string => {
      const cam = b.cameraId ?? "unknown";
      const type = b.behavioral.eventType;
      // Arredonda o timestamp para a janela de 30min
      const windowIndex = Math.floor(
        b.timestamp.getTime() / (GROUP_WINDOW_MINUTES * 60_000),
      );
      return `${cam}|${type}|${windowIndex}`;
    };

    const groups = new Map<string, (typeof behaviors)[number][]>();
    for (const b of behaviors) {
      const key = groupKey(b);
      const existing = groups.get(key);
      if (existing) {
        existing.push(b);
      } else {
        groups.set(key, [b]);
      }
    }

    // 3. Filtra grupos com >= 2 ocorrências
    const repeatedGroups: (typeof behaviors)[number][] = [];
    for (const group of groups.values()) {
      if (group.length >= 2) {
        repeatedGroups.push(...group);
      }
    }

    // 4. Ordena por timestamp
    repeatedGroups.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // 5. Remove ruído: mantém apenas comportamentos que aparecem em
    //    grupos repetidos e deduplica eventos consecutivos idênticos
    const cleaned: BehavioralEvent[] = [];
    for (let i = 0; i < repeatedGroups.length; i++) {
      const current = repeatedGroups[i]!;
      const prev = cleaned[cleaned.length - 1];

      // Deduplica consecutivos com mesmo tipo e câmera
      if (
        prev &&
        prev.eventType === current.behavioral.eventType &&
        prev.location === current.behavioral.location
      ) {
        // Atualiza duração acumulada
        prev.durationSeconds += current.behavioral.durationSeconds;
        continue;
      }

      cleaned.push({ ...current.behavioral });
    }

    return cleaned;
  }

  // ── Filtro de câmeras próximas ──────────────────────────────

  /**
   * Filtra eventos cuja câmera está próxima à localização do incidente.
   *
   * Utiliza heurística de substring no cameraId ou no campo location
   * do payload do evento. Pode ser expandido com geolocalização.
   */
  private filterNearbyCameras(
    events: SecurityEvent[],
    location: string,
  ): SecurityEvent[] {
    const locationLower = location.toLowerCase();
    const locationTokens = locationLower.split(/\s+/).filter((t) => t.length >= 3);

    return events.filter((event) => {
      // CameraId contém token da localização
      if (event.cameraId) {
        const camLower = event.cameraId.toLowerCase();
        for (const token of locationTokens) {
          if (camLower.includes(token)) return true;
        }
      }

      // Payload pode conter referência à localização
      const payloadLocation = event.payload.location as string | undefined;
      if (payloadLocation) {
        const plLower = payloadLocation.toLowerCase();
        for (const token of locationTokens) {
          if (plLower.includes(token)) return true;
        }
      }

      // Descrição do evento menciona a localização
      const descLower = event.description.toLowerCase();
      for (const token of locationTokens) {
        if (descLower.includes(token)) return true;
      }

      return false;
    });
  }

  // ── LLM Pattern Identification ──────────────────────────────

  /**
   * Pede ao LLM para identificar o padrão comportamental nos eventos
   * de prelúdio que antecederam o incidente.
   */
  private async askLlmForPattern(
    prelude: BehavioralEvent[],
    location: string,
  ): Promise<string | null> {
    if (!this.llmClient) return null;

    const eventDescriptions = prelude
      .map(
        (e, i) =>
          `  ${i + 1}. Tipo: ${e.eventType}, Local: ${e.location ?? "desconhecido"}, Duração: ${e.durationSeconds}s`,
      )
      .join("\n");

    const prompt = [
      "Estes eventos antecederam um incidente de segurança. Identifique o padrão comportamental:",
      "",
      `Localização do incidente: ${location}`,
      "",
      "Sequência de eventos:",
      eventDescriptions,
      "",
      "Responda em português, em uma frase curta (máx 80 caracteres), descrevendo o padrão identificado.",
    ].join("\n");

    try {
      const response = await this.llmClient.generateText?.(prompt);
      if (typeof response === "string" && response.trim().length > 0) {
        return response.trim().slice(0, 80);
      }
    } catch {
      // Fallback: sem LLM ou erro na chamada
    }

    return null;
  }

  // ── Helpers ─────────────────────────────────────────────────

  /**
   * Retorna um incidente registrado pelo ID.
   */
  getIncident(incidentId: string): IncidentReport | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Retorna todos os incidentes registrados.
   */
  getAllIncidents(): IncidentReport[] {
    return [...this.incidents.values()];
  }
}
