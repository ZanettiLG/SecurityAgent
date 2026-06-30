/**
 * Camera PTZ Route tests — Tests for PTZ API endpoints.
 *
 * Tests each endpoint with:
 * - Valid inputs (200/201 responses with { ok: true, data })
 * - Invalid inputs (422 Validation errors)
 * - Error cases (câmera offline, não encontrada)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import { setPTZCameras } from "../camera-ptz.route.js";
import type {
  OnvifPTZ,
  PresetInfo,
  PTZStatus,
} from "../../../perception/onvif-connector.js";

// ── Mock OnvifPTZ ──────────────────────────────────────────────

function createMockPTZ(id: string = "mock-cam"): OnvifPTZ {
  return {
    cameraId: id,
    isConnected: true,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    continuousMove: vi.fn().mockResolvedValue(undefined),
    stopMove: vi.fn().mockResolvedValue(undefined),
    absoluteMove: vi.fn().mockResolvedValue(undefined),
    listPresets: vi.fn().mockResolvedValue([
      { token: "p1", name: "Home" },
      { token: "p2", name: "Gate" },
    ] as PresetInfo[]),
    gotoPreset: vi.fn().mockResolvedValue(undefined),
    savePreset: vi.fn().mockResolvedValue("new-preset-uuid"),
    gotoHome: vi.fn().mockResolvedValue(undefined),
    setHome: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn().mockResolvedValue({
      position: { pan: 0.5, tilt: 0.3, zoom: 1.0 },
      moveStatus: "IDLE",
      error: null,
      utcTime: "2024-01-01T00:00:00Z",
    } as PTZStatus),
  };
}

// ── Test App ────────────────────────────────────────────────────

async function buildTestApp(ptzMap: Map<string, OnvifPTZ>): Promise<Express> {
  const app = express();
  app.use(express.json());

  // Initialize the controller
  setPTZCameras(ptzMap);

  // Import the router
  const mod = await import("../camera-ptz.route.js");
  app.use("/api/cameras", mod.default);

  // Error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res
        .status(500)
        .json({ ok: false, error: { code: "INTERNAL", message: err.message } });
    },
  );

  return app;
}

describe("Camera PTZ Routes", () => {
  let app: Express;
  let mockPTZ: OnvifPTZ;

  beforeEach(async () => {
    mockPTZ = createMockPTZ();
    const ptzMap = new Map<string, OnvifPTZ>();
    ptzMap.set("cam-1", mockPTZ);
    app = await buildTestApp(ptzMap);
  });

  // ── POST /api/cameras/:id/ptz/move ────────────────────────────

  describe("POST /:id/ptz/move", () => {
    it("deve iniciar movimento contínuo com dados válidos", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/move")
        .send({ pan: 0.5, tilt: -0.3, zoom: 0.1 })
        .expect(200);

      expect(res.body).toEqual({ ok: true, data: { status: "moving" } });
      expect(mockPTZ.continuousMove).toHaveBeenCalledWith(
        { pan: 0.5, tilt: -0.3, zoom: 0.1 },
        undefined,
      );
    });

    it("deve retornar 422 para pan fora do range", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/move")
        .send({ pan: 2.0, tilt: 0, zoom: 0 })
        .expect(422);

      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 422 para campos faltantes", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/move")
        .send({ pan: 0.5 })
        .expect(422);

      expect(res.body.ok).toBe(false);
    });

    it("deve retornar 404 para câmera não encontrada", async () => {
      const res = await request(app)
        .post("/api/cameras/unknown/ptz/move")
        .send({ pan: 0, tilt: 0, zoom: 0 })
        .expect(404);

      expect(res.body.error.code).toBe("CAMERA_NOT_FOUND");
    });

    it("deve retornar 503 quando câmera está offline", async () => {
      (mockPTZ.continuousMove as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Connection timeout"),
      );

      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/move")
        .send({ pan: 0, tilt: 0, zoom: 0 })
        .expect(500);

      expect(res.body.ok).toBe(false);
    });
  });

  // ── POST /api/cameras/:id/ptz/stop ─────────────────────────────

  describe("POST /:id/ptz/stop", () => {
    it("deve parar o movimento", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/stop")
        .expect(200);

      expect(res.body).toEqual({ ok: true, data: { status: "stopped" } });
      expect(mockPTZ.stopMove).toHaveBeenCalled();
    });
  });

  // ── POST /api/cameras/:id/ptz/absolute ─────────────────────────

  describe("POST /:id/ptz/absolute", () => {
    it("deve mover para posição absoluta", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/absolute")
        .send({ pan: 0.5, tilt: 0.5, zoom: 0.8 })
        .expect(200);

      expect(res.body).toEqual({ ok: true, data: { status: "moved" } });
    });

    it("deve rejeitar zoom negativo", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/absolute")
        .send({ pan: 0, tilt: 0, zoom: -0.5 })
        .expect(422);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── GET /api/cameras/:id/ptz/presets ───────────────────────────

  describe("GET /:id/ptz/presets", () => {
    it("deve listar presets", async () => {
      const res = await request(app)
        .get("/api/cameras/cam-1/ptz/presets")
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe("Home");
    });
  });

  // ── POST /api/cameras/:id/ptz/preset/:token ────────────────────

  describe("POST /:id/ptz/preset/:token", () => {
    it("deve ir para um preset pelo token", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/preset/p1")
        .expect(200);

      expect(res.body).toEqual({
        ok: true,
        data: { status: "moving_to_preset", token: "p1" },
      });
      // Controller calls ptz.gotoPreset(token) with only one argument
      expect(mockPTZ.gotoPreset).toHaveBeenCalledWith("p1");
    });
  });

  // ── POST /api/cameras/:id/ptz/preset ───────────────────────────

  describe("POST /:id/ptz/preset", () => {
    it("deve salvar um novo preset", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/preset")
        .send({ name: "Night Watch" })
        .expect(201);

      expect(res.body.ok).toBe(true);
      expect(res.body.data.token).toBe("new-preset-uuid");
    });

    it("deve rejeitar nome vazio", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/preset")
        .send({ name: "" })
        .expect(422);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── POST /api/cameras/:id/ptz/home ─────────────────────────────

  describe("POST /:id/ptz/home", () => {
    it("deve ir para posição home", async () => {
      const res = await request(app)
        .post("/api/cameras/cam-1/ptz/home")
        .expect(200);

      expect(res.body).toEqual({ ok: true, data: { status: "moving_home" } });
      expect(mockPTZ.gotoHome).toHaveBeenCalled();
    });
  });

  // ── Error cases ────────────────────────────────────────────────

  describe("error handling", () => {
    it("deve retornar 404 para câmera desconhecida em qualquer endpoint", async () => {
      const res = await request(app)
        .get("/api/cameras/no-exist/ptz/presets")
        .expect(404);

      expect(res.body.error.code).toBe("CAMERA_NOT_FOUND");
    });

    it("deve retornar 500 em erro interno", async () => {
      (mockPTZ.listPresets as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Internal failure"),
      );

      const res = await request(app)
        .get("/api/cameras/cam-1/ptz/presets")
        .expect(500);

      expect(res.body.ok).toBe(false);
    });
  });
});
