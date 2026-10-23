import { useColors } from "../colorsContext";

export function Dot({ id }) {
  const { colorById } = useColors();
  const c = colorById(id);
  return <i className="dot" style={{ background: c.hex }} title={c.label} />;
}

// Kolorowe "pigułki": ● Czerwona 10
export function Chips({ data }) {
  const { colorById } = useColors();
  const entries = Object.entries(data || {}).filter(([, n]) => n !== 0);
  if (entries.length === 0) return <span className="muted">—</span>;
  return (
    <span className="chips">
      {entries.map(([id, n]) => (
        <span className="chip" key={id}>
          <Dot id={id} />
          {colorById(id).label} <b>{n}</b>
        </span>
      ))}
    </span>
  );
}

// Siatka pól "ile sztuk danego koloru"
export function ColorInputs({ ids, values, onChange, max, hint }) {
  const { colors, colorById } = useColors();
  ids = ids ?? colors.map((c) => c.id);
  return (
    <div className="color-grid">
      {ids.map((id) => {
        const c = colorById(id);
        return (
          <label className="color-cell" key={id}>
            <span className="color-name">
              <Dot id={id} />
              {c.label}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={max?.[id]}
              placeholder="0"
              value={values[id] ?? ""}
              onChange={(e) => onChange(id, e.target.value)}
            />
            {hint?.[id] !== undefined && <span className="color-hint">{hint[id]}</span>}
          </label>
        );
      })}
    </div>
  );
}
