import { useState, useCallback, useRef, type CSSProperties } from "react";
import { useMediaQuery } from "./lib/useMediaQuery";

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

// ── Component ──

interface Props {
  cameraId: string;
  visible: boolean;
  onClose: () => void;
}

export default function PTZControls({ cameraId, visible, onClose }: Props) {
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const moveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

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

  const btnClass = (dir: string) =>
    `ptz-controls__btn${activeDir === dir ? " ptz-controls__btn--active" : ""}`;

  const btnStyle = (dir: string): CSSProperties | undefined =>
    activeDir === dir
      ? { background: "#2563eb", borderColor: "#3b82f6" }
      : undefined;

  // ── Mobile: horizontal bottom-sheet layout ──
  if (isMobile) {
    return (
      <div className="ptz-controls--mobile" onTouchEnd={stopMove}>
        <button
          type="button"
          onClick={onClose}
          className="ptz-controls__close"
          aria-label="Fechar controles PTZ"
        >
          ✕
        </button>

        <div className="ptz-controls--mobile ptz-controls__dir-row">
          <button
            type="button"
            className={btnClass("left")}
            style={btnStyle("left")}
            onMouseDown={() => startMove("left", -1, 0)}
            onMouseUp={stopMove}
            onTouchStart={() => startMove("left", -1, 0)}
            onTouchEnd={stopMove}
            aria-label="Pan Left"
          >
            ◀
          </button>
          <button
            type="button"
            className={btnClass("up")}
            style={btnStyle("up")}
            onMouseDown={() => startMove("up", 0, 1)}
            onMouseUp={stopMove}
            onTouchStart={() => startMove("up", 0, 1)}
            onTouchEnd={stopMove}
            aria-label="Tilt Up"
          >
            ▲
          </button>
          <button
            type="button"
            className="ptz-controls__btn ptz-controls__btn--stop"
            onClick={stopMove}
            aria-label="Parar movimento"
          >
            ■
          </button>
          <button
            type="button"
            className={btnClass("down")}
            style={btnStyle("down")}
            onMouseDown={() => startMove("down", 0, -1)}
            onMouseUp={stopMove}
            onTouchStart={() => startMove("down", 0, -1)}
            onTouchEnd={stopMove}
            aria-label="Tilt Down"
          >
            ▼
          </button>
          <button
            type="button"
            className={btnClass("right")}
            style={btnStyle("right")}
            onMouseDown={() => startMove("right", 1, 0)}
            onMouseUp={stopMove}
            onTouchStart={() => startMove("right", 1, 0)}
            onTouchEnd={stopMove}
            aria-label="Pan Right"
          >
            ▶
          </button>
        </div>

        <div className="ptz-controls__zoom-row">
          <button
            type="button"
            className="ptz-controls__zoom-btn"
            onClick={() => handleZoom(1)}
            aria-label="Zoom In"
          >
            🔍+
          </button>
          <button
            type="button"
            className="ptz-controls__zoom-btn"
            onClick={() => handleZoom(-1)}
            aria-label="Zoom Out"
          >
            🔍−
          </button>
          <button
            type="button"
            className="ptz-controls__zoom-btn"
            style={{ fontSize: 12 }}
            onClick={goHome}
            aria-label="Posição Home"
          >
            🏠
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop: absolute d-pad layout ──
  return (
    <fieldset
      className="ptz-controls"
      aria-label="Controles PTZ da câmera"
      onMouseLeave={stopMove}
      onTouchEnd={stopMove}
    >
      <button
        type="button"
        onClick={onClose}
        className="ptz-controls__close"
        aria-label="Fechar controles PTZ"
      >
        ✕
      </button>

      <div className="ptz-controls__pad">
        <div />
        <button
          type="button"
          className={btnClass("up")}
          style={btnStyle("up")}
          onMouseDown={() => startMove("up", 0, 1)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("up", 0, 1)}
          onTouchEnd={stopMove}
          aria-label="Tilt Up"
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          className={btnClass("left")}
          style={btnStyle("left")}
          onMouseDown={() => startMove("left", -1, 0)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("left", -1, 0)}
          onTouchEnd={stopMove}
          aria-label="Pan Left"
        >
          ◀
        </button>
        <button
          type="button"
          className="ptz-controls__btn ptz-controls__btn--stop"
          onClick={stopMove}
          aria-label="Parar movimento"
        >
          ■
        </button>
        <button
          type="button"
          className={btnClass("right")}
          style={btnStyle("right")}
          onMouseDown={() => startMove("right", 1, 0)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("right", 1, 0)}
          onTouchEnd={stopMove}
          aria-label="Pan Right"
        >
          ▶
        </button>

        <div />
        <button
          type="button"
          className={btnClass("down")}
          style={btnStyle("down")}
          onMouseDown={() => startMove("down", 0, -1)}
          onMouseUp={stopMove}
          onTouchStart={() => startMove("down", 0, -1)}
          onTouchEnd={stopMove}
          aria-label="Tilt Down"
        >
          ▼
        </button>
        <div />
      </div>

      <div className="ptz-controls__zoom-row">
        <button
          type="button"
          className="ptz-controls__zoom-btn"
          onClick={() => handleZoom(1)}
          aria-label="Zoom In"
        >
          🔍+
        </button>
        <button
          type="button"
          className="ptz-controls__zoom-btn"
          onClick={() => handleZoom(-1)}
          aria-label="Zoom Out"
        >
          🔍−
        </button>
        <button
          type="button"
          className="ptz-controls__zoom-btn"
          style={{ fontSize: 12 }}
          onClick={goHome}
          aria-label="Posição Home"
        >
          🏠
        </button>
      </div>
    </fieldset>
  );
}
