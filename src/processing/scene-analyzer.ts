/**
 * Scene Analyzer — Análise Semântica de Cena via LLM Vision.
 *
 * Usa LLM Vision (GPT-4o-mini / LLaVA / Ollama vision) para descrever
 * semanticamente frames de câmera com movimento significativo.
 *
 * O SceneAnalyzer preenche a lacuna entre "algo se moveu" (pixel-diff)
 * e "um homem de camisa azul está parado no portão há 5 minutos"
 * (compreensão semântica).
 *
 * Integração: chamado no camera loop após VisionPipeline detectar motion.
 * NUNCA bloqueia o loop — processamento assíncrono com void.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../core/logger.js";
import type { EventBus } from "../core/bus.js";
import type { CameraFrame } from "../perception/camera-connector.js";
import type { LlmClient } from "../reasoning/llm/client.js";
import type { SceneAnalyzerConfig } from "../core/config.js";
import {
  type SceneObservation,
  type SceneDescription,
  EventType,
} from "../core/types.js";

// ── System Prompt (Português) ───────────────────────────────────

const VISION_SYSTEM_PROMPT = `Você é o Vigia, um agente de segurança residencial inteligente.
Analise esta imagem de câmera de segurança e retorne APENAS um JSON com a seguinte estrutura:

{
  "narration": "descrição completa em texto corrido da cena, em português",
  "persons": [
    {
      "localId": "person_1",
      "appearance": {
        "estimatedAge": "30-40 anos",
        "clothing": "camiseta branca, calça jeans",
        "accessories": ["mochila preta"],
        "height": "médio"
      },
      "movement": "caminhando lentamente",
      "appearsKnown": false
    }
  ],
  "vehicles": [
    {
      "type": "sedan",
      "color": "prata",
      "plate": "ABC-1234",
      "parkedMinutes": 12
    }
  ],
  "objects": [
    {
      "type": "pacote na porta",
      "relevance": "normal"
    }
  ],
  "actions": ["caminhando em direção ao portão"],
  "intentions": ["possível visitante"],
  "anomalyFlags": []
}

Regras:
1. Se não houver pessoas, veículos ou objetos relevantes, retorne arrays vazios.
2. Seja objetivo e preciso. Use português.
3. "appearsKnown": false sempre, a menos que você reconheça a pessoa de interações anteriores.
4. "relevance" deve ser "normal", "suspicious" ou "threat".
5. "anomalyFlags" só preencha se houver algo realmente fora do comum.
6. Retorne APENAS o JSON, sem texto antes ou depois.`;

// ── SceneAnalyzer ───────────────────────────────────────────────

export class SceneAnalyzer {
  private lastAnalysis = new Map<string, number>();
  private config: SceneAnalyzerConfig;

  constructor(
    private llmClient?: LlmClient,
    private bus?: EventBus,
    config?: Partial<SceneAnalyzerConfig>,
  ) {
    this.config = {
      enabled: config?.enabled ?? true,
      minIntervalMs: config?.minIntervalMs ?? 5000,
      motionThreshold: config?.motionThreshold ?? 0.05,
      maxTokens: config?.maxTokens ?? 300,
      model: config?.model,
    };
  }

  /**
   * Analisa um frame de câmera usando LLM Vision.
   *
   * Só processa se:
   * - SceneAnalyzer está enabled
   * - Passou minIntervalMs desde a última análise desta câmera
   * - motionScore (se fornecido) está acima do threshold
   *
   * @returns SceneObservation ou null (se throttled, sem motion, ou erro LLM)
   */
  async analyze(
    frame: CameraFrame,
    motionScore?: number,
  ): Promise<SceneObservation | null> {
    if (!this.config.enabled) return null;
    if (!this.llmClient) {
      logger.warn("SceneAnalyzer: LLM client not available");
      return null;
    }

    // ── Throttle por câmera ──
    const now = Date.now();
    const last = this.lastAnalysis.get(frame.cameraId) ?? 0;
    if (now - last < this.config.minIntervalMs) return null;

    // ── Motion threshold ──
    if (
      motionScore !== undefined &&
      motionScore < this.config.motionThreshold
    ) {
      return null;
    }

    // Atualiza timestamp antes da chamada (evita chamadas paralelas)
    this.lastAnalysis.set(frame.cameraId, now);

    try {
      // ── Converter JPEG Buffer → base64 ──
      const base64 = frame.data.toString("base64");
      const dataUri = `data:image/jpeg;base64,${base64}`;

      // ── Chamar LLM Vision ──
      const model = this.config.model ?? undefined;
      const response = await this.llmClient.generateVision(
        VISION_SYSTEM_PROMPT,
        dataUri,
        { maxTokens: this.config.maxTokens, model },
      );

      // ── Parse JSON ──
      const description = this.parseSceneDescription(response);
      if (!description) return null;

      // ── Montar SceneObservation ──
      const observation: SceneObservation = {
        id: `scene_${randomUUID().slice(0, 8)}`,
        timestamp: frame.timestamp,
        cameraId: frame.cameraId,
        snapshotPath: `data/cam_${frame.cameraId}.jpg`,
        description,
      };

      // ── Publicar no EventBus ──
      if (this.bus) {
        this.bus.publish(
          "scene.observation",
          observation as unknown as Record<string, unknown>,
        );
      }

      logger.info(
        {
          cameraId: frame.cameraId,
          narration: description.narration.slice(0, 80),
        },
        "Scene analyzed",
      );

      return observation;
    } catch (err) {
      logger.warn(
        { err, cameraId: frame.cameraId },
        "SceneAnalyzer: LLM vision failed",
      );
      return null;
    }
  }

  /**
   * Extrai e valida o JSON da resposta do LLM.
   */
  private parseSceneDescription(raw: string): SceneDescription | null {
    try {
      // Tenta extrair JSON de code blocks ```json ... ``` ou texto puro
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();

      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      // Validação mínima
      if (typeof parsed.narration !== "string") {
        logger.warn("SceneAnalyzer: missing narration in LLM response");
        return null;
      }

      return {
        narration: parsed.narration as string,
        persons: Array.isArray(parsed.persons)
          ? (parsed.persons as SceneDescription["persons"])
          : [],
        vehicles: Array.isArray(parsed.vehicles)
          ? (parsed.vehicles as SceneDescription["vehicles"])
          : [],
        objects: Array.isArray(parsed.objects)
          ? (parsed.objects as SceneDescription["objects"])
          : [],
        actions: Array.isArray(parsed.actions)
          ? (parsed.actions as string[])
          : [],
        intentions: Array.isArray(parsed.intentions)
          ? (parsed.intentions as string[])
          : [],
        anomalyFlags: Array.isArray(parsed.anomalyFlags)
          ? (parsed.anomalyFlags as string[])
          : [],
      };
    } catch {
      logger.warn("SceneAnalyzer: failed to parse LLM JSON response");
      return null;
    }
  }
}
