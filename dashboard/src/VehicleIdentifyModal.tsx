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
  {
    icon: "📦",
    label: "Entrega / Encomenda",
    value: "É uma entrega/encomenda",
  },
  { icon: "🔧", label: "Serviço / Manutenção", value: "É serviço/manutenção" },
  { icon: "❌", label: "Não reconheço", value: "Não reconheço" },
];

// ── Component ──

function VehicleIdentifyModal({
  cameraId,
  description,
  onIdentify,
  onClose,
}: Props) {
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [snapshotTs] = useState(() => Date.now());
  const snapshotUrl = `/cameras/${cameraId}/snapshot?t=${snapshotTs}`;

  // Close on Escape + focus trap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Focus the modal on mount
    modalRef.current?.focus();
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = (value: string) => {
    if (value.endsWith(" ")) {
      setShowCustom(true);
      setCustomText(value);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSelected(value);
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
      className="vehicle-modal__backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="vehicle-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Identificar veículo ou pessoa"
        tabIndex={-1}
      >
        {/* Camera Snapshot */}
        <div className="vehicle-modal__snapshot">
          <img
            src={snapshotUrl}
            alt={`Câmera ${cameraId}`}
            className="vehicle-modal__snapshot-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="vehicle-modal__snapshot-header">
            <div className="vehicle-modal__snapshot-label">
              📷 Câmera {cameraId}
            </div>
          </div>
          <div className="vehicle-modal__snapshot-desc">
            <div className="vehicle-modal__snapshot-text">{description}</div>
          </div>
        </div>

        {/* Identification Options */}
        <div className="vehicle-modal__body">
          <div className="vehicle-modal__title">
            O que é este objeto/pessoa?
          </div>

          <div className="vehicle-modal__options">
            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                disabled={selected !== null}
                className={`vehicle-modal__option${
                  selected === opt.value
                    ? " vehicle-modal__option--selected"
                    : ""
                }${
                  selected && selected !== opt.value
                    ? " vehicle-modal__option--dimmed"
                    : ""
                }`}
                aria-label={opt.label}
              >
                <span className="vehicle-modal__option-icon">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Text Input */}
          {showCustom && (
            <div className="vehicle-modal__custom">
              <input
                ref={inputRef}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomSubmit();
                }}
                placeholder="Descreva..."
                className="vehicle-modal__custom-input"
              />
              <button
                onClick={handleCustomSubmit}
                className="camera-card__overlay-cta"
                style={{ borderRadius: 6 }}
              >
                Confirmar
              </button>
            </div>
          )}

          {/* Skip / Close */}
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: 11,
                cursor: "pointer",
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
