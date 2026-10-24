import type { SiteRecord } from "@/lib/db/local-records";

export const siteLabelOf = (site: Pick<SiteRecord, "label" | "address">) =>
  site.label === null ? site.address : `${site.label} · ${site.address}`;
