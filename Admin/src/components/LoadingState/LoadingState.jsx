import "./LoadingState.css";

export default function LoadingState({ label = "Loading...", count = 4, type = "skeleton" }) {
  if (type === "spinner") {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="loading-skeleton-container" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="item" key={i}>
          <div className="av sk" />
          <div style={{ flex: 1 }}>
            <div className="t sk w1" />
            <div className="t sk w2" />
          </div>
        </div>
      ))}
      {label && <p className="loading-skeleton-hint">{label}</p>}
    </div>
  );
}
