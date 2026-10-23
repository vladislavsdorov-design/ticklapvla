import { useState } from "react";
import { push, ref, remove } from "firebase/database";
import { db } from "../firebase";
import { useColors } from "../colorsContext";
import { DEFAULT_COLORS } from "../utils";
import { Dot } from "./Colors";

export default function ColorManager({ stock }) {
  const { colors } = useColors();
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("#ff7a00");

  const add = async (e) => {
    e.preventDefault();
    const name = label.trim();
    if (!name) return;
    if (colors.some((c) => c.label.toLowerCase() === name.toLowerCase())) {
      alert("Taki kolor już istnieje.");
      return;
    }
    await push(ref(db, "colors"), { label: name, hex, createdAt: Date.now() });
    setLabel("");
  };

  const isDefault = (id) => DEFAULT_COLORS.some((c) => c.id === id);
  const inUse = (id) => {
    const r = stock.byColor[id];
    return !!r && (r.received || r.issued || r.returned);
  };

  const del = (c) => {
    if (window.confirm(`Usunąć kolor „${c.label}”?`)) remove(ref(db, `colors/${c.id}`));
  };

  return (
    <section className="block">
      <h2>Kolory opasek</h2>
      <form onSubmit={add} className="row">
        <input
          type="color"
          className="color-pick"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          aria-label="Wybierz kolor"
        />
        <input
          className="grow"
          placeholder="Nazwa nowego koloru (np. Pomarańczowa)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="submit" disabled={!label.trim()}>Dodaj kolor</button>
      </form>

      <ul className="list">
        {colors.map((c) => (
          <li key={c.id}>
            <span className="list-main">
              <Dot id={c.id} />
              <span>{c.label}</span>
              {isDefault(c.id) && <span className="muted">podstawowy</span>}
            </span>
            {!isDefault(c.id) &&
              (inUse(c.id) ? (
                <span className="muted small-inline">używany</span>
              ) : (
                <button className="icon" onClick={() => del(c)} aria-label="Usuń kolor" title="Usuń">
                  ✕
                </button>
              ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
