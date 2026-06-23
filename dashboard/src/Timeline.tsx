interface TimelineEvent {
  description: string;
  timestamp: Date;
  severity: number;
  cameraId: string;
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  const sevColor: Record<number, string> = { 0: "#22c55e", 1: "#22c55e", 2: "#fbbf24", 3: "#f97316", 4: "#ef4444" };

  return (
    <div style={{ height: 200, borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "6px 12px", backgroundColor: "#1a2235",
        fontSize: 12, fontWeight: 600, borderBottom: "1px solid #1e293b",
      }}>
        📋 Timeline
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "6px 12px" }}>
        {events.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: 11, padding: 8 }}>
            Nenhum evento ainda
          </div>
        )}
        {events.map((ev, i) => (
          <div key={i} style={{
            padding: "4px 0", borderBottom: "1px solid #1e293b",
            display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              backgroundColor: sevColor[ev.severity] || "#6b7280",
              marginTop: 4, flexShrink: 0,
            }} />
            <span style={{ color: "#6b7280", flexShrink: 0 }}>{ev.timestamp.toLocaleTimeString()}</span>
            <span style={{ flex: 1 }}>{ev.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
