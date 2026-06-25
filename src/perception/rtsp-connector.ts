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
  readonly transport: string;

  private _connected = false;
  private process: ChildProcess | null = null;
  private readonly maxRetries = 30;  // Aguentar horas de monitoramento
  private fps: number;
  private width: number;
  private height: number;

  constructor(config: CameraConfig) {
    this.cameraId = config.id;
    this.source = config.source;
    this.enabled = config.enabled;
    this.username = config.username ?? "";
    this.password = config.password ?? "";
    this.transport = config.transport ?? "tcp";

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
    this._stopProcess();
    logger.info({ cameraId: this.cameraId }, "RTSP camera disconnected");
  }

  async getFrame(): Promise<CameraFrame | null> {
    return null;
  }

  // ── Stream ─────────────────────────────────────────────────

  async *stream(): AsyncGenerator<CameraFrame> {
    let retries = 0;

    while (retries < this.maxRetries && this._connected) {
      try {
        let yielded = false;
        for await (const frame of this._streamInternal()) {
          yielded = true;
          yield frame;
          retries = 0; // Only reset on actual frame delivery
        }
        // Generator completed — ffmpeg likely crashed immediately
        if (!yielded) {
          retries++;
          const backoff = Math.min(5000, 1000 * retries);
          logger.warn({ retries, cameraId: this.cameraId, backoff }, "No frames received, backing off before reconnect");
          this._stopProcess();
          await sleep(backoff);
        }
      } catch (err) {
        retries++;
        const backoff = Math.min(30000, 2000 * retries);
        logger.warn({ err, retries, cameraId: this.cameraId, backoff }, "RTSP stream error, reconnecting...");
        this._stopProcess();
        await sleep(backoff);
      }
    }

    if (retries >= this.maxRetries) {
      logger.error({ cameraId: this.cameraId }, "Camera max retries exhausted — giving up");
    }
  }

  // ── Internals ──────────────────────────────────────────────

  private _stopProcess(): void {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
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
    // Escreve frames JPEG direto em arquivo (mais confiavel que MJPEG pipe no Windows)
    // Usa .tmp para race-free: ffmpeg escreve no .tmp, renomeamos para .jpg atomicamente
    const framePath = `data/cam_${this.cameraId}.jpg`;
    const tmpPath = `data/cam_${this.cameraId}.tmp.jpg`;
    const args = [
      "-rtsp_transport", this.transport,
      "-y",                    // Overwrite without prompting
      "-timeout", "3000000",
      "-i", authUrl,
      "-f", "image2",
      "-r", String(this.fps),
      "-update", "1",
      "-q:v", "2",
      tmpPath,
    ];

    logger.info({ cameraId: this.cameraId, tmpPath, framePath }, "Spawning ffmpeg (file mode)");

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

  // Remove old BOUNDARY/JPEG_SOI constants and use file polling instead
  private async *_streamInternal(): AsyncGenerator<CameraFrame> {
    const framePath = `data/cam_${this.cameraId}.jpg`;
    const tmpPath = `data/cam_${this.cameraId}.tmp.jpg`;
    const proc = this._startFfmpeg();
    this.process = proc;

    const { readFile, stat, rename } = await import("node:fs/promises");
    let lastSize = 0;
    let lastMtime = 0;

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    while (this._connected && proc.exitCode === null) {
      try {
        const s = await stat(tmpPath).catch(() => null);
        if (!s || s.size < 500 || s.mtimeMs === lastMtime) {
          await sleep(1000 / this.fps);
          continue;
        }

        lastSize = s.size;
        lastMtime = s.mtimeMs;
        const data = await readFile(tmpPath);

        // Renomeia atomicamente para o path final — API sempre lê JPEG completo
        await rename(tmpPath, framePath).catch(() => {});

        yield {
          cameraId: this.cameraId,
          timestamp: new Date(),
          data,
          width: this.width,
          height: this.height,
        };
      } catch {
        await sleep(1000 / this.fps);
      }
    }

    this.process = null;
  }
}
