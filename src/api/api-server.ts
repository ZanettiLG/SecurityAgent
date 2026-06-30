/**
 * API Server — Express-based REST API for the Vigia backend.
 *
 * Creates an HTTP server that hosts the Express app with auto-discovered
 * routes. ONVIF PTZ connectors are injected via setPTZCameras() before
 * the server starts accepting requests.
 *
 * Runs on API_PORT (default 5175) alongside the dashboard server.
 */

import { createServer } from "node:http";
import type express from "express";
import { createApiApp } from "./app.js";
import { setPTZCameras } from "./routes/camera-ptz.route.js";
import { logger } from "../core/logger.js";
import type { OnvifPTZ } from "../perception/onvif-connector.js";

const API_PORT = parseInt(process.env.API_PORT ?? "5175", 10);

export async function createApiServer(
  ptzCameras: Map<string, OnvifPTZ>,
): Promise<void> {
  // Inject PTZ connectors into the route controller
  setPTZCameras(ptzCameras);

  // createApiApp auto-discovers and mounts all routes under src/api/routes/,
  // including camera-ptz.route.ts → /api/cameras. No manual mounting needed.
  const app = await createApiApp();

  // Global error handler (Express 4 style)
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      logger.error({ err }, "Unhandled API error");
      res.status(500).json({
        ok: false,
        error: { code: "INTERNAL_ERROR", message: err.message },
      });
    },
  );

  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(API_PORT, () => {
      logger.info(`API server listening on http://localhost:${API_PORT}`);
      resolve();
    });
  });
}
