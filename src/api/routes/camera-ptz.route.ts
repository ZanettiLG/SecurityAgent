/**
 * Camera PTZ API Routes — Pan-Tilt-Zoom control endpoints.
 *
 * Exposes ONVIF PTZ operations via REST-like API following
 * Audiobooker backend conventions (Zod validation, { ok, data } envelope).
 *
 * Route prefix: /api/cameras (set via app.ts auto-discovery)
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  CameraController,
  CameraNotFoundError,
  CameraNotConnectedError,
} from "../controllers/camera-controller.js";
import type { OnvifPTZ } from "../../perception/onvif-connector.js";
import { logger } from "../../core/logger.js";

// ── Zod Schemas ─────────────────────────────────────────────────

const moveSchema = z.object({
  pan: z.number().min(-1).max(1),
  tilt: z.number().min(-1).max(1),
  zoom: z.number().min(-1).max(1),
});

const absoluteSchema = z.object({
  pan: z.number().min(-1).max(1),
  tilt: z.number().min(-1).max(1),
  zoom: z.number().min(0).max(1),
});

const savePresetSchema = z.object({
  name: z.string().min(1, "Preset name is required").max(128),
});

// ── Error envelope helper ───────────────────────────────────────

function ok(data: unknown) {
  return { ok: true, data };
}

function sendError(
  res: Response,
  code: string,
  message: string,
  status: number = 400,
) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// ── Controller factory ──────────────────────────────────────────

let controller: CameraController | null = null;

export function setPTZCameras(ptzCameras: Map<string, OnvifPTZ>): void {
  controller = new CameraController(ptzCameras);
  logger.info(
    { count: ptzCameras.size },
    "PTZ cameras registered in controller",
  );
}

function ensureController(): CameraController {
  if (!controller) {
    throw new Error(
      "CameraController not initialized — call setPTZCameras() first",
    );
  }
  return controller;
}

// ── Router ──────────────────────────────────────────────────────

const router = Router();

/**
 * POST /api/cameras/:id/ptz/move
 * Body: { pan: number, tilt: number, zoom: number }
 */
router.post("/:id/ptz/move", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) throw new CameraNotFoundError("Camera ID required");
    const body = moveSchema.parse(req.body);
    const result = await ensureController().continuousMove(id, body);
    res.json(ok(result));
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/cameras/:id/ptz/stop
 */
router.post("/:id/ptz/stop", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) throw new CameraNotFoundError("Camera ID required");
    const result = await ensureController().stopMove(id);
    res.json(ok(result));
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/cameras/:id/ptz/absolute
 * Body: { pan: number, tilt: number, zoom: number }
 */
router.post("/:id/ptz/absolute", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) throw new CameraNotFoundError("Camera ID required");
    const body = absoluteSchema.parse(req.body);
    const result = await ensureController().absoluteMove(id, body);
    res.json(ok(result));
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/cameras/:id/ptz/presets
 */
router.get("/:id/ptz/presets", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) throw new CameraNotFoundError("Camera ID required");
    const presets = await ensureController().listPresets(id);
    res.json(ok(presets));
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/cameras/:id/ptz/preset/:token
 */
router.post("/:id/ptz/preset/:token", async (req: Request, res: Response) => {
  try {
    const { id, token } = req.params;
    if (!id || !token)
      throw new CameraNotFoundError("Camera ID and preset token required");
    const result = await ensureController().gotoPreset(id, token);
    res.json(ok(result));
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/cameras/:id/ptz/preset
 * Body: { name: string }
 */
router.post("/:id/ptz/preset", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) throw new CameraNotFoundError("Camera ID required");
    const body = savePresetSchema.parse(req.body);
    const result = await ensureController().savePreset(id, body.name);
    res.status(201).json(ok(result));
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/cameras/:id/ptz/home
 */
router.post("/:id/ptz/home", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) throw new CameraNotFoundError("Camera ID required");
    const result = await ensureController().goHome(id);
    res.json(ok(result));
  } catch (err) {
    handleError(res, err);
  }
});

// ── Error handler ───────────────────────────────────────────────

function handleError(res: Response, err: unknown): void {
  if (err instanceof z.ZodError) {
    sendError(
      res,
      "VALIDATION_ERROR",
      err.issues.map((i) => i.message).join("; "),
      422,
    );
    return;
  }
  if (err instanceof CameraNotFoundError) {
    sendError(res, "CAMERA_NOT_FOUND", err.message, 404);
    return;
  }
  if (err instanceof CameraNotConnectedError) {
    sendError(res, "CAMERA_NOT_CONNECTED", err.message, 503);
    return;
  }
  if (err instanceof Error) {
    logger.error({ err }, "PTZ route error");
    sendError(res, "INTERNAL_ERROR", err.message, 500);
    return;
  }
  sendError(res, "UNKNOWN_ERROR", "An unknown error occurred", 500);
}

/** Auto-discovery path prefix — override derivePrefix("camera-ptz.route.ts") */
export const path = "/api/cameras";

export default router;
