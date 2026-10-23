import type { LucideIcon } from "lucide-react";
import { Phone } from "lucide-react";
import type { ComponentProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_SECONDARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";

export const TILE_CLASS =
  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-[#E3E8EF] bg-white text-[13px] font-semibold text-[#0F2A44] disabled:opacity-50 aria-disabled:opacity-50";

export const SECONDARY_ACTION_CLASS = cn(
  buttonVariants({ variant: "outline" }),
  ADMIN_SECONDARY_BUTTON_CLASS,
  "gap-1.5",
);

const telHref = (phone: string) => `tel:${phone.replaceAll(/[^\d+]/g, "")}`;

export const CallLink = ({
  phone,
  className,
}: {
  readonly phone: string | null;
  readonly className: string;
}) =>
  phone === null ? (
    <span aria-disabled="true" className={cn(className, "pointer-events-none opacity-50")}>
      <Phone aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
      {salesFr.file.call}
    </span>
  ) : (
    <a href={telHref(phone)} className={className}>
      <Phone aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
      {salesFr.file.call}
    </a>
  );

type TileButtonProps = ComponentProps<"button"> & {
  readonly icon: LucideIcon;
  readonly label: string;
};

export const TileButton = ({ icon: Icon, label, className, ...props }: TileButtonProps) => (
  <button type="button" className={cn(TILE_CLASS, className)} {...props}>
    <Icon aria-hidden="true" className="size-5 text-[#0E7C5A]" strokeWidth={1.8} />
    {label}
  </button>
);

export const CallTile = ({ phone }: { readonly phone: string | null }) =>
  phone === null ? (
    <span aria-disabled="true" className={TILE_CLASS}>
      <Phone aria-hidden="true" className="size-5 text-[#0E7C5A]" strokeWidth={1.8} />
      {salesFr.file.call}
    </span>
  ) : (
    <a href={telHref(phone)} className={TILE_CLASS}>
      <Phone aria-hidden="true" className="size-5 text-[#0E7C5A]" strokeWidth={1.8} />
      {salesFr.file.call}
    </a>
  );
