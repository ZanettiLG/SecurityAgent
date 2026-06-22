# 02 — Vehicle Tracker (Port Python → TypeScript)

## Objetivo

Portar o `VehicleTracker` do protótipo Python para TypeScript, seguindo
as interfaces do sistema.

## Fonte

Prototipo Python em: (já removido, recriar da especificação abaixo)

## Arquivo a criar

```
src/processing/vehicle-tracker.ts
```

## Modelo de Dados

```typescript
export interface VehicleRecord {
  vehicleId: string;
  plate: string | null;
  makeModel: string | null;       // "Sedan branco"
  color: string | null;
  vehicleType: string | null;     // "sedan", "suv", "truck", "motorcycle"

  associatedPersonIds: string[];
  associatedPersonNames: string[];

  firstSeen: Date | null;
  lastSeen: Date | null;
  totalSightings: number;
  commonLocations: string[];      // cameraIds
  commonHours: number[];
  commonDays: number[];

  avgParkingDuration: number;     // segundos
  maxParkingDuration: number;

  category: "unknown" | "neighbor" | "delivery" | "service" | "family" | "suspicious";

  describe(): string;
}

export interface ParkingSession {
  sessionId: string;
  vehicleId: string | null;       // null até ser identificado
  cameraId: string;
  startTime: Date;
  lastSeen: Date;
  location: string;               // "frente à residência"
  identified: boolean;
}
```

## Classe Principal

```typescript
export class VehicleTracker {
  private vehicles = new Map<string, VehicleRecord>();
  private activeSessions = new Map<string, ParkingSession>();
  private durationBaselines = new Map<string, {
    typicalMedian: number;
    typicalMax: number;
    durations: number[];
  }>();

  constructor(
    private memory?: MemorySystem,
    private bus?: EventBus,
  ) {}

  // ── Processamento de frame ──

  async processFrame(cameraId: string): Promise<SecurityEvent[]>;
  // Simula detecção de veículo:
  // - 15% de chance de "detectar" um veículo a cada chamada
  // - Se detecta: cria ou atualiza ParkingSession
  // - Se duração > baseline.typicalMax E não identificado → evento VEHICLE_DETECTED
  // - Se duração > vehicle.avgParkingDuration * 3 (para veículo conhecido) → evento atípico
  // - Se veículo "saiu" (> 30s sem update) → registra fim

  // ── Identificação ──

  async identifyVehicle(sessionId: string, personName: string, personId?: string): Promise<void>;
  // Associa veículo a pessoa (via feedback do usuário)
  // Cria VehicleRecord se não existe
  // Atualiza KnowledgeGraph se disponível

  // ── Baselines ──

  private getBaseline(cameraId: string): { typicalMedian: number; typicalMax: number };
  // Retorna baseline de duração para a câmera.
  // Valores default antes de aprender: median=120s, max=300s

  private recordParkingEnd(session: ParkingSession, duration: number): void;
  // Registra fim de estacionamento e atualiza baselines
  // Média móvel para avgParkingDuration do veículo (alpha=0.1)
  // Mantém últimos 1000 samples de duração por câmera

  // ── Sessões ──

  private findOrCreateSession(cameraId: string): ParkingSession;
  // Uma sessão por câmera por vez (simplificado)
  // Em produção: tracking visual + re-ID

  private determineLocation(cameraId: string): string;
  // Mapeia cameraId → descrição legível
}
```

## Eventos Gerados

### Veículo não identificado parado muito tempo
```typescript
createEvent({
  eventType: EventType.VEHICLE_DETECTED,
  cameraId,
  severity: Severity.MEDIUM,
  description: `Veículo não identificado parado há ${mins} minutos`,
  payload: {
    vehicleClass: "car",
    confidence: 0.8,
    durationSeconds: duration,
    sessionId: session.sessionId,
    identified: false,
  },
})
```

### Veículo conhecido com duração atípica
```typescript
createEvent({
  eventType: EventType.VEHICLE_DETECTED,
  cameraId,
  severity: Severity.LOW,
  description: `Veículo de ${vehicle.describe()} estacionado há ${mins} min (duração atípica)`,
  payload: {
    vehicleId: session.vehicleId,
    durationSeconds: duration,
    typicalDuration: vehicle.avgParkingDuration,
    identified: true,
    speedReduction: true,
    observingResidence: false,
  },
})
```

## Comportamento "Vigia"

O método `processFrame` deve injetar no payload flags que o
`BehavioralPatternMatcher` usa:

- `speedReduction: true` — se a duração for > baseline
- `observingResidence: true` — se o veículo ficar parado > 5 min em local não associado
- `multiplePasses: true` — se a mesma sessão for reaberta 2+ vezes em 6h

## Verificação

```typescript
// Teste manual
const tracker = new VehicleTracker();
const events = await tracker.processFrame("front_door");
// Deve logar "Vehicle detected" ou retornar array vazio
```

## Dependências

- `src/core/types.ts` — `SecurityEvent`, `EventType`, `Severity`, `createEvent`
- `src/core/bus.ts` — `EventBus` (opcional)
- `src/memory/system.ts` — `MemorySystem` (opcional)
- `src/core/logger.ts` — `logger`

## Entregáveis

- [ ] `src/processing/vehicle-tracker.ts`
- [ ] `VehicleRecord` e `ParkingSession` interfaces exportadas
- [ ] `VehicleTracker` class com todos os métodos
- [ ] Simulação de detecção funcional (15% chance)
- [ ] Baselines de duração atualizadas corretamente
- [ ] Compila com `tsc --noEmit`
