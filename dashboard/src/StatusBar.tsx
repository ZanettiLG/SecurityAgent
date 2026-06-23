function StatusBar({ connected, eventsCount, camerasOnline, threats }: {
  connected: boolean;
  eventsCount: number;
  camerasOnline: number;
  threats: number;
}) {
  return (
    <footer style={{
      padding: "4px 16px", backgroundColor: "#111827",
      borderTop: "1px solid #1e293b", display: "flex", gap: 24,
      fontSize: 11, color: "#64748b", flexShrink: 0,
    }}>
      <span style={{ color: connected ? "#22c55e" : "#ef4444" }}>
        {connected ? "🟢" : "🔴"} {connected ? "Conectado" : "Desconectado"}
      </span>
      <span>📷 {camerasOnline}/2 câmeras</span>
      <span>⚠️ {threats} ameaças</span>
      <span>📊 {eventsCount} eventos hoje</span>
      <span style={{ marginLeft: "auto" }}>🧠 MiniCPM-V 4.6</span>
    </footer>
  );
}

export default StatusBar;
