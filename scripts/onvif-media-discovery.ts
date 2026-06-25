/**
 * ONVIF Media Service — Query the camera's ONVIF service on port 80
 * to discover the actual RTSP stream URI.
 */

import { parseStringPromise } from "xml2js";

const CAMERAS = [
  { name: "Yoosee (interna)", ip: "192.168.3.65", port: 80, user: "admin", pass: "cazape1248" },
];

const SOAP_ENVELOPE = (body: string) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:trt="http://www.onvif.org/ver10/media/wsdl"
  xmlns:tt="http://www.onvif.org/ver10/schema">
  <soap:Header/>
  <soap:Body>
${body}
  </soap:Body>
</soap:Envelope>`;

const GET_PROFILES = SOAP_ENVELOPE(`    <trt:GetProfiles/>`);

async function queryOnvif(cam: typeof CAMERAS[0]) {
  const baseUrl = `http://${cam.ip}:${cam.port}/onvif/device_service`;
  const auth = Buffer.from(`${cam.user}:${cam.pass}`).toString("base64");
  const headers: Record<string, string> = {
    "Content-Type": "application/soap+xml;charset=utf-8",
    "Authorization": `Basic ${auth}`,
  };

  console.log(`\n📷 ${cam.name} — ONVIF on port ${cam.port}`);
  console.log(`   URL: ${baseUrl}`);

  // Step 1: Get profiles
  console.log(`\n   Step 1: GetProfiles...`);
  try {
    const resp = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: GET_PROFILES,
      signal: AbortSignal.timeout(8000),
    });
    const text = await resp.text();
    const parsed = await parseStringPromise(text);

    const profiles = parsed?.["Envelope"]?.["Body"]?.[0]?.["GetProfilesResponse"]?.[0]?.["Profiles"];
    if (!profiles?.length) {
      console.log(`   ⚠️  No profiles found. Response:`);
      console.log(text.slice(0, 500));
      return;
    }

    console.log(`   ✅ Found ${profiles.length} profile(s):`);
    for (const p of profiles) {
      const token = p?.["$"]?.["token"] || "?";
      const name = p?.["Name"]?.[0] || "?";
      const videoToken = p?.["VideoEncoderConfiguration"]?.[0]?.["$"]?.["token"] || "?";
      console.log(`      - Token: ${token}, Name: ${name}, VideoConfig: ${videoToken}`);
    }

    // Step 2: GetStreamUri for each profile
    for (const p of profiles) {
      const token = p?.["$"]?.["token"] || "";
      const name = p?.["Name"]?.[0] || token;

      const getStreamUri = SOAP_ENVELOPE(`    <trt:GetStreamUri>
      <StreamSetup>
        <Stream>RTP-Unicast</Stream>
        <Transport>
          <Protocol>RTSP</Protocol>
        </Transport>
      </StreamSetup>
      <ProfileToken>${token}</ProfileToken>
    </trt:GetStreamUri>`);

      console.log(`\n   Step 2: GetStreamUri for "${name}"...`);
      const uriResp = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: getStreamUri,
        signal: AbortSignal.timeout(8000),
      });
      const uriText = await uriResp.text();
      const uriParsed = await parseStringPromise(uriText);
      const uri = uriParsed?.["Envelope"]?.["Body"]?.[0]?.["GetStreamUriResponse"]?.[0]?.["MediaUri"]?.[0]?.["Uri"]?.[0];

      if (uri) {
        console.log(`   ✅ Stream URI: ${uri}`);
        const authenticatedUri = uri.replace(/\/\/[^@]*@/, `//${cam.user}:${cam.pass}@`);
        console.log(`   🔑 With auth:  ${authenticatedUri}`);
      } else {
        console.log(`   ❌ No URI returned. Response:`);
        console.log(`   ${uriText.slice(0, 500)}`);
      }
    }
  } catch (err: any) {
    if (err.name === "FetchError" || err.message?.includes("fetch failed")) {
      console.log(`   ❌ Connection failed — ONVIF not available on port ${cam.port}`);
      console.log(`   💡 Trying alternative ports...`);
    } else {
      console.log(`   ❌ Error: ${err.message?.slice(0, 200)}`);
    }
  }

  // Try alternative ONVIF ports
  const altPorts = [8080, 8899, 8000, 8001, 554];
  for (const altPort of altPorts) {
    if (altPort === cam.port) continue;
    const altUrl = `http://${cam.ip}:${altPort}/onvif/device_service`;
    console.log(`\n   Trying ONVIF on port ${altPort}...`);
    try {
      const resp = await fetch(altUrl, {
        method: "POST",
        headers,
        body: GET_PROFILES,
        signal: AbortSignal.timeout(3000),
      });
      const text = await resp.text();
      if (text.includes("GetProfilesResponse")) {
        console.log(`   ✅ ONVIF responding on port ${altPort}!`);
        const parsed = await parseStringPromise(text);
        const profiles = parsed?.["Envelope"]?.["Body"]?.[0]?.["GetProfilesResponse"]?.[0]?.["Profiles"];
        if (profiles?.length) {
          for (const p of profiles) {
            const token = p?.["$"]?.["token"] || "";
            const name = p?.["Name"]?.[0] || token;

            const getStreamUri = SOAP_ENVELOPE(`    <trt:GetStreamUri>
      <StreamSetup>
        <Stream>RTP-Unicast</Stream>
        <Transport>
          <Protocol>RTSP</Protocol>
        </Transport>
      </StreamSetup>
      <ProfileToken>${token}</ProfileToken>
    </trt:GetStreamUri>`);

            const uriResp = await fetch(altUrl, {
              method: "POST",
              headers,
              body: getStreamUri,
              signal: AbortSignal.timeout(5000),
            });
            const uriText = await uriResp.text();
            const uriParsed = await parseStringPromise(uriText);
            const uri = uriParsed?.["Envelope"]?.["Body"]?.[0]?.["GetStreamUriResponse"]?.[0]?.["MediaUri"]?.[0]?.["Uri"]?.[0];

            if (uri) {
              console.log(`   ✅ Profile "${name}" → ${uri}`);
              const authUri = uri.replace(/\/\/[^@]*@/, `//${cam.user}:${cam.pass}@`);
              console.log(`   🔑 With auth:  ${authUri}`);
            }
          }
        }
      } else {
        console.log(`   ❌ No ONVIF response`);
      }
    } catch {
      console.log(`   ❌ No ONVIF on port ${altPort}`);
    }
  }
}

(async () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  ONVIF Media Discovery — Yoosee Camera  ║`);
  console.log(`╚══════════════════════════════════════════╝`);

  for (const cam of CAMERAS) {
    await queryOnvif(cam);
  }

  console.log(`\n✅ Done.\n`);
})();
