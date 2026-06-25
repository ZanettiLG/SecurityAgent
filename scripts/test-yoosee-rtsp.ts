import { spawn } from "child_process";

const paths = [
  "/ch0_0.h264",
  "/live/ch00_0",
  "/stream1",
  "/stream2",
  "/0",
  "/1",
  "/video1",
  "/video2",
  "/h264/ch1/main/av_stream",
  "/cam/realmonitor?channel=1&subtype=0",
];

const user = "admin";
const pass = "cazape1248";
const ip = "192.168.3.65";
const port = 554;

function testPath(path: string): Promise<boolean> {
  const url = `rtsp://${user}:${pass}@${ip}:${port}${path}`;
  return new Promise((resolve) => {
    console.log(`Testing: ${url}`);
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
      const hasAuth401 = stderr.includes("401") || stderr.includes("Unauthorized");
      if (hasStream && !hasAuth401) {
        console.log(`  ✅ FOUND: ${path}`);
        resolve(true);
      } else if (hasAuth401) {
        console.log(`  🔐 Auth required: ${path}`);
        resolve(false);
      } else {
        const lastLine = stderr.split("\n").filter(l => l.includes("Error") || l.includes("error") || l.includes("RTSP")).pop() || "";
        console.log(`  ❌ Failed: ${lastLine.trim()}`);
        resolve(false);
      }
    });
    proc.on("error", (err) => {
      console.log(`  ❌ Process error: ${err.message}`);
      resolve(false);
    });
  });
}

(async () => {
  console.log(`\n🔍 Testing RTSP paths for Yoosee camera at ${ip}:${port}\n`);
  for (const p of paths) {
    const ok = await testPath(p);
    if (ok) {
      console.log(`\n🎉 Working URL: rtsp://${user}:${pass}@${ip}:${port}${p}\n`);
      break;
    }
  }
  console.log("Done.");
})();
