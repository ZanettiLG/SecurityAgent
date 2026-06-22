/**
 * ONVIF Discovery — Encontra URLs RTSP corretas via ONVIF.
 * 
 * Uso: npx tsx scripts/onvif-discover.ts
 */

import { createSocket } from "node:dgram";
import { parseStringPromise } from "xml2js";
import { request } from "node:http";

const CAMERAS = [
  { name: "Intelbras iM7 (externa)", ip: "192.168.3.106", port: 544, user: "admin", pass: "cazape1234" },
  { name: "Yoosee (interna)", ip: "192.168.3.65", port: 554, user: "admin", pass: "cazape1248" },
];

async function getStreamUri(camera: typeof CAMERAS[0]): Promise<string | null> {
  const url = `http://${camera.ip}:${camera.port}/onvif/device_service`;
  const auth = Buffer.from(`${camera.user}:${camera.pass}`).toString("base64");

  // GetProfiles request to find stream URIs
  const getProfiles = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:trt="http://www.onvif.org/ver10/media/wsdl"
  xmlns:tt="http://www.onvif.org/ver10/schema">
  <soap:Header/>
  <soap:Body>
    <trt:GetProfiles/>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml;charset=utf-8",
        "Authorization": `Basic ${auth}`,
      },
      body: getProfiles,
      signal: AbortSignal.timeout(5000),
    });

    const text = await response.text();
    const parsed = await parseStringPromise(text);
    const profiles = parsed["Envelope"]?.["Body"]?.[0]?.["GetProfilesResponse"]?.[0]?.["Profiles"];

    if (!profiles?.length) {
      console.log(`  ⚠️  No profiles found`);
      return null;
    }

    const profileToken = profiles[0]?.["$"]?.["token"] || "";

    // GetStreamUri
    const getStreamUri = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:trt="http://www.onvif.org/ver10/media/wsdl"
  xmlns:tt="http://www.onvif.org/ver10/schema">
  <soap:Header/>
  <soap:Body>
    <trt:GetStreamUri>
      <StreamSetup>
        <Stream>RTP-Unicast</Stream>
        <Transport>
          <Protocol>RTSP</Protocol>
        </Transport>
      </StreamSetup>
      <ProfileToken>${profileToken}</ProfileToken>
    </trt:GetStreamUri>
  </soap:Body>
</soap:Envelope>`;

    const uriResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml;charset=utf-8",
        "Authorization": `Basic ${auth}`,
      },
      body: getStreamUri,
      signal: AbortSignal.timeout(5000),
    });

    const uriText = await uriResponse.text();
    const uriParsed = await parseStringPromise(uriText);
    const streamUri = uriParsed?.["Envelope"]?.["Body"]?.[0]?.["GetStreamUriResponse"]?.[0]?.["MediaUri"]?.[0]?.["Uri"]?.[0];

    if (streamUri) {
      return streamUri;
    }

    return null;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log(`  ⏱️  Timeout - ONVIF nao disponivel`);
    } else if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
      console.log(`  ⛔ Auth failed on ONVIF`);
    } else {
      console.log(`  ❓ ${err.message?.slice(0, 100) || err}`);
    }
    return null;
  }
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   ONVIF Discovery — RTSP URLs           ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  for (const cam of CAMERAS) {
    console.log(`\n📷 ${cam.name} (${cam.ip}:${cam.port})`);
    console.log(`   Conectando via ONVIF...`);

    const uri = await getStreamUri(cam);

    if (uri) {
      console.log(`   ✅ URL RTSP encontrada:`);
      console.log(`      ${uri}`);
      // Replace IP if it returns a different one
      const finalUrl = uri.replace(/\/\/[^@]*@/, `//${cam.user}:${cam.pass}@`);
      console.log(`   Configurar no .env como:`);
      console.log(`   source: "${finalUrl}"`);
    } else {
      console.log(`   ❌ ONVIF não retornou URL RTSP`);
      console.log(`   Dica: acesse http://${cam.ip}:${cam.port} para`);
      console.log(`         configurar o RTSP manualmente.`);
    }
  }

  console.log(`\n✅ Discovery concluído.\n`);
}

main().catch(console.error);
