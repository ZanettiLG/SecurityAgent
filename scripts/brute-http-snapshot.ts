/**
 * Brute-force HTTP snapshot — Try to find a working HTTP endpoint
 * on the Yoosee camera for live frames.
 */
import http from "node:http";
import { writeFileSync } from "node:fs";

const IP = "192.168.3.65";

const paths = [
  "/", "/snapshot", "/image", "/snap", "/jpg", "/jpeg",
  "/cgi-bin/snapshot", "/cgi-bin/jpeg", "/cgi-bin/image",
  "/webcapture.jpg", "/snapshot.jpg", "/live.jpg",
  "/onvif-http/snapshot", "/onvif/snapshot",
  "/ISAPI/Streaming/channels/101/picture",
  "/ISAPI/Streaming/channels/102/picture",
  "/tmpfs/snap.jpg", "/tmpfs/live.jpg",
  "/picture", "/photo", "/frame",
  "/api/snapshot", "/api/live",
  "/current.jpg", "/current.jpeg",
  "/video.mjpg", "/video.jpg",
];

const ports = [80, 8080, 8899, 5000, 5001, 3000, 8000, 8001, 9000, 8081, 8443];

function tryHttp(port: number, path: string, timeoutMs = 2000): Promise<{ status: number; contentType: string; length: number }> {
  return new Promise((resolve) => {
    const auth = Buffer.from("admin:cazape1248").toString("base64");
    const req = http.request(
      { hostname: IP, port, path, method: "GET", timeout: timeoutMs,
        headers: { Authorization: `Basic ${auth}` } },
      (res) => {
        let len = 0;
        const chunks: Buffer[] = [];
        res.on("data", (d: Buffer) => { len += d.length; chunks.push(d); });
        res.on("end", () => {
          const ct = res.headers["content-type"] || "";
          if (ct.includes("image") || (len > 5000 && res.statusCode === 200)) {
            const data = Buffer.concat(chunks);
            const ext = ct.includes("png") ? "png" : "jpg";
            writeFileSync(`data/yoosee_${port}_${path.replace(/\//g, "_")}.${ext}`, data);
          }
          resolve({ status: res.statusCode || 0, contentType: ct, length: len });
        });
      }
    );
    req.on("error", () => resolve({ status: 0, contentType: "", length: 0 }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, contentType: "", length: 0 }); });
    req.end();
  });
}

(async () => {
  console.log(`\n🔍 HTTP Snapshot Brute-force — ${IP}\n`);

  for (const port of ports) {
    for (const path of paths) {
      const r = await tryHttp(port, path, 2000);
      if (r.status > 0) {
        const isImage = r.contentType.includes("image");
        console.log(`  ${port}${path} → ${r.status} (${r.contentType}) ${r.length}b ${isImage ? "📸 IMAGE!" : ""}`);
      }
    }
  }

  console.log(`\nDone.\n`);
})();
