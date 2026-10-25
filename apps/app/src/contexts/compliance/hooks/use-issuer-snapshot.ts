import { useEffect, useMemo } from "react";
import { useDocumentSettings, useOrganization, useOrganizationPdfLogo } from "@/contexts/identity";
import type { LocalDatabase } from "@/lib/db/local-database";
import { documentIssuerOf } from "../document-issuer";
import { saveIssuer } from "../issuer-store";

export const useIssuerSnapshot = (database: LocalDatabase, canSign: boolean) => {
  const { data: organization } = useOrganization();
  const { data: settings } = useDocumentSettings();
  const hasLogo = organization?.hasLogo === true;
  const { data: logo } = useOrganizationPdfLogo(canSign && hasLogo);
  const issuer = useMemo(() => {
    if (!canSign || organization === undefined || settings === undefined) {
      return undefined;
    }
    if (hasLogo && logo === undefined) {
      return undefined;
    }
    return documentIssuerOf({ organization, settings, logo: hasLogo ? (logo ?? null) : null });
  }, [canSign, organization, settings, hasLogo, logo]);
  useEffect(() => {
    if (issuer !== undefined) {
      void saveIssuer(database, issuer, new Date());
    }
  }, [database, issuer]);
};
