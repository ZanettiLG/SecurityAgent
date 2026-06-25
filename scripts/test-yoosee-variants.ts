import { spawn } from "child_process";

const tests = [
  // Standard with auth in URL
  { label: "Basic auth in URL", url: "rtsp://admin:cazape1248@192.168.3.65:554/1" },
  // Without port (default 554)
  { label: "No port", url: "rtsp://admin:cazape1248@192.168.3.65/1" },
  // UDP transport
  { label: "UDP transport", url: "rtsp://admin:cazape1248@192.168.3.65:554/1", extra: ["-rtsp_transport", "udp"] },
  // Without auth (let ffmpeg prompt)
  { label: "No auth in URL", url: "rtsp://192.168.3.65:554/1" },
  // URL-encoded credentials
  { label: "URL-encoded pass", url: "rtsp://admin:cazape1248@192.168.3.65:554/1" },
  // Try with DESCRIBE first (use ffprobe)
  { label: "ffprobe test", url: "rtsp://admin:cazape1248@192.168.3.65:554/1", tool: "ffprobe" },
  // Try /0 instead
  { label: "Path /0", url: "rtsp://admin:cazape1248@192.168.3.65:554/0" },
  // Try with live prefix
  { label: "Path /live/1", url: "rtsp://admin:cazape1248@192.168.3.65:554/live/1" },
];

function runTest(test: typeof tests[0]): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const tool = test.tool || "ffmpeg";
    const args = test.tool === "ffprobe"
      ? ["-rtsp_transport", "tcp", "-i", test.url]
      : ["-rtsp_transport", "tcp", "-timeout", "5000000", "-i", test.url, "-t", "1", "-f", "null", "-"];

    const extraArgs = (test as any).extra || [];
    const finalArgs = test.tool === "ffprobe"
      ? [...extraArgs, ...args]
      : [...args.slice(0, 3), ...extraArgs, ...args.slice(3)];

    const proc = spawn(tool === "ffprobe" ? "ffprobe" : "ffmpeg", finalArgs, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", () => {
      const has400 = stderr.includes("400");
      const has401 = stderr.includes("401");
      const hasStream = stderr.includes("Stream #") || stderr.includes("video:");
      const hasDesc = stderr.includes("Describe") || stderr.includes("DESCRIBE");

      if (hasStream) {
        resolve({ ok: true, detail: "✅ STREAM FOUND!" });
      } else if (has401) {
        resolve({ ok: false, detail: "401 Unauthorized" });
      } else if (has400) {
        resolve({ ok: false, detail: "400 Bad Request" });
      } else {
        const match = stderr.match(/(error|Error|RTSP|rtsp|Invalid).{0,80}/i);
        resolve({ ok: false, detail: match ? match[0] : stderr.split("\n").slice(-3).join(" ").slice(0, 120) });
      }
    });
    proc.on("error", () => resolve({ ok: false, detail: "process error" }));
  });
}

(async () => {
  console.log(`\n🔍 Testing Yoosee RTSP variations\n`);

  for (const test of tests) {
    process.stdout.write(`  ${test.label.padEnd(25)} → `);
    const { ok, detail } = await runTest(test);
    console.log(detail);
    if (ok) {
      console.log(`\n🎉 Working URL: ${test.url}\n`);
      break;
    }
  }
})();
