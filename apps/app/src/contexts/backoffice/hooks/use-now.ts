import { useState } from "react";

export const useNow = () => {
  const [now] = useState(() => new Date());
  return now;
};
