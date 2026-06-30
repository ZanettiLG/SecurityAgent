/**
 * OnvifConnector tests — Mock-based tests for ONVIF PTZ connector.
 *
 * Uses vi.mock() to mock the `onvif` library, testing all PTZ methods
 * without requiring a real camera.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to ensure mock helpers are available before vi.mock runs
// (vi.mock is hoisted to the top of the file, so variables must be defined
//  before it executes).
const { mockCamMethods, MockCam } = vi.hoisted(() => {
  const mockCamMethods = {
    connect: vi.fn(),
    continuousMove: vi.fn(),
    stop: vi.fn(),
    absoluteMove: vi.fn(),
    getPresets: vi.fn(),
    gotoPreset: vi.fn(),
    setPreset: vi.fn(),
    gotoHomePosition: vi.fn(),
    setHomePosition: vi.fn(),
    getStatus: vi.fn(),
    // Used by OnvifConnector.connect() for manual initialization
    getCapabilities: vi.fn(),
    getProfiles: vi.fn(),
    // Internal — monkey-patched for Basic auth injection
    _requestPart2: vi.fn(),
  };

  const MockCam = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
  ) {
    Object.assign(this, mockCamMethods);
    this.connect = mockCamMethods.connect;
  });

  return { mockCamMethods, MockCam };
});

vi.mock("onvif", () => ({
  default: {
    Cam: MockCam,
    Discovery: vi.fn(),
  },
}));

// We import after the mock
import { OnvifConnector } from "../onvif-connector.js";
import type { CameraConfig } from "../../core/config.js";

function createConfig(overrides: Partial<CameraConfig> = {}): CameraConfig {
  return {
    id: "test-cam",
    name: "Test PTZ Camera",
    type: "onvif",
    source: "192.168.1.100:80",
    enabled: true,
    username: "admin",
    password: "test123",
    transport: "tcp",
    zones: [],
    processing: {
      faceDetection: true,
      objectDetection: true,
      motionDetection: true,
      frameSkip: 3,
    },
    ...overrides,
  } as CameraConfig;
}

describe("OnvifConnector", () => {
  let connector: OnvifConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCamMethods.connect.mockImplementation((cb: (err: null) => void) =>
      cb(null),
    );
    // Mock manual ONVIF init: getCapabilities → getProfiles
    mockCamMethods.getCapabilities.mockImplementation(
      (cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.getProfiles.mockImplementation((cb: (err: null) => void) =>
      cb(null),
    );
    mockCamMethods.continuousMove.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.stop.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.absoluteMove.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.getPresets.mockImplementation(
      (
        _opts: unknown,
        cb: (err: null, presets: Record<string, unknown>) => void,
      ) =>
        cb(null, {
          "1": { $: { token: "preset1" }, Name: ["Home"] },
          "2": { $: { token: "preset2" }, Name: ["Gate"] },
        }),
    );
    mockCamMethods.gotoPreset.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.setPreset.mockImplementation(
      (
        _opts: unknown,
        cb: (err: null, result: Record<string, unknown>) => void,
      ) => cb(null, { presetToken: "new-preset-1" }),
    );
    mockCamMethods.gotoHomePosition.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.setHomePosition.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    mockCamMethods.getStatus.mockImplementation(
      (
        _opts: unknown,
        cb: (err: null, status: Record<string, unknown>) => void,
      ) =>
        cb(null, {
          position: { x: 0.5, y: 0.3, zoom: 1.0 },
          moveStatus: "IDLE",
          error: null,
          utcTime: "2024-01-01T00:00:00Z",
        }),
    );

    connector = new OnvifConnector(createConfig());
  });

  describe("connect", () => {
    it("deve conectar à câmera ONVIF com sucesso", async () => {
      await connector.connect();
      expect(connector.isConnected).toBe(true);
      expect(MockCam).toHaveBeenCalledTimes(1);
    });

    it("deve rejeitar quando a conexão falha", async () => {
      mockCamMethods.getCapabilities.mockImplementation(
        (cb: (err: Error) => void) => cb(new Error("Connection refused")),
      );
      await expect(connector.connect()).rejects.toThrow("Connection refused");
      expect(connector.isConnected).toBe(false);
    });
  });

  describe("disconnect", () => {
    it("deve desconectar da câmera", async () => {
      await connector.connect();
      await connector.disconnect();
      expect(connector.isConnected).toBe(false);
    });
  });

  describe("continuousMove", () => {
    it("deve iniciar movimento contínuo com velocidades corretas", async () => {
      await connector.connect();
      await connector.continuousMove({ pan: 0.5, tilt: -0.3, zoom: 0.1 });
      expect(mockCamMethods.continuousMove).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0.5, y: -0.3, zoom: 0.1 }),
        expect.any(Function),
      );
    });

    it("deve lançar erro quando não está conectado", async () => {
      await expect(
        connector.continuousMove({ pan: 1, tilt: 0, zoom: 0 }),
      ).rejects.toThrow("not connected");
    });
  });

  describe("stopMove", () => {
    it("deve parar o movimento", async () => {
      await connector.connect();
      await connector.stopMove();
      expect(mockCamMethods.stop).toHaveBeenCalledWith(
        expect.objectContaining({ panTilt: true, zoom: true }),
        expect.any(Function),
      );
    });
  });

  describe("absoluteMove", () => {
    it("deve mover para posição absoluta", async () => {
      await connector.connect();
      await connector.absoluteMove({ pan: 0.5, tilt: 0.5, zoom: 0.8 });
      expect(mockCamMethods.absoluteMove).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0.5, y: 0.5, zoom: 0.8 }),
        expect.any(Function),
      );
    });
  });

  describe("presets", () => {
    it("deve listar presets", async () => {
      await connector.connect();
      const presets = await connector.listPresets();
      expect(presets).toHaveLength(2);
      expect(presets[0]?.name).toBe("Home");
      expect(presets[1]?.token).toBe("preset2");
    });

    it("deve ir para um preset", async () => {
      await connector.connect();
      await connector.gotoPreset("preset1");
      expect(mockCamMethods.gotoPreset).toHaveBeenCalledWith(
        expect.objectContaining({ preset: "preset1" }),
        expect.any(Function),
      );
    });

    it("deve salvar um novo preset", async () => {
      await connector.connect();
      const token = await connector.savePreset("Night Watch");
      expect(token).toBe("new-preset-1");
      expect(mockCamMethods.setPreset).toHaveBeenCalledWith(
        expect.objectContaining({ presetName: "Night Watch" }),
        expect.any(Function),
      );
    });
  });

  describe("home", () => {
    it("deve ir para posição home", async () => {
      await connector.connect();
      await connector.gotoHome();
      expect(mockCamMethods.gotoHomePosition).toHaveBeenCalled();
    });

    it("deve definir posição home", async () => {
      await connector.connect();
      await connector.setHome();
      expect(mockCamMethods.setHomePosition).toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("deve retornar o status PTZ", async () => {
      await connector.connect();
      const status = await connector.getStatus();
      expect(status.position).toEqual({ x: 0.5, y: 0.3, zoom: 1.0 });
      expect(status.moveStatus).toBe("IDLE");
    });
  });

  describe("parseSource", () => {
    it("deve parsear URL HTTP corretamente", async () => {
      // Test via constructor
      const cfg = createConfig({
        source: "http://10.0.0.1:8080/onvif/device_service",
      });
      const c = new OnvifConnector(cfg);
      expect((c as unknown as Record<string, unknown>).hostname).toBe(
        "10.0.0.1",
      );
      expect((c as unknown as Record<string, unknown>).port).toBe(8080);
    });
  });
});
