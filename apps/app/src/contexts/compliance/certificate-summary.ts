import type { CertificateFormValues } from "./certificate-form";
import { anomaliesTextOf } from "./certificate-body";
import { complianceFr } from "./fr";

const text = complianceFr.sign;

export const draftSummaryOf = (values: CertificateFormValues) =>
  text.summary(
    [
      values.isDoNotUse ? text.doNotUse : null,
      text.extent(values.sweepingExtent),
      anomaliesTextOf(values),
    ].filter((part) => part !== null),
  );
