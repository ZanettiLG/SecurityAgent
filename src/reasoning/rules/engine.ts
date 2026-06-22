/**
 * Rules Engine — Motor de regras determinísticas (< 5ms).
 */

import { logger } from "../../core/logger.js";
import { type SecurityEvent } from "../../core/types.js";

export interface Rule {
  name: string;
  priority: number;
  condition: Record<string, unknown>;
  actions: string[];
  matches(event: SecurityEvent): boolean;
}

export class RulesEngine {
  private rules: Rule[];

  constructor(rules: Rule[] = []) {
    this.rules = [...defaultRules(), ...rules].sort((a, b) => b.priority - a.priority);
  }

  async evaluate(event: SecurityEvent): Promise<string[]> {
    const actions: string[] = [];
    for (const rule of this.rules) {
      try {
        if (rule.matches(event)) {
          logger.info(`Rule matched: ${rule.name} → ${rule.actions.join(", ")}`);
          actions.push(...rule.actions);
        }
      } catch (err) {
        logger.error({ err, rule: rule.name }, "Rule evaluation error");
      }
    }
    return [...new Set(actions)];
  }
}

function defaultRules(): Rule[] {
  return [
    {
      name: "gunshot_immediate",
      priority: 100,
      condition: { eventType: "sound_detected", soundClass: "gunshot" },
      actions: ["alert_critical", "call_emergency", "start_recording"],
      matches: (e) =>
        e.eventType === "sound_detected" && e.payload.soundClass === "gunshot",
    },
    {
      name: "breaking_glass",
      priority: 90,
      condition: { eventType: "sound_detected", soundClass: "breaking_glass" },
      actions: ["alert_high", "start_recording", "send_notification_owner"],
      matches: (e) =>
        e.eventType === "sound_detected" && e.payload.soundClass === "breaking_glass",
    },
    {
      name: "high_anomaly",
      priority: 60,
      condition: { anomalyScore: { min: 0.8 } },
      actions: ["alert_high", "send_notification_owner"],
      matches: (e) => e.anomalyScore >= 0.8,
    },
  ];
}
