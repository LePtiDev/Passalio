import type { PlatformRole } from "@passalio/shared";
import { cn } from "@/lib/utils";
import { PLATFORM_ROLE_LABELS } from "../../team-fr";
import { ROLE_BADGE_CLASS } from "./team-styles";

export const RoleBadge = ({ role }: { readonly role: PlatformRole }) => (
  <span
    className={cn(
      "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
      ROLE_BADGE_CLASS[role],
    )}
  >
    {PLATFORM_ROLE_LABELS[role]}
  </span>
);
