interface TimelineEvent {
  description: string;
  timestamp: Date;
  severity: number;
  cameraId: string;
}

const SEV_COLORS: Record<number, string> = {
  0: "#22c55e",
  1: "#22c55e",
  2: "#fbbf24",
  3: "#f97316",
  4: "#ef4444",
};

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="timeline">
      <div className="timeline__header">📋 Timeline</div>
      <div className="timeline__list">
        {events.length === 0 && (
          <div className="timeline__empty">Nenhum evento ainda</div>
        )}
        {events.map((ev, i) => (
          <div key={i} className="timeline__item">
            <span
              className="timeline__dot"
              style={{ backgroundColor: SEV_COLORS[ev.severity] || "#6b7280" }}
            />
            <span className="timeline__time">
              {new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(ev.timestamp)}
            </span>
            <span className="timeline__desc">{ev.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
