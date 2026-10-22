import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { identityFr } from "../fr";
import { ORGANIZATION_LOGO_URL, useOrganization } from "../hooks/use-organization";
import { OrganizationMark } from "./onboarding/organization-mark";

const NAME_CLASS = {
  sidebar: "text-[13px]",
  header: "text-[15px]",
} as const;

type OrganizationBadgeProps = {
  readonly placement?: keyof typeof NAME_CLASS;
};

export const OrganizationBadge = ({ placement = "sidebar" }: OrganizationBadgeProps) => {
  const { data: organization } = useOrganization();
  if (organization === undefined) {
    return (
      <span className="flex min-h-10 items-center gap-2.5 p-1.5" aria-busy="true">
        <Skeleton className="size-8 rounded-lg lg:size-[26px]" />
        <span className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex min-h-10 min-w-0 items-center gap-2.5 p-1.5">
      <OrganizationMark
        name={organization.name}
        brandColor={organization.brandColor}
        logoUrl={organization.hasLogo ? ORGANIZATION_LOGO_URL : null}
        size="tiny"
      />
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate font-bold", NAME_CLASS[placement])}>{organization.name}</span>
        <span className="text-xs text-[#64748B]">{identityFr.organizationBadge.freeTrial}</span>
      </span>
    </span>
  );
};
