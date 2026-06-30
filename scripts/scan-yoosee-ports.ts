import { spawn } from "child_process";

const user = "admin";
const pass = "cazape1248";
const ip = "192.168.3.65";

// Yoosee cameras often use non-standard ports
const ports = [554, 80, 8080, 8554, 1554, 3554, 9000];

// Common Yoosee/Tuya camera paths
const paths = [
  "/ch0_0.h264",
  "/live/ch00_0",
  "/stream1",
  "/0",
  "/1",
  "/video1",
  "/onvif/device_service",
  "/onvif/stream1",
  "/onvif1",
];

function testUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", [
      "-rtsp_transport", "tcp",
      "-timeout", "5000000",
      "-i", url,
      "-t", "1",
      "-f", "null",
      "-",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", () => {
      const hasStream = stderr.includes("Stream #") || stderr.includes("video:");
      const has401 = stderr.includes("401");
      const has400 = stderr.includes("400");
      const lastLines = stderr.split("\n").slice(-5).join(" ").trim();
      if (hasStream) {
        resolve({ ok: true, detail: "STREAM FOUND" });
      } else if (has401) {
        resolve({ ok: false, detail: "401 Unauthorized" });
      } else if (has400) {
        resolve({ ok: false, detail: "400 Bad Request" });
      } else {
        resolve({ ok: false, detail: lastLines.slice(0, 120) });
      }
    });
    proc.on("error", () => resolve({ ok: false, detail: "process error" }));
  });
}

(async () => {
  console.log(`\n🔍 Scanning Yoosee camera ${ip} - multiple ports & paths\n`);

  // First: scan ports to see which ones are open
  console.log("── Port scan ──");
  for (const port of ports) {
    const url = `rtsp://${user}:${pass}@${ip}:${port}/stream1`;
    const { ok, detail } = await testUrl(url);
    const status = ok ? "✅" : "❌";
    console.log(`  ${status} Port ${port}: ${detail}`);
    if (ok) {
      console.log(`\n🎉 Working: ${url}\n`);
      return;
    }
  }

  console.log("\n── Testing all paths on port 554 with no auth ──");
  for (const p of paths) {
    const url = `rtsp://${ip}:554${p}`;
    const { ok, detail } = await testUrl(url);
    console.log(`  ${ok ? "✅" : "❌"} ${url} → ${detail}`);
    if (ok) {
      console.log(`\n🎉 Working: ${url}\n`);
      return;
    }
  }

  console.log("\n── Testing all paths on port 554 with auth ──");
  for (const p of paths) {
    const url = `rtsp://${user}:${pass}@${ip}:554${p}`;
    const { ok, detail } = await testUrl(url);
    console.log(`  ${ok ? "✅" : "❌"} ${url} → ${detail}`);
    if (ok) {
      console.log(`\n🎉 Working: ${url}\n`);
      return;
    }
  }

  console.log("\n❌ No working RTSP URL found. Camera may need RTSP enabled via app/web interface.");
})();
