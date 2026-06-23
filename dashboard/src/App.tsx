import { useEffect, useState } from "react";
import CameraGrid from "./CameraGrid";
import ChatPanel from "./ChatPanel";
import Timeline from "./Timeline";
import StatusBar from "./StatusBar";

interface VigiaMessage {
  type: string;
  topic?: string;
  payload?: Record<string, unknown>;
}

function App() {
  const [messages, setMessages] = useState<Array<{ text: string; type: string; timestamp: Date }>>([]);
  const [events, setEvents] = useState<Array<{ description: string; timestamp: Date; severity: number; cameraId: string }>>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      try {
        const msg: VigiaMessage = JSON.parse(e.data);

        if (msg.type === "event" && msg.topic === "vision.event" && msg.payload && "eventType" in msg.payload) {
          const p = msg.payload as Record<string, unknown>;
          const sevMap: Record<number, string> = { 0: "info", 1: "info", 2: "observation", 3: "alert", 4: "threat" };
          const sev = (p.severity as number) ?? 0;

          setMessages((prev) => [
            ...prev.slice(-199),
            { text: (p.description as string) || "Evento", type: sevMap[sev] || "info", timestamp: new Date() },
          ]);

          setEvents((prev) => [
            { description: (p.description as string) || "", timestamp: new Date(), severity: sev, cameraId: (p.cameraId as string) || "" },
            ...prev.slice(0, 99),
          ]);
        }

        if (msg.type === "connected") {
          setMessages((prev) => [...prev, { text: "✅ Conectado ao Vigia", type: "info", timestamp: new Date() }]);
        }
      } catch { /* ignore */ }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      backgroundColor: "#0a0e17", color: "#c8d6e5",
      fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden",
    }}>
      <header style={{
        padding: "8px 20px", backgroundColor: "#111827",
        display: "flex", alignItems: "center", gap: 16,
        borderBottom: "1px solid #1e293b", flexShrink: 0,
      }}>
        <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>🔴 AO VIVO</span>
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Vigia — Central de Segurança</span>
        <span style={{ color: "#64748b", fontSize: 13 }}>{new Date().toLocaleTimeString()}</span>
      </header>

      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
          <CameraGrid />
        </div>
        <div style={{
          width: 380, display: "flex", flexDirection: "column",
          borderLeft: "1px solid #1e293b", backgroundColor: "#0f172a", flexShrink: 0,
        }}>
          <ChatPanel messages={messages} connected={connected} />
          <Timeline events={events} />
        </div>
      </main>

      <StatusBar connected={connected} eventsCount={events.length} camerasOnline={1} threats={0} />
    </div>
  );
}

export default App;
