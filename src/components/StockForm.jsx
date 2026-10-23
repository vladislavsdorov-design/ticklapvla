import { useState } from "react";
import { push, ref, remove } from "firebase/database";
import { db } from "../firebase";
import { today, fmtDate, cleanColors, sumColors, incomeColors } from "../utils";
import { useColors } from "../colorsContext";
import { Chips, ColorInputs } from "./Colors";

export default function StockForm({ incomes }) {
  const { colors } = useColors();
  const [vals, setVals] = useState({});
  const [note, setNote] = useState("");

  const total = sumColors(vals);

  const submit = async (e) => {
    e.preventDefault();
    const clean = cleanColors(vals);
    const n = sumColors(clean);
    if (n <= 0) return;
    await push(ref(db, "incomes"), {
      colors: clean,
      amount: n,
      note: note.trim(),
      date: today(),
      createdAt: Date.now(),
    });
    setVals({});
    setNote("");
  };

  const del = (id) => {
    if (window.confirm("Usunąć przyjęcie?")) remove(ref(db, `incomes/${id}`));
  };

  return (
    <section className="block">
      <h2>Przyjęcie biletów <span className="count">{incomes.length}</span></h2>
      <form onSubmit={submit}>
        <ColorInputs
          ids={colors.map((c) => c.id)}
          values={vals}
          onChange={(id, v) => setVals((x) => ({ ...x, [id]: v }))}
        />
        <div className="row">
          <input
            className="grow"
            placeholder="Komentarz (opcjonalnie)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="submit" disabled={total <= 0}>
            Dodaj{total > 0 ? ` (${total})` : ""}
          </button>
        </div>
      </form>

      {incomes.length > 0 && (
        <ul className="list">
          {incomes.map((i) => (
            <li key={i.id}>
              <span>
                {fmtDate(i.date)} — <b>+{i.amount}</b> {i.note && `(${i.note})`}
                <div className="shift-colors">
                  <Chips data={incomeColors(i)} />
                </div>
              </span>
              <button className="ghost" onClick={() => del(i.id)} aria-label="Usuń">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
