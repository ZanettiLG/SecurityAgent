/**
 * Post-NVR probe — Test if activating NVR on the Yoosee camera
 * enabled ONVIF HTTP services or changed RTSP behavior.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const onvif = require("onvif");

const IP = "192.168.3.65";
const USER = "admin";
const PASS = "cazape1248";

const SOAP = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:tdevice="http://www.onvif.org/ver10/device/wsdl">
  <soap:Header/>
  <soap:Body>
    <tdevice:GetSystemDateAndTime/>
  </soap:Body>
</soap:Envelope>`;

function httpPost(ip: string, port: number, path: string, body: string, timeoutMs = 4000): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${USER}:${PASS}`).toString("base64");
    const req = http.request(
      { hostname: ip, port, path, method: "POST", timeout: timeoutMs,
        headers: { "Content-Type": "application/soap+xml", Authorization: `Basic ${auth}` } },
      (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => resolve({ status: res.statusCode || 0, body: data.slice(0, 500) }));
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "timeout" }); });
    req.write(body);
    req.end();
  });
}

function rtspTest(url: string, timeoutMs = 6000): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", [
      "-rtsp_transport", "tcp", "-timeout", String(timeoutMs * 1000),
      "-i", url, "-t", "1", "-f", "null", "-",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", () => {
      if (stderr.includes("Stream #") || stderr.includes("video:")) {
        resolve({ ok: true, detail: "STREAM!" });
      } else {
        const m = stderr.match(/(Server returned \d+|Error opening).*/i);
        resolve({ ok: false, detail: m ? m[0].slice(0, 80) : "unknown" });
      }
    });
    proc.on("error", () => resolve({ ok: false, detail: "process error" }));
  });
}

async function main() {
  console.log(`\n═══ Post-NVR Probe: ${IP} ═══\n`);

  // 1. Port scan
  console.log("── Port Scan ──");
  const net = await import("node:net");
  for (const port of [554, 80, 8080, 8899, 5000, 3000, 8000, 9000]) {
    const open = await new Promise<boolean>((r) => {
      const s = net.createConnection({ host: IP, port, timeout: 1000 }, () => { s.destroy(); r(true); });
      s.on("error", () => { s.destroy(); r(false); });
      s.on("timeout", () => { s.destroy(); r(false); });
    });
    if (open) console.log(`  ✅ Port ${port} OPEN`);
  }

  // 2. ONVIF HTTP probe
  console.log("\n── ONVIF HTTP Probe ──");
  for (const port of [80, 554, 8080, 8899, 5000]) {
    for (const path of ["/onvif/device_service", "/onvif", "/onvif2"]) {
      const r = await httpPost(IP, port, path, SOAP, 3000);
      if (r.status > 0) {
        console.log(`  ${port}${path} → ${r.status} ${r.body.slice(0, 150)}`);
      }
    }
  }

  // 3. WS-Discovery re-probe
  console.log("\n── WS-Discovery Re-probe ──");
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => { console.log("  (probe timeout)"); resolve(); }, 8000);
    onvif.Discovery.on("device", (cam: any, info: any) => {
      console.log(`  ✅ Discovered: ${info.address}`);
      if (cam.uri) console.log(`     XAddrs: ${JSON.stringify(cam.uri)}`);
    });
    onvif.Discovery.on("error", (err: any) => console.log(`  ⚠️  ${err}`));
    onvif.Discovery.probe();
    setTimeout(() => { clearTimeout(timeout); resolve(); }, 9000);
  });

  // 4. RTSP tests (all common paths)
  console.log("\n── RTSP Stream Test ──");
  const paths = ["/1", "/0", "/ch0_0.h264", "/live/ch00_0", "/stream1", "/stream2",
    "/h264/ch1/main/av_stream", "/cam/realmonitor?channel=1&subtype=0",
    "/video1", "/MediaInput/h264", "/ch0_0", "/2", "/3"];
  for (const p of paths) {
    const url = `rtsp://${USER}:${PASS}@${IP}:554${p}`;
    const r = await rtspTest(url, 4000);
    if (r.ok) {
      console.log(`  ✅ ${p} → ${r.detail}`);
      console.log(`\n  🎉 WORKING URL: ${url}`);
    } else {
      console.log(`  ❌ ${p} → ${r.detail}`);
    }
  }

  // 5. Try ONVIF library direct connection on all ports
  console.log("\n── ONVIF Library Connection ──");
  for (const port of [80, 554, 8080, 8899, 5000]) {
    try {
      const cam = new onvif.Cam({ hostname: IP, port, username: USER, password: PASS });
      await new Promise<void>((resolve, reject) => {
        cam.on("ready", () => resolve());
        cam.on("error", reject);
        setTimeout(() => reject(new Error("timeout")), 5000);
      });
      console.log(`  ✅ ONVIF connected on port ${port}!`);
      if (cam.profiles?.length > 0) {
        console.log(`  📹 Profiles: ${cam.profiles.map((p: any) => p.name).join(", ")}`);
        const uri = await cam.getStreamUri({ protocol: "RTSP" });
        console.log(`  🔗 RTSP: ${uri.uri}`);
      }
    } catch (e: any) {
      // silent
    }
  }

  console.log(`\n═══ Done ═══\n`);
}

main().catch(console.error);
