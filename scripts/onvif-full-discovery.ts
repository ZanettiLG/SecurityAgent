/**
 * ONVIF Camera Discovery — Complete implementation.
 *
 * Protocol flow:
 * 1. WS-Discovery (UDP multicast) → find cameras on network
 * 2. SOAP over HTTP → get device capabilities
 * 3. SOAP over HTTP → get media profiles
 * 4. SOAP over HTTP → get RTSP stream URI
 *
 * Handles partial ONVIF implementations (Yoosee/Tuya cameras).
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const onvif = require("onvif");
const { Cam } = onvif;

// ── SOAP Templates ──────────────────────────────────────

function soapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:trt="http://www.onvif.org/ver10/media/wsdl"
  xmlns:tev="http://www.onvif.org/ver10/events/wsdl"
  xmlns:tt="http://www.onvif.org/ver10/schema"
  xmlns:tdevice="http://www.onvif.org/ver10/device/wsdl">
  <soap:Header/>
  <soap:Body>
${body}
  </soap:Body>
</soap:Envelope>`;
}

function soapEnvelopeWithAuth(body: string, user: string, pass: string, nonce?: string): string {
  // For cameras that require WS-Security header
  const created = new Date().toISOString();
  const nonceStr = nonce || Buffer.from(Math.random().toString(36)).toString("base64");
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:trt="http://www.onvif.org/ver10/media/wsdl"
  xmlns:tev="http://www.onvif.org/ver10/events/wsdl"
  xmlns:tt="http://www.onvif.org/ver10/schema"
  xmlns:tdevice="http://www.onvif.org/ver10/device/wsdl"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-2004-01-wss-wssecurity-secext-1.0.xsd"
  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-2004-01-wss-wssecurity-utility-1.0.xsd">
  <soap:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${user}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-2004-01-wss-username-token-profile-1.0#PasswordDigest">${nonceStr}</wsse:Password>
        <wsse:Nonce>${nonceStr}</wsse:Nonce>
        <wsu:Created>${created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
${body}
  </soap:Body>
</soap:Envelope>`;
}

// ── SOAP HTTP Client ────────────────────────────────────

async function soapRequest(
  url: string,
  body: string,
  user: string,
  pass: string,
  timeoutMs = 8000
): Promise<string> {
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": 'application/soap+xml; charset=utf-8',
      "Authorization": `Basic ${auth}`,
    },
    body,
    signal: AbortSignal.timeout(timeoutMs),
  });

  return resp.text();
}

// ── Camera Probe ────────────────────────────────────────

const SOAP_METHODS = {
  getSystemDateAndTime: soapEnvelope(`    <tdevice:GetSystemDateAndTime/>`),
  getCapabilities: soapEnvelope(`    <tdevice:GetCapabilities/>`),
  getServices: soapEnvelope(`    <tdevice:GetServices/>`),
  getDeviceInformation: soapEnvelope(`    <tdevice:GetDeviceInformation/>`),
  getProfiles: soapEnvelope(`    <trt:GetProfiles/>`),
  getVideoSources: soapEnvelope(`    <trt:GetVideoSources/>`),
};

async function probeCamera(ip: string, port: number, user: string, pass: string) {
  const baseUrl = `http://${ip}:${port}/onvif/device_service`;
  const mediaUrl = `http://${ip}:${port}/onvif/media_service`;

  console.log(`\n📷 Probing ${ip}:${port}`);
  console.log(`   Device service: ${baseUrl}`);
  console.log(`   Media service: ${mediaUrl}`);

  // Try multiple ONVIF paths
  const paths = [
    "/onvif/device_service",
    "/onvif/device_service_onvif",
    "/onvif",
    "/",
  ];

  let workingUrl = baseUrl;

  // Step 1: Find working ONVIF endpoint
  console.log(`\n   ── Step 1: Find ONVIF endpoint ──`);
  for (const path of paths) {
    const url = `http://${ip}:${port}${path}`;
    try {
      const xml = await soapRequest(url, SOAP_METHODS.getSystemDateAndTime, user, pass, 5000);
      if (xml.includes("SystemDateAndTime") || xml.includes("DateTime") || xml.includes("SOAP-ENV") || xml.includes("s:Envelope")) {
        console.log(`   ✅ ONVIF responding at: ${url}`);
        workingUrl = url.replace(/\/device_service.*$/, "/device_service");
        break;
      }
    } catch (e: any) {
      console.log(`   ❌ ${path}: ${e.message?.slice(0, 60)}`);
    }
  }

  // Also try the media service URL
  const mediaBase = workingUrl.replace("device_service", "media_service");

  // Step 2: Get capabilities (which tells us where media service is)
  console.log(`\n   ── Step 2: GetCapabilities ──`);
  try {
    const xml = await soapRequest(workingUrl, SOAP_METHODS.getCapabilities, user, pass);
    // Extract media XAddr from capabilities
    const mediaMatch = xml.match(/<tt:Media>[\s\S]*?<tt:XAddr>([^<]+)<\/tt:XAddr>/);
    if (mediaMatch) {
      console.log(`   📡 Media XAddr: ${mediaMatch[1]}`);
    }
    // Check for device info
    const devMatch = xml.match(/<tt:Device>[\s\S]*?<tt:XAddr>([^<]+)<\/tt:XAddr>/);
    if (devMatch) {
      console.log(`   📡 Device XAddr: ${devMatch[1]}`);
    }
    // Check for capabilities
    if (xml.includes("Streaming") || xml.includes("RTSP")) {
      console.log(`   ✅ Device supports streaming`);
    }
    if (xml.includes("Snapshot")) {
      console.log(`   ✅ Device supports snapshots`);
    }
  } catch (e: any) {
    console.log(`   ❌ GetCapabilities failed: ${e.message?.slice(0, 80)}`);
  }

  // Step 3: Get device information
  console.log(`\n   ── Step 3: GetDeviceInformation ──`);
  try {
    const xml = await soapRequest(workingUrl, SOAP_METHODS.getDeviceInformation, user, pass);
    const extract = (tag: string) => {
      const m = xml.match(new RegExp(`<tt:${tag}>([^<]+)</tt:${tag}>`));
      return m?.[1] || "N/A";
    };
    console.log(`   Manufacturer: ${extract("Manufacturer")}`);
    console.log(`   Model: ${extract("Model")}`);
    console.log(`   Firmware: ${extract("FirmwareVersion")}`);
    console.log(`   Serial: ${extract("SerialNumber")}`);
  } catch (e: any) {
    console.log(`   ❌ GetDeviceInformation failed: ${e.message?.slice(0, 80)}`);
  }

  // Step 4: Get media profiles
  console.log(`\n   ── Step 4: GetProfiles (Media) ──`);
  let profileTokens: string[] = [];
  try {
    const xml = await soapRequest(mediaBase, SOAP_METHODS.getProfiles, user, pass);
    // Extract profile tokens
    const tokenRegex = /token="([^"]+)"/g;
    let m;
    while ((m = tokenRegex.exec(xml)) !== null) {
      profileTokens.push(m[1]);
    }
    console.log(`   Found ${profileTokens.length} profile(s): ${profileTokens.join(", ")}`);

    // Also try to extract profile names
    const nameRegex = /<tt:Name>([^<]+)<\/tt:Name>/g;
    let idx = 0;
    while ((m = nameRegex.exec(xml)) !== null) {
      console.log(`   Profile ${idx}: ${m[1]} (token: ${profileTokens[idx] || "?"})`);
      idx++;
    }
  } catch (e: any) {
    console.log(`   ❌ GetProfiles failed: ${e.message?.slice(0, 80)}`);
  }

  // Step 5: Get RTSP stream URI for each profile
  console.log(`\n   ── Step 5: GetStreamUri ──`);
  if (profileTokens.length === 0) {
    // Try with no profile token (some cameras accept this)
    profileTokens = [""];
  }

  const workingUris: string[] = [];
  for (const token of profileTokens) {
    const getStreamUri = soapEnvelope(`    <trt:GetStreamUri>
      <StreamSetup>
        <Stream>RTP-Unicast</Stream>
        <Transport><Protocol>RTSP</Protocol></Transport>
      </StreamSetup>
      ${token ? `<ProfileToken>${token}</ProfileToken>` : ""}
    </trt:GetStreamUri>`);

    try {
      const xml = await soapRequest(mediaBase, getStreamUri, user, pass);
      const uriMatch = xml.match(/<tt:Uri>([^<]+)<\/tt:Uri>/);
      if (uriMatch) {
        const uri = uriMatch[1];
        console.log(`   ✅ RTSP URI${token ? ` (${token})` : ""}: ${uri}`);
        workingUris.push(uri);
      } else {
        // Try with stream:RTSP
        const uriMatch2 = xml.match(/<trt:Uri>([^<]+)<\/trt:Uri>/);
        if (uriMatch2) {
          console.log(`   ✅ RTSP URI: ${uriMatch2[1]}`);
          workingUris.push(uriMatch2[1]);
        }
      }
    } catch (e: any) {
      console.log(`   ❌ GetStreamUri failed: ${e.message?.slice(0, 80)}`);
    }
  }

  // Step 6: Also try direct SOAP to media service on the known ports
  if (workingUris.length === 0) {
    console.log(`\n   ── Step 6: Alternative media endpoints ──`);
    const altPorts = [80, 8080, 554, 8899];
    const altPaths = ["/onvif/media_service", "/onvif", "/onvif/media"];

    for (const altPort of altPorts) {
      for (const altPath of altPaths) {
        const altUrl = `http://${ip}:${altPort}${altPath}`;
        try {
          const xml = await soapRequest(altUrl, SOAP_METHODS.getProfiles, user, pass, 3000);
          if (xml.includes("Profiles") && !xml.includes("fault")) {
            console.log(`   ✅ Media profiles found at: ${altUrl}`);
            // Try to get stream URI from here
            const tokenM = xml.match(/token="([^"]+)"/);
            if (tokenM) {
              const getStream = soapEnvelope(`    <trt:GetStreamUri>
                <StreamSetup>
                  <Stream>RTP-Unicast</Stream>
                  <Transport><Protocol>RTSP</Protocol></Transport>
                </StreamSetup>
                <ProfileToken>${tokenM[1]}</ProfileToken>
              </trt:GetStreamUri>`);
              const uriXml = await soapRequest(altUrl, getStream, user, pass);
              const uriM = uriXml.match(/<tt:Uri>([^<]+)<\/tt:Uri>/) ||
                           uriXml.match(/<trt:Uri>([^<]+)<\/trt:Uri>/);
              if (uriM) {
                console.log(`   🎉 RTSP: ${uriM[1]}`);
                workingUris.push(uriM[1]);
              }
            }
            break;
          }
        } catch {
          // skip
        }
      }
      if (workingUris.length > 0) break;
    }
  }

  return workingUris;
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log(`╔══════════════════════════════════════════════════╗`);
  console.log(`║  ONVIF Protocol Discovery — Complete Scanner    ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);

  // Step 1: WS-Discovery
  console.log(`\n📡 WS-Discovery multicast probe...\n`);

  const discovered = await new Promise<any[]>((resolve) => {
    const devices: any[] = [];
    const timeout = setTimeout(() => resolve(devices), 10000);

    onvif.Discovery.on("device", (cam: any, info: any) => {
      console.log(`   ✅ Discovered: ${info.address}`);
      devices.push({ cam, info });
    });

    onvif.Discovery.on("error", (err: any) => {
      console.log(`   ⚠️  ${err}`);
    });

    onvif.Discovery.probe();
  });

  console.log(`\n   Found ${discovered.length} device(s) via WS-Discovery`);

  // Step 2: Deep probe each known camera
  const cameras = [
    { name: "Yoosee (interna)", ip: "192.168.3.65", port: 554, user: "admin", pass: "cazape1248" },
    { name: "Intelbras iM7 (externa)", ip: "192.168.3.106", port: 554, user: "admin", pass: "cazape1234" },
  ];

  console.log(`\n\n═══════════════════════════════════════════════`);
  console.log(`  Deep ONVIF probe`);
  console.log(`═══════════════════════════════════════════════`);

  for (const cam of cameras) {
    const uris = await probeCamera(cam.ip, cam.port, cam.user, cam.pass);
    if (uris.length > 0) {
      const authUri = uris[0].replace("://", `://${cam.user}:${cam.pass}@`);
      console.log(`\n   🎉 Configurar no .env como:`);
      console.log(`      source: "${authUri}"`);
    } else {
      console.log(`\n   ❌ No RTSP stream found via ONVIF`);
      console.log(`      Possíveis causas:`);
      console.log(`      1. RTSP não habilitado no app Yoosee`);
      console.log(`      2. ONVIF implementado parcialmente`);
      console.log(`      3. Credenciais incorretas`);
    }
  }

  console.log(`\n✅ Discovery complete.\n`);
}

main().catch(console.error);
