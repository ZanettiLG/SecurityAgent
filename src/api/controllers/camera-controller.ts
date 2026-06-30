/**
 * CameraController — PTZ operations for ONVIF cameras.
 *
 * Pure business logic: receives a map of OnvifPTZ connectors
 * and exposes methods for continuous move, absolute move,
 * presets, and home position. No HTTP dependency.
 */

import type { OnvifPTZ, PresetInfo } from "../../perception/onvif-connector.js";
import { logger } from "../../core/logger.js";

export class CameraNotFoundError extends Error {
  constructor(cameraId: string) {
    super(`Camera "${cameraId}" not found or not ONVIF-capable`);
    this.name = "CameraNotFoundError";
  }
}

export class CameraNotConnectedError extends Error {
  constructor(cameraId: string) {
    super(`Camera "${cameraId}" is not connected`);
    this.name = "CameraNotConnectedError";
  }
}

export class CameraController {
  constructor(private readonly ptzCameras: Map<string, OnvifPTZ>) {}

  private getPTZ(cameraId: string): OnvifPTZ {
    const ptz = this.ptzCameras.get(cameraId);
    if (!ptz) {
      throw new CameraNotFoundError(cameraId);
    }
    return ptz;
  }

  // ── Continuous Move ──────────────────────────────────────────

  async continuousMove(
    cameraId: string,
    vector: { pan: number; tilt: number; zoom: number },
    speed?: PTZSpeed,
  ): Promise<{ status: string }> {
    const ptz = this.getPTZ(cameraId);
    await ptz.continuousMove(vector, speed);
    logger.info({ cameraId, vector }, "Continuous move started");
    return { status: "moving" };
  }

  // ── Stop ─────────────────────────────────────────────────────

  async stopMove(cameraId: string): Promise<{ status: string }> {
    const ptz = this.getPTZ(cameraId);
    await ptz.stopMove(true, true);
    logger.info({ cameraId }, "Movement stopped");
    return { status: "stopped" };
  }

  // ── Absolute Move ────────────────────────────────────────────

  async absoluteMove(
    cameraId: string,
    position: { pan: number; tilt: number; zoom: number },
    speed?: PTZSpeed,
  ): Promise<{ status: string }> {
    const ptz = this.getPTZ(cameraId);
    await ptz.absoluteMove(position, speed);
    logger.info({ cameraId, position }, "Absolute move completed");
    return { status: "moved" };
  }

  // ── Presets ──────────────────────────────────────────────────

  async listPresets(cameraId: string): Promise<PresetInfo[]> {
    const ptz = this.getPTZ(cameraId);
    const presets = await ptz.listPresets();
    logger.info({ cameraId, count: presets.length }, "Presets listed");
    return presets;
  }

  async gotoPreset(
    cameraId: string,
    token: string,
  ): Promise<{ status: string; token: string }> {
    const ptz = this.getPTZ(cameraId);
    await ptz.gotoPreset(token);
    logger.info({ cameraId, token }, "Moving to preset");
    return { status: "moving_to_preset", token };
  }

  async savePreset(
    cameraId: string,
    name: string,
  ): Promise<{ status: string; token: string; name: string }> {
    const ptz = this.getPTZ(cameraId);
    const token = await ptz.savePreset(name);
    logger.info({ cameraId, name, token }, "Preset saved");
    return { status: "saved", token, name };
  }

  // ── Home ─────────────────────────────────────────────────────

  async goHome(cameraId: string): Promise<{ status: string }> {
    const ptz = this.getPTZ(cameraId);
    await ptz.gotoHome();
    logger.info({ cameraId }, "Moving to home position");
    return { status: "moving_home" };
  }

  // ── Status ───────────────────────────────────────────────────

  async getStatus(cameraId: string): Promise<PTZStatus> {
    const ptz = this.getPTZ(cameraId);
    return await ptz.getStatus();
  }
}
