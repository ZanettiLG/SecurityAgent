function StatusBar({
  connected,
  eventsCount,
  camerasOnline,
  threats,
}: {
  connected: boolean;
  eventsCount: number;
  camerasOnline: number;
  threats: number;
}) {
  return (
    <footer className="status-bar">
      <span
        className={
          connected
            ? "status-bar__item status-bar__item--connected"
            : "status-bar__item status-bar__item--disconnected"
        }
      >
        {connected ? "🟢" : "🔴"} {connected ? "Conectado" : "Desconectado"}
      </span>
      <span className="status-bar__item">📷 {camerasOnline}/2 câmeras</span>
      <span className="status-bar__item">⚠️ {threats} ameaças</span>
      <span className="status-bar__item">📊 {eventsCount} eventos hoje</span>
      <span className="status-bar__model">🧠 MiniCPM-V 4.6</span>
    </footer>
  );
}

export default StatusBar;
