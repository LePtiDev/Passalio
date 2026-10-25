import type { CallbackSlot } from "@passalio/shared";

const SLOT_LABELS: Readonly<Record<CallbackSlot, string>> = {
  morning: "le matin, entre 8 h et 12 h",
  noon: "le midi, entre 12 h et 14 h",
  afternoon: "l’après-midi, entre 14 h et 18 h",
  evening: "le soir, entre 18 h et 20 h",
};

export const websiteCallbackFr = {
  note: (request: {
    readonly firstName: string;
    readonly company: string | null;
    readonly phone: string;
    readonly postalCode: string;
    readonly slot: CallbackSlot;
    readonly message: string | null;
    readonly pagePath: string;
  }) =>
    [
      `Demande de rappel depuis le site (page ${request.pagePath}).`,
      `Prénom : ${request.firstName}.`,
      request.company === null ? null : `Entreprise : ${request.company}.`,
      `Téléphone : ${request.phone}. Code postal : ${request.postalCode}.`,
      `À rappeler ${SLOT_LABELS[request.slot]}.`,
      request.message === null ? null : `Message : ${request.message}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
} as const;
