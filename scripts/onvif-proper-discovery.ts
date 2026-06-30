/**
 * ONVIF Discovery — Using the proper `onvif` npm library.
 *
 * This uses WS-Discovery (multicast UDP) to find cameras,
 * then queries their Media service for RTSP stream URIs.
 *
 * Usage: npx tsx scripts/onvif-proper-discovery.ts
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const onvif = require("onvif");
const { Cam } = onvif;
const Discovery = onvif.Discovery;

const CAMERAS = [
  { name: "Yoosee (interna)", ip: "192.168.3.65", port: 554, user: "admin", pass: "cazape1248" },
  { name: "Intelbras iM7 (externa)", ip: "192.168.3.106", port: 80, user: "admin", pass: "cazape1234" },
];

async function probeOnvif(): Promise<void> {
  console.log(`\n📡 WS-Discovery Probe (multicast UDP on 239.255.255.250:3702)...\n`);

  return new Promise((resolve) => {
    const devices: any[] = [];

    Discovery.on("device", (cam: any, remoteInfo: any) => {
      devices.push({ cam, remoteInfo });
      console.log(`  ✅ Found device: ${remoteInfo.address}`);
      console.log(`     XAddrs: ${cam.uri?.device || "unknown"}`);
    });

    Discovery.on("error", (err: any) => {
      console.log(`  ⚠️  Discovery error: ${err.message || err}`);
    });

    Discovery.probe({ timeout: 8000 }, (err: any) => {
      if (err) {
        console.log(`\n  ⚠️  Probe completed with errors: ${err.message || err}`);
      }
      if (devices.length === 0) {
        console.log(`  ❌ No ONVIF devices found via WS-Discovery`);
      } else {
        console.log(`\n  Found ${devices.length} device(s) via WS-Discovery`);
      }
      resolve();
    });
  });
}

async function connectAndDiscover(cam: typeof CAMERAS[0]): Promise<void> {
  console.log(`\n📷 ${cam.name} (${cam.ip}:${cam.port})`);
  console.log(`   Connecting via ONVIF...`);

  try {
    const onvifCam = new Cam({
      hostname: cam.ip,
      port: cam.port,
      username: cam.user,
      password: cam.pass,
    });

    await onvifCam.connect();
    console.log(`   ✅ Connected!`);

    // Get device info
    try {
      const info = await onvifCam.getDeviceInformation();
      console.log(`   📋 Manufacturer: ${info.manufacturer}`);
      console.log(`   📋 Model: ${info.model}`);
      console.log(`   📋 Firmware: ${info.firmwareVersion}`);
      console.log(`   📋 Serial: ${info.serialNumber}`);
    } catch (e: any) {
      console.log(`   ⚠️  Could not get device info: ${e.message}`);
    }

    // Get profiles
    const profiles = onvifCam.profiles || [];
    console.log(`   📹 Found ${profiles.length} media profile(s)`);

    for (const profile of profiles) {
      console.log(`      - Profile: ${profile.name} (token: ${profile.$.token})`);
    }

    // Get RTSP stream URI for each profile
    for (const profile of profiles) {
      try {
        const uri = await onvifCam.getStreamUri({
          protocol: "RTSP",
          profileToken: profile.$.token,
        });
        console.log(`   🔗 RTSP URI (${profile.name}): ${uri.uri}`);

        // Add auth to URI if not present
        const authUri = uri.uri.replace("://", `://${cam.user}:${cam.pass}@`);
        console.log(`   🔑 With auth: ${authUri}`);
      } catch (e: any) {
        console.log(`   ❌ Could not get stream URI for ${profile.name}: ${e.message}`);
      }
    }

    // Get snapshot URI
    try {
      const snapshot = await onvifCam.getSnapshotUri({});
      console.log(`   📸 Snapshot URI: ${snapshot.uri}`);
    } catch (e: any) {
      console.log(`   ⚠️  Could not get snapshot URI: ${e.message}`);
    }

  } catch (err: any) {
    console.log(`   ❌ Connection failed: ${err.message || err}`);

    // Try alternative: direct SOAP to common ONVIF paths
    console.log(`   💡 Trying alternative ONVIF paths...`);
    const altPorts = [80, 8080, 8899, 554, 8000];
    for (const port of altPorts) {
      try {
        const altCam = new Cam({
          hostname: cam.ip,
          port,
          username: cam.user,
          password: cam.pass,
        });
        await altCam.connect();
        console.log(`   ✅ Connected on port ${port}!`);
        const info = await altCam.getDeviceInformation();
        console.log(`   📋 ${info.manufacturer} ${info.model}`);
        const uri = await altCam.getStreamUri({ protocol: "RTSP" });
        console.log(`   🔗 RTSP: ${uri.uri}`);
        return;
      } catch {
        // silent
      }
    }
    console.log(`   ❌ No ONVIF service found on any port`);
  }
}

async function main() {
  console.log(`╔══════════════════════════════════════════════╗`);
  console.log(`║  ONVIF Protocol Discovery (proper library)  ║`);
  console.log(`╚══════════════════════════════════════════════╝`);

  // Step 1: WS-Discovery multicast probe
  await probeOnvif();

  // Step 2: Direct connection to known cameras
  console.log(`\n\n═══════════════════════════════════════════════`);
  console.log(`  Direct ONVIF connection to known cameras`);
  console.log(`═══════════════════════════════════════════════`);

  for (const cam of CAMERAS) {
    await connectAndDiscover(cam);
  }

  console.log(`\n✅ Discovery complete.\n`);
}

main().catch(console.error);
