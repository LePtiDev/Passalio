export const closestOf = (element: HTMLElement, selector: string): HTMLElement => {
  const ancestor = element.closest<HTMLElement>(selector);
  if (ancestor === null) {
    throw new Error(`element is not inside ${selector}`);
  }
  return ancestor;
};
