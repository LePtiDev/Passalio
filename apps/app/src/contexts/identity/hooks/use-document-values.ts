import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import type { DocumentSettingsValues } from "../document-settings-form";

export const useDocumentValues = (
  control: Control<DocumentSettingsValues>,
): DocumentSettingsValues => {
  const [
    documentTemplate,
    brandColor,
    phone,
    contactEmail,
    website,
    qualification,
    customerMessage,
    footerText,
    documentNumberPrefix,
    nextDocumentNumber,
  ] = useWatch({
    control,
    name: [
      "documentTemplate",
      "brandColor",
      "phone",
      "contactEmail",
      "website",
      "qualification",
      "customerMessage",
      "footerText",
      "documentNumberPrefix",
      "nextDocumentNumber",
    ],
  });
  return useMemo(
    () => ({
      documentTemplate,
      brandColor,
      phone,
      contactEmail,
      website,
      qualification,
      customerMessage,
      footerText,
      documentNumberPrefix,
      nextDocumentNumber,
    }),
    [
      documentTemplate,
      brandColor,
      phone,
      contactEmail,
      website,
      qualification,
      customerMessage,
      footerText,
      documentNumberPrefix,
      nextDocumentNumber,
    ],
  );
};
