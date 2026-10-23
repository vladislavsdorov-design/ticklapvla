import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// user: undefined = jeszcze sprawdzamy, null = niezalogowany, obiekt = zalogowany
export function useAuth() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}
