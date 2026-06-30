import { spawn } from "child_process";

// Exact URL from .env: rtsp://admin:cazape1248@192.168.3.65:554/1
const url = "rtsp://admin:cazape1248@192.168.3.65:554/1";

console.log(`\n🔍 Testing RTSP URL: ${url}\n`);

const proc = spawn("ffmpeg", [
  "-rtsp_transport", "tcp",
  "-timeout", "5000000",
  "-i", url,
  "-frames:v", "1",
  "-f", "image2",
  "-y",
  "data/test_yoosee.jpg",
], { stdio: ["ignore", "pipe", "pipe"] });

let stdout = "";
let stderr = "";

proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

proc.on("close", (code) => {
  console.log(`Exit code: ${code}`);
  
  // Show relevant lines
  const lines = stderr.split("\n");
  for (const line of lines) {
    if (line.includes("Stream #") || line.includes("video:") || line.includes("Input #") ||
        line.includes("Error") || line.includes("error") || line.includes("rtsp://") ||
        line.includes("Server returned")) {
      console.log(line.trim());
    }
  }
  
  if (code === 0) {
    console.log("\n✅ SUCCESS — Frame captured!");
    const fs = require("fs");
    if (fs.existsSync("data/test_yoosee.jpg")) {
      const stat = fs.statSync("data/test_yoosee.jpg");
      console.log(`📸 File size: ${stat.size} bytes`);
    }
  } else {
    console.log("\n❌ Failed to capture frame");
  }
});

proc.on("error", (err) => {
  console.log(`Process error: ${err.message}`);
});
