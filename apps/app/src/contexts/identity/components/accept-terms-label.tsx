import { LEGAL_PATHS, legalFr } from "@/legal";
import { AUTH_LINK_CLASS } from "./auth-styles";

const text = legalFr.acceptTerms;

const NewTabLink = ({ href, label }: { readonly href: string; readonly label: string }) => (
  <a href={href} target="_blank" rel="noopener" className={AUTH_LINK_CLASS}>
    {label}
    <span className="sr-only"> {text.opensInNewTab}</span>
  </a>
);

export const AcceptTermsLabel = () => (
  <span>
    {text.before} <NewTabLink href={LEGAL_PATHS.terms} label={text.terms} /> {text.between}{" "}
    <NewTabLink href={LEGAL_PATHS.privacy} label={text.privacy} />
    {text.after}
  </span>
);
