import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DASHED_CARD_CLASS } from "@/contexts/customers";
import { complianceFr } from "../fr";

export const CertificateSkeleton = () => (
  <div
    aria-busy="true"
    className="mx-auto flex w-full max-w-[600px] flex-col gap-7 p-4 lg:max-w-[800px] lg:py-8"
  >
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-1.5 w-full" />
    <Skeleton className="h-[72px] w-full rounded-[14px]" />
    {["first", "second", "third"].map((key) => (
      <div key={key} className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-12 w-full lg:h-8" />
      </div>
    ))}
  </div>
);

const StateCard = ({
  title,
  text,
  children,
}: {
  readonly title: string;
  readonly text: string;
  readonly children: ReactNode;
}) => (
  <div className="mx-auto flex w-full max-w-[600px] flex-col gap-4 p-4 lg:max-w-[800px] lg:py-8">
    <div className={DASHED_CARD_CLASS}>
      <span className="flex flex-col gap-1">
        <h1 className="text-[17px] font-bold lg:text-[15px]">{title}</h1>
        <p className="text-[15px] text-[#475569] lg:text-[13px]">{text}</p>
      </span>
      {children}
    </div>
  </div>
);

export const CertificateNotFound = () => (
  <StateCard title={complianceFr.notFound.title} text={complianceFr.notFound.text}>
    <Button asChild variant="secondary">
      <Link to="/planning">{complianceFr.notFound.back}</Link>
    </Button>
  </StateCard>
);

export const SealedNotice = ({ interventionId }: { readonly interventionId: string }) => {
  const params = useMemo(() => ({ interventionId }), [interventionId]);
  return (
    <StateCard title={complianceFr.sealed.title} text={complianceFr.sealed.text}>
      <Button asChild variant="secondary">
        <Link to="/passages/$interventionId" params={params}>
          {complianceFr.form.back}
        </Link>
      </Button>
    </StateCard>
  );
};

export const AlreadySigned = ({ interventionId }: { readonly interventionId: string }) => {
  const params = useMemo(() => ({ interventionId }), [interventionId]);
  return (
    <StateCard title={complianceFr.alreadySigned.title} text={complianceFr.alreadySigned.text}>
      <Button asChild variant="secondary">
        <Link to="/passages/$interventionId/certificats-signes" params={params}>
          {complianceFr.alreadySigned.open}
        </Link>
      </Button>
    </StateCard>
  );
};
