/**
 * Behavioral Pattern Matcher — Assinaturas comportamentais cross-ator.
 *
 * "Pessoas mentem. Placas podem ser trocadas. Carros podem mudar.
 *  Mas padrões costumam se repetir."
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";

// ── Types ────────────────────────────────────────────────────────

export interface BehavioralEvent {
  eventType: string;
  location: string | null;
  durationSeconds: number;
  metadata: Record<string, unknown>;
}

export interface BehavioralSignature {
  signatureId: string;
  name: string;
  category: string;
  severity: "advisory" | "elevated" | "high" | "critical";
  eventSequence: BehavioralEvent[];
  minOccurrences: number;
  timeWindowHours: number;
  minConfidence: number;
  learnedFromIncidentId: string | null;
  learnedFromSource: string;
  description: string;
  createdAt: Date;
  confirmedCount: number;
  falsePositiveCount: number;
}

export interface BehaviorMatch {
  matchId: string;
  signature: BehavioralSignature;
  similarityScore: number;
  matchedEventIds: string[];
  temporalFit: number;
  sequenceFit: number;
  locationFit: number;
  actorLevel: 1 | 2 | 3; // 1=universal, 2=category, 3=same-actor
  detectedAt: Date;
  evidenceSummary: string;
  overallScore(): number;
}

// ── Matcher ──────────────────────────────────────────────────────

export class BehavioralPatternMatcher {
  private signatures = new Map<string, BehavioralSignature>();
  private eventBuffer: SecurityEvent[] = [];
  private activeMatches = new Map<string, BehaviorMatch>();

  registerSignature(sig: BehavioralSignature): void {
    this.signatures.set(sig.signatureId, sig);
    logger.info(`Signature registered: ${sig.name} [${sig.category}]`);
  }

  learnFromIncident(
    incidentEvents: SecurityEvent[],
    category: string,
    name: string,
    severity: "advisory" | "elevated" | "high" | "critical" = "high",
  ): BehavioralSignature {
    const behavioralEvents = incidentEvents.map((e) => this.extractBehavior(e));
    const sequence = behavioralEvents;

    const timeSpan =
      incidentEvents.length >= 2
        ? (incidentEvents[incidentEvents.length - 1]!.timestamp.getTime() -
            incidentEvents[0]!.timestamp.getTime()) /
          3_600_000
        : 6;

    // Coleta IDs dos atores envolvidos para futura detecção de reincidência
    const actorIds = new Set<string>();
    for (const e of incidentEvents) {
      const vid = e.payload.vehicleId as string | undefined;
      if (vid) actorIds.add(vid);
      for (const pid of e.personsInvolved) {
        actorIds.add(pid);
      }
    }

    const sig: BehavioralSignature = {
      signatureId: `sig_${crypto.randomUUID().slice(0, 12)}`,
      name,
      category,
      severity,
      eventSequence: sequence,
      minOccurrences: sequence.length,
      timeWindowHours: Math.max(1, timeSpan * 1.5),
      minConfidence: 0.65,
      learnedFromIncidentId: `incident_${crypto.randomUUID().slice(0, 8)}`,
      learnedFromSource: "incident",
      description: `Aprendido de incidente confirmado: ${name}`,
      createdAt: new Date(),
      confirmedCount: 0,
      falsePositiveCount: 0,
    };

    // Armazena IDs dos atores para detecção de reincidência (Nível 3)
    (sig as unknown as { _actorIds: string[] })._actorIds = [...actorIds];

    this.registerSignature(sig);
    return sig;
  }

  matchStreaming(event: SecurityEvent): BehaviorMatch | null {
    this.eventBuffer.push(event);
    this.pruneBuffer();

    for (const sig of this.signatures.values()) {
      const actorLevel = this.determineActorLevel(event, sig);
      const match = this.matchAgainstSignature(this.eventBuffer, sig, actorLevel);

      const effectiveThreshold = actorLevel === 3
        ? sig.minConfidence * 0.7
        : actorLevel === 2
          ? sig.minConfidence * 0.85
          : sig.minConfidence;

      if (match && match.overallScore() >= effectiveThreshold) {
        // Check for existing active match
        const existing = this.findActiveMatch(sig.signatureId);
        if (existing) {
          existing.similarityScore = Math.max(existing.similarityScore, match.similarityScore);
          existing.matchedEventIds.push(
            ...match.matchedEventIds.filter((id) => !existing.matchedEventIds.includes(id)),
          );
          return existing;
        } else {
          this.activeMatches.set(match.matchId, match);
          return match;
        }
      }
    }
    return null;
  }

  matchAgainstSignature(
    events: SecurityEvent[],
    sig: BehavioralSignature,
    actorLevel: 1 | 2 | 3,
  ): BehaviorMatch | null {
    if (events.length < sig.minOccurrences) return null;

    const observed = events.map((e) => this.extractBehavior(e));
    const sequenceFit = this.sequenceSimilarity(observed, sig.eventSequence);
    const temporalFit = this.temporalFit(events, sig);
    const locationFit = this.locationFit(events, sig);
    const similarity = this.eventOverlapScore(observed, sig.eventSequence);

    if (similarity < 0.3) return null;

    const match: BehaviorMatch = {
      matchId: `match_${crypto.randomUUID().slice(0, 8)}`,
      signature: sig,
      similarityScore: similarity,
      matchedEventIds: events.map((e) => e.eventId),
      temporalFit,
      sequenceFit,
      locationFit,
      actorLevel,
      detectedAt: new Date(),
      evidenceSummary: this.generateEvidenceSummary(events, sig, similarity, actorLevel),
      overallScore() {
        return 0.35 * this.similarityScore + 0.30 * this.sequenceFit + 0.20 * this.temporalFit + 0.15 * this.locationFit;
      },
    };

    return match;
  }

  extractBehavior(event: SecurityEvent): BehavioralEvent {
    const eventTypeMap: Record<string, string> = {
      vehicle_detected: "vehicle_pass",
      person_detected: "person_observed",
      motion_detected: "motion",
      sound_detected: "sound",
    };

    let behaviorType = eventTypeMap[event.eventType] ?? event.eventType;
    if (event.payload.speedReduction) behaviorType = "speed_reduction";
    if (event.payload.observingResidence) behaviorType = "observation";
    if (event.payload.multiplePasses) behaviorType = "repeated_pass";

    return {
      eventType: behaviorType,
      location: event.cameraId,
      durationSeconds: (event.payload.durationSeconds as number) || 0,
      metadata: { originalEventId: event.eventId },
    };
  }

  // ── Similarity Methods ──

  private sequenceSimilarity(observed: BehavioralEvent[], target: BehavioralEvent[]): number {
    if (!target.length || !observed.length) return 0;
    let bestScore = 0;
    const tLen = target.length;
    const oLen = observed.length;

    for (let start = 0; start < Math.max(0, oLen - tLen * 3); start++) {
      for (let wSize = tLen; wSize <= Math.min(tLen * 2, oLen - start); wSize++) {
        const window = observed.slice(start, start + wSize);
        const score = this.fuzzySequenceMatch(window, target);
        bestScore = Math.max(bestScore, score);
      }
    }
    return bestScore;
  }

  private fuzzySequenceMatch(window: BehavioralEvent[], target: BehavioralEvent[]): number {
    let matches = 0;
    let tIdx = 0;
    for (const event of window) {
      if (tIdx >= target.length) break;
      if (this.eventsMatch(event, target[tIdx]!)) {
        matches++;
        tIdx++;
      }
    }
    return matches / target.length;
  }

  private eventsMatch(a: BehavioralEvent, b: BehavioralEvent): boolean {
    if (a.eventType !== b.eventType) return false;
    if (a.location && b.location) {
      if (!this.locationsSimilar(a.location, b.location)) return false;
    }
    return true;
  }

  private temporalFit(events: SecurityEvent[], sig: BehavioralSignature): number {
    if (events.length < 2) return 1;
    const span = (events[events.length - 1]!.timestamp.getTime() - events[0]!.timestamp.getTime()) / 3_600_000;
    if (span <= 0) return 0.5;
    const expected = sig.timeWindowHours;
    return Math.min(span, expected) / Math.max(span, expected);
  }

  private locationFit(events: SecurityEvent[], sig: BehavioralSignature): number {
    const sigLocations = new Set(sig.eventSequence.map((e) => e.location).filter(Boolean));
    if (!sigLocations.size) return 1;

    const eventLocations = new Set<string>();
    for (const e of events) {
      if (e.cameraId) eventLocations.add(e.cameraId);
    }
    if (!eventLocations.size) return 0.5;

    let overlap = 0;
    for (const loc of sigLocations) {
      if ([...eventLocations].some((el) => this.locationsSimilar(loc!, el))) overlap++;
    }
    return overlap / sigLocations.size;
  }

  private eventOverlapScore(observed: BehavioralEvent[], target: BehavioralEvent[]): number {
    const targetTypes = new Set(target.map((e) => e.eventType));
    const observedTypes = new Set(observed.map((e) => e.eventType));
    if (!targetTypes.size) return 0;
    let overlap = 0;
    for (const t of targetTypes) {
      if (observedTypes.has(t)) overlap++;
    }
    return overlap / targetTypes.size;
  }

  private locationsSimilar(a: string, b: string): boolean {
    const la = a.toLowerCase();
    const lb = b.toLowerCase();
    return la === lb || la.includes(lb) || lb.includes(la);
  }

  private pruneBuffer(): void {
    const cutoff = new Date(Date.now() - 24 * 3_600_000);
    this.eventBuffer = this.eventBuffer.filter((e) => e.timestamp > cutoff);
  }

  private findActiveMatch(signatureId: string): BehaviorMatch | undefined {
    for (const match of this.activeMatches.values()) {
      if (match.signature.signatureId === signatureId) return match;
    }
    return undefined;
  }

  private determineActorLevel(
    event: SecurityEvent,
    sig: BehavioralSignature,
  ): 1 | 2 | 3 {
    // Nível 3: Mesmo ator específico
    const eventVehicleId = event.payload.vehicleId as string | undefined;
    const eventPersonIds = event.personsInvolved;

    if (sig.learnedFromIncidentId) {
      if (eventVehicleId && this.isActorFromIncident(eventVehicleId, sig)) {
        return 3;
      }
      for (const pid of eventPersonIds) {
        if (this.isActorFromIncident(pid, sig)) {
          return 3;
        }
      }
    }

    // Nível 2: Mesma categoria suspeita
    const eventCategory = event.payload.actorCategory as string | undefined;
    if (eventCategory && sig.category === "pre_invasion_reconnaissance") {
      if (event.payload.suspicious === true) return 2;
    }

    // Nível 1: Universal (default)
    return 1;
  }

  private isActorFromIncident(actorId: string, sig: BehavioralSignature): boolean {
    // Verifica se o actorId (vehicleId ou personId) aparece nos metadados
    // da assinatura ou nos eventos associados ao incidente
    if (!sig.learnedFromIncidentId) return false;

    // Verifica se o ator está nos metadados da assinatura
    // (armazenado durante learnFromIncident)
    const sigMetadata = sig as unknown as { _actorIds?: string[] };
    if (sigMetadata._actorIds && sigMetadata._actorIds.includes(actorId)) {
      return true;
    }

    return false;
  }

  private generateEvidenceSummary(
    events: SecurityEvent[],
    sig: BehavioralSignature,
    similarity: number,
    actorLevel: number,
  ): string {
    const pct = (similarity * 100).toFixed(0);
    const locations = [...new Set(events.map((e) => e.cameraId).filter(Boolean))];
    const actorLabel = actorLevel === 3
      ? " (MESMO ator do incidente anterior — REINCIDÊNCIA)"
      : actorLevel === 2
        ? " (ator de mesma categoria suspeita)"
        : "";

    return [
      `Comportamento compatível com '${sig.name}'${actorLabel}.`,
      `Nível de match: ${actorLevel}/3.`,
      `Eventos detectados: ${events.length}.`,
      `Localizações: ${locations.slice(0, 3).join(", ")}.`,
      `Similaridade: ${pct}%.`,
      `Severidade: ${sig.severity}.`,
    ].join("\n");
  }
}

// ── Default Signatures ───────────────────────────────────────────

export function createDefaultSignatures(): BehavioralSignature[] {
  return [
    {
      signatureId: "sig_pre_invasion_recon",
      name: "Reconhecimento Pré-Invasão",
      category: "pre_invasion_reconnaissance",
      severity: "high",
      eventSequence: [
        { eventType: "vehicle_pass", location: null, durationSeconds: 0, metadata: {} },
        { eventType: "speed_reduction", location: null, durationSeconds: 0, metadata: {} },
        { eventType: "observation", location: null, durationSeconds: 0, metadata: {} },
      ],
      minOccurrences: 3,
      timeWindowHours: 12,
      minConfidence: 0.65,
      learnedFromIncidentId: null,
      learnedFromSource: "public_data",
      description: "Múltiplas passagens com redução de velocidade e observação de residências.",
      createdAt: new Date(),
      confirmedCount: 0,
      falsePositiveCount: 0,
    },
  ];
}
