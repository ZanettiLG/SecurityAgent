/**
 * ONVIF Connector — PTZ-enabled camera connector using the onvif library.
 *
 * Implements both `CameraConnector` (frame capture via RTSP) and `OnvifPTZ`
 * (Pan-Tilt-Zoom control via ONVIF Profile S). Wraps the callback-based
 * `onvif` library API in Promises for ergonomic use.
 *
 * Usage:
 *   const conn = new OnvifConnector(config);
 *   await conn.connect();
 *   await conn.continuousMove({ pan: 0.5, tilt: 0, zoom: 0 });
 *   await conn.disconnect();
 */

import type { CameraConfig } from "../core/config.js";
import { logger } from "../core/logger.js";
import type { CameraConnector, CameraFrame } from "./camera-connector.js";
import onvif from "onvif";

// ── PTZ Types ───────────────────────────────────────────────────

export interface PTZVector {
  /** Pan velocity/position, range -1..1 (continuous) or device-dependent (absolute) */
  pan: number;
  /** Tilt velocity/position, range -1..1 */
  tilt: number;
  /** Zoom velocity/position, range -1..1 (continuous) or 0..1 (absolute) */
  zoom: number;
}

export interface PTZSpeed {
  pan?: number;
  tilt?: number;
  zoom?: number;
}

export interface PresetInfo {
  token: string;
  name: string;
}

export interface PTZStatus {
  position: { pan: number; tilt: number; zoom: number };
  moveStatus: string | null;
  error: string | null;
  utcTime: string | null;
}

export interface OnvifPTZ {
  /** Connect to the ONVIF camera */
  connect(): Promise<void>;
  /** Disconnect from the ONVIF camera */
  disconnect(): Promise<void>;
  /** Whether the camera is currently connected */
  readonly isConnected: boolean;
  /** Camera ID */
  readonly cameraId: string;

  continuousMove(vector: PTZVector, speed?: PTZSpeed): Promise<void>;
  stopMove(panTilt?: boolean, zoom?: boolean): Promise<void>;
  absoluteMove(position: PTZVector, speed?: PTZSpeed): Promise<void>;
  listPresets(): Promise<PresetInfo[]>;
  gotoPreset(token: string, speed?: PTZSpeed): Promise<void>;
  savePreset(name: string, token?: string): Promise<string>;
  gotoHome(speed?: PTZSpeed): Promise<void>;
  setHome(): Promise<void>;
  getStatus(): Promise<PTZStatus>;
}

// ── OnvifConnector ──────────────────────────────────────────────

export class OnvifConnector implements CameraConnector, OnvifPTZ {
  readonly cameraId: string;
  readonly source: string;
  readonly enabled: boolean;

  private _connected = false;
  private _cam: onvif.Cam | null = null;
  private readonly hostname: string;
  private readonly port: number;
  private readonly username: string;
  private readonly password: string;
  private readonly _useWSSecurity: boolean;
  private readonly _onvifPort: number | undefined;

  constructor(config: CameraConfig) {
    this.cameraId = config.id;
    this.source = config.source;
    this.enabled = config.enabled;
    this.username = config.username ?? "admin";
    this.password = config.password ?? "";

    // Parse hostname:port from source URL or use direct config
    const url = this.parseSource(config.source);
    this.hostname = url.hostname;
    this.port = url.port ?? 80;
    // ONVIF auth mode — Digest (false) works with most consumer cameras
    this._useWSSecurity = config.onvifUseWSSecurity ?? false;
    this._onvifPort = config.onvifPort;
  }

  get isConnected(): boolean {
    return this._connected && this._cam !== null;
  }

  // ── Connection ────────────────────────────────────────────────

  async connect(): Promise<void> {
    const actualPort = this._onvifPort ?? this.port ?? 80;
    logger.info(
      {
        cameraId: this.cameraId,
        hostname: this.hostname,
        port: actualPort,
        useWSSecurity: this._useWSSecurity,
      },
      "ONVIF camera connecting",
    );

    const cam = new onvif.Cam({
      hostname: this.hostname,
      username: this.username,
      password: this.password,
      port: actualPort,
      timeout: 15_000,
      autoconnect: false,
      useWSSecurity: this._useWSSecurity,
    });

    // Inject Basic auth header for cameras that don't return proper 401
    // (e.g. Yoosee hangs without authentication).
    if (this.username && this.password) {
      const basicAuth = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
      const origRequest = cam._requestPart2.bind(cam);
      cam._requestPart2 = function (this: onvif.Cam, ...args: unknown[]): void {
        const options = args[0] as Record<string, unknown>;
        const callback = args[1] as (err?: Error | null) => void;
        const headers =
          (options.headers as Record<string, string> | undefined) ?? {};
        headers.Authorization = basicAuth;
        options.headers = headers;
        return origRequest(options, callback);
      };
    }

    // Manual ONVIF initialization — skip cam.connect() because consumer-grade
    // cameras (Yoosee, Intelbras) don't implement getSystemDateAndTime,
    // getServices, or getVideoSources. We only need capabilities + profiles.
    await new Promise<void>((resolve, reject) => {
      cam.getCapabilities((err: Error | null) => {
        if (err) {
          logger.error(
            { err, cameraId: this.cameraId },
            "ONVIF getCapabilities failed",
          );
          reject(err);
          return;
        }
        // getCapabilities populates cam.uri with service endpoints
        cam.getProfiles((profileErr: Error | null) => {
          if (profileErr) {
            // Profiles not strictly required for PTZ-only operation
            logger.warn(
              { err: profileErr, cameraId: this.cameraId },
              "ONVIF getProfiles failed — PTZ may still work",
            );
          }
          // Set activeSource for PTZ operations (first media profile)
          const profiles = cam.profiles as unknown as
            Array<{ $: { token: string } }> | undefined;
          if (profiles && profiles.length > 0 && profiles[0]?.$.token) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (cam as any).activeSource = {
              profileToken: profiles[0].$.token,
            };
          } else {
            // Fallback: many consumer cameras don't expose profiles via ONVIF.
            // Use a dummy profile token — PTZ commands will still work if the
            // camera's PTZ service ignores the profile token field.
            logger.warn(
              { cameraId: this.cameraId },
              "No ONVIF profiles found — using dummy profile token",
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (cam as any).activeSource = {
              profileToken: "profile_1",
            };
          }
          this._cam = cam;
          this._connected = true;
          logger.info({ cameraId: this.cameraId }, "ONVIF camera connected");
          resolve();
        });
      });
    });
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    // Attempt to close the ONVIF connection if the cam object supports it.
    // The onvif library does not expose an explicit disconnect method,
    // so we release the reference for GC. The underlying HTTP socket
    // will be closed when the Node.js event loop discards it.
    this._cam = null;
    logger.info({ cameraId: this.cameraId }, "ONVIF camera disconnected");
  }

  // ── Frame Capture (delegated to RTSP, for CameraConnector compat) ──

  async getFrame(): Promise<CameraFrame | null> {
    // ONVIF connector focuses on PTZ — frame capture uses RTSP connector
    logger.warn(
      { cameraId: this.cameraId },
      "getFrame not implemented for ONVIF — use RTSP connector for frames",
    );
    return null;
  }

  async *stream(): AsyncGenerator<CameraFrame> {
    // ONVIF connector focuses on PTZ control, not frame capture.
    // Throw immediately so callers don't loop forever on an empty generator.
    yield {
      cameraId: this.cameraId,
      timestamp: new Date(),
      data: Buffer.alloc(0),
      width: 0,
      height: 0,
    };
    throw new Error(
      `ONVIF connector "${this.cameraId}" does not support frame streaming. Use RTSP connector for frames.`,
    );
  }

  // ── PTZ: Continuous Move ──────────────────────────────────────

  async continuousMove(vector: PTZVector, _speed?: PTZSpeed): Promise<void> {
    const cam = this.ensureCam();
    return new Promise<void>((resolve, reject) => {
      cam.continuousMove(
        {
          x: vector.pan,
          y: vector.tilt,
          zoom: vector.zoom,
          timeout: 5_000, // 5 second timeout for continuous move
        },
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  // ── PTZ: Stop ─────────────────────────────────────────────────

  async stopMove(panTilt: boolean = true, zoom: boolean = true): Promise<void> {
    const cam = this.ensureCam();
    try {
      return await new Promise<void>((resolve, reject) => {
        cam.stop({ panTilt, zoom }, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch {
      // Fallback: some cameras (e.g. Yoosee) don't implement Stop.
      // Use ContinuousMove with zero velocity instead.
      logger.warn(
        { cameraId: this.cameraId },
        "PTZ Stop not supported — using zero-velocity ContinuousMove",
      );
      return this.continuousMove({ pan: 0, tilt: 0, zoom: 0 });
    }
  }

  // ── PTZ: Absolute Move ────────────────────────────────────────

  async absoluteMove(position: PTZVector, speed?: PTZSpeed): Promise<void> {
    const cam = this.ensureCam();
    return new Promise<void>((resolve, reject) => {
      const opts: Record<string, unknown> = {
        x: position.pan,
        y: position.tilt,
        zoom: position.zoom,
      };
      if (speed) {
        opts.speed = {
          x: speed.pan ?? 0,
          y: speed.tilt ?? 0,
          zoom: speed.zoom ?? 0,
        };
      }
      cam.absoluteMove(opts, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // ── PTZ: Presets ──────────────────────────────────────────────

  async listPresets(): Promise<PresetInfo[]> {
    const cam = this.ensureCam();
    return new Promise<PresetInfo[]>((resolve, reject) => {
      cam.getPresets({}, (err: Error | null, presets?: unknown) => {
        if (err) {
          reject(err);
        } else {
          const list: PresetInfo[] = Object.values(presets ?? {}).map((p) => {
            const pVal = p as {
              $?: { token?: string };
              Name?: string[] | string;
            };
            return {
              token: pVal.$?.token ?? "",
              name: Array.isArray(pVal.Name)
                ? (pVal.Name[0] ?? "")
                : ((pVal.Name as string) ?? ""),
            };
          });
          resolve(list);
        }
      });
    });
  }

  async gotoPreset(token: string, speed?: PTZSpeed): Promise<void> {
    const cam = this.ensureCam();
    return new Promise<void>((resolve, reject) => {
      const opts: Record<string, unknown> = { preset: token };
      if (speed) {
        opts.speed = {
          x: speed.pan ?? 0,
          y: speed.tilt ?? 0,
          zoom: speed.zoom ?? 0,
        };
      }
      cam.gotoPreset(opts, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async savePreset(name: string, token?: string): Promise<string> {
    const cam = this.ensureCam();
    return new Promise<string>((resolve, reject) => {
      const opts: Record<string, unknown> = { presetName: name };
      if (token) {
        opts.presetToken = token;
      }
      cam.setPreset(
        opts,
        (err: Error | null, result?: Record<string, unknown>) => {
          if (err) reject(err);
          else {
            const newToken =
              (result?.presetToken as string) ??
              (result?.token as string) ??
              token ??
              name;
            resolve(newToken);
          }
        },
      );
    });
  }

  // ── PTZ: Home ─────────────────────────────────────────────────

  async gotoHome(speed?: PTZSpeed): Promise<void> {
    const cam = this.ensureCam();
    return new Promise<void>((resolve, reject) => {
      const opts: Record<string, unknown> = {};
      if (speed) {
        opts.speed = {
          x: speed.pan ?? 1,
          y: speed.tilt ?? 1,
          zoom: speed.zoom ?? 1,
        };
      }
      cam.gotoHomePosition(opts, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async setHome(): Promise<void> {
    const cam = this.ensureCam();
    return new Promise<void>((resolve, reject) => {
      cam.setHomePosition({}, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // ── PTZ: Status ───────────────────────────────────────────────

  async getStatus(): Promise<PTZStatus> {
    const cam = this.ensureCam();
    return new Promise<PTZStatus>((resolve, reject) => {
      cam.getStatus(
        {},
        (err: Error | null, status?: Record<string, unknown>) => {
          if (err) reject(err);
          else resolve(status as unknown as PTZStatus);
        },
      );
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  private ensureCam(): onvif.Cam {
    if (!this._cam || !this._connected) {
      throw new Error(`ONVIF camera "${this.cameraId}" is not connected`);
    }
    return this._cam;
  }

  private parseSource(source: string): {
    hostname: string;
    port: number | null;
  } {
    // Support formats:
    //   hostname:port
    //   http://hostname:port/onvif/device_service
    //   https://hostname:port/onvif/device_service
    //   plain hostname
    try {
      if (source.startsWith("http://") || source.startsWith("https://")) {
        const url = new URL(source);
        return { hostname: url.hostname, port: parseInt(url.port) || null };
      }
      // For RTSP URLs: extract hostname only — ONVIF uses a different port
      // (typically 80) than RTSP (typically 554). Let the ONVIF library
      // use its default port (80) when port is null.
      if (source.startsWith("rtsp://")) {
        const url = new URL(source);
        return { hostname: url.hostname, port: null };
      }
      // Plain hostname:port
      const parts = source.split(":");
      if (parts.length === 2 && parts[1]) {
        const port = parseInt(parts[1]);
        if (!Number.isNaN(port)) {
          return { hostname: parts[0] ?? source, port };
        }
      }
      return { hostname: source, port: null };
    } catch {
      return { hostname: source, port: null };
    }
  }
}
