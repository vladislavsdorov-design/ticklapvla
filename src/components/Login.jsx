import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const MESSAGES = {
  "auth/invalid-credential": "Nieprawidłowy e-mail lub hasło.",
  "auth/invalid-email": "Nieprawidłowy adres e-mail.",
  "auth/user-disabled": "To konto zostało zablokowane.",
  "auth/too-many-requests": "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  "auth/network-request-failed": "Brak połączenia z internetem.",
  "auth/operation-not-allowed":
    "Logowanie e-mailem nie jest włączone w Firebase (Authentication → Sign-in method).",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(MESSAGES[err.code] ?? "Nie udało się zalogować.");
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <img src="./logo.png" alt="" />
        <h1>Ewidencja biletów</h1>
        <p className="muted">Zaloguj się, aby kontynuować</p>
        <label>
          <span className="label">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span className="label">Hasło</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !email || !password}>
          {busy ? "Logowanie…" : "Zaloguj się"}
        </button>
      </form>
    </div>
  );
}
