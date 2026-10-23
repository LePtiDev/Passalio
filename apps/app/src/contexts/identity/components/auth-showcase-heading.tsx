export type AuthShowcaseHeadingProps = {
  readonly badge: string;
  readonly title: string;
};

export const AuthShowcaseHeading = ({ badge, title }: AuthShowcaseHeadingProps) => (
  <div className="flex max-w-[460px] flex-col gap-3">
    <span className="self-start rounded-full border border-[rgb(52_211_153/0.35)] bg-[rgb(52_211_153/0.08)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-mint)]">
      {badge}
    </span>
    <h2 className="text-[26px] leading-tight font-extrabold tracking-tight text-balance">
      {title}
    </h2>
  </div>
);
