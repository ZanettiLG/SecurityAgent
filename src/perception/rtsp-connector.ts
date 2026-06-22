/**
 * RTSP Connector — Captures MJPEG frames via ffmpeg subprocess.
 *
 * Spawns `ffmpeg` to pull an RTSP stream, reads stdout as a
 * series of MJPEG frames delimited by `--ffmpeg_boundary`, and
 * yields `CameraFrame` objects. Includes reconnection logic
 * with up to 3 retries.
 */

import { spawn, type ChildProcess } from "node:child_process";
import type { CameraConfig } from "../core/config.js";
import { logger } from "../core/logger.js";
import type { CameraConnector, CameraFrame } from "./camera-connector.js";

// ── Constants ────────────────────────────────────────────────────

const BOUNDARY = Buffer.from("--ffmpeg_boundary");
const JPEG_SOI = Buffer.from([0xff, 0xd8]); // Start of Image marker

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── RtspConnector ────────────────────────────────────────────────

export class RtspConnector implements CameraConnector {
  readonly cameraId: string;
  readonly source: string;
  readonly enabled: boolean;
  readonly username: string;
  readonly password: string;

  private _connected = false;
  private process: ChildProcess | null = null;
  private readonly maxRetries = 3;
  private fps: number;
  private width: number;
  private height: number;

  constructor(config: CameraConfig) {
    this.cameraId = config.id;
    this.source = config.source;
    this.enabled = config.enabled;
    this.username = config.username ?? "";
    this.password = config.password ?? "";

    this.fps = (config as Record<string, unknown>).fps as number ?? 5;
    this.width = (config as Record<string, unknown>).width as number ?? 640;
    this.height = (config as Record<string, unknown>).height as number ?? 480;
  }

  get isConnected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    logger.info({ cameraId: this.cameraId, source: this.source }, "RTSP camera connecting");
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this._killProcess();
    logger.info({ cameraId: this.cameraId }, "RTSP camera disconnected");
  }

  async getFrame(): Promise<CameraFrame | null> {
    // Single-frame capture not supported for RTSP; use stream() instead.
    return null;
  }

  // ── Stream ─────────────────────────────────────────────────

  async *stream(): AsyncGenerator<CameraFrame> {
    let retries = 0;

    while (retries < this.maxRetries && this._connected) {
      try {
        yield* this._streamInternal();
        retries = 0; // reset on clean exit
      } catch (err) {
        retries++;
        logger.warn({ err, retries, cameraId: this.cameraId }, "RTSP stream error, reconnecting...");

        this._killProcess();
        await sleep(5000);
      }
    }

    if (retries >= this.maxRetries) {
      logger.error(
        { cameraId: this.cameraId, maxRetries: this.maxRetries },
        "RTSP max retries exceeded, giving up",
      );
    }
  }

  // ── Internals ──────────────────────────────────────────────

  private _buildAuthenticatedUrl(): string {
    // Se já tem credenciais embutidas na URL (rtsp://user:pass@...), usa como está
    if (this.source.includes("@")) {
      return this.source;
    }
    // Se tem username/password separados, monta a URL autenticada
    if (this.username) {
      try {
        const url = new URL(this.source);
        url.username = encodeURIComponent(this.username);
        url.password = encodeURIComponent(this.password);
        return url.toString();
      } catch {
        // Se a URL for inválida, tenta montar manualmente
        return this.source.replace("rtsp://", `rtsp://${this.username}:${this.password}@`);
      }
    }
    return this.source;
  }

  private _startFfmpeg(): ChildProcess {
    const authUrl = this._buildAuthenticatedUrl();
    const args = [
      "-rtsp_transport", "tcp",
      "-timeout", "3000000",
      "-i", authUrl,
      "-f", "image2pipe",
      "-vcodec", "mjpeg",
      "-q:v", "2",
      "-r", String(this.fps),
      "-",
    ];

    logger.debug({ cameraId: this.cameraId, source: authUrl.replace(/:[^:@]+@/, ":****@") }, "Spawning ffmpeg");

    const proc = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg.includes("Error") || msg.includes("Stream #0")) {
        logger.info({ cameraId: this.cameraId, ffmpeg: msg.split("\n")[0] }, "ffmpeg");
      }
    });

    proc.on("exit", (code) => {
      logger.warn({ cameraId: this.cameraId, exitCode: code }, "ffmpeg process exited");
    });

    proc.on("error", (err) => {
      logger.error({ cameraId: this.cameraId, err }, "ffmpeg process error");
    });

    return proc;
  }

  private _killProcess(): void {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
    }
  }

  private async *_streamInternal(): AsyncGenerator<CameraFrame> {
    const proc = this._startFfmpeg();
    this.process = proc;

    let buffer = Buffer.alloc(0);

    for await (const chunk of proc.stdout!) {
      if (!this._connected) break;

      buffer = Buffer.concat([buffer, chunk]);

      // Parse MJPEG frames delimited by BOUNDARY
      let boundaryIdx: number;
      while ((boundaryIdx = buffer.indexOf(BOUNDARY)) !== -1) {
        // Find the next boundary to delimit this frame
        const nextBoundary = buffer.indexOf(BOUNDARY, boundaryIdx + BOUNDARY.length);
        if (nextBoundary === -1) break; // incomplete frame, wait for more data

        const segment = buffer.subarray(boundaryIdx + BOUNDARY.length, nextBoundary);

        // Locate JPEG Start-of-Image marker
        const soiIdx = segment.indexOf(JPEG_SOI);
        if (soiIdx === -1) {
          buffer = buffer.subarray(nextBoundary);
          continue; // no JPEG data in this segment
        }

        const jpegData = segment.subarray(soiIdx);

        logger.debug(
          { cameraId: this.cameraId, size: jpegData.length },
          "RTSP frame received",
        );

        yield {
          cameraId: this.cameraId,
          timestamp: new Date(),
          data: jpegData,
          width: this.width,
          height: this.height,
        };

        buffer = buffer.subarray(nextBoundary);
      }
    }

    this.process = null;
  }
}
