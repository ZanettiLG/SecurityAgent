/**
 * Audio Pipeline — Processamento de áudio: VAD, classificação de sons,
 * reconhecimento de locutor e transcrição de fala.
 *
 * MVP: Voice Activity Detection (VAD) + classificação de sons (YAMNet-like).
 * Integração futura: speaker embedding (ECAPA-TDNN), transcrição (Whisper).
 *
 * Processa chunks de áudio e gera eventos no EventBus.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../core/logger.js";
import { EventType, Severity, createEvent } from "../core/types.js";
import type { SecurityEvent } from "../core/types.js";
import type { EventBus } from "../core/bus.js";

// ── Types ────────────────────────────────────────────────────────

export interface AudioChunk {
  cameraId: string;
  timestamp: Date;
  /** Raw PCM audio data (16kHz, 16-bit, mono) */
  data: Buffer;
  sampleRate: number;
  durationMs: number;
}

export interface AudioPipelineConfig {
  enabled: boolean;
  vad: {
    enabled: boolean;
    /** Speech probability threshold for VAD (0-1) */
    threshold: number;
    /** Minimum silence duration before end of speech (ms) */
    silenceDurationMs: number;
  };
  soundClassification: {
    enabled: boolean;
    /** Minimum confidence for sound classification (0-1) */
    minConfidence: number;
  };
  speakerRecognition: {
    enabled: boolean;
  };
  speechTranscription: {
    enabled: boolean;
  };
}

// ── Sound Classes ───────────────────────────────────────────────

const DANGER_SOUNDS = new Set(["gunshot", "breaking_glass", "scream", "alarm"]);
const WARNING_SOUNDS = new Set([
  "dog_bark",
  "loud_noise",
  "car_horn",
  "door_slam",
]);
const INFO_SOUNDS = new Set([
  "speech",
  "music",
  "car_engine",
  "footsteps",
  "doorbell",
]);

// ── AudioPipeline ───────────────────────────────────────────────

export class AudioPipeline {
  private config: AudioPipelineConfig;
  /** Tracks accumulated speech segments per camera */
  private speechSegments = new Map<string, { start: Date; end: Date }>();

  constructor(
    private bus: EventBus,
    config?: Partial<AudioPipelineConfig>,
  ) {
    this.config = {
      enabled: config?.enabled ?? true,
      vad: {
        enabled: config?.vad?.enabled ?? true,
        threshold: config?.vad?.threshold ?? 0.5,
        silenceDurationMs: config?.vad?.silenceDurationMs ?? 800,
      },
      soundClassification: {
        enabled: config?.soundClassification?.enabled ?? true,
        minConfidence: config?.soundClassification?.minConfidence ?? 0.3,
      },
      speakerRecognition: {
        enabled: config?.speakerRecognition?.enabled ?? false,
      },
      speechTranscription: {
        enabled: config?.speechTranscription?.enabled ?? false,
      },
    };
  }

  /**
   * Processa um chunk de áudio de uma câmera.
   *
   * Pipeline:
   * 1. Voice Activity Detection (VAD) — detecta fala
   * 2. Sound Classification — classifica o som (tiro, vidro, latido, etc.)
   * 3. [FUTURO] Speaker Recognition — identifica locutor
   * 4. [FUTURO] Speech Transcription — transcreve fala
   */
  async process(chunk: AudioChunk): Promise<SecurityEvent | null> {
    if (!this.config.enabled) return null;

    const events: SecurityEvent[] = [];

    // ── Step 1: VAD ──
    if (this.config.vad.enabled) {
      const speechEvent = await this.detectSpeech(chunk);
      if (speechEvent) events.push(speechEvent);
    }

    // ── Step 2: Sound Classification ──
    if (this.config.soundClassification.enabled) {
      const soundEvent = await this.classifySound(chunk);
      if (soundEvent) events.push(soundEvent);
    }

    // Publica todos os eventos
    for (const ev of events) {
      this.bus.publish("audio.event", ev);
    }

    // Retorna o evento de maior severidade
    if (events.length === 0) return null;
    events.sort((a, b) => b.severity - a.severity);
    return events[0]!;
  }

  /**
   * VAD — Voice Activity Detection.
   *
   * Implementação atual: baseada em energia (RMS).
   * Futuro: integrar Silero VAD via ONNX runtime.
   */
  private async detectSpeech(chunk: AudioChunk): Promise<SecurityEvent | null> {
    // Calcula RMS (Root Mean Square) como proxy de "energia de voz"
    const rms = this.calculateRMS(chunk.data);
    const isSpeech = rms > this.config.vad.threshold;

    if (isSpeech) {
      // Atualiza segmento de fala
      const existing = this.speechSegments.get(chunk.cameraId);
      if (existing) {
        existing.end = chunk.timestamp;
      } else {
        this.speechSegments.set(chunk.cameraId, {
          start: chunk.timestamp,
          end: chunk.timestamp,
        });
      }
    } else {
      // Silêncio — verifica se segmento de fala terminou
      const segment = this.speechSegments.get(chunk.cameraId);
      if (segment) {
        const silenceDuration =
          chunk.timestamp.getTime() - segment.end.getTime();
        if (silenceDuration >= this.config.vad.silenceDurationMs) {
          // Fala terminou — gera evento
          this.speechSegments.delete(chunk.cameraId);
          return createEvent({
            eventType: EventType.SPEECH_DETECTED,
            cameraId: chunk.cameraId,
            severity: Severity.INFO,
            description: `Fala detectada — ${((segment.end.getTime() - segment.start.getTime()) / 1000).toFixed(1)}s`,
            payload: {
              durationMs: segment.end.getTime() - segment.start.getTime(),
              sampleRate: chunk.sampleRate,
              rms,
            },
          });
        }
      }
    }

    return null;
  }

  /**
   * Classificação de sons.
   *
   * Implementação atual: heurística baseada em energia + frequência.
   * Futuro: integrar YAMNet / AST via Python microservice.
   */
  private async classifySound(
    chunk: AudioChunk,
  ): Promise<SecurityEvent | null> {
    const rms = this.calculateRMS(chunk.data);
    const zeroCrossings = this.countZeroCrossings(chunk.data);

    let soundClass = "ambient";
    let severity: Severity = Severity.INFO;

    // Heurística simples baseada em características do sinal
    if (rms > 0.8) {
      // Som muito alto
      if (zeroCrossings > 0.3) {
        soundClass = "gunshot";
        severity = Severity.CRITICAL;
      } else {
        soundClass = "loud_noise";
        severity = Severity.MEDIUM;
      }
    } else if (rms > 0.5) {
      if (zeroCrossings > 0.4) {
        soundClass = "breaking_glass";
        severity = Severity.HIGH;
      } else {
        soundClass = "dog_bark";
        severity = Severity.LOW;
      }
    }

    if (soundClass === "ambient" && rms < 0.1) return null; // Silêncio — ignora

    return createEvent({
      eventType: EventType.SOUND_DETECTED,
      cameraId: chunk.cameraId,
      severity,
      description: `Som detectado: ${soundClass} (RMS: ${rms.toFixed(2)})`,
      payload: {
        soundClass,
        rms: Math.round(rms * 100) / 100,
        zeroCrossings: Math.round(zeroCrossings * 100) / 100,
        confidence: 0.6, // Heurística — confiança moderada
      },
    });
  }

  // ── Audio Analysis Helpers ──────────────────────────────────

  /** Calcula RMS (Root Mean Square) como proxy de volume/energia. */
  private calculateRMS(buffer: Buffer): number {
    let sum = 0;
    // Processa como int16 (PCM 16-bit)
    for (let i = 0; i < buffer.length - 1; i += 2) {
      const sample = buffer.readInt16LE(i);
      sum += (sample / 32768) ** 2;
    }
    const samples = buffer.length / 2;
    return Math.sqrt(sum / Math.max(1, samples));
  }

  /** Conta zero crossings normalizado como proxy de frequência. */
  private countZeroCrossings(buffer: Buffer): number {
    let crossings = 0;
    const totalSamples = buffer.length / 2;

    for (let i = 2; i < buffer.length - 1; i += 2) {
      const prev = buffer.readInt16LE(i - 2);
      const curr = buffer.readInt16LE(i);
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        crossings++;
      }
    }

    return crossings / Math.max(1, totalSamples);
  }
}
