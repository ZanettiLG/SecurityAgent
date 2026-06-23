function CameraGrid() {
  const cameras = [
    { id: "externa", name: "Intelbras iM7 — Externa", online: true },
    { id: "interna", name: "Yoosee — Interna", online: false },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 12, height: "100%" }}>
      {cameras.map((cam) => (
        <div key={cam.id} style={{
          backgroundColor: "#111827", borderRadius: 8, overflow: "hidden",
          border: `2px solid ${cam.online ? "#1e293b" : "#374151"}`,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "6px 12px", backgroundColor: "#1a2235",
            fontSize: 12, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: cam.online ? "#22c55e" : "#6b7280",
              display: "inline-block",
            }} />
            {cam.name}
          </div>
          <div style={{ flex: 1, backgroundColor: "#000", position: "relative", minHeight: 200 }}>
            {cam.online ? (
              <img
                src={`/cameras/${cam.id}/snapshot?t=${Date.now()}`}
                alt={cam.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => {
                  // Retry on load error
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                }}
              />
            ) : (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100%", color: "#6b7280", fontSize: 14,
              }}>
                ⚫ Câmera offline
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CameraGrid;
