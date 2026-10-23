import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";

export function useList(path) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onValue(
      ref(db, path),
      (snap) => {
        const val = snap.val() || {};
        const list = Object.entries(val).map(([id, v]) => ({ id, ...v }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setItems(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`Firebase (${path}):`, err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [path]);

  return { items, loading, error };
}
