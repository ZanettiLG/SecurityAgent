import { useState, useEffect, useRef, memo, useMemo } from "react";
import PTZControls from "./PTZControls";

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

function CameraCard({
  cam,
  alerts,
  motion,
  onClick,
}: {
  cam: Camera;
  alerts: ActiveAlert[];
  motion?: MotionSummary;
  onClick?: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [showPTZ, setShowPTZ] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!cam.online) return;
    timerRef.current = setInterval(() => setTick((t) => t + 1), 2000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cam.online]);

  const snapshotUrl = `/cameras/${cam.id}/snapshot?t=${tick}`;
  const hasAlert = alerts.length > 0;
  const topAlert = alerts[0];

  // Determine card modifier based on state
  const cardMod = useMemo(() => {
    if (!cam.online) return "camera-card--offline";
    if (!hasAlert) return "camera-card--online";
    const maxSev = Math.max(...alerts.map((a) => a.severity));
    if (maxSev >= 4) return "camera-card--online camera-card--threat";
    if (maxSev >= 3) return "camera-card--online camera-card--amber";
    return "camera-card--online camera-card--alert";
  }, [cam.online, hasAlert, alerts]);

  // Dot modifier
  const dotMod = useMemo(() => {
    if (!cam.online) return "camera-card__dot--offline";
    return hasAlert ? "camera-card__dot--alert" : "camera-card__dot--online";
  }, [cam.online, hasAlert]);

  // Overlay severity modifier
  const overlaySev = useMemo(() => {
    if (!topAlert) return "info";
    return topAlert.severity >= 4
      ? "threat"
      : topAlert.severity >= 3
        ? "alert"
        : "info";
  }, [topAlert]);

  return (
    <div
      onClick={cam.online ? onClick : undefined}
      className={`camera-card ${cardMod}`}
    >
      {/* Header bar */}
      <div className="camera-card__header">
        <span className={`camera-card__dot ${dotMod}`} />
        <span className="camera-card__name">{cam.name}</span>
        {motion && motion.count > 0 && (
          <span className="camera-card__motion">🏃 {motion.count}x</span>
        )}
        {cam.online && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPTZ((v) => !v);
            }}
            className={`camera-card__ptz-btn${showPTZ ? " camera-card__ptz-btn--active" : ""}`}
            aria-label={
              showPTZ ? "Fechar controles PTZ" : "Abrir controles PTZ"
            }
          >
            🎥 PTZ
          </button>
        )}
      </div>

      {/* Camera feed */}
      <div className="camera-card__feed">
        {cam.online ? (
          !imgError ? (
            <img
              src={snapshotUrl}
              alt={cam.name}
              className="camera-card__feed-img"
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          ) : (
            <div className="camera-card__feed-placeholder camera-card__feed-placeholder--error">
              ⚠️ Sem sinal — tentando novamente...
            </div>
          )
        ) : (
          <div className="camera-card__feed-placeholder camera-card__feed-placeholder--offline">
            ⚫ Câmera offline
          </div>
        )}

        {/* Alert Overlay */}
        {hasAlert && topAlert && (
          <div className="camera-card__overlay">
            <div className="camera-card__overlay-row">
              <span
                className={`camera-card__overlay-dot camera-card__overlay-dot--${overlaySev}`}
              />
              <span
                className={`camera-card__overlay-type camera-card__overlay-type--${overlaySev}`}
              >
                {topAlert.eventType === "vehicle_detected" ? "🚗" : "👤"}{" "}
                {topAlert.description}
              </span>
              <span className="camera-card__overlay-time">
                {topAlert.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {topAlert.eventType === "vehicle_detected" && (
              <button
                type="button"
                className="camera-card__overlay-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                Identificar veículo →
              </button>
            )}
          </div>
        )}

        {/* Motion indicator (subtle) */}
        {motion && motion.count > 3 && !hasAlert && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              color: "#22c55e",
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ▲ {motion.count} detecções
          </div>
        )}

        {/* PTZ Controls */}
        {cam.online && (
          <PTZControls
            cameraId={cam.id}
            visible={showPTZ}
            onClose={() => setShowPTZ(false)}
          />
        )}
      </div>
    </div>
  );
}

const MemoCard = memo(CameraCard);

// ── Main Grid ──

function CameraGrid({
  activeAlerts = [],
  motionSummary = [],
  onCameraClick,
}: Props) {
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
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="camera-grid">
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
  );
}

export default memo(CameraGrid);
