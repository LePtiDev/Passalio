export type EmailHero =
  | { readonly kind: "icon"; readonly icon: "key" | "lock" }
  | {
      readonly kind: "organization";
      readonly name: string;
      readonly initials: string;
      readonly caption: string | null;
    };

export type EmailContent = {
  readonly subject: string;
  readonly hero: EmailHero;
  readonly title: string;
  readonly lead: string;
  readonly action: { readonly label: string; readonly url: string };
  readonly validity: string;
  readonly safety: string;
};

export type RenderedEmail = {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};
