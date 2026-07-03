import { useRef, useEffect, useState, useCallback } from "react";

// ── Types ──

interface Message {
  id: string;
  text: string;
  type: string;
  timestamp: Date;
  canReply?: boolean;
  cameraId?: string;
  eventType?: string;
  snapshotPath?: string;
  quickReplies?: Array<{ label: string; value: string }>;
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

// ── Component ──

const MSG_BG: Record<string, string> = {
  observation: "rgba(59,130,246,0.08)",
  alert: "rgba(245,158,11,0.08)",
  insight: "rgba(168,85,247,0.08)",
  info: "transparent",
};

function ChatPanel({
  messages,
  connected,
  onReply,
  onQuickReply,
  activeAlerts,
  onOpenIdentify,
  motionSummary,
}: {
  messages: Message[];
  connected: boolean;
  onReply: (messageId: string, answer: string) => void;
  onQuickReply?: (messageId: string, value: string) => void;
  activeAlerts?: ActiveAlert[];
  onOpenIdentify?: (alertId: string) => void;
  motionSummary?: MotionSummary[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [userScrolling, setUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Smart auto-scroll: pause when user is scrolling manually
  useEffect(() => {
    if (!userScrolling && messages.length > 0) {
      const el = scrollRef.current;
      if (el) {
        const isNearBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (isNearBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
      }
    }
  }, [messages, userScrolling]);

  const handleScroll = useCallback(() => {
    setUserScrolling(true);
    if (userScrollTimeoutRef.current)
      clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(
      () => setUserScrolling(false),
      3000,
    );
  }, []);

  const handleReply = (msgId: string) => {
    if (!replyText.trim()) return;
    onReply(msgId, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
    setUserScrolling(false);
  };

  const handleQuickReply = (msgId: string, value: string) => {
    onQuickReply?.(msgId, value);
    setReplyingTo(null);
    setUserScrolling(false);
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel__header">
        💬 Vigia
        <span
          className={`chat-panel__dot${
            connected
              ? " chat-panel__dot--connected"
              : " chat-panel__dot--disconnected"
          }`}
        />
        {userScrolling && (
          <span className="chat-panel__scroll-hint">⬇️ Rolar para baixo</span>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="chat-panel__alerts">
          <div className="chat-panel__alerts-title">
            ⚡ Alertas Ativos ({activeAlerts.length})
          </div>
          {activeAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className="chat-panel__alert-item"
              onClick={() => onOpenIdentify?.(alert.id)}
              role="button"
              tabIndex={0}
              aria-label={`Alerta: ${alert.description}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  onOpenIdentify?.(alert.id);
              }}
            >
              <span className="chat-panel__alert-icon">
                {alert.eventType === "vehicle_detected" ? "🚗" : "👤"}
              </span>
              <div className="chat-panel__alert-body">
                <div className="chat-panel__alert-desc">
                  {alert.description}
                </div>
                <div className="chat-panel__alert-meta">
                  📷 {alert.cameraId} · {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <span className="chat-panel__alert-cta">Identificar →</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-panel__messages"
      >
        {messages.length === 0 && (
          <div className="chat-panel__empty">Aguardando eventos...</div>
        )}

        {messages.map((msg) => {
          const msgClass = `chat-panel__msg chat-panel__msg--${msg.type || "info"}${
            msg.canReply ? " chat-panel__msg--can-reply" : ""
          }`;
          const bg = MSG_BG[msg.type] || "transparent";

          return (
            <div
              key={msg.id}
              className={msgClass}
              style={{
                backgroundColor:
                  replyingTo === msg.id ? "rgba(59,130,246,0.15)" : bg,
              }}
              onClick={() =>
                msg.canReply && !replyingTo && setReplyingTo(msg.id)
              }
              role={
                msg.type === "threat" || msg.type === "alert"
                  ? "status"
                  : undefined
              }
              aria-label={
                msg.type === "threat" || msg.type === "alert"
                  ? `Alerta: ${msg.text}`
                  : undefined
              }
            >
              <div className="chat-panel__msg-time">
                {msg.timestamp.toLocaleTimeString()}
                {msg.cameraId && (
                  <span className="chat-panel__msg-camera">
                    📷 {msg.cameraId}
                  </span>
                )}
              </div>
              {msg.text}

              {/* Quick Reply Buttons */}
              {msg.canReply && msg.quickReplies && replyingTo !== msg.id && (
                <div className="chat-panel__quick-replies">
                  {msg.quickReplies.map((qr) => (
                    <button
                      key={qr.value}
                      className="chat-panel__quick-reply"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (qr.value.endsWith(" ")) {
                          setReplyingTo(msg.id);
                          setReplyText(qr.value);
                        } else {
                          handleQuickReply(msg.id, qr.value);
                        }
                      }}
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Text Input Reply */}
              {replyingTo === msg.id && (
                <div
                  className="chat-panel__reply-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) handleReply(msg.id);
                      if (e.key === "Escape") {
                        setReplyingTo(null);
                        setReplyText("");
                      }
                    }}
                    placeholder='Ex: "É o meu carro", "É a dona Olinda"...'
                    className="chat-panel__reply-input"
                  />
                  <button
                    onClick={() => handleReply(msg.id)}
                    className="camera-card__overlay-cta"
                    style={{
                      borderRadius: 4,
                      fontSize: 11,
                      padding: "6px 12px",
                    }}
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Motion Activity Indicator */}
        {motionSummary && motionSummary.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px",
              borderRadius: 4,
              color: "#6b7280",
              fontSize: 11,
              backgroundColor: "rgba(34,197,94,0.05)",
              borderLeft: "2px solid rgba(34,197,94,0.3)",
            }}
          >
            <span style={{ animation: "pulse 1.5s infinite" }}>🟢</span>
            <span>
              {motionSummary.reduce((sum, m) => sum + m.count, 0)} detecções de
              movimento
              {motionSummary.length === 1 &&
                ` (média ${(motionSummary[0].avgChangeRatio * 100).toFixed(1)}%)`}
            </span>
          </div>
        )}

        <div style={{ flexShrink: 0, height: 1 }} />
      </div>
    </div>
  );
}

export default ChatPanel;
