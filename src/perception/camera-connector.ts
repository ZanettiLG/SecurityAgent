/**
 * Camera Connector — Interface & Factory
 *
 * Defines the abstraction for all camera connectors and provides
 * a factory to instantiate the correct implementation based on config.
 */

import type { CameraConfig } from "../core/config.js";
import { logger } from "../core/logger.js";
import { MockConnector } from "./mock-connector.js";
import { RtspConnector } from "./rtsp-connector.js";

// ── Types ────────────────────────────────────────────────────────

export interface CameraFrame {
  cameraId: string;
  timestamp: Date;
  data: Buffer; // JPEG encoded frame
  width: number;
  height: number;
}

export interface CameraConnector {
  readonly cameraId: string;
  readonly source: string;
  readonly enabled: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getFrame(): Promise<CameraFrame | null>;
  stream(): AsyncGenerator<CameraFrame>;

  readonly isConnected: boolean;
}

// ── Factory ──────────────────────────────────────────────────────

export function createCameraConnector(config: CameraConfig): CameraConnector {
  logger.info({ cameraId: config.id, type: config.type }, "Creating camera connector");

  switch (config.type) {
    case "rtsp":
      return new RtspConnector(config);
    case "usb":
      return new MockConnector(config); // fallback — USB not implemented yet
    default:
      return new MockConnector(config);
  }
}
