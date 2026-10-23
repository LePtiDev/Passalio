import { useEffect, useState } from "react";

export const useDebouncedValue = <Value>(value: Value, delayMs: number): Value => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};
