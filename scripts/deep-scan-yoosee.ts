import { spawn } from "child_process";

const user = "admin";
const pass = "cazape1248";
const ip = "192.168.3.65";
const port = 554;

// Extended Yoosee/Tuya paths — many variations
const paths = [
  "/",
  "/0",
  "/1",
  "/2",
  "/3",
  "/ch0_0",
  "/ch0_0.h264",
  "/ch0_1.h264",
  "/ch0_0.h265",
  "/ch1_0.h264",
  "/live/ch00_0",
  "/live/ch00_1",
  "/live/ch01_0",
  "/live/ch10_0",
  "/stream1",
  "/stream2",
  "/stream3",
  "/h264Preview_01_main",
  "/h264Preview_01_sub",
  "/videoMain",
  "/videoSub",
  "/cam/realmonitor?channel=1&subtype=0",
  "/onvif1",
  "/onvif2",
  "/onvif/stream1",
  "/onvif/stream2",
  "/cgi-bin/mjpeg",
  "/cgi-bin/snapshot",
  "/MediaInput/h264",
];

function testUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", [
      "-rtsp_transport", "tcp",
      "-timeout", "4000000",
      "-i", url,
      "-t", "1",
      "-f", "null",
      "-",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", () => {
      const hasStream = stderr.includes("Stream #") || stderr.includes("video:");
      if (hasStream) {
        resolve({ ok: true, detail: "STREAM FOUND!" });
      } else {
        // Extract meaningful error
        const match = stderr.match(/(Server returned \d+|Error opening|error|Invalid).*/i);
        resolve({ ok: false, detail: match ? match[0].slice(0, 80) : "unknown" });
      }
    });
    proc.on("error", () => resolve({ ok: false, detail: "process error" }));
  });
}

(async () => {
  console.log(`\n🔍 Deep scanning Yoosee RTSP at ${ip}:${port} (${paths.length} paths)\n`);

  const found: string[] = [];

  for (const p of paths) {
    const url = `rtsp://${user}:${pass}@${ip}:${port}${p}`;
    const { ok, detail } = await testUrl(url);
    const icon = ok ? "✅" : "❌";
    console.log(`  ${icon} ${p.padEnd(45)} → ${detail}`);
    if (ok) found.push(url);
  }

  if (found.length > 0) {
    console.log(`\n🎉 WORKING URLS:`);
    found.forEach(u => console.log(`   ${u}`));
  } else {
    console.log(`\n⚠️  No paths worked. Camera may need RTSP enabled in Yoosee app.`);
    console.log(`   Tip: In the Yoosee app, go to Camera Settings > Advanced > Enable RTSP`);
  }
  console.log();
})();
