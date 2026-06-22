/**
 * Camera Discovery — Scan local network for RTSP cameras.
 *
 * Uso: npx tsx scripts/discover-cameras.ts
 *
 * Escaneia a sub-rede local em busca de câmeras RTSP.
 * Testa URLs comuns de fabricantes: Reolink, Hikvision, Intelbras, Dahua.
 */

import { createSocket } from "node:dgram";
import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

const COMMON_RTSP_PATHS: Record<string, string[]> = {
  Reolink: [
    "/h264Preview_01_main",
    "/h264Preview_01_sub",
    "/stream1",
    "/stream2",
  ],
  Hikvision: [
    "/Streaming/Channels/101",
    "/Streaming/Channels/102",
    "/h264/ch1/main/av_stream",
    "/h264/ch1/sub/av_stream",
  ],
  Intelbras: [
    "/cam/realmonitor?channel=1&subtype=0",
    "/cam/realmonitor?channel=1&subtype=1",
    "/stream1",
    "/onvif1",
  ],
  Dahua: [
    "/cam/realmonitor?channel=1&subtype=0",
    "/cam/realmonitor?channel=1&subtype=1",
    "/live/ch00_0",
    "/live/ch00_1",
  ],
  Genérico: [
    "/stream1",
    "/stream2",
    "/video1",
    "/video2",
    "/live",
    "/0",
    "/1",
  ],
};

const RTSP_PORT = 554;

function getLocalSubnet(): string | null {
  const interfaces = networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === "IPv4" && !info.internal) {
        const parts = info.address.split(".");
        parts[3] = "0";
        return `${parts.join(".")}/24`;
      }
    }
  }
  return null;
}

async function testRtspUrl(url: string, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", [
      "-rtsp_transport", "tcp",
      "-timeout", String(timeoutMs),
      "-i", url,
      "-t", "1",
      "-f", "null",
      "-",
    ], { stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      resolve(false);
    }, timeoutMs + 1000);

    proc.on("exit", (code) => {
      clearTimeout(timer);
      // ffmpeg exit code 0 ou 1 com "Stream #0:" indica que conseguiu conectar
      const connected = stderr.includes("Stream #0:") || stderr.includes("mjpeg");
      if (stderr.includes("401 Unauthorized")) {
        console.log(`  ⚠️  URL reachable but needs auth: ${url.replace(/:[^:@]+@/, ":****@")}`);
      }
      resolve(connected || code === 0);
    });

    proc.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function scanIp(ip: string, username = "admin", password = "admin"): Promise<void> {
  let found = false;

  for (const [brand, paths] of Object.entries(COMMON_RTSP_PATHS)) {
    if (found) break;
    for (const path of paths) {
      // Tenta sem auth primeiro
      const urlNoAuth = `rtsp://${ip}:${RTSP_PORT}${path}`;
      if (await testRtspUrl(urlNoAuth)) {
        console.log(`  ✅ [${brand}] ${urlNoAuth} (anonimo)`);
        found = true;
        break;
      }

      // Tenta com auth
      const urlAuth = `rtsp://${username}:${password}@${ip}:${RTSP_PORT}${path}`;
      if (await testRtspUrl(urlAuth)) {
        console.log(`  ✅ [${brand}] rtsp://${username}:****@${ip}:${RTSP_PORT}${path}`);
        found = true;
        break;
      }
    }
  }

  if (!found) {
    // Tenta ONVIF discovery na porta 80
    console.log(`  ❌ Nenhuma camera RTSP encontrada em ${ip}`);
  }
}

async function main(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════╗
║     Vigia — Camera Discovery            ║
║  Escaneando rede local por cameras RTSP ║
╚══════════════════════════════════════════╝
`);

  const subnet = getLocalSubnet();
  if (!subnet) {
    console.error("Nao foi possivel detectar a rede local.");
    process.exit(1);
  }

  console.log(`Rede local detectada: ${subnet}`);
  console.log("");

  // Pega IPs da linha de comando ou escaneia a sub-rede
  const targetIps = process.argv.slice(2);
  if (targetIps.length > 0) {
    console.log("Escaneando IPs especificos:\n");
    for (const ip of targetIps) {
      console.log(`  ${ip}:`);
      await scanIp(ip);
      console.log("");
    }
  } else {
    console.log("Escaneando toda a sub-rede (pode levar alguns minutos)...\n");
    console.log("Dica: para escanear IPs especificos, passe-os como argumento:");
    console.log("  npx tsx scripts/discover-cameras.ts 192.168.1.100 192.168.1.101\n");

    const prefix = subnet.split(".").slice(0, 3).join(".") + ".";
    for (let i = 1; i <= 254; i++) {
      const ip = `${prefix}${i}`;
      process.stdout.write(`  Escaneando ${ip}...\r`);
      await scanIp(ip, process.env.CAM_USER, process.env.CAM_PASS);
    }
  }

  console.log("\nScanner concluido.");
}

main().catch(console.error);
