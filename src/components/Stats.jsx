import { useMemo, useState } from "react";
import {
  fmtDate,
  issuedColors,
  returnedColors,
  usedColors,
  visibleColorIds,
} from "../utils";
import { Dot } from "./Colors";
import { useColors } from "../colorsContext";

function groupBy(list, key) {
  const m = {};
  list.forEach((s) => {
    const k = s[key];
    m[k] ??= { key: k, shifts: 0, issued: 0, returned: 0 };
    m[k].shifts++;
    m[k].issued += s.issued;
    m[k].returned += s.returned;
  });
  return Object.values(m).map((r) => ({ ...r, used: r.issued - r.returned }));
}

function Table({ title, rows, firstCol, formatKey }) {
  return (
    <section className="block">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{firstCol}</th>
              <th className="num">Zmian</th>
              <th className="num">Wydano</th>
              <th className="num">Zwrócono</th>
              <th className="num">Wykorzystano</th>
              <th>Wykorzystanie</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = r.issued ? Math.round((r.used / r.issued) * 100) : 0;
              return (
                <tr key={r.key}>
                  <td>{formatKey ? formatKey(r.key) : r.key}</td>
                  <td className="num">{r.shifts}</td>
                  <td className="num">{r.issued}</td>
                  <td className="num">{r.returned}</td>
                  <td className="num"><b>{r.used}</b></td>
                  <td>
                    <div className="meter">
                      <div className="meter-bar">
                        <div className="meter-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan="6" className="muted">Brak danych</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ColorName({ id }) {
  const { colorById } = useColors();
  return (
    <span className="color-name">
      <Dot id={id} />
      {colorById(id).label}
    </span>
  );
}

// Magazyn w podziale na kolory
function StockByColor({ stock }) {
  const { colors } = useColors();
  const ids = visibleColorIds(stock.byColor, colors);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Kolor</th>
            <th className="num">Przyjęto</th>
            <th className="num">Na magazynie</th>
            <th className="num">U selekcjonerów</th>
            <th className="num">Wykorzystano</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const r = stock.byColor[id];
            return (
              <tr key={id}>
                <td><ColorName id={id} /></td>
                <td className="num">{r.received}</td>
                <td className={`num ${r.inStock < 0 ? "neg-text" : ""}`}><b>{r.inStock}</b></td>
                <td className="num">{r.onHands}</td>
                <td className="num accent">{r.used}</td>
              </tr>
            );
          })}
          <tr className="total-row">
            <td>Razem</td>
            <td className="num">{stock.received}</td>
            <td className="num"><b>{stock.inStock}</b></td>
            <td className="num">{stock.onHands}</td>
            <td className="num accent">{stock.used}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Tabela: wiersze = selekcjonerzy, kolumny = kolory (ile wydano)
function PersonColorMatrix({ shifts, ids }) {
  const rows = useMemo(() => {
    const m = {};
    shifts.forEach((s) => {
      const r = (m[s.faceControl] ??= { name: s.faceControl, total: 0, colors: {} });
      Object.entries(issuedColors(s)).forEach(([id, n]) => {
        r.colors[id] = (r.colors[id] ?? 0) + n;
        r.total += n;
      });
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [shifts]);

  const totals = ids.map((id) => rows.reduce((a, r) => a + (r.colors[id] ?? 0), 0));
  const grand = rows.reduce((a, r) => a + r.total, 0);

  return (
    <section className="block">
      <h2>Wydane opaski: selekcjoner × kolor</h2>
      <p className="muted small">Wszystkie zmiany z wybranego okresu (także otwarte).</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Imię</th>
              {ids.map((id) => (
                <th className="num" key={id}><ColorName id={id} /></th>
              ))}
              <th className="num">Razem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                {ids.map((id) => (
                  <td className="num" key={id}>{r.colors[id] ?? 0}</td>
                ))}
                <td className="num"><b>{r.total}</b></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={ids.length + 2} className="muted">Brak danych</td></tr>
            )}
            {rows.length > 0 && (
              <tr className="total-row">
                <td>Razem</td>
                {totals.map((t, i) => (
                  <td className="num" key={ids[i]}>{t}</td>
                ))}
                <td className="num"><b>{grand}</b></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Zamknięte zmiany w okresie: wydano / zwrócono / wykorzystano według koloru
function PeriodByColor({ closed, ids }) {
  const rows = useMemo(() => {
    const m = Object.fromEntries(ids.map((id) => [id, { issued: 0, returned: 0, used: 0 }]));
    closed.forEach((s) => {
      Object.entries(issuedColors(s)).forEach(([id, n]) => {
        (m[id] ??= { issued: 0, returned: 0, used: 0 }).issued += n;
      });
      Object.entries(returnedColors(s)).forEach(([id, n]) => {
        (m[id] ??= { issued: 0, returned: 0, used: 0 }).returned += n;
      });
      Object.entries(usedColors(s)).forEach(([id, n]) => {
        (m[id] ??= { issued: 0, returned: 0, used: 0 }).used += n;
      });
    });
    return Object.entries(m);
  }, [closed, ids]);

  return (
    <section className="block">
      <h2>Według kolorów (zamknięte zmiany)</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kolor</th>
              <th className="num">Wydano</th>
              <th className="num">Zwrócono</th>
              <th className="num">Wykorzystano</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([id, r]) => (
              <tr key={id}>
                <td><ColorName id={id} /></td>
                <td className="num">{r.issued}</td>
                <td className="num">{r.returned}</td>
                <td className="num"><b>{r.used}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Stats({ shifts, stock }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inRange = (s) => (!from || s.date >= from) && (!to || s.date <= to);

  const inPeriod = useMemo(
    () => shifts.filter(inRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shifts, from, to]
  );
  const closed = useMemo(
    () => inPeriod.filter((s) => s.status === "closed"),
    [inPeriod]
  );

  const totals = useMemo(() => {
    const issued = closed.reduce((a, s) => a + s.issued, 0);
    const returned = closed.reduce((a, s) => a + s.returned, 0);
    return { issued, returned, used: issued - returned, shifts: closed.length };
  }, [closed]);

  const byPerson = useMemo(
    () => groupBy(closed, "faceControl").sort((a, b) => b.used - a.used),
    [closed]
  );
  const byDate = useMemo(
    () => groupBy(closed, "date").sort((a, b) => (a.key < b.key ? 1 : -1)),
    [closed]
  );

  const { colors } = useColors();
  const ids = visibleColorIds(stock.byColor, colors);

  return (
    <>
      <section className="block">
        <h2>Magazyn ogółem</h2>
        <div className="stats">
          <div><span className="label">Łącznie przyjęto</span><b>{stock.received}</b></div>
          <div><span className="label">Na magazynie</span><b>{stock.inStock}</b></div>
          <div><span className="label">U selekcjonerów</span><b>{stock.onHands}</b></div>
          <div><span className="label">Łącznie wykorzystano</span><b className="accent">{stock.used}</b></div>
        </div>
        <StockByColor stock={stock} />
      </section>

      <section className="block">
        <h2>Wybrany okres</h2>
        <div className="row">
          <label>Od <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>Do <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button className="ghost" onClick={() => { setFrom(""); setTo(""); }}>
            Wyczyść
          </button>
        </div>
        <div className="stats">
          <div><span className="label">Zmian</span><b>{totals.shifts}</b></div>
          <div><span className="label">Wydano</span><b>{totals.issued}</b></div>
          <div><span className="label">Zwrócono</span><b>{totals.returned}</b></div>
          <div><span className="label">Wykorzystano</span><b className="accent">{totals.used}</b></div>
        </div>
      </section>

      <PersonColorMatrix shifts={inPeriod} ids={ids} />
      <PeriodByColor closed={closed} ids={ids} />
      <Table title="Według selekcjonerów" rows={byPerson} firstCol="Imię" />
      <Table title="Według dni" rows={byDate} firstCol="Data" formatKey={fmtDate} />
    </>
  );
}
