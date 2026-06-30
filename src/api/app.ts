/**
 * Express API App — Route auto-discovery for the Vigia backend.
 *
 * Scans `src/api/routes/` for `*.route.ts` files and mounts them
 * under `/api`. Each route file must export a `{ path, router }` or
 * default export an Express Router. The router's own path prefix is
 * derived from the filename (e.g., `camera-ptz.route.ts` → `/api/cameras`).
 *
 * Integrated into the dashboard server via `createDashboardServer`.
 */

import express, { type Express } from "express";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../core/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface RouteModule {
  path?: string;
  router?: express.Router;
  default?: express.Router;
}

export async function createApiApp(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(express.json());

  // Auto-discover route files
  const routesDir = join(__dirname, "routes");
  let routeFiles: string[] = [];
  try {
    routeFiles = readdirSync(routesDir).filter(
      (f) => f.endsWith(".route.ts") || f.endsWith(".route.js"),
    );
  } catch {
    logger.warn("No routes directory found — skipping auto-discovery");
    return app;
  }

  // Auto-discover and mount route files (all mounted before server starts)
  const routeModules = await Promise.all(
    routeFiles.map(async (file) => {
      const routePath = join(routesDir, file);
      try {
        const mod: RouteModule = await import(routePath);
        const prefix = mod.path ?? derivePrefix(file);
        const handler = mod.router ?? mod.default;
        if (handler) {
          app.use(prefix, handler);
          logger.info({ prefix, file }, "Route mounted");
        } else {
          logger.warn({ file }, "Route file has no exported router");
        }
        return { file, prefix, ok: true };
      } catch (err) {
        logger.error({ err, file }, "Failed to mount route");
        return { file, ok: false, err };
      }
    }),
  );

  const failures = routeModules.filter((r) => !r.ok);
  if (failures.length > 0) {
    logger.warn(
      { count: failures.length, files: failures.map((f) => f.file) },
      "Some routes failed to mount",
    );
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, data: { status: "api_ok" } });
  });

  // 404 handler for API routes
  app.use("/api", (_req, res) => {
    res.status(404).json({
      ok: false,
      error: { code: "NOT_FOUND", message: "API endpoint not found" },
    });
  });

  // Global error handler
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

  return app;
}

function derivePrefix(filename: string): string {
  // camera-ptz.route.ts → /api/cameras
  // camera-config.route.ts → /api/cameras
  const base = filename.replace(/\.route\.(ts|js)$/, "");
  const resource = base.split("-")[0];
  if (!resource) {
    logger.warn({ filename }, "Could not derive route prefix, using fallback");
    return "/api";
  }
  return `/api/${resource}`;
}
