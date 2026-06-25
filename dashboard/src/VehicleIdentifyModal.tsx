import { useState, useRef, useEffect } from "react";

// ── Types ──

interface Props {
  cameraId: string;
  snapshotPath?: string;
  description: string;
  onIdentify: (cameraId: string, identification: string) => void;
  onClose: () => void;
}

const QUICK_OPTIONS = [
  { icon: "🚗", label: "É o meu carro", value: "É o meu carro" },
  { icon: "👤", label: "Conheço essa pessoa", value: "Conheço essa pessoa: " },
  { icon: "📦", label: "Entrega / Encomenda", value: "É uma entrega/encomenda" },
  { icon: "🔧", label: "Serviço / Manutenção", value: "É serviço/manutenção" },
  { icon: "❌", label: "Não reconheço", value: "Não reconheço" },
];

// ── Component ──

function VehicleIdentifyModal({ cameraId, snapshotPath, description, onIdentify, onClose }: Props) {
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const snapshotUrl = `/cameras/${cameraId}/snapshot?t=${Date.now()}`;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = (value: string) => {
    if (value.endsWith(" ")) {
      // Needs text input
      setShowCustom(true);
      setCustomText(value);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSelected(value);
      // Brief delay for visual feedback
      setTimeout(() => onIdentify(cameraId, value), 300);
    }
  };

  const handleCustomSubmit = () => {
    const text = customText.trim();
    if (!text) return;
    setSelected(text);
    setTimeout(() => onIdentify(cameraId, text), 300);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#111827", borderRadius: 12,
          border: "1px solid #1e293b",
          maxWidth: 480, width: "90%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* ── Camera Snapshot ── */}
        <div style={{ position: "relative", backgroundColor: "#000", height: 240 }}>
          <img
            src={snapshotUrl}
            alt={`Câmera ${cameraId}`}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            background: "linear-gradient(rgba(0,0,0,0.7), transparent)",
            padding: "12px 16px",
          }}>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>
              📷 Câmera {cameraId}
            </div>
          </div>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
            padding: "20px 16px 10px",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>
              {description}
            </div>
          </div>
        </div>

        {/* ── Identification Options ── */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
            O que é este objeto/pessoa?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                disabled={selected !== null}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8,
                  border: selected === opt.value ? "1px solid #3b82f6" : "1px solid #1e293b",
                  backgroundColor: selected === opt.value ? "rgba(59,130,246,0.15)" : "#0f172a",
                  color: "#e2e8f0", fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: selected && selected !== opt.value ? 0.4 : 1,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.1)";
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.backgroundColor = "#0f172a";
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* ── Custom Text Input ── */}
          {showCustom && (
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <input
                ref={inputRef}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit(); }}
                placeholder="Descreva..."
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 6,
                  border: "1px solid #3b82f6",
                  backgroundColor: "#1e293b", color: "#e2e8f0",
                  fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={handleCustomSubmit}
                style={{
                  padding: "8px 16px", borderRadius: 6, border: "none",
                  backgroundColor: "#3b82f6", color: "#fff",
                  fontSize: 12, cursor: "pointer", fontWeight: 500,
                }}
              >
                Confirmar
              </button>
            </div>
          )}

          {/* ── Skip / Close ── */}
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none",
                color: "#6b7280", fontSize: 11, cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              Ignorar por enquanto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleIdentifyModal;
