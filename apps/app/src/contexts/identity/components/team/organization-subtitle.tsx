import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine, errorMessage } from "@/lib/errors";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { useOrganization } from "../../hooks/use-organization";

type OrganizationSubtitleProps = {
  readonly isForDesktop: boolean;
  readonly className: string;
  readonly skeletonClassName: string;
  readonly render: (organizationName: string) => string;
};

const OrganizationLoadError = ({ error }: { readonly error: unknown }) => {
  const apiError = apiErrorOf(error);
  const codeLine = errorCodeLine(apiError);
  return (
    <span className="flex flex-wrap gap-x-1.5 text-[13px] text-destructive">
      <span>{errorMessage(apiError.code)}</span>
      {codeLine === undefined ? null : (
        <span className="text-[#64748B] tabular-nums">{codeLine}</span>
      )}
    </span>
  );
};

export const OrganizationSubtitle = ({
  isForDesktop,
  className,
  skeletonClassName,
  render,
}: OrganizationSubtitleProps) => {
  const organization = useOrganization();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (organization.isPending) {
    return <Skeleton className={skeletonClassName} />;
  }
  if (organization.isError) {
    return isDesktop === isForDesktop ? <OrganizationLoadError error={organization.error} /> : null;
  }
  return <span className={className}>{render(organization.data.name)}</span>;
};
