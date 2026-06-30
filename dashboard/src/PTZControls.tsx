import { useState, useCallback, useRef } from "react";

// ── API helpers ──

const API_BASE = "/api/cameras";

async function ptzCmd(cameraId: string, cmd: string, body?: unknown) {
  const res = await fetch(`${API_BASE}/${cameraId}/ptz/${cmd}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn(`PTZ ${cmd} failed:`, err);
  }
}

// ── Styles ──

const padBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#d1d5db",
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s, border-color 0.15s",
  userSelect: "none",
  lineHeight: 1,
};

const zoomBtn: React.CSSProperties = {
  ...padBtn,
  width: 36,
  height: 36,
  fontSize: 16,
  borderRadius: 6,
};

const stopBtn: React.CSSProperties = {
  ...padBtn,
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "2px solid #ef4444",
  color: "#ef4444",
  fontSize: 14,
  fontWeight: 600,
};

// ── Component ──

interface Props {
  cameraId: string;
  visible: boolean;
  onClose: () => void;
}

export default function PTZControls({ cameraId, visible, onClose }: Props) {
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const moveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMove = useCallback(
    (dir: string, pan: number, tilt: number) => {
      setActiveDir(dir);
      // Send initial move command
      ptzCmd(cameraId, "move", { pan, tilt, zoom: 0 });
      // Keep sending move commands while held (continuous)
      if (moveTimer.current) clearInterval(moveTimer.current);
      moveTimer.current = setInterval(() => {
        ptzCmd(cameraId, "move", { pan, tilt, zoom: 0 });
      }, 500);
    },
    [cameraId],
  );

  const stopMove = useCallback(() => {
    setActiveDir(null);
    if (moveTimer.current) {
      clearInterval(moveTimer.current);
      moveTimer.current = null;
    }
    ptzCmd(cameraId, "stop");
  }, [cameraId]);

  const handleZoom = useCallback(
    (dir: number) => {
      ptzCmd(cameraId, "move", { pan: 0, tilt: 0, zoom: dir });
      // Auto-stop zoom after 300ms
      setTimeout(() => ptzCmd(cameraId, "stop"), 300);
    },
    [cameraId],
  );

  const goHome = useCallback(() => {
    ptzCmd(cameraId, "home");
  }, [cameraId]);

  if (!visible) return null;

  return (
    <fieldset
      aria-label="Controles PTZ da câmera"
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "center",
      }}
      onMouseLeave={stopMove}
      onTouchEnd={stopMove}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: -28,
          right: 0,
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: 16,
          cursor: "pointer",
          padding: "2px 6px",
        }}
        title="Fechar controles PTZ"
      >
        ✕
      </button>

      {/* Directional pad */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "44px 44px 44px",
          gridTemplateRows: "44px 44px 44px",
          gap: 3,
        }}
      >
        {/* Row 1: empty, UP, empty */}
        <div />
        <button
          type="button"
          style={{
            ...padBtn,
            background: activeDir === "up" ? "#2563eb" : padBtn.background,
            borderColor: activeDir === "up" ? "#3b82f6" : padBtn.borderColor,
          }}
          onMouseDown={() => startMove("up", 0, 1)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("up", 0, 1)}
          onTouchEnd={stopMove}
          title="Tilt Up"
        >
          ▲
        </button>
        <div />

        {/* Row 2: LEFT, STOP, RIGHT */}
        <button
          type="button"
          style={{
            ...padBtn,
            background: activeDir === "left" ? "#2563eb" : padBtn.background,
            borderColor: activeDir === "left" ? "#3b82f6" : padBtn.borderColor,
          }}
          onMouseDown={() => startMove("left", -1, 0)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("left", -1, 0)}
          onTouchEnd={stopMove}
          title="Pan Left"
        >
          ◀
        </button>
        <button
          type="button"
          style={stopBtn}
          onClick={stopMove}
          title="Parar movimento"
        >
          ■
        </button>
        <button
          type="button"
          style={{
            ...padBtn,
            background: activeDir === "right" ? "#2563eb" : padBtn.background,
            borderColor: activeDir === "right" ? "#3b82f6" : padBtn.borderColor,
          }}
          onMouseDown={() => startMove("right", 1, 0)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("right", 1, 0)}
          onTouchEnd={stopMove}
          title="Pan Right"
        >
          ▶
        </button>

        {/* Row 3: empty, DOWN, empty */}
        <div />
        <button
          type="button"
          style={{
            ...padBtn,
            background: activeDir === "down" ? "#2563eb" : padBtn.background,
            borderColor: activeDir === "down" ? "#3b82f6" : padBtn.borderColor,
          }}
          onMouseDown={() => startMove("down", 0, -1)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("down", 0, -1)}
          onTouchEnd={stopMove}
          title="Tilt Down"
        >
          ▼
        </button>
        <div />
      </div>

      {/* Zoom controls */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          type="button"
          style={zoomBtn}
          onClick={() => handleZoom(1)}
          title="Zoom In"
        >
          🔍+
        </button>
        <button
          type="button"
          style={zoomBtn}
          onClick={() => handleZoom(-1)}
          title="Zoom Out"
        >
          🔍−
        </button>
        <button
          type="button"
          style={{ ...zoomBtn, fontSize: 12 }}
          onClick={goHome}
          title="Posição Home"
        >
          🏠
        </button>
      </div>
    </fieldset>
  );
}
