# Research Card — PTZ Camera Rotation

**Phase:** 1/5 — Research
**Date:** 2026-06-29
**Status:** ✅ Complete

## Codebase Map

### Arquivos relevantes

| Arquivo                              | Papel                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/perception/camera-connector.ts` | Interface `CameraConnector` + factory `createCameraConnector()`. Suporta `rtsp`, `usb`. Precisa adicionar `onvif`. |
| `src/perception/rtsp-connector.ts`   | Implementação RTSP via ffmpeg subprocess. Referência para novo conector.                                           |
| `src/perception/mock-connector.ts`   | Implementação mock para dev/testing.                                                                               |
| `src/core/config.ts`                 | Schema Zod do `CameraConfig`. Tipo `onvif` já existe no enum `z.enum(["rtsp", "onvif", "usb"])`.                   |
| `src/api/server.ts`                  | Servidor HTTP raw (Node.js). Sem Express. Rotas inline no handler.                                                 |
| `src/core/agent.ts`                  | Entry point. Importa `createDashboardServer` de `../api/server.js`. Inicia câmeras via `createCameraConnector()`.  |
| `config/settings.yaml`               | Config de câmeras: externa (Intelbras) + interna (Yoosee).                                                         |
| `package.json`                       | Dependências: `onvif@0.8.1`, `zod@3.23`, `vitest@2.0`. **Sem Express.**                                            |
| `tsconfig.json`                      | `moduleResolution: "bundler"` — não exige `.js` nos imports, mas convenção manda usar.                             |

### Padrões existentes

- **Factory pattern**: `createCameraConnector(config)` com switch por `config.type`
- **CameraConnector interface**: `connect()`, `disconnect()`, `getFrame()`, `stream()`, `isConnected`
- **Logger**: `import { logger } from "../core/logger.js"` (pino)
- **Config types**: `CameraConfig` do Zod schema com `id`, `name`, `type`, `source`, `enabled`, `username`, `password`, `transport`

## Gaps identificados

1. **Sem Express**: O projeto usa HTTP raw. Backend conventions esperam Express + Router + auto-discovery. Será necessário instalar Express e criar `src/api/app.ts`.
2. **Sem testes**: Nenhum arquivo de teste existe. Criar `vitest.config.ts` e estrutura `__tests__/`.
3. **Interface `CameraConnector` não tem PTZ**: A interface atual só tem captura de frame. ONVIF connector precisa de métodos PTZ adicionais OU uma interface separada.
4. **Sem controllers**: O projeto não tem padrão de controllers. Criar `src/api/controllers/`.

## Decisões de arquitetura

1. **Express API separada**: Criar `src/api/app.ts` com Express + auto-discovery de rotas. Integrar ao `server.ts` existente com delegação mínima (1 linha).
2. **Interface `OnvifPTZ` separada**: Estender `CameraConnector` com uma nova interface `OnvifPTZ` para métodos PTZ, mantendo compatibilidade.
3. **Controller pattern**: Criar `CameraController` como classe pura (sem dependência HTTP), injetável nas rotas.
4. **Zod validation**: Seguir padrão do `backend.instructions.md` — schema no topo, `validate()` middleware.
5. **Estrutura de testes**: `__tests__/` espelhando `src/`, mocks com `vi.mock()`, descrições em português.

## Dependências a instalar

- `express` + `@types/express`

## 🤖 Handoff Contract

**To:** Planner
**You receive:** Este research card completo — codebase map, gaps, decisões de arquitetura.
**You DO NOT receive:** Raw codebase files, logs de exploração, conversa com usuário.
**Your job:** Decompor a feature em tasks sequenciais no Planning Card.
