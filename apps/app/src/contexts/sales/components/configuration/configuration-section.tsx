import type { ReactNode } from "react";

export const ConfigurationSection = ({
  title,
  hint,
  children,
}: {
  readonly title: string;
  readonly hint: string;
  readonly children: ReactNode;
}) => {
  const titleId = `configuration-${title}`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3.5 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl lg:px-5 lg:py-[18px]"
    >
      <span className="flex flex-col gap-0.5">
        <h2 id={titleId} className="text-base font-bold lg:text-[15px]">
          {title}
        </h2>
        <span className="text-sm text-[#64748B] lg:text-[13px]">{hint}</span>
      </span>
      {children}
    </section>
  );
};

export const ConfigurationGrid = ({ children }: { readonly children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 lg:grid-cols-2 lg:gap-y-3">{children}</div>
);
