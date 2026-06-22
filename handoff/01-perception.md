# 01 — Perception Layer: Conectores de Câmera + Vision Pipeline

## Objetivo

Fazer o sistema **receber eventos reais** de câmeras. Sem isso, o Vigia é
um cérebro sem sentidos.

## Escopo

Criar 3 arquivos:

```
src/perception/
├── camera-connector.ts    # Interface abstrata + fábrica
├── rtsp-connector.ts      # Conector RTSP via ffmpeg
└── mock-connector.ts      # Conector simulado para dev/testes
```

E expandir 1 arquivo:

```
src/processing/
└── vision-pipeline.ts     # Pipeline básico: motion detect → evento
```

## Tarefa 1.1: `src/perception/camera-connector.ts`

### Interface

```typescript
export interface CameraFrame {
  cameraId: string;
  timestamp: Date;
  data: Buffer;          // JPEG encoded frame
  width: number;
  height: number;
}

export interface CameraConnector {
  readonly cameraId: string;
  readonly source: string;
  readonly enabled: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getFrame(): Promise<CameraFrame | null>;
  stream(): AsyncGenerator<CameraFrame>;
  readonly isConnected: boolean;
}
```

### Fábrica

```typescript
export function createCameraConnector(config: CameraConfig): CameraConnector {
  switch (config.type) {
    case "rtsp": return new RtspConnector(config);
    case "usb":  return new MockConnector(config); // fallback
    default:     return new MockConnector(config);
  }
}
```

- Importa `CameraConfig` de `../../core/config.js`
- Loga conexão/desconexão via `logger`

## Tarefa 1.2: `src/perception/mock-connector.ts`

### Requisitos

- Gera frames sintéticos (ruído colorido ou imagem preta)
- Configurável: `fps` (default 5), `width` (640), `height` (480)
- `stream()` é um `AsyncGenerator` que yield a cada `1000/fps` ms
- Simula desconexão aleatória (5% de chance a cada frame) para testar resiliência

```typescript
export class MockConnector implements CameraConnector {
  // ...
  async *stream(): AsyncGenerator<CameraFrame> {
    while (this._connected) {
      await sleep(1000 / this.fps);
      if (Math.random() < 0.05) throw new Error("Simulated disconnect");
      yield {
        cameraId: this.cameraId,
        timestamp: new Date(),
        data: Buffer.alloc(this.width * this.height * 3), // preto
        width: this.width,
        height: this.height,
      };
    }
  }
}
```

## Tarefa 1.3: `src/perception/rtsp-connector.ts`

### Requisitos

- Usa `child_process.spawn` para rodar `ffmpeg` como subprocesso
- Comando: `ffmpeg -rtsp_transport tcp -i <source> -f image2pipe -vcodec mjpeg -q:v 2 -r <fps> -`
- Lê stdout como stream de JPEGs delimitados por boundary `--ffmpeg_boundary`
- `stream()` encapsula o parsing de frames do stdout
- Se ffmpeg morrer, tenta reconectar após 5s (até 3 tentativas)
- Loga cada frame com `logger.debug` (para não floodar)

### Tratamento de erro

```typescript
async *stream(): AsyncGenerator<CameraFrame> {
  let retries = 0;
  while (retries < this.maxRetries) {
    try {
      yield* this._streamInternal();
      retries = 0; // reset on clean exit
    } catch (err) {
      retries++;
      logger.warn({ err, retries }, "RTSP stream error, reconnecting...");
      await sleep(5000);
    }
  }
}
```

## Tarefa 1.4: `src/processing/vision-pipeline.ts`

### Requisitos

Pipeline simplificado que processa frames e gera eventos:

```typescript
export class VisionPipeline {
  constructor(
    private bus: EventBus,
    private memory?: MemorySystem,
  ) {}

  async process(frame: CameraFrame): Promise<SecurityEvent | null> {
    // Skip frames (processar 1 a cada N)
    // 1. Motion detection (simulada: 30% de chance de "movimento")
    // 2. Se movimento → criar evento MOTION_DETECTED
    // 3. Publicar no bus: "vision.event"
    // Retorna o evento ou null
  }
}
```

### Evento gerado (exemplo)

```typescript
createEvent({
  eventType: EventType.MOTION_DETECTED,
  cameraId: frame.cameraId,
  severity: Severity.INFO,
  description: `Movimento detectado na câmera ${frame.cameraId}`,
  payload: {
    frameTimestamp: frame.timestamp.toISOString(),
    confidence: 0.8,
  },
})
```

### Frame skip

```typescript
private frameCounts = new Map<string, number>();
private frameSkip = 3;

async process(frame: CameraFrame): Promise<SecurityEvent | null> {
  const count = (this.frameCounts.get(frame.cameraId) ?? 0) + 1;
  this.frameCounts.set(frame.cameraId, count);
  if (count % this.frameSkip !== 0) return null;
  // ... process
}
```

## Verificação

```bash
npx tsx -e "
import { MockConnector } from './src/perception/mock-connector.js';
const cam = new MockConnector({ id: 'test', source: 'mock', fps: 2 });
await cam.connect();
for await (const frame of cam.stream()) {
  console.log('Frame:', frame.timestamp.toISOString());
  break;
}
await cam.disconnect();
"
```

## Dependências

- `src/core/types.ts` — `SecurityEvent`, `EventType`, `Severity`, `createEvent`
- `src/core/bus.ts` — `EventBus`
- `src/core/config.ts` — `CameraConfig`
- `src/core/logger.ts` — `logger`
- `src/memory/system.ts` — `MemorySystem` (opcional, pode ser null)

## Entregáveis

- [ ] `src/perception/camera-connector.ts`
- [ ] `src/perception/mock-connector.ts`
- [ ] `src/perception/rtsp-connector.ts`
- [ ] `src/processing/vision-pipeline.ts`
- [ ] Todos compilam com `tsc --noEmit`
- [ ] Mock connector testável standalone
