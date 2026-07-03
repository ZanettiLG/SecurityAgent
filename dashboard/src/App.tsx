import { useEffect, useState, useRef, useCallback } from "react";
import CameraGrid from "./CameraGrid";
import ChatPanel from "./ChatPanel";
import Timeline from "./Timeline";
import StatusBar from "./StatusBar";
import VehicleIdentifyModal from "./VehicleIdentifyModal";

// ── Types ──

interface VigiaMessage {
  type: string;
  topic?: string;
  payload?: Record<string, unknown>;
}

interface Message {
  id: string;
  text: string;
  type: string;
  timestamp: Date;
  canReply?: boolean;
  cameraId?: string;
  eventType?: string;
  snapshotPath?: string;
  /** Quick reply options shown as buttons */
  quickReplies?: Array<{ label: string; value: string }>;
}

interface ActiveAlert {
  id: string;
  cameraId: string;
  eventType: string;
  description: string;
  timestamp: Date;
  snapshotPath?: string;
  severity: number;
}

interface MotionSummary {
  count: number;
  lastChangeRatio: number;
  avgChangeRatio: number;
  cameraId: string;
  firstAt: Date;
  lastAt: Date;
}

let msgCounter = 0;
function nextMsgId() {
  return `msg_${++msgCounter}_${Date.now()}`;
}

/** Deduplicate events within 3s window by eventType + cameraId */
const DEDUP_WINDOW_MS = 3000;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<
    Array<{
      description: string;
      timestamp: Date;
      severity: number;
      cameraId: string;
    }>
  >([]);
  const [connected, setConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [motionSummary, setMotionSummary] = useState<
    Map<string, MotionSummary>
  >(new Map());
  const [identifyVehicle, setIdentifyVehicle] = useState<{
    alertId: string;
    cameraId: string;
    snapshotPath?: string;
    description: string;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastEventRef = useRef<Map<string, number>>(new Map());

  // Group motion events into summaries instead of flooding chat
  const handleMotionEvent = useCallback(
    (p: Record<string, unknown>, cameraId: string) => {
      const now = new Date();
      const changeRatio = (p.changeRatio as number) ?? 0;

      setMotionSummary((prev) => {
        const next = new Map(prev);
        const existing = next.get(cameraId);
        if (existing) {
          const total = existing.avgChangeRatio * existing.count + changeRatio;
          const newCount = existing.count + 1;
          next.set(cameraId, {
            count: newCount,
            lastChangeRatio: changeRatio,
            avgChangeRatio: total / newCount,
            cameraId,
            firstAt: existing.firstAt,
            lastAt: now,
          });
        } else {
          next.set(cameraId, {
            count: 1,
            lastChangeRatio: changeRatio,
            avgChangeRatio: changeRatio,
            cameraId,
            firstAt: now,
            lastAt: now,
          });
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3s
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          // Will re-trigger this effect
        }
      }, 3000);
    };

    ws.onmessage = (e) => {
      try {
        const msg: VigiaMessage = JSON.parse(e.data);

        if (
          msg.type === "event" &&
          msg.topic === "vision.event" &&
          msg.payload &&
          "eventType" in msg.payload
        ) {
          const p = msg.payload as Record<string, unknown>;
          const sev = (p.severity as number) ?? 0;
          const eventType = p.eventType as string;
          const cameraId = (p.cameraId as string) || "";
          const now = Date.now();

          // ── Dedup: skip same eventType+cameraId within window ──
          const dedupKey = `${eventType}:${cameraId}`;
          const lastTime = lastEventRef.current.get(dedupKey) ?? 0;
          if (
            now - lastTime < DEDUP_WINDOW_MS &&
            eventType === "motion_detected"
          ) {
            // Still count in summary but don't create new message
            if (eventType === "motion_detected") handleMotionEvent(p, cameraId);
            return;
          }
          lastEventRef.current.set(dedupKey, now);

          // ── Motion events → smart summary (no individual chat messages) ──
          if (eventType === "motion_detected") {
            handleMotionEvent(p, cameraId);
            // Still add to timeline
            setEvents((prev) => [
              {
                description: (p.description as string) || "Movimento detectado",
                timestamp: new Date(),
                severity: sev,
                cameraId,
              },
              ...prev.slice(0, 99),
            ]);
            return;
          }

          // ── Vehicle / Person detection → prominent alert ──
          if (
            eventType === "vehicle_detected" ||
            eventType === "person_detected"
          ) {
            const alertId = nextMsgId();
            const snapshotPath =
              (p.snapshotPath as string) ||
              (p.framePath as string) ||
              undefined;

            const alert: ActiveAlert = {
              id: alertId,
              cameraId,
              eventType,
              description: (p.description as string) || "Detectado",
              timestamp: new Date(),
              snapshotPath,
              severity: sev,
            };
            setActiveAlerts((prev) => [alert, ...prev.slice(0, 9)]);

            const quickReplies =
              eventType === "vehicle_detected"
                ? [
                    { label: "🚗 É o meu carro", value: "É o meu carro" },
                    {
                      label: "👤 É a pessoa: ___",
                      value: "É a dona/neighbora ",
                    },
                    {
                      label: "❌ Não reconheço",
                      value: "Não reconheço esse veículo",
                    },
                  ]
                : [
                    {
                      label: "👤 Conheço: ___",
                      value: "Conheço essa pessoa: ",
                    },
                    { label: "❌ Desconhecido", value: "Pessoa desconhecida" },
                  ];

            setMessages((prev) => [
              ...prev.slice(-199),
              {
                id: alertId,
                text: (p.description as string) || "Detectado",
                type: sev >= 3 ? "alert" : "observation",
                timestamp: new Date(),
                canReply: true,
                cameraId,
                eventType,
                snapshotPath,
                quickReplies,
              },
            ]);
          }

          // ── All events → timeline ──
          setEvents((prev) => [
            {
              description: (p.description as string) || "",
              timestamp: new Date(),
              severity: sev,
              cameraId,
            },
            ...prev.slice(0, 99),
          ]);
        }

        if (msg.type === "connected") {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId(),
              text: "✅ Vigia conectado — monitoramento ativo",
              type: "info",
              timestamp: new Date(),
            },
          ]);
        }

        // ── User answer confirmation ──
        if (
          msg.type === "event" &&
          msg.topic === "user.answer" &&
          msg.payload
        ) {
          const p = msg.payload as Record<string, unknown>;
          if (p.insight) {
            setMessages((prev) => [
              ...prev.slice(-199),
              {
                id: nextMsgId(),
                text: `📝 ${p.insight as string}`,
                type: "insight",
                timestamp: new Date(),
              },
            ]);
          }
        }
      } catch {
        /* ignore */
      }
    };

    return () => ws.close();
  }, [handleMotionEvent]);

  const handleReply = useCallback((messageId: string, answer: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat_response",
          messageId,
          answer,
          timestamp: new Date().toISOString(),
        }),
      );
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId(),
          text: `👤 ${answer}`,
          type: "info",
          timestamp: new Date(),
        },
      ]);
      // Remove from active alerts
      setActiveAlerts((prev) => prev.filter((a) => a.id !== messageId));
    }
  }, []);

  const handleQuickReply = useCallback(
    (messageId: string, value: string) => {
      handleReply(messageId, value);
    },
    [handleReply],
  );

  const handleIdentify = useCallback(
    (cameraId: string, identification: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "chat_response",
            messageId: `identify_${Date.now()}`,
            answer: identification,
            timestamp: new Date().toISOString(),
            cameraId,
          }),
        );
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            text: `👤 ${identification}`,
            type: "info",
            timestamp: new Date(),
          },
        ]);
      }
      setIdentifyVehicle(null);
    },
    [],
  );

  // Aggregate motion summary for display
  const motionEntries = Array.from(motionSummary.values());

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__header-live">🔴 AO VIVO</span>
        <span className="app__header-brand">Vigia — Central de Segurança</span>
        <span style={{ color: "#64748b", fontSize: 13 }}>
          {new Date().toLocaleTimeString()}
        </span>
      </header>

      <main className="app__main">
        <div className="app__camera-area">
          <CameraGrid
            activeAlerts={activeAlerts}
            motionSummary={motionEntries}
            onCameraClick={(cameraId) => {
              const alert = activeAlerts.find((a) => a.cameraId === cameraId);
              if (alert) {
                setIdentifyVehicle({
                  alertId: alert.id,
                  cameraId: alert.cameraId,
                  snapshotPath: alert.snapshotPath,
                  description: alert.description,
                });
              }
            }}
          />
        </div>
        <div className="app__sidebar">
          <ChatPanel
            messages={messages}
            connected={connected}
            onReply={handleReply}
            onQuickReply={handleQuickReply}
            activeAlerts={activeAlerts}
            onOpenIdentify={(alertId) => {
              const alert = activeAlerts.find((a) => a.id === alertId);
              if (alert) {
                setIdentifyVehicle({
                  alertId: alert.id,
                  cameraId: alert.cameraId,
                  snapshotPath: alert.snapshotPath,
                  description: alert.description,
                });
              }
            }}
            motionSummary={motionEntries}
          />
          <Timeline events={events} />
        </div>
      </main>

      <StatusBar
        connected={connected}
        eventsCount={events.length}
        camerasOnline={1}
        threats={0}
      />

      {identifyVehicle && (
        <VehicleIdentifyModal
          cameraId={identifyVehicle.cameraId}
          snapshotPath={identifyVehicle.snapshotPath}
          description={identifyVehicle.description}
          onIdentify={handleIdentify}
          onClose={() => setIdentifyVehicle(null)}
        />
      )}
    </div>
  );
}

export default App;
