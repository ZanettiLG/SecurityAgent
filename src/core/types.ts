/**
 * SecurityAgent — Core Types
 *
 * Tipos, enums e interfaces fundamentais do sistema.
 * Equivalente TypeScript dos dataclasses e enums do Python.
 */

// ── Enums ────────────────────────────────────────────────────────

export const PersonCategory = {
  KNOWN: "known",
  UNKNOWN: "unknown",
  FREQUENT_UNKNOWN: "frequent_unknown",
  THREAT: "threat",
} as const;
export type PersonCategory =
  (typeof PersonCategory)[keyof typeof PersonCategory];

export const EventType = {
  // Pessoas
  PERSON_DETECTED: "person_detected",
  PERSON_LEFT: "person_left",
  // Movimento e Objetos
  MOTION_DETECTED: "motion_detected",
  OBJECT_DETECTED: "object_detected",
  // Veículos (Vigia)
  VEHICLE_DETECTED: "vehicle_detected",
  VEHICLE_LEFT: "vehicle_left",
  // Áudio
  SOUND_DETECTED: "sound_detected",
  SPEECH_DETECTED: "speech_detected",
  // Sistema
  SYSTEM_ALERT: "system_alert",
  CAMERA_OFFLINE: "camera_offline",
  CAMERA_ONLINE: "camera_online",
  CONSOLIDATED: "consolidated",
  // Inteligência de Vizinhança (Vigia)
  PATTERN_DEVIATION: "pattern_deviation",
  SOCIAL_INSIGHT: "social_insight",
  HYPOTHESIS_GENERATED: "hypothesis_generated",
  USER_QUERY: "user_query",
  USER_ANSWER: "user_answer",
  INVESTIGATION_RESULT: "investigation_result",
  PREDICTION_MADE: "prediction_made",
  PREDICTION_VERIFIED: "prediction_verified",
  // Cena Semântica (Vigia)
  SCENE_OBSERVATION: "scene_observation",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const Severity = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const SystemMode = {
  HOME: "home",
  AWAY: "away",
  NIGHT: "night",
  VACATION: "vacation",
  BUSINESS_HOURS: "business_hours",
} as const;
export type SystemMode = (typeof SystemMode)[keyof typeof SystemMode];

// ── Core Data Types ──────────────────────────────────────────────

export interface SecurityEvent {
  eventId: string;
  timestamp: Date;
  cameraId: string | null;
  eventType: EventType;
  severity: Severity;
  personsInvolved: string[];
  description: string;
  snapshotPath: string | null;
  audioClipPath: string | null;
  payload: Record<string, unknown>;
  actionsTaken: string[];
  llmSummary: string | null;
  anomalyScore: number;
  consolidated: boolean;
}

export interface PersonRecord {
  personId: string;
  name: string | null;
  category: PersonCategory;
  faceEmbeddingCount: number;
  voiceEmbeddingCount: number;
  firstSeen: Date | null;
  lastSeen: Date | null;
  totalVisits: number;
  avgVisitDuration: number;
  commonHours: number[];
  commonDays: number[];
  commonEntrances: string[];
  importance: number;
  threatScore: number;
  tags: string[];
  notes: string | null;
  metadata: Record<string, unknown>;
}

// ── Scene Observation (Vigia — Análise Semântica de Cena) ───────

/** Observação completa de uma cena — envelope com metadados + descrição rica */
export interface SceneObservation {
  id: string;
  timestamp: Date;
  cameraId: string;
  snapshotPath: string;
  description: SceneDescription;
  /** Embedding da narração para busca semântica (ChromaDB) */
  textEmbedding?: number[];
}

/** Descrição rica da cena gerada por LLM Vision */
export interface SceneDescription {
  /** Descrição completa em texto corrido (português) */
  narration: string;
  persons: PersonObservation[];
  vehicles: VehicleObservation[];
  objects: ObjectObservation[];
  actions: string[];
  intentions: string[];
  anomalyFlags: string[];
}

/** Observação visual pontual de uma pessoa na cena */
export interface PersonObservation {
  localId: string;
  /** ID da pessoa no PersonRegistry, se reconhecida */
  personId?: string;
  appearance: {
    estimatedAge?: string;
    clothing: string;
    accessories: string[];
    height?: string;
  };
  movement?: string;
  appearsKnown: boolean;
}

/** Observação visual de um veículo na cena */
export interface VehicleObservation {
  type: string;
  color: string;
  plate?: string;
  parkedMinutes?: number;
}

/** Objeto relevante detectado na cena */
export interface ObjectObservation {
  type: string;
  relevance: "normal" | "suspicious" | "threat";
}

// ── World State ──────────────────────────────────────────────────

export type FactValue = string | number | boolean;
export type ConditionValue = FactValue | [string, FactValue];
export type WorldStateFacts = Record<string, FactValue>;

export class WorldState {
  constructor(public facts: WorldStateFacts = {}) {}

  satisfies(conditions: Record<string, ConditionValue>): boolean {
    for (const [key, expected] of Object.entries(conditions)) {
      const current = this.facts[key];

      if (Array.isArray(expected)) {
        const [op, val] = expected;
        const numCurrent = typeof current === "number" ? current : 0;
        const numVal = typeof val === "number" ? val : 0;

        switch (op) {
          case ">":
            if (!(typeof current === "number" && current > numVal))
              return false;
            break;
          case "<":
            if (!(typeof current === "number" && current < numVal))
              return false;
            break;
          case ">=":
            if (!(typeof current === "number" && current >= numVal))
              return false;
            break;
          case "<=":
            if (!(typeof current === "number" && current <= numVal))
              return false;
            break;
          case "==":
            if (current !== val) return false;
            break;
          case "!=":
            if (current === val) return false;
            break;
        }
      } else {
        if (current !== expected) return false;
      }
    }
    return true;
  }

  applyEffects(effects: Record<string, ConditionValue>): WorldState {
    const newFacts = { ...this.facts };
    for (const [key, value] of Object.entries(effects)) {
      if (Array.isArray(value)) {
        const [op, val] = value;
        const current =
          typeof newFacts[key] === "number" ? (newFacts[key] as number) : 0;
        const numVal = typeof val === "number" ? val : 0;

        if (op === "+") newFacts[key] = current + numVal;
        else if (op === "-") newFacts[key] = Math.max(0, current - numVal);
        else if (op === "set") newFacts[key] = val;
      } else {
        newFacts[key] = value;
      }
    }
    return new WorldState(newFacts);
  }

  distanceTo(goalFacts: Record<string, ConditionValue>): number {
    let distance = 0;
    for (const [key, expected] of Object.entries(goalFacts)) {
      const current = this.facts[key];
      if (Array.isArray(expected)) {
        const [op, val] = expected;
        const numCurrent = typeof current === "number" ? current : 0;
        const numVal = typeof val === "number" ? val : 0;

        if (op === ">" || op === ">=") {
          if (current === undefined || (current as number) < numVal) {
            distance += Math.abs(numVal - numCurrent);
          }
        } else if (op === "<" || op === "<=") {
          if (current === undefined || (current as number) > numVal) {
            distance += Math.abs(numCurrent - numVal);
          }
        }
      } else if (current !== expected) {
        distance += 1;
      }
    }
    return distance;
  }

  hash(): string {
    return JSON.stringify(Object.entries(this.facts).sort());
  }
}

// ── Helper: create event factory ─────────────────────────────────

let _eventCounter = 0;

export function createEvent(
  partial: Partial<SecurityEvent> & { eventType: EventType },
): SecurityEvent {
  _eventCounter++;
  return {
    eventId: `evt_${Date.now()}_${_eventCounter}`,
    timestamp: new Date(),
    cameraId: null,
    severity: Severity.INFO,
    personsInvolved: [],
    description: "",
    snapshotPath: null,
    audioClipPath: null,
    payload: {},
    actionsTaken: [],
    llmSummary: null,
    anomalyScore: 0,
    consolidated: false,
    ...partial,
  };
}
