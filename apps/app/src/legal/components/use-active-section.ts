import { useEffect, useState } from "react";

const VISIBLE_BAND = "0px 0px -70% 0px";

export const useActiveSection = (sectionIds: readonly string[]) => {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible !== undefined) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: VISIBLE_BAND },
    );
    const elements = sectionIds.flatMap((id) => {
      const element = document.getElementById(id);
      return element === null ? [] : [element];
    });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
};
