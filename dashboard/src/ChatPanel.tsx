import { useRef, useEffect } from "react";

interface Message {
  text: string;
  type: string;
  timestamp: Date;
}

function ChatPanel({ messages, connected }: { messages: Message[]; connected: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const typeStyle: Record<string, React.CSSProperties> = {
    info: { color: "#9ca3af", fontSize: 12 },
    observation: { color: "#60a5fa", borderLeft: "3px solid #3b82f6", paddingLeft: 8 },
    alert: { color: "#fbbf24", borderLeft: "3px solid #f59e0b", paddingLeft: 8 },
    threat: { color: "#f87171", borderLeft: "3px solid #ef4444", paddingLeft: 8, fontWeight: 600 },
    insight: { color: "#c084fc", borderLeft: "3px solid #a855f7", paddingLeft: 8, fontStyle: "italic" },
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{
        padding: "8px 12px", backgroundColor: "#1a2235",
        fontSize: 13, fontWeight: 600, borderBottom: "1px solid #1e293b",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        💬 Vigia
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: connected ? "#22c55e" : "#ef4444", display: "inline-block" }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            Aguardando eventos...
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ ...typeStyle[msg.type] || typeStyle.info, padding: "4px 0" }}>
            <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 2 }}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ChatPanel;
