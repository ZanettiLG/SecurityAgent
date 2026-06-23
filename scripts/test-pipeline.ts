/**
 * Test script — Injeta eventos simulados no agent para exercitar o pipeline completo.
 *
 * Uso: npx tsx scripts/test-pipeline.ts
 *
 * Simula:
 * 1. Pessoa detectada na câmera externa (dona Olinda)
 * 2. Veículo desconhecido estacionado (23 min)
 * 3. Movimento suspeito noturno
 */

import { SecurityAgent } from "../src/core/agent.js";
import { EventType, Severity, createEvent } from "../src/core/types.js";

async function main() {
  console.log("🚀 Iniciando agente de teste...\n");
  const agent = new SecurityAgent();
  await agent.setup();

  // Espera tudo inicializar
  await new Promise((r) => setTimeout(r, 500));

  // ── Teste 1: Pessoa conhecida detectada ──
  console.log("═══ TESTE 1: Pessoa conhecida na porta ═══\n");
  const event1 = createEvent({
    eventType: EventType.PERSON_DETECTED,
    cameraId: "externa",
    severity: Severity.LOW,
    description: "Dona Olinda detectada na porta da frente",
    personsInvolved: ["person_olinda"],
    payload: {
      confidence: 0.92,
      personName: "Olinda",
      category: "known",
    },
  });

  console.log(`📤 Evento: ${event1.description}`);
  await agent.handleEvent(event1);
  await new Promise((r) => setTimeout(r, 800));
  console.log("");

  // ── Teste 2: Veículo desconhecido ──
  console.log("═══ TESTE 2: Veículo não identificado estacionado ═══\n");
  const event2 = createEvent({
    eventType: EventType.VEHICLE_DETECTED,
    cameraId: "externa",
    severity: Severity.MEDIUM,
    description: "Veículo sedan branco não identificado estacionado há 23 minutos",
    personsInvolved: [],
    payload: {
      durationSeconds: 1380,
      vehicleClass: "sedan",
      confidence: 0.85,
      identified: false,
      speedReduction: true,
      observingResidence: true,
    },
  });

  console.log(`📤 Evento: ${event2.description}`);
  console.log(`   Anomaly score: ${event2.anomalyScore.toFixed(2)}`);
  await agent.handleEvent(event2);
  await new Promise((r) => setTimeout(r, 2000)); // Espera LLM responder
  console.log("");

  // ── Teste 3: Movimento noturno suspeito ──
  console.log("═══ TESTE 3: Movimento suspeito às 2h da manhã ═══\n");
  const event3 = createEvent({
    eventType: EventType.MOTION_DETECTED,
    cameraId: "externa",
    severity: Severity.HIGH,
    description: "Movimento detectado no quintal às 02:17 da manhã",
    personsInvolved: ["unknown_abc123"],
    payload: {
      changeRatio: 0.12,
      confidence: 0.95,
      zone: "perimeter",
    },
    anomalyScore: 0.85, // Evento muito atípico
    timestamp: new Date("2026-06-22T02:17:00"),
  });

  console.log(`📤 Evento: ${event3.description}`);
  await agent.handleEvent(event3);
  await new Promise((r) => setTimeout(r, 2000));

  // ── Resultado ──
  console.log("\n═══ ESTADO FINAL ═══\n");
  console.log("World State:", JSON.stringify(agent.worldState.facts, null, 2));

  // Verificar eventos armazenados
  const recent = await agent.memory?.eventStore.getRecent(60);
  console.log(`\n📊 Eventos nas últimas 24h: ${recent?.length ?? 0}`);

  // Verificar perguntas pendentes
  if (agent.queryManager) {
    const pending = agent.queryManager.pendingCount;
    console.log(`❓ Perguntas pendentes: ${pending}`);
  }

  await agent.shutdown();
  console.log("\n✅ Teste concluído.");
}

main().catch((err) => {
  console.error("Teste falhou:", err);
  process.exit(1);
});
