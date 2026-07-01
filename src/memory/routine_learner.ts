/**
 * Routine Learner — Aprendizado estatístico de rotinas (3 camadas de baseline).
 *
 * Camada 1 — Universal: "Como TODOS os veículos se comportam nesta rua?"
 * Camada 2 — Categoria: "Como entregadores/vizinhos se comportam?"
 * Camada 3 — Ator específico: "Como ESTE carro/pessoa se comporta?"
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent, PersonRecord } from "../core/types.js";
import type { MemorySystem } from "./system.js";
import type { PersistentRoutineStore } from "./routine-store.js";

// ── Routine Profile ──────────────────────────────────────────────

export interface RoutineProfile {
  entityId: string;
  entityType:
    "camera" | "person" | "vehicle" | "location" | "universal" | "category";
  hourlyActivity: number[]; // 24 floats
  dailyActivity: number[]; // 7 floats
  typicalEvents: Map<string, TypicalEvent[]>;
  totalObservations: number;
  daysOfData: number;
  lastUpdated: Date | null;
}

interface TypicalEvent {
  signature: string;
  eventType: string;
  description: string;
  frequency: number;
  lastSeen: Date;
}

// ── Learner ──────────────────────────────────────────────────────

export class RoutineLearner {
  private profiles = new Map<string, RoutineProfile>();
  private learningRate: number;
  private atypicalThreshold: number;
  private minObservations: number;

  constructor(
    private memory?: MemorySystem,
    opts?: {
      learningRate?: number;
      atypicalThreshold?: number;
      minObservations?: number;
    },
    private routineStore?: PersistentRoutineStore,
  ) {
    this.learningRate = opts?.learningRate ?? 0.05;
    this.atypicalThreshold = opts?.atypicalThreshold ?? 0.15;
    this.minObservations = opts?.minObservations ?? 10;
  }

  observe(event: SecurityEvent): void {
    const hour = event.timestamp.getHours();
    const day = event.timestamp.getDay();

    // Camada 1 — Universal (todos os veículos/pessoas neste local)
    this.updateProfile("universal:all_vehicles", "universal", hour, day, event);
    this.updateProfile("universal:all_persons", "universal", hour, day, event);

    // Camada 3 — Por ator específico
    if (event.cameraId) {
      this.updateProfile(
        `camera:${event.cameraId}`,
        "camera",
        hour,
        day,
        event,
      );
    }
    for (const pid of event.personsInvolved) {
      this.updateProfile(`person:${pid}`, "person", hour, day, event);
    }
    const vehicleId = event.payload.vehicleId as string | undefined;
    if (vehicleId) {
      this.updateProfile(`vehicle:${vehicleId}`, "vehicle", hour, day, event);
    }

    // Categorização automática — Camada 2
    for (const pid of event.personsInvolved) {
      const category = this.categorizeActor(pid);
      if (category && !event.payload.actorCategory) {
        event.payload.actorCategory = category;
      }
    }
    if (vehicleId) {
      const category = this.categorizeActor(undefined, vehicleId);
      if (category && !event.payload.actorCategory) {
        event.payload.actorCategory = category;
      }
    }

    // Camada 2 — Por categoria (se disponível ou recém-determinada)
    const category = (event.payload.actorCategory as string) || null;
    if (category) {
      this.updateProfile(`category:${category}`, "category", hour, day, event);
    }
  }

  private updateProfile(
    entityId: string,
    entityType: RoutineProfile["entityType"],
    hour: number,
    day: number,
    event: SecurityEvent,
  ): void {
    let profile = this.profiles.get(entityId);
    if (!profile) {
      profile = {
        entityId,
        entityType,
        hourlyActivity: new Array(24).fill(0),
        dailyActivity: new Array(7).fill(0),
        typicalEvents: new Map(),
        totalObservations: 0,
        daysOfData: 0,
        lastUpdated: null,
      };
      this.profiles.set(entityId, profile);
    }

    const alpha = this.learningRate;

    // Atualiza atividade horária (EMA)
    profile.hourlyActivity[hour] =
      (1 - alpha) * profile.hourlyActivity[hour]! + alpha * 1;
    // Suaviza horas vizinhas
    for (let h = Math.max(0, hour - 1); h <= Math.min(23, hour + 1); h++) {
      if (h !== hour) {
        profile.hourlyActivity[h] =
          (1 - alpha * 0.3) * profile.hourlyActivity[h]! + alpha * 0.3 * 0.5;
      }
    }

    // Atualiza atividade diária
    profile.dailyActivity[day] =
      (1 - alpha) * profile.dailyActivity[day]! + alpha * 1;

    // Registra evento típico
    const hourKey = `${String(hour).padStart(2, "0")}:00`;
    const eventSig = `${event.eventType}:${event.description.slice(0, 50)}`;
    const existing = profile.typicalEvents
      .get(hourKey)
      ?.find((e) => e.signature === eventSig);

    if (existing) {
      existing.frequency++;
      existing.lastSeen = event.timestamp;
    } else {
      if (!profile.typicalEvents.has(hourKey)) {
        profile.typicalEvents.set(hourKey, []);
      }
      profile.typicalEvents.get(hourKey)!.push({
        signature: eventSig,
        eventType: event.eventType,
        description: event.description,
        frequency: 1,
        lastSeen: event.timestamp,
      });
    }

    profile.totalObservations++;
    profile.lastUpdated = new Date();

    // Write-through to SQLite if store available
    if (this.routineStore) {
      void this.routineStore.save(profile);
    }
  }

  /**
   * Pontua quão atípico é um evento.
   *
   * Ordem de avaliação:
   * 1. Camada 3 (ator específico) — se existir, usa ela
   * 2. Camada 2 (categoria) — se existir
   * 3. Camada 1 (universal) — sempre existe
   */
  scoreAtypical(event: SecurityEvent): number {
    const hour = event.timestamp.getHours();
    const day = event.timestamp.getDay();
    const scores: number[] = [];

    // Tenta Camada 3 primeiro (mais específica)
    const actorProfiles = this.findActorProfiles(event);
    if (actorProfiles.length > 0) {
      for (const profile of actorProfiles) {
        if (profile.totalObservations >= this.minObservations) {
          const hourActivity = profile.hourlyActivity[hour]!;
          const dayActivity = profile.dailyActivity[day]!;
          if (hourActivity < this.atypicalThreshold) scores.push(0.5);
          if (dayActivity < this.atypicalThreshold) scores.push(0.3);
        }
      }
      if (scores.length > 0) return Math.min(1, Math.max(...scores));
    }

    // Fallback: Camada 1 (universal)
    const universal = this.profiles.get("universal:all_vehicles");
    if (universal && universal.totalObservations >= this.minObservations) {
      if (universal.hourlyActivity[hour]! < this.atypicalThreshold) {
        scores.push(0.7);
      }
    }

    return scores.length > 0 ? Math.min(1, Math.max(...scores)) : 0;
  }

  private findActorProfiles(event: SecurityEvent): RoutineProfile[] {
    const profiles: RoutineProfile[] = [];
    const vehicleId = event.payload.vehicleId as string | undefined;
    if (vehicleId) {
      const p = this.profiles.get(`vehicle:${vehicleId}`);
      if (p) profiles.push(p);
    }
    for (const pid of event.personsInvolved) {
      const p = this.profiles.get(`person:${pid}`);
      if (p) profiles.push(p);
    }
    return profiles;
  }

  /**
   * Categoriza um ator baseado em seu comportamento observado.
   *
   * Heurísticas:
   * - Atividade noturna > 2x atividade comercial → "suspicious"
   * - Muitas observações em horário comercial → "frequent_visitor"
   * - Muitas observações totais → "neighbor"
   * - Default → "visitor"
   */
  categorizeActor(personId?: string, vehicleId?: string): string | null {
    const entityId = personId
      ? `person:${personId}`
      : vehicleId
        ? `vehicle:${vehicleId}`
        : null;

    if (!entityId) return null;

    const profile = this.profiles.get(entityId);
    if (!profile || profile.totalObservations < 5) return null;

    // Atividade noturna (22h-05h)
    const nightActivity = profile.hourlyActivity
      .slice(22)
      .concat(profile.hourlyActivity.slice(0, 5))
      .reduce((a, b) => a + b, 0);

    // Atividade em horário comercial (08h-18h)
    const businessActivity = profile.hourlyActivity
      .slice(8, 18)
      .reduce((a, b) => a + b, 0);

    if (nightActivity > businessActivity * 2) {
      return "suspicious";
    }
    if (businessActivity > 0.5 && profile.totalObservations > 20) {
      return "frequent_visitor";
    }
    if (profile.totalObservations > 50) {
      return "neighbor";
    }

    return "visitor";
  }

  getRoutineDescription(entityId: string): string {
    const profile = this.profiles.get(entityId);
    if (!profile || profile.totalObservations < this.minObservations) {
      return "Rotina ainda não estabelecida.";
    }

    const activeHours = profile.hourlyActivity
      .map((v, h) => ({ hour: h, value: v }))
      .filter((x) => x.value > 0.3)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const parts: string[] = [];
    if (activeHours.length > 0) {
      parts.push(
        `Atividade concentrada às ${activeHours.map((h) => `${String(h.hour).padStart(2, "0")}h`).join(", ")}`,
      );
    }

    for (const [hourKey, events] of profile.typicalEvents) {
      for (const evt of events) {
        if (evt.frequency >= 5) {
          parts.push(
            `${evt.description} — ${evt.frequency}x por volta das ${hourKey}`,
          );
        }
      }
    }

    return parts.join(". ") || "Padrão difuso.";
  }
}
