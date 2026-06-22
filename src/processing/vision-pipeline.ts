/**
 * Vision Pipeline — Real motion detection via pixel differencing.
 *
 * Uses sharp to decode JPEG frames and compare consecutive frames.
 * If the percentage of changed pixels exceeds a threshold, a
 * MOTION_DETECTED event is generated and published to the EventBus.
 */

import sharp from "sharp";
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

  /** Stores the previous frame's raw pixel buffer per camera for diffing */
  private previousFrames = new Map<string, Buffer>();

  /** Minimum percentage of changed pixels to trigger motion (default 2%) */
  private readonly motionThreshold = 0.02;

  /** Downsample frames to this width for faster processing */
  private readonly compareWidth = 320;

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

    try {
      // Decode JPEG to raw RGBA pixels and resize for efficiency
      const raw = await sharp(frame.data)
        .resize(this.compareWidth, Math.round(this.compareWidth * (frame.height / frame.width)))
        .raw()
        .toBuffer({ resolveWithObject: true });

      const currentPixels = raw.data;
      const prevPixels = this.previousFrames.get(frame.cameraId);

      // Store for next comparison
      this.previousFrames.set(frame.cameraId, currentPixels);

      // No previous frame yet — can't compare
      if (!prevPixels || prevPixels.length !== currentPixels.length) {
        return null;
      }

      // Pixel-by-pixel difference
      const changedPixels = this.countChangedPixels(currentPixels, prevPixels);
      const changeRatio = changedPixels / currentPixels.length;

      if (changeRatio < this.motionThreshold) {
        return null;
      }

      // ── Motion detected! ──
      const confidence = Math.min(1.0, changeRatio * 20); // 2% → 0.4, 5% → 1.0

      const event = createEvent({
        eventType: EventType.MOTION_DETECTED,
        cameraId: frame.cameraId,
        severity: Severity.INFO,
        description: `Movimento detectado (${(changeRatio * 100).toFixed(1)}% dos pixels)`,
        payload: {
          frameTimestamp: frame.timestamp.toISOString(),
          confidence,
          changeRatio: Math.round(changeRatio * 10000) / 10000,
        },
      });

      logger.debug(
        { eventId: event.eventId, cameraId: frame.cameraId, changeRatio },
        "Real motion detected",
      );

      this.bus.publish("vision.event", event);
      return event;
    } catch (err) {
      logger.error({ err, cameraId: frame.cameraId }, "Vision processing error");
      return null;
    }
  }

  /**
   * Count how many pixels differ between two raw RGBA buffers.
   * Skips alpha channel for speed.
   */
  private countChangedPixels(current: Buffer, previous: Buffer): number {
    let changed = 0;
    const len = Math.min(current.length, previous.length);
    // Compare RGB channels only (every 4th byte is alpha, skip it)
    for (let i = 0; i < len; i += 4) {
      // Tolerance: ignore 1-bit differences (camera noise)
      const dr = Math.abs(current[i]! - previous[i]!);
      const dg = Math.abs(current[i + 1]! - previous[i + 1]!);
      const db = Math.abs(current[i + 2]! - previous[i + 2]!);
      // Each channel must differ by >= 10 (out of 255) to count
      if (dr > 10 || dg > 10 || db > 10) {
        changed++;
      }
    }
    return changed;
  }
}

