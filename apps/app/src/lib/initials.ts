const LEGAL_FORMS = new Set(["SCI", "SARL", "SAS", "SASU", "EURL", "SA", "SNC", "EI", "EIRL"]);

const isLegalForm = (word: string) => LEGAL_FORMS.has(word.toUpperCase());

export const initialsOf = (name: string): string => {
  const words = name.split(/\s+/).filter((word) => word.length > 0);
  const meaningfulWords = words.filter((word) => !isLegalForm(word));
  return (meaningfulWords.length > 0 ? meaningfulWords : words)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};
