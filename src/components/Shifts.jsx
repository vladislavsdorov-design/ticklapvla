import { useState } from "react";
import { ref, remove as dbRemove, update } from "firebase/database";
import { db } from "../firebase";
import {
  fmtDate,
  cleanColors,
  issuedColors,
  returnedColors,
  usedColors,
} from "../utils";
import { useColors } from "../colorsContext";
import { Chips, ColorInputs } from "./Colors";

function ShiftRow({ s }) {
  const { colorById } = useColors();
  const [vals, setVals] = useState({});

  const issued = issuedColors(s);
  const issuedIds = Object.keys(issued).filter((id) => issued[id] > 0);

  const close = async () => {
    // puste pole = 0 zwrotów tego koloru
    for (const id of issuedIds) {
      const r = Number(vals[id] || 0);
      if (!Number.isInteger(r) || r < 0 || r > issued[id]) {
        alert(`${colorById(id).label}: wpisz liczbę od 0 do ${issued[id]}`);
        return;
      }
    }
    const back = cleanColors(vals);
    const total = Object.values(back).reduce((a, b) => a + b, 0);
    await update(ref(db, `shifts/${s.id}`), {
      returnedColors: back,
      returned: total,
      status: "closed",
      closedAt: Date.now(),
    });
    setVals({});
  };

  const reopen = () =>
    update(ref(db, `shifts/${s.id}`), {
      returned: null,
      returnedColors: null,
      status: "open",
      closedAt: null,
    });

  const del = () => {
    if (window.confirm("Usunąć tę zmianę?")) dbRemove(ref(db, `shifts/${s.id}`));
  };

  return (
    <div className={`shift ${s.status}`}>
      <div className="shift-head">
        <b>{s.faceControl}</b>
        <span className="muted">{fmtDate(s.date)}</span>
      </div>

      <div className="shift-nums">
        <div>
          <span className="label">Wydano</span>
          <b>{s.issued}</b>
          <div className="shift-colors"><Chips data={issued} /></div>
        </div>
        {s.status === "closed" ? (
          <>
            <div>
              <span className="label">Zwrócił</span>
              <b>{s.returned}</b>
              <div className="shift-colors"><Chips data={returnedColors(s)} /></div>
            </div>
            <div>
              <span className="label">Wykorzystano</span>
              <b className="accent">{s.issued - s.returned}</b>
              <div className="shift-colors"><Chips data={usedColors(s)} /></div>
            </div>
          </>
        ) : (
          <div>
            <span className="badge">Trwa zmiana</span>
          </div>
        )}
      </div>

      {s.status === "open" ? (
        <>
          <p className="label returns-title">Ile zwrócił (puste = 0)</p>
          <ColorInputs
            ids={issuedIds}
            values={vals}
            max={issued}
            hint={Object.fromEntries(issuedIds.map((id) => [id, `wydano: ${issued[id]}`]))}
            onChange={(id, v) => setVals((x) => ({ ...x, [id]: v }))}
          />
          <div className="row">
            <button onClick={close}>Zamknij zmianę</button>
            <button className="ghost" onClick={del}>Usuń</button>
          </div>
        </>
      ) : (
        <div className="row">
          <button className="ghost" onClick={reopen}>Popraw</button>
          <button className="ghost" onClick={del}>Usuń</button>
        </div>
      )}
    </div>
  );
}

export default function Shifts({ shifts }) {
  const open = shifts.filter((s) => s.status === "open");
  const closed = shifts.filter((s) => s.status === "closed");

  return (
    <>
      <section className="block">
        <h2>Otwarte zmiany <span className="count">{open.length}</span></h2>
        {open.length === 0 && (
          <p className="muted">Brak otwartych zmian. Wydaj opaski selekcjonerowi powyżej.</p>
        )}
        {open.map((s) => <ShiftRow key={s.id} s={s} />)}
      </section>

      <section className="block">
        <h2>Zamknięte zmiany</h2>
        {closed.length === 0 && <p className="muted">Na razie pusto.</p>}
        {closed.slice(0, 20).map((s) => <ShiftRow key={s.id} s={s} />)}
      </section>
    </>
  );
}
