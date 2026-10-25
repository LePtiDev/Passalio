import { complianceFr } from "./fr";

const text = complianceFr.sign.errors;

export type SignaturesState = {
  readonly technicianSignature: string | null;
  readonly customerSignature: string | null;
  readonly isCustomerAbsent: boolean;
};

export type SignIssues = {
  readonly certificates?: string;
  readonly technicianSignature?: string;
  readonly customerSignature?: string;
};

export const signIssuesOf = (
  state: SignaturesState,
  { hasEveryDraft }: { readonly hasEveryDraft: boolean },
): SignIssues => ({
  ...(hasEveryDraft ? {} : { certificates: text.missingCertificates }),
  ...(state.technicianSignature === null ? { technicianSignature: text.technicianSignature } : {}),
  ...(state.customerSignature === null && !state.isCustomerAbsent
    ? { customerSignature: text.customerSignature }
    : {}),
});

export const hasSignIssues = (issues: SignIssues) => Object.keys(issues).length > 0;
