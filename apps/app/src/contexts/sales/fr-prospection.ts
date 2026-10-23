import type { ProspectionTab } from "./components/prospection/prospection-scope";

const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;

const TAB_SUBTITLES: Readonly<Record<ProspectionTab, (count: number) => string>> = {
  to_qualify: (count) => plural(count, "entreprise à qualifier", "entreprises à qualifier"),
  qualified: (count) => plural(count, "entreprise qualifiée", "entreprises qualifiées"),
  not_interested: (count) =>
    plural(count, "entreprise pas intéressée", "entreprises pas intéressées"),
};

const TAB_SHORT: Readonly<Record<ProspectionTab, string>> = {
  to_qualify: "à qualifier",
  qualified: "qualifiées",
  not_interested: "pas intéressées",
};

export const prospectionFr = {
  title: "Prospection",
  subtitle: (tab: ProspectionTab, count: number, department: string | null) =>
    department === null
      ? `${TAB_SUBTITLES[tab](count)}.`
      : `${TAB_SUBTITLES[tab](count)} · ${department}.`,
  subtitleLoading: "Les ramoneurs à situer et à qualifier.",
  mobilePlaceholder: (tab: ProspectionTab, count: number | null, department: string | null) =>
    [department, count === null ? null : `${count} ${TAB_SHORT[tab]}`]
      .filter((part) => part !== null)
      .join(" · ") || "Nom ou ville",
  searchLabel: "Rechercher une entreprise",
  searchPlaceholder: "Nom ou ville",
  leadsLabel: "Entreprises de l'onglet",
  mapLabel: "Carte",
  mapDescription: (department: string | null) =>
    department === null
      ? "Carte des entreprises"
      : `Carte des entreprises dans le département ${department}`,
  selectedLabel: "Entreprise sélectionnée",
  select: (name: string) => `Afficher ${name} sur la carte`,
  zoomIn: "Zoomer",
  zoomOut: "Dézoomer",
  legend: "Légende",
  leader: "Dirigeant",
  phone: "Téléphone",
  activity: "Activité",
  website: "Site web",
  missingLeader: "À trouver",
  missingPhone: "À trouver",
  missingActivity: "Non renseignée",
  missingWebsite: "Aucun",
  qualify: "Qualifiée",
  reject: "Pas intéressée",
  openFile: "Ouvrir la fiche",
  emptyTitle: (tab: ProspectionTab) => `Aucune entreprise ${TAB_SHORT[tab]}`,
  emptyText: "Changez d'onglet ou de département.",
  searchEmptyTitle: (search: string) => `Aucune entreprise pour « ${search} »`,
  searchEmptyText: "Vérifiez l'orthographe ou changez de département.",
  seeCompanies: "Voir les entreprises",
  attribution: "© IGN",
  seeOnMap: "Voir sur la carte",
  mapTile: "Carte",
} as const;
