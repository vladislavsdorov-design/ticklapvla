import { useState } from "react";
import { push, ref } from "firebase/database";
import { db } from "../firebase";
import { today, cleanColors, sumColors, visibleColorIds } from "../utils";
import { useColors } from "../colorsContext";
import { ColorInputs } from "./Colors";

export default function IssueForm({ stock }) {
  const [name, setName] = useState("");
  const [colors, setColors] = useState({});
  const [date, setDate] = useState(today());

  const { colors: allColors, colorById } = useColors();
  const ids = visibleColorIds(stock.byColor, allColors);
  const hint = Object.fromEntries(
    ids.map((id) => [id, `na magazynie: ${stock.byColor[id]?.inStock ?? 0}`])
  );
  const total = sumColors(colors);

  const submit = async (e) => {
    e.preventDefault();
    const clean = cleanColors(colors);
    const n = sumColors(clean);
    if (!name.trim() || n <= 0) return;

    // Ostrzeżenie, jeśli któregoś koloru brakuje na magazynie
    const short = Object.entries(clean).filter(
      ([id, k]) => k > (stock.byColor[id]?.inStock ?? 0)
    );
    if (short.length > 0) {
      const lines = short
        .map(
          ([id, k]) =>
            `${colorById(id).label}: na magazynie ${stock.byColor[id]?.inStock ?? 0}, wydajesz ${k}`
        )
        .join("\n");
      if (!window.confirm(`Brakuje opasek:\n${lines}\n\nWydać mimo to?`)) return;
    }

    await push(ref(db, "shifts"), {
      faceControl: name.trim(),
      issuedColors: clean,
      issued: n,
      date,
      status: "open",
      createdAt: Date.now(),
    });
    setColors({});
  };

  return (
    <section className="block">
      <h2>Wydaj selekcjonerowi</h2>
      <form onSubmit={submit}>
        <div className="row">
          <input
            className="grow"
            placeholder="Imię selekcjonera"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <ColorInputs
          ids={ids}
          values={colors}
          hint={hint}
          onChange={(id, v) => setColors((c) => ({ ...c, [id]: v }))}
        />
        <div className="row">
          <button type="submit" disabled={!name.trim() || total <= 0}>
            Wydaj{total > 0 ? ` (${total})` : ""}
          </button>
        </div>
      </form>
    </section>
  );
}
