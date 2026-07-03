import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──

interface Props {
  cameraId: string;
  snapshotPath?: string;
  description: string;
  eventTimestamp?: Date;
  onIdentify: (cameraId: string, identification: string) => void;
  onClose: () => void;
}

const GROUP_KNOWN = [
  { icon: "🚗", label: "É o meu carro", value: "É o meu carro" },
  { icon: "👤", label: "Conheço essa pessoa", value: "Conheço essa pessoa: " },
  {
    icon: "📦",
    label: "Entrega / Encomenda",
    value: "É uma entrega/encomenda",
  },
];

const GROUP_UNKNOWN = [
  { icon: "🔧", label: "Serviço / Manutenção", value: "É serviço/manutenção" },
  { icon: "❌", label: "Não reconheço", value: "Não reconheço" },
];

const ALL_OPTIONS = [...GROUP_KNOWN, ...GROUP_UNKNOWN];

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "agora";
  if (secs < 60) return `há ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `há ${mins}min`;
  return `há ${Math.floor(mins / 60)}h`;
}

// ── Component ──

function VehicleIdentifyModal({
  cameraId,
  description,
  eventTimestamp,
  onIdentify,
  onClose,
}: Props) {
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const [snapshotTs] = useState(() => Date.now());
  const snapshotUrl = `/cameras/${cameraId}/snapshot?t=${snapshotTs}`;

  // Save previous focus + focus trap
  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Keyboard shortcuts 1-5
      if (e.key >= "1" && e.key <= "5" && !showCustom && !selected) {
        const idx = parseInt(e.key) - 1;
        if (idx < ALL_OPTIONS.length) {
          handleSelect(ALL_OPTIONS[idx].value);
        }
        return;
      }

      // Focus trap: Tab cycles within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      // Restore focus
      prevFocusRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, showCustom, selected]);

  const handleSelect = useCallback(
    (value: string) => {
      if (value.endsWith(" ")) {
        setShowCustom(true);
        setCustomText(value);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setSelected(value);
        setTimeout(() => onIdentify(cameraId, value), 300);
      }
    },
    [cameraId, onIdentify],
  );

  const handleCustomSubmit = useCallback(() => {
    const text = customText.trim();
    if (!text) return;
    setSelected(text);
    setTimeout(() => onIdentify(cameraId, text), 300);
  }, [cameraId, customText, onIdentify]);

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
        aria-label={`Identificar: ${description}`}
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
          {/* Dismiss button */}
          <button
            type="button"
            className="vehicle-modal__dismiss"
            onClick={onClose}
            aria-label="Fechar sem classificar"
          >
            ✕
          </button>
          <div className="vehicle-modal__snapshot-header">
            <div className="vehicle-modal__snapshot-label">
              📷 Câmera {cameraId}
            </div>
          </div>
          <div className="vehicle-modal__snapshot-desc">
            <div className="vehicle-modal__snapshot-text">{description}</div>
            {eventTimestamp && (
              <div className="vehicle-modal__timestamp">
                📸 {timeAgo(eventTimestamp)}
              </div>
            )}
          </div>
        </div>

        {/* Identification Options */}
        <div className="vehicle-modal__body">
          <div className="vehicle-modal__title">
            O que é este objeto/pessoa?
          </div>

          {/* Group: Conheço */}
          <div className="vehicle-modal__group">
            <div className="vehicle-modal__group-label">Conheço</div>
            {GROUP_KNOWN.map((opt, i) => (
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
                <span className="vehicle-modal__kbd">{i + 1}</span>
              </button>
            ))}
          </div>

          {/* Group: Desconheço / Outro */}
          <div className="vehicle-modal__group">
            <div className="vehicle-modal__group-label">Desconheço / Outro</div>
            {GROUP_UNKNOWN.map((opt, i) => (
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
                <span className="vehicle-modal__kbd">
                  {GROUP_KNOWN.length + i + 1}
                </span>
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
        </div>
      </div>
    </div>
  );
}

export default VehicleIdentifyModal;
