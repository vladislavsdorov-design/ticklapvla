import { useCountUp } from "../hooks/useCountUp";

export default function AnimatedNumber({ value }) {
  return <>{useCountUp(value)}</>;
}
