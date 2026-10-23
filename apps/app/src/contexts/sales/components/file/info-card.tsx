import type { LucideIcon } from "lucide-react";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { CARD_TITLE_CLASS, MUTED_CLASS } from "../sales-styles";

export type InfoItem = {
  readonly key: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly value: string | null;
  readonly missing: string;
  readonly isMobileHidden?: boolean;
};

export const InfoCard = ({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly InfoItem[];
}) => (
  <section className={ADMIN_CARD_CLASS}>
    <h2 className={CARD_TITLE_CLASS}>{title}</h2>
    <dl>
      {items.map(({ key, label, icon: Icon, value, missing, isMobileHidden }) => (
        <div
          key={key}
          className={cn(
            "flex gap-3 border-t border-[#EEF2F6] px-3.5 py-3",
            isMobileHidden === true && "hidden lg:flex",
          )}
        >
          <Icon
            aria-hidden="true"
            className="mt-0.5 hidden size-4 shrink-0 text-[#94A3B8] lg:block"
            strokeWidth={1.8}
          />
          <div className="flex min-w-0 flex-col">
            <dt className="text-xs text-[#64748B]">{label}</dt>
            <dd
              className={cn(
                "text-[15px] break-words lg:truncate lg:text-[13px]",
                value === null && MUTED_CLASS,
              )}
            >
              {value ?? missing}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  </section>
);
