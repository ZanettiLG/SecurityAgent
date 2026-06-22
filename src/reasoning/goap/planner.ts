/**
 * GOAP Planner — Goal-Oriented Action Planning.
 *
 * Planejador A* que encontra sequência de ações do estado atual ao goal.
 */

import { logger } from "../../core/logger.js";
import { WorldState, type FactValue, type ConditionValue } from "../../core/types.js";

// ── Action ───────────────────────────────────────────────────────

export interface GoapAction {
  name: string;
  cost: number;
  preconditions: Record<string, ConditionValue>;
  effects: Record<string, ConditionValue>;
  durationEstimate: number;
  isReversible: boolean;
  maxRetries: number;
  execute(ctx: Record<string, unknown>): Promise<boolean>;
  undo?(ctx: Record<string, unknown>): Promise<boolean>;
}

// ── Goal ─────────────────────────────────────────────────────────

export interface Goal {
  name: string;
  priority: number;
  targetState: Record<string, ConditionValue>;
  preconditions: Record<string, ConditionValue>;
  isPersistent: boolean;
  ttlSeconds: number | null;
}

// ── Plan Result ──────────────────────────────────────────────────

export interface PlanResult {
  success: boolean;
  actions: GoapAction[];
  totalCost: number;
  goalName: string;
}

// ── Internal A* Node ─────────────────────────────────────────────

interface PlanNode {
  state: WorldState;
  actions: GoapAction[];
  cost: number;
}

// ── Planner ──────────────────────────────────────────────────────

export class GoapPlanner {
  constructor(private actions: GoapAction[]) {}

  plan(
    currentState: WorldState,
    goal: Goal,
    maxDepth = 10,
    maxIterations = 2000,
  ): PlanResult {
    if (currentState.satisfies(goal.targetState)) {
      return { success: true, actions: [], totalCost: 0, goalName: goal.name };
    }

    // A* using array as priority queue
    const openSet: { f: number; node: PlanNode }[] = [];
    let counter = 0;

    const startNode: PlanNode = { state: currentState, actions: [], cost: 0 };
    const h = currentState.distanceTo(goal.targetState);
    openSet.push({ f: h, node: startNode });

    const gScore = new Map<string, number>();
    gScore.set(currentState.hash(), 0);

    let iterations = 0;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      openSet.sort((a, b) => a.f - b.f);
      const { node: current } = openSet.shift()!;

      if (current.state.satisfies(goal.targetState)) {
        logger.info(
          `Plan found for goal '${goal.name}': ${current.actions.map((a) => a.name).join(" → ")} (cost=${current.cost.toFixed(1)})`,
        );
        return {
          success: true,
          actions: current.actions,
          totalCost: current.cost,
          goalName: goal.name,
        };
      }

      if (current.actions.length >= maxDepth) continue;

      for (const action of this.applicableActions(current.state)) {
        const newState = current.state.applyEffects(action.effects);
        const tentativeG = (gScore.get(current.state.hash()) ?? 0) + action.cost;
        const stateHash = newState.hash();

        if (tentativeG < (gScore.get(stateHash) ?? Infinity)) {
          gScore.set(stateHash, tentativeG);
          const hNew = newState.distanceTo(goal.targetState);
          const f = tentativeG + hNew;
          const newNode: PlanNode = {
            state: newState,
            actions: [...current.actions, action],
            cost: tentativeG,
          };
          openSet.push({ f, node: newNode });
        }
      }
    }

    logger.warn(`No plan found for goal '${goal.name}' after ${iterations} iterations`);
    return { success: false, actions: [], totalCost: 0, goalName: goal.name };
  }

  private applicableActions(state: WorldState): GoapAction[] {
    return this.actions.filter((a) => state.satisfies(a.preconditions));
  }
}

// ── GOAP Agent ───────────────────────────────────────────────────

export class GoapAgent {
  private activeGoals: Goal[] = [];
  private currentPlan: PlanResult | null = null;
  private currentPlanIndex = 0;

  constructor(
    private planner: GoapPlanner,
    private actions: GoapAction[],
  ) {}

  addGoal(goal: Goal): void {
    if (!this.activeGoals.some((g) => g.name === goal.name)) {
      this.activeGoals.push(goal);
      this.activeGoals.sort((a, b) => b.priority - a.priority);
    }
  }

  removeGoal(goalName: string): void {
    this.activeGoals = this.activeGoals.filter((g) => g.name !== goalName);
    if (this.currentPlan?.goalName === goalName) {
      this.currentPlan = null;
      this.currentPlanIndex = 0;
    }
  }

  async tick(worldState: WorldState, context: Record<string, unknown>): Promise<string[]> {
    const executed: string[] = [];

    // Remove goals com preconditions inválidas ou (não-persistentes e já satisfeitos)
    this.activeGoals = this.activeGoals.filter(
      (g) =>
        worldState.satisfies(g.preconditions) &&
        (g.isPersistent || !worldState.satisfies(g.targetState)),
    );

    // Planeja se necessário
    if (!this.currentPlan?.success) {
      for (const goal of this.activeGoals) {
        if (!worldState.satisfies(goal.targetState)) {
          this.currentPlan = this.planner.plan(worldState, goal);
          this.currentPlanIndex = 0;
          if (this.currentPlan.success) break;
        }
      }
    }

    // Executa próxima ação
    if (this.currentPlan?.success && this.currentPlanIndex < this.currentPlan.actions.length) {
      const action = this.currentPlan.actions[this.currentPlanIndex]!;

      if (worldState.satisfies(action.preconditions)) {
        const success = await action.execute(context);
        if (success) {
          executed.push(action.name);
          // Aplica os efeitos da ação no world state para evitar replanejamento infinito
          for (const [key, value] of Object.entries(action.effects)) {
            if (Array.isArray(value)) {
              const [op, val] = value;
              const current = (worldState.facts[key] as number) ?? 0;
              const nv = val as number;
              if (op === "+") worldState.facts[key] = current + nv;
              else if (op === "-") worldState.facts[key] = Math.max(0, current - nv);
              else if (op === "set") worldState.facts[key] = val;
            } else {
              worldState.facts[key] = value as FactValue;
            }
          }
          this.currentPlanIndex++;
        } else {
          logger.warn(`Action '${action.name}' failed — replanning`);
          this.currentPlan = null;
          this.currentPlanIndex = 0;
        }
      } else {
        this.currentPlan = null;
        this.currentPlanIndex = 0;
      }
    } else if (this.currentPlan?.success) {
      logger.info(`Plan for '${this.currentPlan.goalName}' completed`);
      this.currentPlan = null;
      this.currentPlanIndex = 0;
    }

    return executed;
  }
}

// ── Default Actions ──────────────────────────────────────────────

export function createDefaultActions(): GoapAction[] {
  return [
    {
      name: "activate_alarm",
      cost: 1,
      preconditions: { alarm_active: false },
      effects: { alarm_active: true, threat_level: ["-", 2] as ConditionValue },
      durationEstimate: 0.5,
      isReversible: true,
      maxRetries: 3,
      execute: async () => { logger.info("🔔 ALARME ATIVADO"); return true; },
    },
    {
      name: "deactivate_alarm",
      cost: 1,
      preconditions: { alarm_active: true },
      effects: { alarm_active: false },
      durationEstimate: 0.5,
      isReversible: true,
      maxRetries: 3,
      execute: async () => { logger.info("🔔 Alarme desativado"); return true; },
    },
    {
      name: "lock_main_door",
      cost: 2,
      preconditions: { main_door_locked: false },
      effects: { main_door_locked: true, perimeter_secured: true },
      durationEstimate: 2,
      isReversible: true,
      maxRetries: 3,
      execute: async () => { logger.info("🔒 Porta trancada"); return true; },
    },
    {
      name: "send_notification_owner",
      cost: 3,
      preconditions: {},
      effects: { threat_level: ["-", 1] as ConditionValue },
      durationEstimate: 2,
      isReversible: false,
      maxRetries: 2,
      execute: async () => { logger.info("📱 Notificação enviada"); return true; },
    },
    {
      name: "sound_siren",
      cost: 8,
      preconditions: { alarm_active: true, threat_level: [">=", 5] as ConditionValue },
      effects: { threat_level: ["-", 3] as ConditionValue, intrusion_detected: false },
      durationEstimate: 1,
      isReversible: true,
      maxRetries: 2,
      execute: async () => { logger.info("🚨 SIRENE"); return true; },
    },
    {
      name: "call_emergency",
      cost: 20,
      preconditions: { threat_level: [">=", 8] as ConditionValue },
      effects: { threat_level: ["-", 5] as ConditionValue },
      durationEstimate: 30,
      isReversible: false,
      maxRetries: 1,
      execute: async () => { logger.fatal("📞 EMERGÊNCIA"); return true; },
    },
    {
      name: "turn_on_lights",
      cost: 1.5,
      preconditions: { lights_on: false },
      effects: { lights_on: true, light_level: "bright" },
      durationEstimate: 1,
      isReversible: true,
      maxRetries: 3,
      execute: async () => { logger.info("💡 Luzes acesas"); return true; },
    },
    {
      name: "start_recording",
      cost: 1,
      preconditions: { cameras_online: [">", 0] as ConditionValue },
      effects: { recording_active: true },
      durationEstimate: 0.5,
      isReversible: true,
      maxRetries: 3,
      execute: async () => { logger.info("⏺️ Gravação iniciada"); return true; },
    },
  ];
}

// ── Default Goals ────────────────────────────────────────────────

export function createDefaultGoals(): Goal[] {
  return [
    {
      name: "eliminate_threat",
      priority: 100,
      targetState: { threat_level: 0, intrusion_detected: false },
      preconditions: { threat_level: [">", 5] as ConditionValue },
      isPersistent: false,
      ttlSeconds: null,
    },
    {
      name: "verify_unknown_person",
      priority: 80,
      targetState: { unknown_person_present: false },
      preconditions: { unknown_person_present: true },
      isPersistent: false,
      ttlSeconds: null,
    },
    {
      name: "secure_perimeter",
      priority: 70,
      targetState: { perimeter_secured: true, main_door_locked: true, garage_door_closed: true },
      preconditions: { perimeter_secured: false },
      isPersistent: false,
      ttlSeconds: null,
    },
    {
      name: "night_mode_security",
      priority: 60,
      targetState: { alarm_active: true, main_door_locked: true },
      preconditions: { time_of_day: "night", system_mode: "home" },
      isPersistent: true,
      ttlSeconds: null,
    },
    {
      name: "away_mode_lockdown",
      priority: 85,
      targetState: {
        alarm_active: true,
        perimeter_secured: true,
        main_door_locked: true,
        garage_door_closed: true,
        cameras_online: [">=", 1] as ConditionValue,
      },
      preconditions: { system_mode: "away" },
      isPersistent: true,
      ttlSeconds: null,
    },
  ];
}
