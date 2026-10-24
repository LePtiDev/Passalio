import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine, errorMessage } from "@/lib/errors";
import { useOrganization } from "../../hooks/use-organization";

type OrganizationSubtitleProps = {
  readonly className: string;
  readonly skeletonClassName: string;
  readonly render: (organizationName: string) => string;
};

export const OrganizationLoadError = () => {
  const organization = useOrganization();
  if (!organization.isError) {
    return null;
  }
  const apiError = apiErrorOf(organization.error);
  const codeLine = errorCodeLine(apiError);
  return (
    <p role="alert" className="flex flex-wrap gap-x-1.5 text-[13px] text-destructive">
      <span>{errorMessage(apiError.code)}</span>
      {codeLine === undefined ? null : (
        <span className="text-[#64748B] tabular-nums">{codeLine}</span>
      )}
    </p>
  );
};

export const OrganizationSubtitle = ({
  className,
  skeletonClassName,
  render,
}: OrganizationSubtitleProps) => {
  const organization = useOrganization();
  if (organization.isPending) {
    return <Skeleton className={skeletonClassName} />;
  }
  if (organization.isError) {
    return null;
  }
  return <span className={className}>{render(organization.data.name)}</span>;
};
