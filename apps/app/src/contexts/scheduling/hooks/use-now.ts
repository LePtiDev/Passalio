import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

export const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
};
