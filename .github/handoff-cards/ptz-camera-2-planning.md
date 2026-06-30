# Planning Card — PTZ Camera Rotation

**Phase:** 2/5 — Planning
**Date:** 2026-06-29
**Status:** ✅ Complete

## Task Breakdown

### Task 1: Setup Express + Vitest

- **File:** `package.json` — add `express`, `@types/express`
- **File:** `vitest.config.ts` — criar config vitest
- **File:** `src/api/app.ts` — Express app com auto-discovery de rotas
- **File:** `src/api/server.ts` — delegar `/api/*` para Express app
- **Depends on:** nada
- **Estimated:** 15 min

### Task 2: OnvifConnector

- **File:** `src/perception/onvif-connector.ts` — NOVO
- **Interface:** `OnvifPTZ` com métodos PTZ (continuousMove, absoluteMove, gotoPreset, savePreset, listPresets, home, stopMove)
- **Implementação:** wrapper sobre `onvif@0.8.1`
- **File:** `src/perception/camera-connector.ts` — adicionar `case "onvif"` no factory
- **Depends on:** Task 1 (para tipos)
- **Estimated:** 45 min

### Task 3: CameraController

- **File:** `src/api/controllers/camera-controller.ts` — NOVO
- **Métodos:** continuousMove, stopMove, absoluteMove, gotoPreset, savePreset, listPresets, home
- **Padrão:** classe pura, recebe mapa de conectores no construtor
- **Depends on:** Task 2
- **Estimated:** 20 min

### Task 4: PTZ API Routes

- **File:** `src/api/routes/camera-ptz.route.ts` — NOVO
- **Endpoints:**
  - `POST /api/cameras/:id/ptz/move` (Zod: `{ pan, tilt, zoom }`)
  - `POST /api/cameras/:id/ptz/stop`
  - `POST /api/cameras/:id/ptz/absolute` (Zod: `{ pan, tilt, zoom }`)
  - `GET /api/cameras/:id/ptz/presets`
  - `POST /api/cameras/:id/ptz/preset/:token`
  - `POST /api/cameras/:id/ptz/preset` (Zod: `{ name }`)
  - `POST /api/cameras/:id/ptz/home`
- **Padrão:** Express Router + Zod `validate` middleware + controller wrapper
- **Depends on:** Task 3
- **Estimated:** 30 min

### Task 5: Testes

- **File:** `src/perception/__tests__/onvif-connector.test.ts` — NOVO
  - Mock da lib `onvif`, testar métodos PTZ com valores hardcoded
- **File:** `src/api/routes/__tests__/camera-ptz.route.test.ts` — NOVO
  - Mock `OnvifConnector`, testar cada endpoint com supertest
  - Inputs válidos e inválidos
  - Error cases (câmera offline, timeout)
- **Depends on:** Task 4
- **Estimated:** 30 min

### Task 6: Validação

- `npm run test` — todos passando
- `npm run typecheck` — sem erros
- Commit + push
- **Depends on:** Task 5
- **Estimated:** 10 min

## Ordem de execução

```mermaid
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
```

## Riscos

1. **ONVIF lib API**: A biblioteca `onvif@0.8.1` pode ter API diferente da esperada. Fallback: wrap com try/catch e mensagens claras.
2. **Express + server.ts existente**: Integração precisa ser não-invasiva. Solução: checar `url.pathname.startsWith("/api/")` no handler existente e delegar para Express.

## 🤖 Handoff Contract

**To:** Coder
**You receive:** Este planning card — 6 tasks sequenciais com arquivos, dependências e estimativas.
**You DO NOT receive:** Research card, codebase files, conversa com usuário.
**Your job:** Implementar Task 1 até Task 6 em ordem, commitando após cada task significativa.
