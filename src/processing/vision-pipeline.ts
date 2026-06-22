/**
 * Vision Pipeline — Processes camera frames and generates security events.
 *
 * Applies frame skipping, simulated motion detection (30% chance),
 * and publishes `MOTION_DETECTED` events to the EventBus.
 */

import type { EventBus } from "../core/bus.js";
import { logger } from "../core/logger.js";
import { EventType, Severity, createEvent } from "../core/types.js";
import type { SecurityEvent } from "../core/types.js";
import type { MemorySystem } from "../memory/system.js";
import type { CameraFrame } from "../perception/camera-connector.js";

// ── VisionPipeline ───────────────────────────────────────────────

export class VisionPipeline {
  private frameCounts = new Map<string, number>();
  private readonly frameSkip = 3;

  constructor(
    private bus: EventBus,
    private memory?: MemorySystem,
  ) {}

  /**
   * Process a single camera frame.
   * Returns a `SecurityEvent` if motion was detected, or `null` otherwise.
   */
  async process(frame: CameraFrame): Promise<SecurityEvent | null> {
    // ── Frame skipping: only process 1 out of every N frames ──
    const count = (this.frameCounts.get(frame.cameraId) ?? 0) + 1;
    this.frameCounts.set(frame.cameraId, count);

    if (count % this.frameSkip !== 0) {
      return null;
    }

    // ── Simulated motion detection: 30% chance ────────────────
    const motionDetected = Math.random() < 0.3;

    if (!motionDetected) {
      return null;
    }

    // ── Create motion event ───────────────────────────────────
    const event = createEvent({
      eventType: EventType.MOTION_DETECTED,
      cameraId: frame.cameraId,
      severity: Severity.INFO,
      description: `Movimento detectado na câmera ${frame.cameraId}`,
      payload: {
        frameTimestamp: frame.timestamp.toISOString(),
        confidence: 0.8,
      },
    });

    logger.debug(
      { eventId: event.eventId, cameraId: frame.cameraId },
      "Motion detected event created",
    );

    // ── Publish to event bus ──────────────────────────────────
    this.bus.publish("vision.event", event);

    return event;
  }
}
