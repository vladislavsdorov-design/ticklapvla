import { useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./hooks/useAuth";
import { useList } from "./hooks/useList";
import { calcStock, visibleColorIds, DEFAULT_COLORS } from "./utils";
import { ColorsProvider } from "./colorsContext";
import StockForm from "./components/StockForm";
import IssueForm from "./components/IssueForm";
import Shifts from "./components/Shifts";
import Stats from "./components/Stats";
import { Chips } from "./components/Colors";
import ColorManager from "./components/ColorManager";
import Loader from "./components/Loader";
import Login from "./components/Login";
import AnimatedNumber from "./components/AnimatedNumber";

const TABS = [
  ["work", "Panel"],
  ["stock", "Magazyn"],
  ["stats", "Statystyki"],
];

function Main({ user }) {
  const [tab, setTab] = useState("work");
  const incomes = useList("incomes");
  const shifts = useList("shifts");
  const customColors = useList("colors");
  const colors = useMemo(
    () => [
      ...DEFAULT_COLORS,
      ...[...customColors.items]
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .map((c) => ({ id: c.id, label: c.label, hex: c.hex })),
    ],
    [customColors.items]
  );

  if (incomes.loading || shifts.loading || customColors.loading) {
    return (
      <div className="container">
        <Loader />
      </div>
    );
  }

  if (incomes.error || shifts.error || customColors.error) {
    return (
      <div className="container fade-in">
        <h1>Brak dostępu do bazy</h1>
        <p className="muted">
          Sprawdź w Firebase Console, czy baza Realtime Database jest utworzona
          i czy reguły (Rules) pozwalają na odczyt i zapis zalogowanym
          użytkownikom (plik database.rules.json).
        </p>
        <button className="ghost" onClick={() => signOut(auth)}>
          Wyloguj
        </button>
      </div>
    );
  }

  const stock = calcStock(incomes.items, shifts.items, colors);
  const inStockByColor = Object.fromEntries(
    visibleColorIds(stock.byColor, colors).map((id) => [
      id,
      stock.byColor[id].inStock,
    ])
  );

  return (
    <ColorsProvider colors={colors}>
      <div className="container">
        <header className="top">
          <img className="top-logo" src="./logo.png" alt="" />
          {/* <h1>Ewidencja biletów</h1> */}
          <nav className="tabs">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="user">
            <span className="muted small-inline">{user.email}</span>
            <button className="ghost" onClick={() => signOut(auth)}>
              Wyloguj
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-main">
            <span className="label">Na magazynie</span>
            <b className={`hero-number ${stock.inStock < 0 ? "neg" : ""}`}>
              <AnimatedNumber value={stock.inStock} />
            </b>
          </div>
          <div className="hero-side">
            <span className="label">U selekcjonerów</span>
            <b>
              <AnimatedNumber value={stock.onHands} />
            </b>
          </div>
        </section>
        <div className="hero-colors">
          <span className="label">Na magazynie według kolorów</span>
          <Chips data={inStockByColor} />
        </div>

        <div className="tab-content" key={tab}>
          {tab === "work" && (
            <>
              <IssueForm stock={stock} />
              <Shifts shifts={shifts.items} />
            </>
          )}
          {tab === "stock" && (
            <>
              <StockForm incomes={incomes.items} />
              <ColorManager stock={stock} />
            </>
          )}
          {tab === "stats" && <Stats shifts={shifts.items} stock={stock} />}
        </div>
      </div>
    </ColorsProvider>
  );
}

export default function App() {
  const user = useAuth();
  if (user === undefined) {
    return (
      <div className="container">
        <Loader text="Sprawdzanie sesji…" />
      </div>
    );
  }
  if (!user) return <Login />;
  return <Main user={user} />;
}
