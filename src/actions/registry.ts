/**
 * Action Registry — Execução de ações de segurança + Vigia.
 */

import { logger } from "../core/logger.js";
import type { EventBus } from "../core/bus.js";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

type ActionHandler = (ctx: Record<string, unknown>) => Promise<ActionResult>;

export class ActionRegistry {
  private actions = new Map<string, ActionHandler>();

  constructor(private bus?: EventBus) {
    this.registerDefaults();
  }

  register(name: string, handler: ActionHandler): void {
    this.actions.set(name, handler);
  }

  async execute(actionName: string, context: Record<string, unknown> = {}): Promise<boolean> {
    const handler = this.actions.get(actionName);
    if (!handler) {
      logger.warn(`Unknown action: ${actionName}`);
      return false;
    }
    try {
      const result = await handler(context);
      logger.info(`Action '${actionName}': ${result.message}`);
      return result.success;
    } catch (err) {
      logger.error({ err, action: actionName }, "Action failed");
      return false;
    }
  }

  private registerDefaults(): void {
    this.register("activate_alarm", async () => {
      logger.info("🔔 ALARME ATIVADO");
      return { success: true, message: "Alarme ativado" };
    });
    this.register("deactivate_alarm", async () => {
      logger.info("🔔 Alarme desativado");
      return { success: true, message: "Alarme desativado" };
    });
    this.register("lock_main_door", async () => {
      logger.info("🔒 Porta trancada");
      return { success: true, message: "Porta trancada" };
    });
    this.register("turn_on_lights", async () => {
      logger.info("💡 Luzes acesas");
      return { success: true, message: "Luzes acesas" };
    });
    this.register("send_notification_owner", async (ctx) => {
      const msg = (ctx.message as string) || "Alerta do SecurityAgent";
      logger.info(`📱 Notificação: ${msg}`);
      return { success: true, message: `Notificação: ${msg}` };
    });
    this.register("alert_critical", async (ctx) => {
      const msg = (ctx.message as string) || "🚨 ALERTA CRÍTICO";
      logger.error(msg);
      return { success: true, message: msg };
    });
    this.register("alert_high", async (ctx) => {
      const msg = (ctx.message as string) || "🔴 Alerta Alto";
      logger.warn(msg);
      return { success: true, message: msg };
    });
    this.register("sound_siren", async () => {
      logger.info("🚨 SIRENE");
      return { success: true, message: "Sirene acionada" };
    });
    this.register("call_emergency", async () => {
      logger.error("📞 CHAMADA DE EMERGÊNCIA");
      return { success: true, message: "Emergência acionada" };
    });
    this.register("start_recording", async () => {
      logger.info("⏺️ Gravação iniciada");
      return { success: true, message: "Gravação iniciada" };
    });

    // Vigia actions
    this.register("register_social_insight", async (ctx) => {
      const insight = (ctx.insight as string) || "";
      logger.info(`📝 Insight social: ${insight}`);
      this.bus?.publish("social.insight", { insight, timestamp: new Date().toISOString() });
      return { success: true, message: "Insight registrado" };
    });
    this.register("confirm_prediction", async (ctx) => {
      const outcome = (ctx.outcome as string) || "Previsão social confirmada";
      logger.info(`✅ ${outcome}`);
      return { success: true, message: outcome };
    });
  }
}
