/**
 * RTSP auth variants — Try Digest auth, UDP, and other combinations.
 */
import { spawn } from "node:child_process";

const IP = "192.168.3.65";
const USER = "admin";
const PASS = "cazape1248";

const tests = [
  { label: "Basic auth, TCP, /1", args: ["-rtsp_transport", "tcp", "-i", `rtsp://${USER}:${PASS}@${IP}:554/1`, "-t", "2", "-f", "null", "-"] },
  { label: "Basic auth, UDP, /1", args: ["-rtsp_transport", "udp", "-i", `rtsp://${USER}:${PASS}@${IP}:554/1`, "-t", "2", "-f", "null", "-"] },
  { label: "No auth, TCP, /1", args: ["-rtsp_transport", "tcp", "-i", `rtsp://${IP}:554/1`, "-t", "2", "-f", "null", "-"] },
  { label: "Basic auth, TCP, /0", args: ["-rtsp_transport", "tcp", "-i", `rtsp://${USER}:${PASS}@${IP}:554/0`, "-t", "2", "-f", "null", "-"] },
  { label: "Basic auth, TCP, /", args: ["-rtsp_transport", "tcp", "-i", `rtsp://${USER}:${PASS}@${IP}:554/`, "-t", "2", "-f", "null", "-"] },
  { label: "No auth, TCP, /", args: ["-rtsp_transport", "tcp", "-i", `rtsp://${IP}:554/`, "-t", "2", "-f", "null", "-"] },
  { label: "Basic auth, TCP, /live", args: ["-rtsp_transport", "tcp", "-i", `rtsp://${USER}:${PASS}@${IP}:554/live`, "-t", "2", "-f", "null", "-"] },
  // Try user agent override
  { label: "User-Agent Yoosee, /1", args: ["-rtsp_transport", "tcp", "-user_agent", "GStreamer/1.0", "-i", `rtsp://${USER}:${PASS}@${IP}:554/1`, "-t", "2", "-f", "null", "-"] },
];

function run(test: typeof tests[0]): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", ["-loglevel", "debug", ...test.args], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => {
      const ok = stderr.includes("Stream #") || stderr.includes("video:");
      const cseq = stderr.includes("CSeq");
      const auth401 = stderr.includes("401");
      const authFail = stderr.includes("Authorization") || stderr.includes("auth");
      const lastLines = stderr.split("\n").filter(l => l.includes("RTSP") || l.includes("CSeq") || l.includes("error") || l.includes("Error") || l.includes("Server") || l.includes("DESCRIBE") || l.includes("SETUP") || l.includes("401") || l.includes("400")).slice(-5);
      resolve({ ok, detail: lastLines.join(" | ").slice(0, 200) });
    });
    proc.on("error", () => resolve({ ok: false, detail: "error" }));
  });
}

(async () => {
  console.log(`\n🔍 RTSP Auth Variant Test — ${IP}\n`);
  for (const test of tests) {
    process.stdout.write(`  ${test.label.padEnd(40)}`);
    const { ok, detail } = await run(test);
    console.log(ok ? "✅" : "❌");
    if (detail) console.log(`    ${detail}`);
    if (ok) {
      console.log(`\n🎉 WORKING!`);
      break;
    }
  }
})();
