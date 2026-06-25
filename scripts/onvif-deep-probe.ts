/**
 * Deep ONVIF probe — Get raw service info from the Yoosee camera.
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const onvif = require("onvif");
const { Cam } = onvif;

async function deepProbe() {
  console.log(`\n🔍 Deep ONVIF probe — Yoosee at 192.168.3.65:554\n`);

  const cam = new Cam({
    hostname: "192.168.3.65",
    port: 554,
    username: "admin",
    password: "cazape1248",
  });

  await cam.connect();

  // 1. Get raw services
  console.log("── Services ──");
  try {
    const services = await cam.getServices();
    console.log(JSON.stringify(services, null, 2));
  } catch (e: any) {
    console.log("getServices failed:", e.message);
  }

  // 2. Get capabilities
  console.log("\n── Capabilities ──");
  try {
    const caps = cam.capabilities;
    console.log(JSON.stringify(caps, null, 2));
  } catch (e: any) {
    console.log("capabilities failed:", e.message);
  }

  // 3. Get URI endpoints
  console.log("\n── URI Endpoints ──");
  try {
    console.log(JSON.stringify(cam.uri, null, 2));
  } catch (e: any) {
    console.log("uri failed:", e.message);
  }

  // 4. Get profiles (raw)
  console.log("\n── Profiles ──");
  try {
    const profiles = cam.profiles;
    console.log(JSON.stringify(profiles, null, 2));
  } catch (e: any) {
    console.log("profiles failed:", e.message);
  }

  // 5. Try media service directly via SOAP
  console.log("\n── Try GetVideoSources ──");
  try {
    const vs = await cam.getVideoSources();
    console.log(JSON.stringify(vs, null, 2));
  } catch (e: any) {
    console.log("getVideoSources failed:", e.message);
  }

  // 6. Try Media2 service
  console.log("\n── Try Media2 GetProfiles ──");
  try {
    const media2 = await cam.createMediaService2();
    if (media2 && media2.getProfiles) {
      const profiles2 = await media2.getProfiles();
      console.log(JSON.stringify(profiles2, null, 2));
    } else {
      console.log("Media2 not available");
    }
  } catch (e: any) {
    console.log("Media2 failed:", e.message);
  }

  // 7. Try direct RTSP test with a known profile token
  console.log("\n── Try getStreamUri with first profile ──");
  try {
    if (cam.profiles && cam.profiles.length > 0) {
      const token = cam.profiles[0].$.token;
      console.log(`Using profile token: ${token}`);
      const uri = await cam.getStreamUri({ protocol: "RTSP", profileToken: token });
      console.log(`RTSP URI: ${uri.uri}`);
    } else {
      console.log("No profiles available, trying default...");
      const uri = await cam.getStreamUri({ protocol: "RTSP" });
      console.log(`RTSP URI: ${uri.uri}`);
    }
  } catch (e: any) {
    console.log("getStreamUri failed:", e.message);
  }

  // 8. Try with active source
  console.log("\n── Active Source ──");
  try {
    console.log(JSON.stringify(cam.activeSource, null, 2));
  } catch (e: any) {
    console.log("activeSource failed:", e.message);
  }
}

deepProbe().catch(console.error);
