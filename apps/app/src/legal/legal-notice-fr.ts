import type { LegalDocument } from "./legal-document";
import { PUBLISHER } from "./legal-fr";

export const LEGAL_NOTICE_FR: LegalDocument = {
  title: "Mentions légales",
  sections: [
    {
      id: "editeur",
      title: "Éditeur",
      blocks: [
        {
          kind: "paragraph",
          text: `Le site passalio.com et l'application app.passalio.com sont édités par ${PUBLISHER.name}, ${PUBLISHER.legalForm}, dont le siège est situé ${PUBLISHER.address}, immatriculée sous le numéro ${PUBLISHER.registration}.`,
        },
        { kind: "paragraph", text: `TVA : ${PUBLISHER.vat}.` },
        { kind: "paragraph", text: `Contact : ${PUBLISHER.email}, ${PUBLISHER.phone}.` },
      ],
    },
    {
      id: "directeur-publication",
      title: "Directeur de la publication",
      blocks: [{ kind: "paragraph", text: `${PUBLISHER.publicationDirector}.` }],
    },
    {
      id: "hebergeur",
      title: "Hébergeur",
      blocks: [
        {
          kind: "paragraph",
          text: "Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis, +1 650 319 8930. Les données sont stockées dans l'Union européenne.",
        },
      ],
    },
    {
      id: "propriete-intellectuelle",
      title: "Propriété intellectuelle",
      blocks: [
        {
          kind: "paragraph",
          text: "Le nom Passalio, le logo, les textes et le logiciel appartiennent à l'éditeur. Toute reproduction sans accord écrit est interdite.",
        },
      ],
    },
    {
      id: "donnees-personnelles",
      title: "Données personnelles",
      blocks: [
        {
          kind: "paragraph",
          text: "Le traitement de vos données est décrit dans la politique de confidentialité.",
        },
      ],
    },
  ],
};
