import type { MarketingPageInput } from "../content-schema";

export const sweepingCompanyPage: MarketingPageInput = {
  slug: "entreprise-de-ramonage",
  isPublished: true,
  seo: {
    title: "Logiciel pour entreprise de ramonage | Passalio",
    description:
      "Planning d’équipe, rôles et accès, fiches clients partagées et travail hors ligne. Le bureau voit la journée avancer, les techniciens ne ressaisissent rien.",
  },
  menu: {
    title: "Entreprise de ramonage",
    text: "Un planning d’équipe, des utilisateurs illimités.",
    icon: "users",
  },
  eyebrow: "Pour les entreprises de ramonage, de 2 à 15 personnes",
  title: "Le bureau voit la journée avancer. Les techniciens ne ressaisissent rien.",
  lead: "Vous placez les passages, chaque technicien reçoit sa tournée sur son téléphone et signe ses certificats chez le client. Un seul abonnement, quel que soit le nombre de techniciens.",
  highlights: ["Utilisateurs illimités", "Patron, bureau, technicien", "Sans engagement"],
  screen: {
    backLabel: "Planning",
    status: {
      label: "Équipe",
      tone: "neutral",
    },
    title: "Aujourd’hui",
    subtitle: "Mardi 14 octobre · 3 techniciens",
    rows: [
      {
        label: "Julien Martin",
        value: "6 passages, 4 signés",
        tag: "Patron",
      },
      {
        label: "Kevin Robert",
        value: "5 passages, 5 signés",
        tag: "Technicien",
      },
      {
        label: "Léa Petit",
        value: "3 passages, 1 signé",
        tag: "Apprentie",
      },
      {
        label: "À placer",
        value: "2 passages sans technicien",
      },
    ],
    action: "Nouveau passage",
  },
  pains: [
    {
      title: "Le planning",
      text: "Sur un tableau blanc ou dans un groupe WhatsApp, changé trois fois par jour.",
    },
    {
      title: "Le vendredi",
      text: "Des certificats qui reviennent froissés ou incomplets, à ressaisir au bureau.",
    },
    {
      title: "Le litige",
      text: "Un client conteste : qui est passé, quand, et qu’a-t-il constaté ?",
    },
  ],
  featuresTitle: "Toute l’équipe sur le même outil, chacun à sa place.",
  features: [
    {
      label: "Planning d’équipe",
      title: "Vous placez les passages, chacun reçoit sa tournée",
      text: "Le bureau organise la semaine. Le technicien ouvre son téléphone le matin et voit ses clients dans l’ordre, même sans réseau.",
      bullets: [
        "Vues jour, semaine et équipe",
        "Types de passage avec leur durée par défaut",
        "Chaque technicien ne voit que sa tournée",
      ],
      visual: {
        title: "Semaine du 13 octobre",
        subtitle: "Planning de l’équipe",
        status: {
          label: "14 passages",
          tone: "neutral",
        },
        rows: [
          {
            label: "Kevin Robert",
            value: "Lun. 6 · Mar. 5 · Mer. 4",
            tag: "15",
          },
          {
            label: "Léa Petit",
            value: "Lun. 3 · Mar. 3 · Mer. 2",
            tag: "8",
          },
          {
            label: "Julien Martin",
            value: "Lun. 4 · Mar. 6 · Mer. 5",
            tag: "15",
          },
          {
            label: "Sans technicien",
            value: "2 passages à placer",
            tag: "À placer",
          },
        ],
      },
    },
    {
      label: "Rôles et accès",
      title: "Le bureau prépare, le technicien signe",
      text: "Chacun a son propre accès et voit ce dont il a besoin. Vous ajoutez un apprenti en saison sans changer d’abonnement.",
      bullets: [
        "Patron, administrateur, secrétariat, technicien",
        "Invitation par mail, accès retiré en un clic",
        "Utilisateurs illimités, sans supplément",
      ],
      visual: {
        title: "Équipe",
        subtitle: "Ramonage Martin",
        status: {
          label: "4 membres",
          tone: "neutral",
        },
        rows: [
          {
            label: "Julien Martin",
            value: "julien@ramonage-martin.fr",
            tag: "Patron",
          },
          {
            label: "Sophie Martin",
            value: "sophie@ramonage-martin.fr",
            tag: "Secrétariat",
          },
          {
            label: "Kevin Robert",
            value: "kevin@ramonage-martin.fr",
            tag: "Technicien",
          },
          {
            label: "Léa Petit",
            value: "Invitation envoyée",
            tag: "En attente",
          },
        ],
      },
    },
    {
      label: "Traçabilité",
      title: "Pour chaque passage : qui, quand, et ce qui a été vu",
      text: "En cas de litige ou de sinistre, vous retrouvez le certificat, le technicien et les photos en quelques secondes.",
      bullets: [
        "Nom du technicien sur chaque certificat",
        "Numérotation unique, commune à l’entreprise",
        "Certificat signé non modifiable, rangé dans la fiche client",
      ],
      visual: {
        title: "Certificat n° 2026-0388",
        subtitle: "SCI Les Tilleuls · 3 conduits",
        status: {
          label: "Signé",
          tone: "validated",
        },
        rows: [
          {
            label: "Technicien",
            value: "Kevin Robert",
          },
          {
            label: "Date",
            value: "Mardi 14 octobre 2026, 15 h 10",
          },
          {
            label: "Photos",
            value: "4 photos jointes",
          },
          {
            label: "Signature",
            value: "M. Garnier, gestionnaire",
            tag: "Signé",
          },
        ],
      },
    },
    {
      label: "Hors ligne",
      title: "Les techniciens travaillent, le bureau suit au retour du réseau",
      text: "En cave ou à la campagne, les techniciens continuent normalement. Tout remonte au bureau dès que le téléphone capte.",
      bullets: [
        "Tournée, fiches et appareils dans chaque téléphone",
        "Envoi automatique au retour du réseau",
        "Le technicien voit ce qui reste à envoyer",
      ],
      visual: {
        title: "Kevin Robert",
        subtitle: "Tournée du mardi",
        status: {
          label: "Hors ligne",
          tone: "warning",
        },
        rows: [
          {
            label: "8 h 30 · Mme Durand",
            value: "Saint-Maur",
            tag: "Signé",
          },
          {
            label: "10 h 00 · M. Bernard",
            value: "Créteil",
            tag: "Signé",
          },
          {
            label: "11 h 30 · SCI Les Tilleuls",
            value: "Vincennes",
            tag: "En cours",
          },
          {
            label: "À envoyer",
            value: "2 certificats, 5 photos",
            tag: "En attente",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Combien de comptes puis-je créer ?",
      answer: "Autant que vous voulez avec la formule Équipe : les techniciens y sont illimités.",
    },
    {
      question: "Un technicien voit-il le planning des autres ?",
      answer: "Non, il voit sa tournée. Le patron et le bureau voient toute l’équipe.",
    },
    {
      question: "On a déjà un fichier de clients.",
      answer:
        "L’import d’un fichier Excel ou CSV arrive bientôt. En attendant, on vous aide à le reprendre.",
    },
  ],
  finalTitle: "Essayez-le avec un technicien cette semaine.",
};
