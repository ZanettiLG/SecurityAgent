/**
 * Mock Connector — Generates synthetic frames for dev/testing.
 *
 * Produces black frames at configurable FPS with a 5% random
 * disconnect probability to exercise reconnection logic.
 */

import type { CameraConfig } from "../core/config.js";
import { logger } from "../core/logger.js";
import type { CameraConnector, CameraFrame } from "./camera-connector.js";

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── MockConnector ────────────────────────────────────────────────

export class MockConnector implements CameraConnector {
  readonly cameraId: string;
  readonly source: string;
  readonly enabled: boolean;

  private _connected = false;

  private fps: number;
  private width: number;
  private height: number;

  constructor(config: CameraConfig) {
    this.cameraId = config.id;
    this.source = config.source;
    this.enabled = config.enabled;

    // Allow extra dev-only fields for test configurability
    this.fps = (config as Record<string, unknown>).fps as number ?? 5;
    this.width = (config as Record<string, unknown>).width as number ?? 640;
    this.height = (config as Record<string, unknown>).height as number ?? 480;
  }

  get isConnected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    this._connected = true;
    logger.info({ cameraId: this.cameraId, fps: this.fps }, "Mock camera connected");
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    logger.info({ cameraId: this.cameraId }, "Mock camera disconnected");
  }

  async getFrame(): Promise<CameraFrame | null> {
    if (!this._connected) return null;

    if (Math.random() < 0.05) {
      throw new Error("Simulated disconnect");
    }

    return {
      cameraId: this.cameraId,
      timestamp: new Date(),
      data: Buffer.alloc(this.width * this.height * 3), // black RGB frame
      width: this.width,
      height: this.height,
    };
  }

  async *stream(): AsyncGenerator<CameraFrame> {
    while (this._connected) {
      await sleep(1000 / this.fps);

      if (Math.random() < 0.05) {
        throw new Error("Simulated disconnect");
      }

      yield {
        cameraId: this.cameraId,
        timestamp: new Date(),
        data: Buffer.alloc(this.width * this.height * 3), // black RGB frame
        width: this.width,
        height: this.height,
      };
    }
  }
}
