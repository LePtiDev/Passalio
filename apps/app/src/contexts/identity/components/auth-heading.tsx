type AuthHeadingProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly mobileSubtitle?: string;
};

const SUBTITLE_CLASS = "text-[15px] leading-normal text-muted-foreground lg:text-sm";

export const AuthHeading = ({ title, subtitle, mobileSubtitle }: AuthHeadingProps) => (
  <div className="flex flex-col gap-1 lg:gap-1.5">
    <h1 className="text-[22px] leading-tight font-bold tracking-tight">{title}</h1>
    {mobileSubtitle === undefined ? (
      <p className={SUBTITLE_CLASS}>{subtitle}</p>
    ) : (
      <p className={SUBTITLE_CLASS}>
        <span className="lg:hidden">{mobileSubtitle}</span>
        <span className="hidden lg:inline">{subtitle}</span>
      </p>
    )}
  </div>
);
