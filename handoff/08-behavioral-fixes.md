# 08 — Behavioral Fixes: actorLevel + Camada 2

## Objetivo

Corrigir duas inconsistências detectadas na análise:

1. **`BehaviorMatch.actorLevel`**: O tipo existe (1|2|3) mas o matching
   sempre chama com `1`. O código precisa diferenciar Nível 2 (reincidência:
   mesmo ator) de Nível 3 (cross-ator: mesmo padrão, ator diferente).

2. **Camada 2 (categoria)**: A estrutura existe no `RoutineLearner`
   mas não há lógica para categorizar atores automaticamente.

## Arquivos a modificar

```
src/reasoning/behavioral_pattern.ts  # Corrigir actorLevel
src/memory/routine_learner.ts         # Adicionar categorização automática
```

---

## Tarefa 8.1: Corrigir `actorLevel` no BehavioralPatternMatcher

### Problema

Em `matchStreaming()`, a chamada é:

```typescript
const match = this.matchAgainstSignature(this.eventBuffer, sig, 1); // sempre 1!
```

### Solução

Antes de chamar `matchAgainstSignature`, determinar o nível real:

```typescript
matchStreaming(event: SecurityEvent): BehaviorMatch | null {
  this.eventBuffer.push(event);
  this.pruneBuffer();

  for (const sig of this.signatures.values()) {
    // Determina o actorLevel para esta assinatura
    const actorLevel = this.determineActorLevel(event, sig);

    const match = this.matchAgainstSignature(this.eventBuffer, sig, actorLevel);

    // Ajusta threshold conforme o nível
    const effectiveThreshold = actorLevel === 3
      ? sig.minConfidence * 0.7    // Mais leniente: peso da identidade
      : actorLevel === 2
        ? sig.minConfidence * 0.85
        : sig.minConfidence;       // Padrão

    if (match && match.overallScore() >= effectiveThreshold) {
      // ...
    }
  }
  return null;
}
```

### Novo método: `determineActorLevel`

```typescript
private determineActorLevel(
  event: SecurityEvent,
  sig: BehavioralSignature,
): 1 | 2 | 3 {
  // Nível 3: Mesmo ator específico
  // Verifica se o vehicleId/personId do evento bate com
  // o learnedFromIncidentId da assinatura (ou veículo/pessoa
  // associados ao incidente)
  const eventVehicleId = event.payload.vehicleId as string | undefined;
  const eventPersonIds = event.personsInvolved;

  if (sig.learnedFromIncidentId) {
    // TODO: verificar se o ator do evento é o mesmo do incidente
    // Por enquanto: verifica se vehicleId aparece em eventos do incidente
    if (eventVehicleId && this.isActorFromIncident(eventVehicleId, sig)) {
      return 3;
    }
    for (const pid of eventPersonIds) {
      if (this.isActorFromIncident(pid, sig)) {
        return 3;
      }
    }
  }

  // Nível 2: Mesma categoria
  // Verifica se o ator pertence à mesma categoria da assinatura
  const eventCategory = event.payload.actorCategory as string | undefined;
  if (eventCategory && sig.category === "pre_invasion_reconnaissance") {
    // Se o veículo já foi visto antes em contexto suspeito → nível 2
    if (event.payload.suspicious === true) return 2;
  }

  // Nível 1: Universal (default)
  return 1;
}

private isActorFromIncident(actorId: string, sig: BehavioralSignature): boolean {
  // Simplificado: verifica se o actorId aparece nos metadados
  // Em produção: consultar EventStore para eventos do incidente
  return false; // TODO: integrar com EventStore
}
```

### Ajuste no `evidenceSummary`

O resumo deve refletir o nível:

```typescript
private generateEvidenceSummary(...): string {
  const actorLabel = actorLevel === 3
    ? " (MESMO ator do incidente anterior — REINCIDÊNCIA)"
    : actorLevel === 2
      ? " (ator de mesma categoria suspeita)"
      : "";

  return [
    `Comportamento compatível com '${sig.name}'${actorLabel}.`,
    `Nível de match: ${actorLevel}/3.`,
    `Similaridade: ${pct}%.`,
  ].join("\n");
}
```

---

## Tarefa 8.2: Categorização Automática (Camada 2)

### Problema

O `RoutineLearner` cria perfis `category:X` mas nunca popula a categoria
de um ator automaticamente.

### Solução

Adicionar método `categorizeActor` no `RoutineLearner`:

```typescript
/**
 * Categoriza um ator baseado em seu comportamento observado.
 *
 * Heurísticas:
 * - Muitas visitas curtas (< 5min) em horário comercial → "entregador"
 * - Visitas longas (> 30min) em qualquer horário → "visitante"
 * - Visitas diárias longas → "vizinho"
 * - Visitas noturnas frequentes → "suspicious"
 */
categorizeActor(
  personId?: string,
  vehicleId?: string,
): string | null {
  const entityId = personId
    ? `person:${personId}`
    : vehicleId
      ? `vehicle:${vehicleId}`
      : null;

  if (!entityId) return null;

  const profile = this.profiles.get(entityId);
  if (!profile || profile.totalObservations < 5) return null;

  // Heurísticas simples
  const avgDuration = profile.totalObservations > 0
    ? /* precisaria de duration tracking */ 0
    : 0;

  const nightActivity = profile.hourlyActivity
    .slice(22).concat(profile.hourlyActivity.slice(0, 5))
    .reduce((a, b) => a + b, 0);

  const businessActivity = profile.hourlyActivity
    .slice(8, 18)
    .reduce((a, b) => a + b, 0);

  if (nightActivity > businessActivity * 2) {
    return "suspicious";
  }
  if (businessActivity > 0.5 && profile.totalObservations > 20) {
    return "frequent_visitor";
  }
  if (profile.totalObservations > 50) {
    return "neighbor";
  }

  return "visitor";
}
```

### Integração no `observe()`

Após atualizar o perfil, se o ator atingir `minObservations`,
categorizar e armazenar no payload para uso futuro:

```typescript
observe(event: SecurityEvent): void {
  // ... existing profile updates ...

  // Após atualizar, tenta categorizar
  for (const pid of event.personsInvolved) {
    const category = this.categorizeActor(pid);
    if (category && !event.payload.actorCategory) {
      event.payload.actorCategory = category;
    }
  }

  const vehicleId = event.payload.vehicleId as string | undefined;
  if (vehicleId) {
    const category = this.categorizeActor(undefined, vehicleId);
    if (category && !event.payload.actorCategory) {
      event.payload.actorCategory = category;
    }
  }
}
```

E criar perfil de categoria:

```typescript
// Se a categoria foi determinada, atualiza perfil de categoria
if (event.payload.actorCategory) {
  this.updateProfile(
    `category:${event.payload.actorCategory}`,
    "category",
    hour,
    day,
    event,
  );
}
```

---

## Verificação

```typescript
// Teste 8.1
const matcher = new BehavioralPatternMatcher();
const sig = createDefaultSignatures()[0]!;
matcher.registerSignature(sig);

// Simula evento do mesmo veículo do incidente
const event = createEvent({
  eventType: EventType.VEHICLE_DETECTED,
  payload: { vehicleId: "car_do_roubo", speedReduction: true },
});
const match = matcher.matchStreaming(event);
console.log("actorLevel:", match?.actorLevel); // Deve ser 1 até integrar com EventStore

// Teste 8.2
const learner = new RoutineLearner();
// Simula 20 observações de um entregador
for (let i = 0; i < 20; i++) {
  const e = createEvent({
    eventType: EventType.PERSON_DETECTED,
    personsInvolved: ["entregador_1"],
    payload: { durationSeconds: 120 },
    timestamp: new Date(2026, 5, 1, 10 + Math.floor(i / 4), 0),
  });
  learner.observe(e);
}
const cat = learner.categorizeActor("entregador_1");
console.log("Category:", cat); // Deve ser algo como "frequent_visitor"
```

## Dependências

- `src/reasoning/behavioral_pattern.ts`
- `src/memory/routine_learner.ts`
- `src/core/types.ts`

## Entregáveis

- [ ] `determineActorLevel()` implementado no `BehavioralPatternMatcher`
- [ ] `matchStreaming()` usa `actorLevel` real (não hardcoded 1)
- [ ] Threshold ajustado por nível
- [ ] `evidenceSummary` reflete o nível
- [ ] `categorizeActor()` no `RoutineLearner`
- [ ] `observe()` atualiza `payload.actorCategory`
- [ ] Perfis de categoria (`category:X`) populados automaticamente
- [ ] Compila com `tsc --noEmit`
