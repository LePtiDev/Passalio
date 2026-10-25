import type { EquipmentKind } from "@passalio/trades";

export type AdviceCard = { readonly title: string; readonly body: string };

export type FuelFamily = "wood" | "pellets" | "coal";

const APPLIANCE_NAMES: Readonly<Partial<Record<EquipmentKind, string>>> = {
  open_fireplace: "votre foyer ouvert",
  insert: "votre insert",
  log_stove: "votre poêle",
  pellet_stove: "votre poêle à granulés",
  solid_fuel_cooker: "votre cuisinière",
};

const USAGE: Readonly<Record<"open" | "closed" | "pellets", string>> = {
  open: "Un foyer ouvert chauffe peu et émet beaucoup de particules. Utilisez-le en appoint, avec du bois sec, et mettez le pare-étincelles devant le feu.",
  closed:
    "Allumez par le haut avec du petit bois. Laissez l'arrivée d'air ouverte pendant la montée en température. N'étouffez jamais le feu : un feu qui couve émet beaucoup plus de particules polluantes.",
  pellets:
    "Respectez les réglages du fabricant. Videz le cendrier et nettoyez le creuset souvent : une combustion encrassée émet plus de particules polluantes.",
};

const REGULATION: Readonly<Record<"open" | "closed" | "pellets", string>> = {
  open: "Un foyer ouvert ne se règle pas. Un insert ou un poêle permet de régler l'allure et la température de la pièce.",
  closed:
    "Réglez l'allure avec l'arrivée d'air et, si votre appareil en a un, avec son thermostat. 19 °C suffisent dans les pièces à vivre.",
  pellets:
    "Utilisez le thermostat et la programmation de votre poêle plutôt que des marches et arrêts répétés. 19 °C suffisent dans les pièces à vivre.",
};

const FUEL: Readonly<Record<FuelFamily, string>> = {
  wood: "Bois sec, moins de 20 % d'humidité, stocké à l'abri et aéré. Ne brûlez ni bois traité, ni déchets, ni papiers imprimés.",
  pellets:
    "Granulés certifiés, stockés au sec dans leur sac fermé. Des granulés humides ou poussiéreux encrassent l'appareil et le conduit.",
  coal: "Utilisez le charbon prévu par le fabricant de l'appareil, stocké au sec. Ne brûlez jamais de déchets.",
};

export const adviceFr = {
  usageTitle: (kind: EquipmentKind) => `Bien utiliser ${APPLIANCE_NAMES[kind] ?? "votre appareil"}`,
  usage: USAGE,
  regulationTitle: "Régulation et température",
  regulation: REGULATION,
  fuelTitle: "Le bon combustible",
  fuel: FUEL,
  risks: {
    title: "Les risques",
    body: "Un conduit encrassé peut provoquer un feu de cheminée ou une intoxication au monoxyde de carbone. Installez un détecteur de fumée et ne bouchez pas les entrées d'air.",
  },
  frequency: {
    title: "Quand faire ramoner",
    body: "Au moins une fois par an, ou plus si un arrêté local l'impose. Au-delà de 6 m³ de bois bûche ou 2,5 t de granulés par an, deux ramonages sont recommandés, dont un en période de chauffe. Faites ramoner avant une longue période sans feu.",
  },
  needs: {
    title: "Adapter vos besoins",
    body: "Un appareil trop puissant pour la pièce tourne au ralenti et s'encrasse. Isoler le logement réduit vos besoins de chauffage.",
  },
  improvements: {
    title: "Améliorer ou remplacer",
    body: "Un appareil récent chauffe mieux et pollue moins. France Rénov' (france-renov.gouv.fr) vous conseille gratuitement et présente les aides financières.",
  },
} as const;
