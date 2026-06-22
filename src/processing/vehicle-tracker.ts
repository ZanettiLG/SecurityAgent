/**
 * Vehicle Tracker — Detects, tracks, and identifies vehicles near the residence.
 *
 * Simulates vehicle detection (15% chance per frame call), manages parking
 * sessions, learns baseline durations, and generates security events for
 * unusual vehicle behavior.
 *
 * Ported from the Python prototype (Vigia Capítulo 1).
 */

import { logger } from "../core/logger.js";
import { EventType, Severity, createEvent } from "../core/types.js";
import type { SecurityEvent } from "../core/types.js";
import type { EventBus } from "../core/bus.js";
import type { MemorySystem } from "../memory/system.js";

// ── Interfaces ──────────────────────────────────────────────────

export interface VehicleRecord {
  vehicleId: string;
  plate: string | null;
  makeModel: string | null; // "Sedan branco"
  color: string | null;
  vehicleType: string | null; // "sedan", "suv", "truck", "motorcycle"

  associatedPersonIds: string[];
  associatedPersonNames: string[];

  firstSeen: Date | null;
  lastSeen: Date | null;
  totalSightings: number;
  commonLocations: string[]; // cameraIds
  commonHours: number[];
  commonDays: number[];

  avgParkingDuration: number; // segundos
  maxParkingDuration: number;

  category:
    | "unknown"
    | "neighbor"
    | "delivery"
    | "service"
    | "family"
    | "suspicious";

  describe(): string;
}

export interface ParkingSession {
  sessionId: string;
  vehicleId: string | null; // null até ser identificado
  cameraId: string;
  startTime: Date;
  lastSeen: Date;
  location: string; // "frente à residência"
  identified: boolean;
}

// ── Helper: create a new VehicleRecord ───────────────────────────

function newVehicleRecord(
  vehicleId: string,
  overrides: Partial<VehicleRecord> = {},
): VehicleRecord {
  return {
    vehicleId,
    plate: null,
    makeModel: null,
    color: null,
    vehicleType: null,
    associatedPersonIds: [],
    associatedPersonNames: [],
    firstSeen: null,
    lastSeen: null,
    totalSightings: 0,
    commonLocations: [],
    commonHours: [],
    commonDays: [],
    avgParkingDuration: 120,
    maxParkingDuration: 300,
    category: "unknown",
    ...overrides,
    describe(): string {
      // Builds a human-readable description of the vehicle
      const parts: string[] = [];
      if (this.color) parts.push(this.color);
      if (this.makeModel) parts.push(this.makeModel);
      else if (this.vehicleType) parts.push(this.vehicleType);
      if (this.plate) parts.push(`(placa ${this.plate})`);
      if (parts.length === 0) return "Veículo desconhecido";
      return parts.join(" ");
    },
  };
}

// ── Vehicle Tracker ──────────────────────────────────────────────

export class VehicleTracker {
  private vehicles = new Map<string, VehicleRecord>();
  private activeSessions = new Map<string, ParkingSession>();
  private durationBaselines = new Map<
    string,
    {
      typicalMedian: number;
      typicalMax: number;
      durations: number[];
    }
  >();

  /** Tracks session end times per camera for multiplePasses detection */
  private sessionEndHistory = new Map<string, Date[]>();

  private sessionCounter = 0;
  private vehicleCounter = 0;

  constructor(
    private memory?: MemorySystem,
    private bus?: EventBus,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // Frame Processing
  // ═══════════════════════════════════════════════════════════════

  /**
   * Simulates vehicle detection on a camera frame.
   *
   * - 15% chance of "detecting" a vehicle each call
   * - Creates or updates a ParkingSession
   * - Checks for session timeout (> 30s without update → vehicle left)
   * - Generates events for unidentified vehicles parked too long
   *   or known vehicles with atypical duration
   */
  async processFrame(cameraId: string): Promise<SecurityEvent[]> {
    const events: SecurityEvent[] = [];
    const now = new Date();

    // ── Check session timeout (> 30s without update) ────────
    const existingSession = this.activeSessions.get(cameraId);
    if (existingSession) {
      const timeSinceLastSeen =
        (now.getTime() - existingSession.lastSeen.getTime()) / 1000;
      if (timeSinceLastSeen > 30) {
        const duration =
          (existingSession.lastSeen.getTime() -
            existingSession.startTime.getTime()) /
          1000;
        this.recordParkingEnd(existingSession, duration);
        this.activeSessions.delete(cameraId);
        logger.debug(
          { cameraId, sessionId: existingSession.sessionId, duration },
          "Vehicle session ended (timeout)",
        );
      }
    }

    // ── 15% chance of detecting a vehicle ───────────────────
    if (Math.random() > 0.15) {
      return events;
    }

    logger.debug({ cameraId }, "Vehicle detected (simulated)");

    // ── Find or create session ──────────────────────────────
    const session = this.findOrCreateSession(cameraId);
    session.lastSeen = now;

    const duration =
      (now.getTime() - session.startTime.getTime()) / 1000;
    const baseline = this.getBaseline(cameraId);

    // ── Compute behavioral flags ────────────────────────────
    const speedReduction = duration > baseline.typicalMax;
    const observingResidence = duration > 300; // 5 min in non-associated location
    const multiplePasses = this.computeMultiplePasses(cameraId);

    // ── Event: unidentified vehicle parked too long ─────────
    if (!session.identified && duration > baseline.typicalMax) {
      const mins = Math.round(duration / 60);
      events.push(
        createEvent({
          eventType: EventType.VEHICLE_DETECTED,
          cameraId,
          severity: Severity.MEDIUM,
          description: `Veículo não identificado parado há ${mins} minutos`,
          payload: {
            vehicleClass: "car",
            confidence: 0.8,
            durationSeconds: duration,
            sessionId: session.sessionId,
            identified: false,
            speedReduction,
            observingResidence,
            multiplePasses,
          },
        }),
      );
    }

    // ── Event: known vehicle with atypical duration ─────────
    if (session.identified && session.vehicleId) {
      const vehicle = this.vehicles.get(session.vehicleId);
      if (vehicle && duration > vehicle.avgParkingDuration * 3) {
        const mins = Math.round(duration / 60);
        events.push(
          createEvent({
            eventType: EventType.VEHICLE_DETECTED,
            cameraId,
            severity: Severity.LOW,
            description: `Veículo de ${vehicle.describe()} estacionado há ${mins} min (duração atípica)`,
            payload: {
              vehicleId: session.vehicleId,
              durationSeconds: duration,
              typicalDuration: vehicle.avgParkingDuration,
              identified: true,
              speedReduction,
              observingResidence,
              multiplePasses,
            },
          }),
        );
      }
    }

    // ── Publish events to bus if available ──────────────────
    if (this.bus) {
      for (const event of events) {
        this.bus.publish("vehicle.event", event);
      }
    }

    return events;
  }

  // ═══════════════════════════════════════════════════════════════
  // Identification
  // ═══════════════════════════════════════════════════════════════

  /**
   * Associates a vehicle to a person (via user feedback).
   * Creates a VehicleRecord if one doesn't exist yet.
   * Updates the KnowledgeGraph if available.
   */
  async identifyVehicle(
    sessionId: string,
    personName: string,
    personId?: string,
  ): Promise<void> {
    // Find the session
    let session: ParkingSession | undefined;
    for (const s of this.activeSessions.values()) {
      if (s.sessionId === sessionId) {
        session = s;
        break;
      }
    }

    if (!session) {
      logger.warn({ sessionId }, "identifyVehicle: session not found");
      return;
    }

    // Create or update vehicle record
    let vehicleId = session.vehicleId;
    if (!vehicleId) {
      this.vehicleCounter++;
      vehicleId = `veh_${Date.now()}_${this.vehicleCounter}`;
      session.vehicleId = vehicleId;
    }

    let vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) {
      vehicle = newVehicleRecord(vehicleId, {
        firstSeen: session.startTime,
        lastSeen: session.startTime,
      });
      this.vehicles.set(vehicleId, vehicle);
    }

    // Update associations
    if (personId && !vehicle.associatedPersonIds.includes(personId)) {
      vehicle.associatedPersonIds.push(personId);
    }
    if (!vehicle.associatedPersonNames.includes(personName)) {
      vehicle.associatedPersonNames.push(personName);
    }

    session.identified = true;

    // Update KnowledgeGraph if memory system is available
    if (this.memory?.knowledgeGraph) {
      try {
        const kg = this.memory.knowledgeGraph as {
          createEntities?: (
            entities: Array<{
              name: string;
              entityType: string;
              observations: string[];
            }>,
          ) => Promise<void>;
          createRelations?: (
            relations: Array<{
              from: string;
              to: string;
              relationType: string;
            }>,
          ) => Promise<void>;
        };

        // Create vehicle entity if needed
        if (kg.createEntities) {
          await kg.createEntities([
            {
              name: vehicleId,
              entityType: "Vehicle",
              observations: [
                `Associated with person: ${personName}`,
                `Category: ${vehicle.category}`,
                vehicle.describe(),
              ],
            },
          ]);
        }

        // Create relation between vehicle and person
        if (kg.createRelations && personId) {
          await kg.createRelations([
            {
              from: vehicleId,
              to: personId,
              relationType: "belongs_to",
            },
          ]);
        }
      } catch (err) {
        logger.warn(
          { err, vehicleId, personName },
          "Failed to update KnowledgeGraph for vehicle identification",
        );
      }
    }

    logger.info(
      { sessionId, vehicleId, personName },
      "Vehicle identified and associated with person",
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Baselines
  // ═══════════════════════════════════════════════════════════════

  /**
   * Returns the duration baseline for a camera.
   * Defaults before learning: median=120s, max=300s.
   */
  private getBaseline(cameraId: string): {
    typicalMedian: number;
    typicalMax: number;
  } {
    const existing = this.durationBaselines.get(cameraId);
    if (existing) {
      return {
        typicalMedian: existing.typicalMedian,
        typicalMax: existing.typicalMax,
      };
    }
    return { typicalMedian: 120, typicalMax: 300 };
  }

  /**
   * Records the end of a parking session and updates baselines.
   * - Updates vehicle avgParkingDuration with moving average (alpha=0.1)
   * - Maintains last 1000 duration samples per camera
   * - Updates vehicle's maxParkingDuration and sighting stats
   */
  private recordParkingEnd(
    session: ParkingSession,
    duration: number,
  ): void {
    // ── Update camera baselines ─────────────────────────────
    let baseline = this.durationBaselines.get(session.cameraId);
    if (!baseline) {
      baseline = {
        typicalMedian: 120,
        typicalMax: 300,
        durations: [],
      };
      this.durationBaselines.set(session.cameraId, baseline);
    }

    baseline.durations.push(duration);
    // Keep last 1000 samples
    if (baseline.durations.length > 1000) {
      baseline.durations = baseline.durations.slice(-1000);
    }

    // Recalculate median and max from stored durations
    const sorted = [...baseline.durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    baseline.typicalMedian =
      sorted.length % 2 === 0
        ? (sorted[mid - 1]! + sorted[mid]!) / 2
        : sorted[mid]!;
    baseline.typicalMax = sorted[sorted.length - 1]!;

    // ── Update vehicle record ───────────────────────────────
    if (session.vehicleId) {
      const vehicle = this.vehicles.get(session.vehicleId);
      if (vehicle) {
        // Moving average for avgParkingDuration (alpha=0.1)
        vehicle.avgParkingDuration =
          vehicle.avgParkingDuration * 0.9 + duration * 0.1;

        // Update max
        if (duration > vehicle.maxParkingDuration) {
          vehicle.maxParkingDuration = duration;
        }

        // Update sighting stats
        vehicle.totalSightings++;
        vehicle.lastSeen = new Date();

        if (!vehicle.firstSeen) {
          vehicle.firstSeen = new Date();
        }

        // Track location
        if (!vehicle.commonLocations.includes(session.cameraId)) {
          vehicle.commonLocations.push(session.cameraId);
        }
      }
    }

    // ── Track session end for multiplePasses ────────────────
    let history = this.sessionEndHistory.get(session.cameraId);
    if (!history) {
      history = [];
      this.sessionEndHistory.set(session.cameraId, history);
    }
    history.push(new Date());
    // Keep only last 50 entries to bound memory
    if (history.length > 50) {
      history = history.slice(-50);
      this.sessionEndHistory.set(session.cameraId, history);
    }

    logger.debug(
      {
        cameraId: session.cameraId,
        sessionId: session.sessionId,
        duration,
        newMedian: baseline.typicalMedian,
        newMax: baseline.typicalMax,
      },
      "Parking session ended, baselines updated",
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Sessions
  // ═══════════════════════════════════════════════════════════════

  /**
   * Finds an active session for the camera or creates a new one.
   *
   * - One session per camera at a time (simplified)
   * - If existing session was last seen < 60s ago → reuse it
   * - Otherwise → record end of old session, create new one
   */
  private findOrCreateSession(cameraId: string): ParkingSession {
    const now = new Date();
    const existing = this.activeSessions.get(cameraId);

    if (existing) {
      const timeSinceLastSeen =
        (now.getTime() - existing.lastSeen.getTime()) / 1000;

      if (timeSinceLastSeen < 60) {
        // Session is still active, reuse it
        return existing;
      }

      // Session timed out — record end
      const duration =
        (existing.lastSeen.getTime() - existing.startTime.getTime()) / 1000;
      this.recordParkingEnd(existing, duration);
    }

    // Create new session
    this.sessionCounter++;
    const session: ParkingSession = {
      sessionId: `ses_${Date.now()}_${this.sessionCounter}`,
      vehicleId: null,
      cameraId,
      startTime: now,
      lastSeen: now,
      location: this.determineLocation(cameraId),
      identified: false,
    };

    this.activeSessions.set(cameraId, session);

    logger.debug(
      { cameraId, sessionId: session.sessionId, location: session.location },
      "New parking session created",
    );

    return session;
  }

  /**
   * Maps a cameraId to a human-readable location description.
   */
  private determineLocation(cameraId: string): string {
    const locationMap: Record<string, string> = {
      front_door: "frente à residência",
      front_yard: "jardim frontal",
      driveway: "entrada da garagem",
      garage: "garagem",
      backyard: "quintal",
      side_gate: "portão lateral",
      street_front: "rua em frente à residência",
      street_side: "rua lateral",
      corner: "esquina próxima",
    };

    const known = locationMap[cameraId];
    if (known) return known;

    // Heuristic based on cameraId naming
    if (cameraId.includes("front") || cameraId.includes("frente"))
      return "frente à residência";
    if (cameraId.includes("back") || cameraId.includes("fundos"))
      return "fundos da residência";
    if (cameraId.includes("garage") || cameraId.includes("garagem"))
      return "garagem";
    if (cameraId.includes("drive") || cameraId.includes("entrada"))
      return "entrada da garagem";
    if (cameraId.includes("street") || cameraId.includes("rua"))
      return "rua próxima à residência";

    return `próximo à câmera ${cameraId}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Checks if the same camera has had multiple sessions end in the
   * last 6 hours. Returns true if 2+ previous sessions ended recently.
   */
  private computeMultiplePasses(cameraId: string): boolean {
    const history = this.sessionEndHistory.get(cameraId);
    if (!history || history.length < 2) return false;

    const now = Date.now();
    const sixHoursMs = 6 * 60 * 60 * 1000;
    const recentEnds = history.filter(
      (d) => now - d.getTime() < sixHoursMs,
    );
    return recentEnds.length >= 2;
  }

  // ═══════════════════════════════════════════════════════════════
  // Public accessors (for testing / debugging)
  // ═══════════════════════════════════════════════════════════════

  /** Returns all known vehicle records. */
  getVehicles(): ReadonlyMap<string, VehicleRecord> {
    return this.vehicles;
  }

  /** Returns all active parking sessions. */
  getActiveSessions(): ReadonlyMap<string, ParkingSession> {
    return this.activeSessions;
  }

  /** Returns the current duration baselines. */
  getBaselines(): ReadonlyMap<
    string,
    { typicalMedian: number; typicalMax: number; durations: number[] }
  > {
    return this.durationBaselines;
  }
}
