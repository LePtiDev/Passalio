const LOWERCASE_WORDS: ReadonlySet<string> = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "et",
  "en",
  "sur",
  "sous",
  "aux",
]);

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const toDisplayName = (value: string): string =>
  value
    .toLowerCase()
    .split(/(\s+|-|')/)
    .map((part, index) => (index > 0 && LOWERCASE_WORDS.has(part) ? part : capitalize(part)))
    .join("");

export const formatSiret = (siret: string): string =>
  siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
