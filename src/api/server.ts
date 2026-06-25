/**
 * Vigia Dashboard Server — HTTP + WebSocket API
 *
 * Servidor HTTP que serve o dashboard e expõe:
 * - GET  /health              — health check
 * - GET  /cameras/:id/snapshot — último JPEG da câmera
 * - GET  /api/events/recent    — eventos recentes (JSON)
 * - GET  /api/state            — world state atual
 * - WS   /ws                   — WebSocket espelhando EventBus
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "../core/logger.js";
import type { EventBus } from "../core/bus.js";

let PORT = parseInt(process.env.DASHBOARD_PORT ?? "5174", 10);

export async function createDashboardServer(bus: EventBus) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const actualPort = PORT;
    const url = new URL(req.url ?? "/", `http://localhost:${actualPort}`);

    // ── CORS ──
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // ── Health ──
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
      }

      // ── Camera snapshot ──
      else if (url.pathname.startsWith("/cameras/") && url.pathname.endsWith("/snapshot")) {
        const cameraId = url.pathname.split("/")[2]!;
        const framePath = `data/cam_${cameraId}.jpg`;

        if (existsSync(framePath)) {
          const data = readFileSync(framePath);
          res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "Cache-Control": "no-cache",
          });
          res.end(data);
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No snapshot available" }));
        }
      }

      // ── Camera status ──
      else if (url.pathname === "/api/cameras") {
        // Check which camera snapshot files exist and are recent
        const fs = await import("node:fs/promises");
        const cameras = [
          { id: "externa", name: "Intelbras iM7 — Externa" },
          { id: "interna", name: "Yoosee — Interna" },
        ];
        const result = await Promise.all(cameras.map(async (cam) => {
          const framePath = `data/cam_${cam.id}.jpg`;
          try {
            const stat = await fs.stat(framePath);
            const age = Date.now() - stat.mtimeMs;
            return { ...cam, online: age < 10000, lastFrame: stat.mtimeMs };
          } catch {
            return { ...cam, online: false, lastFrame: 0 };
          }
        }));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      }

      // ── Recent events ──
      else if (url.pathname === "/api/events/recent") {
        const minutes = parseInt(url.searchParams.get("minutes") ?? "60");
        const events = bus.getHistory("vision.event").slice(-50);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(events.map((e: { payload: unknown }) => e.payload)));
      }

      // ── World state ──
      else if (url.pathname === "/api/state") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          mode: "home",
          cameras_online: 1,
          threat_level: 0,
          time_of_day: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
        }));
      }

      // ── 404 ──
      else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } catch (err) {
      logger.error({ err }, "HTTP error");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal error" }));
    }
  });

  // ── WebSocket ──
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("Dashboard client connected via WebSocket");

    // Envia estado inicial
    ws.send(JSON.stringify({
      type: "connected",
      payload: { message: "Conectado ao Vigia" },
    }));

    // Espelha eventos do EventBus para o WebSocket
    const unsub = bus.subscribe("all", (_topic: string, payload: unknown) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "event", topic: _topic, payload }));
      }
    });

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        // Roteia resposta do chat para o EventBus → agent processa
        if (msg.type === "chat_response") {
          bus.publish("user.answer", {
            messageId: msg.messageId,
            answer: msg.answer,
            timestamp: msg.timestamp,
          });
          logger.info({ answer: msg.answer }, "User reply received via dashboard");
        }
      } catch {
        // Ignora mensagens mal formatadas
      }
    });

    ws.on("close", () => {
      unsub();
      logger.info("Dashboard client disconnected");
    });
  });

  // Tenta escutar na porta configurada, com fallback para portas seguintes
  const MAX_RETRIES = 10;

  await new Promise<void>((resolve, reject) => {
    function tryListen(port: number) {
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < PORT + MAX_RETRIES) {
          logger.warn(`Port ${port} is in use, trying ${port + 1}...`);
          tryListen(port + 1);
        } else {
          reject(err);
        }
      });

      server.listen(port, () => {
        PORT = port; // atualiza porta para o handler HTTP usar o valor correto
        logger.info(`Dashboard server listening on http://localhost:${port}`);
        resolve();
      });
    }

    tryListen(PORT);
  });

  return { server, port: PORT };
