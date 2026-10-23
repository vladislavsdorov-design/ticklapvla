export const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// 2026-10-17 -> 17.10.2026
export const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

/* ---------- Kolory opasek ----------
   To są kolory startowe. Własne kolory dodaje się w aplikacji (sekcja "Kolory opasek").
   id    – krótki klucz zapisywany w bazie (nie zmieniaj go po starcie pracy)
   label – nazwa na ekranie
   hex   – kolor kropki
*/
export const DEFAULT_COLORS = [
  { id: "red", label: "Czerwona", hex: "#e5484d" },
  // { id: "blue", label: "Niebieska", hex: "#3b82f6" },
  // { id: "green", label: "Zielona", hex: "#30a46c" },
  // { id: "yellow", label: "Żółta", hex: "#f5c518" },
  // { id: "white", label: "Biała", hex: "#f2f2f2" },
  // { id: "black", label: "Czarna", hex: "#555555" },
];

// Stare wpisy (sprzed podziału na kolory) trafiają do tego "koloru"
export const LEGACY = { id: "legacy", label: "Bez koloru", hex: "#8b8b8b" };

export const findColor = (colors, id) =>
  colors.find((c) => c.id === id) ?? { ...LEGACY, id };

export const sumColors = (o) =>
  Object.values(o || {}).reduce((s, v) => s + (Number(v) || 0), 0);

// { red: "10", blue: "", green: 0 } -> { red: 10 }
export const cleanColors = (o) =>
  Object.fromEntries(
    Object.entries(o || {})
      .map(([k, v]) => [k, Number(v) || 0])
      .filter(([, v]) => v > 0)
  );

// Dane z kolorami z rekordu (z obsługą starych rekordów bez kolorów)
export const incomeColors = (i) =>
  i.colors ?? (i.amount ? { legacy: i.amount } : {});
export const issuedColors = (s) =>
  s.issuedColors ?? (s.issued ? { legacy: s.issued } : {});
export const returnedColors = (s) => {
  if (s.status !== "closed") return {};
  return s.returnedColors ?? (s.returned ? { legacy: s.returned } : {});
};
export const usedColors = (s) => {
  const issued = issuedColors(s);
  const back = returnedColors(s);
  const out = {};
  Object.entries(issued).forEach(([id, n]) => {
    const u = n - (back[id] ?? 0);
    if (u > 0) out[id] = u;
  });
  return out;
};

export function calcStock(incomes, shifts, colors = DEFAULT_COLORS) {
  const byColor = {};
  const row = (id) =>
    (byColor[id] ??= {
      received: 0,
      issued: 0,
      returned: 0,
      onHands: 0,
      used: 0,
      inStock: 0,
    });
  colors.forEach((c) => row(c.id));

  incomes.forEach((i) =>
    Object.entries(incomeColors(i)).forEach(
      ([id, n]) => (row(id).received += n)
    )
  );

  shifts.forEach((s) => {
    Object.entries(issuedColors(s)).forEach(([id, n]) => {
      const r = row(id);
      r.issued += n;
      if (s.status === "open") r.onHands += n;
      else r.used += n;
    });
    Object.entries(returnedColors(s)).forEach(([id, n]) => {
      const r = row(id);
      r.returned += n;
      r.used -= n;
    });
  });

  Object.values(byColor).forEach((r) => {
    r.inStock = r.received - r.issued + r.returned;
  });

  const sum = (k) => Object.values(byColor).reduce((s, r) => s + r[k], 0);
  return {
    received: sum("received"),
    issued: sum("issued"),
    returned: sum("returned"),
    onHands: sum("onHands"),
    used: sum("used"),
    inStock: sum("inStock"),
    byColor,
  };
}

// Które kolory pokazywać: wszystkie z listy + "Bez koloru" tylko jeśli coś w nim jest
export function visibleColorIds(byColor, colors = DEFAULT_COLORS) {
  const ids = colors.map((c) => c.id);
  Object.entries(byColor).forEach(([id, r]) => {
    if (!ids.includes(id) && (r.received || r.issued || r.returned))
      ids.push(id);
  });
  return ids;
}
