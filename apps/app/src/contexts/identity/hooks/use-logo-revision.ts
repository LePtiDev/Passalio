import { useCallback, useState } from "react";
import { ORGANIZATION_LOGO_URL } from "./use-organization";

export const useLogoRevision = (hasLogo: boolean) => {
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  const version = hasLogo ? String(revision) : null;
  return {
    version,
    url: version === null ? null : `${ORGANIZATION_LOGO_URL}?v=${version}`,
    refresh,
  };
};
