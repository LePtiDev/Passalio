import type { PlateIdentityField } from "./plate-reading";

const IDENTITY_WITH_ARTICLE: Readonly<Record<PlateIdentityField, string>> = {
  brand: "la marque",
  model: "le modèle",
  serialNumber: "le numéro de série",
};

const FEMININE_IDENTITY: ReadonlySet<PlateIdentityField> = new Set(["brand"]);

const capitalized = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const listOf = (words: readonly string[]) =>
  words.length <= 1
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} et ${words.at(-1) ?? ""}`;

const missingSentence = (missing: readonly PlateIdentityField[]) => {
  const subject = capitalized(listOf(missing.map((field) => IDENTITY_WITH_ARTICLE[field])));
  if (missing.length > 1) {
    return `${subject} sont illisibles : saisissez-les à la main.`;
  }
  const [field] = missing;
  const pronoun = field !== undefined && FEMININE_IDENTITY.has(field) ? "la" : "le";
  return `${subject} est illisible : saisissez-${pronoun} à la main.`;
};

export const plateFr = {
  readingTitle: "Lecture de la plaque…",
  readingText: "Quelques secondes. Vous pouvez continuer à remplir le reste.",
  readTitle: (count: number) =>
    count <= 1 ? `${count} champ lu sur la plaque` : `${count} champs lus sur la plaque`,
  readText:
    "Vérifiez-les avant d'enregistrer. Sans réseau, la photo est gardée et lue au retour du réseau.",
  partialText: (missing: readonly PlateIdentityField[]) =>
    `${missingSentence(missing)} Vérifiez les autres avant d'enregistrer.`,
  unreadableTitle: "Plaque illisible",
  unreadableText:
    "Reprenez la photo bien en face, sans reflet, plaque entière dans le cadre. Ou remplissez à la main.",
  retake: "Reprendre la photo",
  limitTitle: "Lecture automatique en pause jusqu'à demain",
  limitText: (limit: number) =>
    `Votre entreprise a fait ${limit} lectures aujourd'hui. Remplissez à la main, la photo reste jointe à l'appareil.`,
  failed: "La plaque n'a pas pu être lue. Remplissez à la main.",
  readTag: "Lu sur la plaque",
  readingTag: "Lecture…",
  unreadableTag: "Illisible",
  badges: {
    reading: "Lecture…",
    read: "Lue",
    partial: "Lue en partie",
    unreadable: "Illisible",
  },
} as const;
