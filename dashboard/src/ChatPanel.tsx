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

function ChatPanel({ messages, connected, onReply, onQuickReply, activeAlerts, onOpenIdentify, motionSummary }: {
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
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smart auto-scroll: pause when user is scrolling manually
  useEffect(() => {
    if (!userScrolling && messages.length > 0) {
      const el = scrollRef.current;
      if (el) {
        // Only auto-scroll if user was already near the bottom
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (isNearBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
      }
    }
  }, [messages, userScrolling]);

  // Detect user scroll
  const handleScroll = useCallback(() => {
    setUserScrolling(true);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => setUserScrolling(false), 3000);
  }, []);

  const handleReply = (msgId: string) => {
    if (!replyText.trim()) return;
    onReply(msgId, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
    setUserScrolling(false); // Resume auto-scroll after reply
  };

  const handleQuickReply = (msgId: string, value: string) => {
    onQuickReply?.(msgId, value);
    setReplyingTo(null);
    setUserScrolling(false);
  };

  const typeStyle: Record<string, React.CSSProperties> = {
    info: { color: "#9ca3af", fontSize: 12 },
    observation: { color: "#60a5fa", borderLeft: "3px solid #3b82f6", paddingLeft: 8 },
    alert: { color: "#fbbf24", borderLeft: "3px solid #f59e0b", paddingLeft: 8 },
    threat: { color: "#f87171", borderLeft: "3px solid #ef4444", paddingLeft: 8, fontWeight: 600 },
    insight: { color: "#c084fc", borderLeft: "3px solid #a855f7", paddingLeft: 8, fontStyle: "italic" },
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* ── Header ── */}
      <div style={{
        padding: "8px 12px", backgroundColor: "#1a2235",
        fontSize: 13, fontWeight: 600, borderBottom: "1px solid #1e293b",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        💬 Vigia
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: connected ? "#22c55e" : "#ef4444", display: "inline-block" }} />
        {userScrolling && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#6b7280" }}>⬇️ Rolar para baixo</span>
        )}
      </div>

      {/* ── Active Alerts Section ── */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div style={{
          padding: "8px 12px", backgroundColor: "rgba(59,130,246,0.05)",
          borderBottom: "1px solid #1e293b",
        }}>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            ⚡ Alertas Ativos ({activeAlerts.length})
          </div>
          {activeAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              onClick={() => onOpenIdentify?.(alert.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", borderRadius: 4, marginBottom: 4,
                backgroundColor: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.15)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.08)"}
            >
              <span style={{ fontSize: 16 }}>
                {alert.eventType === "vehicle_detected" ? "🚗" : "👤"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {alert.description}
                </div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>
                  📷 {alert.cameraId} · {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#60a5fa", flexShrink: 0 }}>Identificar →</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            Aguardando eventos...
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => msg.canReply && !replyingTo && setReplyingTo(msg.id)}
            style={{
              ...typeStyle[msg.type] || typeStyle.info,
              padding: "6px 8px", borderRadius: 4,
              backgroundColor: msg.type === "observation" ? "rgba(59,130,246,0.08)"
                : msg.type === "alert" ? "rgba(245,158,11,0.08)"
                : msg.type === "insight" ? "rgba(168,85,247,0.08)"
                : "transparent",
              cursor: msg.canReply ? "pointer" : "default",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (msg.canReply) e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.15)";
            }}
            onMouseLeave={(e) => {
              if (msg.canReply && replyingTo !== msg.id) {
                e.currentTarget.style.backgroundColor = msg.type === "observation" ? "rgba(59,130,246,0.08)" : "transparent";
              }
            }}
          >
            <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 2 }}>
              {msg.timestamp.toLocaleTimeString()}
              {msg.cameraId && <span style={{ marginLeft: 6, color: "#6b7280" }}>📷 {msg.cameraId}</span>}
            </div>
            {msg.text}

            {/* ── Quick Reply Buttons ── */}
            {msg.canReply && msg.quickReplies && replyingTo !== msg.id && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {msg.quickReplies.map((qr) => (
                  <button
                    key={qr.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (qr.value.endsWith(" ")) {
                        // Open text input for partial replies
                        setReplyingTo(msg.id);
                        setReplyText(qr.value);
                      } else {
                        handleQuickReply(msg.id, qr.value);
                      }
                    }}
                    style={{
                      fontSize: 11, padding: "4px 8px", borderRadius: 4,
                      border: "1px solid rgba(59,130,246,0.3)",
                      backgroundColor: "rgba(59,130,246,0.1)",
                      color: "#93c5fd", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.25)";
                      e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.1)";
                      e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                    }}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Text Input Reply ── */}
            {replyingTo === msg.id && (
              <div style={{ marginTop: 6, display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleReply(msg.id);
                    if (e.key === "Escape") { setReplyingTo(null); setReplyText(""); }
                  }}
                  placeholder='Ex: "É o meu carro", "É a dona Olinda"...'
                  style={{
                    flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #3b82f6",
                    backgroundColor: "#1e293b", color: "#e2e8f0", fontSize: 12, outline: "none",
                  }}
                />
                <button
                  onClick={() => handleReply(msg.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 4, border: "none",
                    backgroundColor: "#3b82f6", color: "#fff", fontSize: 11, cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Enviar
                </button>
              </div>
            )}
          </div>
        ))}

        {/* ── Motion Activity Indicator ── */}
        {motionSummary && motionSummary.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 8px", borderRadius: 4,
            color: "#6b7280", fontSize: 11,
            backgroundColor: "rgba(34,197,94,0.05)",
            borderLeft: "2px solid rgba(34,197,94,0.3)",
          }}>
            <span style={{ animation: "pulse 1.5s infinite" }}>🟢</span>
            <span>
              {motionSummary.reduce((sum, m) => sum + m.count, 0)} detecções de movimento
              {motionSummary.length === 1 && ` (média ${(motionSummary[0].avgChangeRatio * 100).toFixed(1)}%)`}
            </span>
          </div>
        )}

        <div style={{ flexShrink: 0, height: 1 }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default ChatPanel;
