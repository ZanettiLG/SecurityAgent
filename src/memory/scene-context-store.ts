/**
 * Scene Context Store — Memória de contexto por câmera.
 *
 * Mantém um buffer rotativo das últimas observações de cena por câmera
 * (in-memory) e fornece contexto para o LLM sobre "o que é normal" em
 * cada câmera.
 *
 * Bootstrap: carrega observações recentes do SceneIndex no startup.
 * Ingest: atualiza o contexto a cada nova observação.
 * DetectAnomaly: compara observação atual com baseline histórica.
 */

import { logger } from "../core/logger.js";
import type { SceneObservation, PersonObservation } from "../core/types.js";
import type { SceneIndex } from "./scene-index.js";

// ── Constants ───────────────────────────────────────────────────

const MAX_PER_CAMERA = 50;
const BOOTSTRAP_LIMIT = 20;

// ── SceneContextStore ────────────────────────────────────────────

export class SceneContextStore {
  /** Por cameraId: últimas N observações (mais recentes primeiro) */
  private contexts = new Map<string, SceneObservation[]>();

  // ── Ingest ───────────────────────────────────────────────────

  /** Adiciona uma nova observação ao contexto em memória */
  ingest(observation: SceneObservation): void {
    const camId = observation.cameraId;
    let list = this.contexts.get(camId);
    if (!list) {
      list = [];
      this.contexts.set(camId, list);
    }

    list.unshift(observation);

    // Trim
    if (list.length > MAX_PER_CAMERA) {
      list.length = MAX_PER_CAMERA;
    }
  }

  // ── Bootstrap ────────────────────────────────────────────────

  /** Carrega observações recentes do SceneIndex para inicializar contexto */
  async bootstrap(sceneIndex: SceneIndex, cameraIds: string[]): Promise<void> {
    for (const camId of cameraIds) {
      try {
        const recent = await sceneIndex.getRecent(camId, BOOTSTRAP_LIMIT);
        if (recent.length > 0) {
          this.contexts.set(camId, recent);
          logger.info(
            { cameraId: camId, count: recent.length },
            "SceneContextStore: bootstrapped",
          );
        }
      } catch (err) {
        logger.warn(
          { err, cameraId: camId },
          "SceneContextStore: bootstrap failed for camera",
        );
      }
    }
  }

  // ── LLM Context ──────────────────────────────────────────────

  /**
   * Gera um sumário textual para o contexto do LLM.
   * Descreve o que é "normal" para esta câmera baseado nas
   * observações recentes.
   */
  getLlmContext(cameraId: string): string {
    const list = this.contexts.get(cameraId);
    if (!list || list.length === 0) {
      return `[Câmera "${cameraId}"] Nenhuma observação de cena registrada ainda.`;
    }

    const now = Date.now();
    const recentWindow = 2 * 60 * 60 * 1000; // 2 horas
    const recentObs = list.filter(
      (o) => now - o.timestamp.getTime() < recentWindow,
    );
    const allPersons = list.flatMap((o) => o.description.persons);
    const allVehicles = list.flatMap((o) => o.description.vehicles);
    const allActions = list.flatMap((o) => o.description.actions);
    const allAnomalies = list.filter(
      (o) => o.description.anomalyFlags.length > 0,
    );

    // Unique actions (top 5)
    const actionFreq = new Map<string, number>();
    for (const a of allActions) {
      actionFreq.set(a, (actionFreq.get(a) ?? 0) + 1);
    }
    const topActions = [...actionFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => `${action} (${count}x)`);

    // Person summary
    const personSummary = this.getPersonSummary(cameraId);

    // Vehicle summary
    const uniqueVehicles = new Set(
      allVehicles.map((v) => `${v.color} ${v.type}`),
    );
    const parkedVehicles = allVehicles.filter(
      (v) => v.parkedMinutes && v.parkedMinutes > 5,
    );

    const lines = [
      `[Contexto da câmera "${cameraId}" — últimas 2h]`,
      `- ${recentObs.length} observações registradas`,
      `- Pessoas: ${personSummary.known} conhecidas, ${personSummary.unknown} desconhecidas`,
      uniqueVehicles.size > 0
        ? `- Veículos detectados: ${[...uniqueVehicles].join(", ")}`
        : "- Veículos: nenhum detectado",
      parkedVehicles.length > 0
        ? `- Veículos estacionados: ${parkedVehicles.length}`
        : null,
      topActions.length > 0 ? `- Ações comuns: ${topActions.join("; ")}` : null,
      allAnomalies.length > 0
        ? `- ⚠️ Anomalias anteriores: ${allAnomalies.length}`
        : "- Anomalias anteriores: 0",
      this._hourPattern(list),
    ];

    return lines.filter(Boolean).join("\n");
  }

  // ── Person Summary ───────────────────────────────────────────

  getPersonSummary(cameraId: string): { known: number; unknown: number } {
    const list = this.contexts.get(cameraId);
    if (!list) return { known: 0, unknown: 0 };

    const allPersons = list.flatMap((o) => o.description.persons);
    const known = allPersons.filter((p) => p.appearsKnown).length;
    const unknown = allPersons.filter((p) => !p.appearsKnown).length;

    return { known, unknown };
  }

  // ── Anomaly Detection ────────────────────────────────────────

  /**
   * Compara uma nova observação com o baseline da câmera.
   * Retorna se é anomalia + razão.
   */
  detectAnomaly(obs: SceneObservation): { isAnomaly: boolean; reason: string } {
    const list = this.contexts.get(obs.cameraId);
    if (!list || list.length < 3) {
      // Sem baseline suficiente — não podemos julgar
      return { isAnomaly: false, reason: "baseline insuficiente" };
    }

    const desc = obs.description;
    const flags: string[] = [];

    // ── Pessoas desconhecidas à noite ──
    const hour = obs.timestamp.getHours();
    const unknownPersons = desc.persons.filter((p) => !p.appearsKnown);
    if (unknownPersons.length > 0 && (hour >= 22 || hour <= 5)) {
      flags.push(
        `${unknownPersons.length} pessoa(s) desconhecida(s) em horário noturno (${hour}h)`,
      );
    }

    // ── Pessoa parada muito tempo ──
    const stationary = desc.persons.filter(
      (p) =>
        p.movement && ["parado", "parada"].includes(p.movement.toLowerCase()),
    );
    if (stationary.length > 0) {
      flags.push(
        `${stationary.length} pessoa(s) parada(s) observando a residência`,
      );
    }

    // ── Veículo não visto antes ──
    if (desc.vehicles.length > 0) {
      const knownVehicles = new Set(
        list.flatMap((o) =>
          o.description.vehicles.map((v) => `${v.color}-${v.type}`),
        ),
      );
      for (const v of desc.vehicles) {
        if (!knownVehicles.has(`${v.color}-${v.type}`)) {
          flags.push(`Veículo não reconhecido: ${v.color} ${v.type}`);
        }
      }
    }

    // ── Ações suspeitas ──
    const suspiciousActions = desc.actions.filter((a) =>
      /olhando|observando|espreitando|tentando|forçando/i.test(a),
    );
    if (suspiciousActions.length > 0) {
      flags.push(`Ação suspeita: ${suspiciousActions.join(", ")}`);
    }

    // ── Flags explícitos do LLM ──
    for (const flag of desc.anomalyFlags) {
      flags.push(`LLM flag: ${flag}`);
    }

    if (flags.length > 0) {
      return { isAnomaly: true, reason: flags.join("; ") };
    }

    return { isAnomaly: false, reason: "" };
  }

  // ── Private Helpers ──────────────────────────────────────────

  /** Gera descrição textual do padrão horário */
  private _hourPattern(list: SceneObservation[]): string {
    const now = new Date();
    const currentHour = now.getHours();

    // Conta observações por hora
    const hourCounts = new Map<number, number>();
    for (const obs of list) {
      const h = obs.timestamp.getHours();
      hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
    }

    const currentCount = hourCounts.get(currentHour) ?? 0;
    const avgCount =
      [...hourCounts.values()].reduce((a, b) => a + b, 0) /
      Math.max(hourCounts.size, 1);

    if (currentCount > avgCount * 1.5) {
      return `- ⚠️ Atividade acima do normal para ${currentHour}h (${currentCount} obs vs média ${avgCount.toFixed(0)})`;
    }
    if (currentCount < avgCount * 0.5 && avgCount > 5) {
      return `- Atividade abaixo do normal para ${currentHour}h`;
    }
    return `- Padrão do horário: típico para ${currentHour}h`;
  }
}
