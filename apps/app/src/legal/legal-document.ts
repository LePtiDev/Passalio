export type LegalBlock =
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "notice"; readonly text: string }
  | { readonly kind: "list"; readonly items: readonly string[] }
  | { readonly kind: "orderedList"; readonly items: readonly string[] }
  | {
      readonly kind: "definitions";
      readonly items: readonly { readonly term: string; readonly text: string }[];
    }
  | {
      readonly kind: "table";
      readonly headers: readonly string[];
      readonly rows: readonly (readonly string[])[];
    };

export type LegalSection = {
  readonly id: string;
  readonly title: string;
  readonly shortTitle?: string;
  readonly blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  readonly title: string;
  readonly sections: readonly LegalSection[];
};

export const LEGAL_PATHS = {
  terms: "/conditions",
  privacy: "/confidentialite",
  legalNotice: "/mentions-legales",
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_PATHS;
