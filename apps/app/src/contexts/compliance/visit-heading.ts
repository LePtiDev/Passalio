import { customerNameOf } from "@/contexts/customers";
import { complianceFr } from "./fr";
import type { CertificateVisit } from "./hooks/use-certificate-visit";

const text = complianceFr.form;

export const visitHeadingOf = (visit: CertificateVisit) => {
  const name = customerNameOf(visit.customer);
  const time = visit.intervention.startTime;
  return {
    name,
    subtitle: text.subtitle([name, time].filter((part) => part !== null)),
    desktopSubtitle: text.subtitle(
      [name, `${visit.site.address}, ${visit.site.city}`, time].filter((part) => part !== null),
    ),
  };
};
