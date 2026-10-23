export default function Loader({ text = "Ładowanie…" }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="spinner">
        <span /><span /><span />
      </div>
      <p className="muted">{text}</p>
    </div>
  );
}
