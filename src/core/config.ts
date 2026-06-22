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
  zones: z.array(z.object({
    name: z.string(),
    coords: z.array(z.number()),
  })).default([]),
  processing: z.object({
    faceDetection: z.boolean().default(true),
    objectDetection: z.boolean().default(true),
    motionDetection: z.boolean().default(true),
    frameSkip: z.number().default(3),
  }).default({}),
});

const VigiaConfig = z.object({
  enabled: z.boolean().default(true),
  vehicles: z.object({
    enabled: z.boolean().default(true),
    parkingBaselineSeconds: z.number().default(300),
    askUserThresholdSeconds: z.number().default(600),
    learnDuration: z.boolean().default(true),
  }).default({}),
  routines: z.object({
    enabled: z.boolean().default(true),
    learningRate: z.number().default(0.05),
    atypicalThreshold: z.number().default(0.15),
    minObservations: z.number().default(10),
  }).default({}),
  hypotheses: z.object({
    enabled: z.boolean().default(true),
    autoGenerateThreshold: z.number().default(0.4),
    askUserThreshold: z.number().default(0.5),
    maxActiveHypotheses: z.number().default(10),
  }).default({}),
  queries: z.object({
    enabled: z.boolean().default(true),
    maxPendingQuestions: z.number().default(5),
    questionCooldownSeconds: z.number().default(300),
    tone: z.enum(["informative", "casual", "humoristico"]).default("informative"),
  }).default({}),
});

const LlmConfig = z.object({
  provider: z.enum(["openai", "anthropic", "ollama"]).default("openai"),
  model: z.string().default("gpt-4o-mini"),
  apiKey: z.string().optional(),
  baseUrl: z.string().nullable().default(null),
  maxTokens: z.number().default(1000),
  temperature: z.number().default(0.3),
});

const AppConfigSchema = z.object({
  system: z.object({
    mode: z.enum(["home", "away", "night", "vacation", "business_hours"]).default("home"),
    logLevel: z.string().default("INFO"),
    dataDir: z.string().default("./data"),
  }).default({}),
  cameras: z.array(CameraConfig).default([]),
  llm: LlmConfig.default({}),
  vigia: VigiaConfig.default({}),
  goap: z.object({
    enabled: z.boolean().default(true),
    tickIntervalMs: z.number().default(2000),
  }).default({}),
  rules: z.object({
    enabled: z.boolean().default(true),
  }).default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type CameraConfig = z.infer<typeof CameraConfig>;
export type VigiaConfig = z.infer<typeof VigiaConfig>;
export type LlmConfig = z.infer<typeof LlmConfig>;

// ── Load ──

let _config: AppConfig | null = null;

export function loadConfig(path?: string): AppConfig {
  if (_config) return _config;

  const configPath = path || join(__dirname, "..", "..", "config", "settings.yaml");
  let raw = readFileSync(configPath, "utf-8");

  // Substitui ${VAR_NAME} por process.env.VAR_NAME
  raw = raw.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName.trim()] ?? "";
  });

  const parsed = parseYaml(raw);

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
