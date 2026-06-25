import { useState, useEffect, useRef, memo, useMemo } from "react";

// ── Types ──

interface Camera {
  id: string;
  name: string;
  online: boolean;
}

interface ActiveAlert {
  id: string;
  cameraId: string;
  eventType: string;
  description: string;
  timestamp: Date;
  severity: number;
}

interface MotionSummary {
  count: number;
  lastChangeRatio: number;
  avgChangeRatio: number;
  cameraId: string;
  lastAt: Date;
}

interface Props {
  activeAlerts?: ActiveAlert[];
  motionSummary?: MotionSummary[];
  onCameraClick?: (cameraId: string) => void;
}

// ── Constants ──

const DEFAULT_CAMERAS: Camera[] = [
  { id: "externa", name: "Intelbras iM7 — Externa", online: false },
  { id: "interna", name: "Yoosee — Interna", online: false },
];

// ── Camera Card ──

function CameraCard({ cam, alerts, motion, onClick }: {
  cam: Camera;
  alerts: ActiveAlert[];
  motion?: MotionSummary;
  onClick?: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!cam.online) return;
    setTick((t) => t + 1);
    timerRef.current = setInterval(() => setTick((t) => t + 1), 2000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cam.online]);

  const snapshotUrl = `/cameras/${cam.id}/snapshot?t=${tick}`;
  const hasAlert = alerts.length > 0;
  const topAlert = alerts[0];

  // Determine border color based on severity
  const borderColor = useMemo(() => {
    if (!cam.online) return "#374151";
    if (!hasAlert) return "#1e293b";
    const maxSev = Math.max(...alerts.map((a) => a.severity));
    if (maxSev >= 4) return "#ef4444"; // threat
    if (maxSev >= 3) return "#f59e0b"; // alert
    return "#3b82f6"; // observation
  }, [cam.online, hasAlert, alerts]);

  return (
    <div
      onClick={cam.online ? onClick : undefined}
      style={{
        backgroundColor: "#111827", borderRadius: 8, overflow: "hidden",
        border: `2px solid ${borderColor}`,
        display: "flex", flexDirection: "column",
        cursor: cam.online && onClick ? "pointer" : "default",
        transition: "border-color 0.3s ease",
        boxShadow: hasAlert ? `0 0 20px ${borderColor}33` : "none",
      }}
    >
      {/* Header bar */}
      <div style={{
        padding: "6px 12px", backgroundColor: "#1a2235",
        fontSize: 12, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          backgroundColor: cam.online ? (hasAlert ? "#f59e0b" : "#22c55e") : "#6b7280",
          display: "inline-block",
          animation: hasAlert ? "pulse 1.5s infinite" : "none",
        }} />
        <span style={{ flex: 1 }}>{cam.name}</span>
        {motion && motion.count > 0 && (
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            🏃 {motion.count}x
          </span>
        )}
      </div>

      {/* Camera feed */}
      <div style={{ flex: 1, backgroundColor: "#000", position: "relative", minHeight: 200 }}>
        {cam.online ? (
          !imgError ? (
            <img
              src={snapshotUrl}
              alt={cam.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: "100%", color: "#ef4444", fontSize: 13, gap: 8,
            }}>
              ⚠️ Sem sinal — tentando novamente...
            </div>
          )
        ) : (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", color: "#6b7280", fontSize: 14,
          }}>
            ⚫ Câmera offline
          </div>
        )}

        {/* ── Alert Overlay ── */}
        {hasAlert && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
            padding: "20px 12px 10px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 4,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                backgroundColor: topAlert.severity >= 3 ? "#f59e0b" : "#3b82f6",
                animation: "pulse 1.5s infinite",
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                {topAlert.eventType === "vehicle_detected" ? "🚗" : "👤"} {topAlert.description}
              </span>
            </div>
            {topAlert.eventType === "vehicle_detected" && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 4,
                  backgroundColor: "rgba(59,130,246,0.3)", color: "#93c5fd",
                  border: "1px solid rgba(59,130,246,0.5)",
                }}>
                  Toque para identificar →
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Motion indicator (subtle) ── */}
        {motion && motion.count > 3 && !hasAlert && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            fontSize: 10, color: "#22c55e",
            backgroundColor: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4,
          }}>
            ▲ {motion.count} detecções
          </div>
        )}
      </div>
    </div>
  );
}

const MemoCard = memo(CameraCard);

// ── Main Grid ──

function CameraGrid({ activeAlerts = [], motionSummary = [], onCameraClick }: Props) {
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);

  // Fetch camera status from API every 5 seconds
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/cameras");
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data)) {
            setCameras(data);
          }
        }
      } catch {
        // API offline — keep last known state
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 12, height: "100%" }}>
        {cameras.map((cam) => {
          const camAlerts = activeAlerts.filter((a) => a.cameraId === cam.id);
          const camMotion = motionSummary.find((m) => m.cameraId === cam.id);
          return (
            <MemoCard
              key={cam.id}
              cam={cam}
              alerts={camAlerts}
              motion={camMotion}
              onClick={() => onCameraClick?.(cam.id)}
            />
          );
        })}
      </div>
    </>
  );
}

export default memo(CameraGrid);
