import { createContext, useContext, useMemo } from "react";
import { DEFAULT_COLORS, findColor } from "./utils";

const Ctx = createContext({
  colors: DEFAULT_COLORS,
  colorById: (id) => findColor(DEFAULT_COLORS, id),
});

export function ColorsProvider({ colors, children }) {
  const value = useMemo(
    () => ({ colors, colorById: (id) => findColor(colors, id) }),
    [colors]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useColors = () => useContext(Ctx);
