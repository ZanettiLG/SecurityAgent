/**
 * Config — Carrega e valida a configuração do sistema.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { logger } from "./logger.js";

// Carrega variaveis do .env para process.env
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Schema ──

const CameraConfig = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.enum(["rtsp", "onvif", "usb"]).default("rtsp"),
  source: z.string(),
  enabled: z.boolean().default(true),
  username: z.string().optional(),
  password: z.string().optional(),
  transport: z.enum(["tcp", "udp"]).default("tcp"),
  zones: z
    .array(
      z.object({
        name: z.string(),
        coords: z.array(z.number()),
      }),
    )
    .default([]),
  processing: z
    .object({
      faceDetection: z.boolean().default(true),
      objectDetection: z.boolean().default(true),
      motionDetection: z.boolean().default(true),
      frameSkip: z.number().default(3),
    })
    .default({}),
  /** ONVIF HTTP port (defaults to 80, or inferred from source URL if http/https) */
  onvifPort: z.number().int().min(1).max(65535).optional(),
  /** Disable WS-Security for cameras that only support Digest auth */
  onvifUseWSSecurity: z.boolean().default(false).optional(),
});

const VigiaConfig = z.object({
  enabled: z.boolean().default(true),
  vehicles: z
    .object({
      enabled: z.boolean().default(true),
      parkingBaselineSeconds: z.number().default(300),
      askUserThresholdSeconds: z.number().default(600),
      learnDuration: z.boolean().default(true),
    })
    .default({}),
  routines: z
    .object({
      enabled: z.boolean().default(true),
      learningRate: z.number().default(0.05),
      atypicalThreshold: z.number().default(0.15),
      minObservations: z.number().default(10),
    })
    .default({}),
  hypotheses: z
    .object({
      enabled: z.boolean().default(true),
      autoGenerateThreshold: z.number().default(0.4),
      askUserThreshold: z.number().default(0.5),
      maxActiveHypotheses: z.number().default(10),
    })
    .default({}),
  queries: z
    .object({
      enabled: z.boolean().default(true),
      maxPendingQuestions: z.number().default(5),
      questionCooldownSeconds: z.number().default(300),
      tone: z
        .enum(["informative", "casual", "humoristico"])
        .default("informative"),
    })
    .default({}),
  sceneAnalyzer: z
    .object({
      enabled: z.boolean().default(true),
      minIntervalMs: z.number().default(5000),
      motionThreshold: z.number().default(0.05),
      maxTokens: z.number().default(300),
      model: z.string().optional(),
    })
    .default({}),
});

const LlmConfig = z.object({
  baseUrl: z.string().default("http://localhost:11434/v1"),
  apiKey: z.string().optional(),
  model: z.string().default("minicpm-v4.6"),
  maxTokens: z.number().default(4096),
  temperature: z.number().default(0.3),
});

const AppConfigSchema = z.object({
  system: z
    .object({
      mode: z
        .enum(["home", "away", "night", "vacation", "business_hours"])
        .default("home"),
      logLevel: z.string().default("INFO"),
      dataDir: z.string().default("./data"),
    })
    .default({}),
  cameras: z.array(CameraConfig).default([]),
  llm: LlmConfig.default({}),
  vigia: VigiaConfig.default({}),
  goap: z
    .object({
      enabled: z.boolean().default(true),
      tickIntervalMs: z.number().default(2000),
    })
    .default({}),
  rules: z
    .object({
      enabled: z.boolean().default(true),
    })
    .default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type CameraConfig = z.infer<typeof CameraConfig>;
export type VigiaConfig = z.infer<typeof VigiaConfig>;
export type LlmConfig = z.infer<typeof LlmConfig>;
export type SceneAnalyzerConfig = z.infer<typeof VigiaConfig>["sceneAnalyzer"];

// ── Load ──

let _config: AppConfig | null = null;

export function loadConfig(path?: string): AppConfig {
  if (_config) return _config;

  const configPath =
    path || join(__dirname, "..", "..", "config", "settings.yaml");
  let raw = readFileSync(configPath, "utf-8");

  // Substitui ${VAR_NAME:-default} ou ${VAR_NAME} por process.env.VAR_NAME
  // Suporta sintaxe bash: ${VAR:-fallback} — se VAR não existir, usa fallback
  raw = raw.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const trimmed = expr.trim();
    // Parse ${VAR:-default} syntax
    const colonIdx = trimmed.indexOf(":-");
    let name: string;
    let fallback: string;
    if (colonIdx >= 0) {
      name = trimmed.slice(0, colonIdx).trim();
      fallback = trimmed.slice(colonIdx + 2);
    } else {
      name = trimmed;
      fallback = "";
    }

    const value = process.env[name];
    if (!value) {
      if (fallback) {
        return fallback;
      }
      logger.warn(
        { varName: name },
        "Environment variable not set — camera may be disabled",
      );
    }
    return value ?? fallback;
  });

  const parsed = parseYaml(raw);

  // Valida e desabilita câmeras com credenciais RTSP vazias
  if (Array.isArray(parsed?.cameras)) {
    for (const cam of parsed.cameras as Array<Record<string, unknown>>) {
      const source = String(cam.source ?? "");
      if (/rtsp:\/\/:/.test(source) || /rtsp:\/\/[^:]*:@/.test(source)) {
        logger.warn(
          { cameraId: cam.id, source },
          "Camera has empty credentials — disabling",
        );
        cam.enabled = false;
      }
    }
  }

  const result = AppConfigSchema.safeParse(parsed);
  if (!result.success) {
    logger.error({ errors: result.error.format() }, "Invalid configuration");
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) return loadConfig();
  return _config;
}
