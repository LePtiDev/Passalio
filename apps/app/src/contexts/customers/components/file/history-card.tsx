import { Link } from "@tanstack/react-router";
import { FileCheck2, FileX2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CertificateHistoryItem } from "../../certificate-history";
import { customersFr } from "../../fr";
import { CARD_CLASS } from "../customer-styles";

const text = customersFr.file;

const detailOf = (item: CertificateHistoryItem) =>
  [
    item.signedOn,
    ...(item.correctedByNumber === null
      ? [text.historySweeping, item.technicianName]
      : [text.historyCorrectedBy(item.correctedByNumber)]),
  ]
    .filter((part) => part !== null)
    .join(" · ");

const HistoryRow = ({ item }: { readonly item: CertificateHistoryItem }) => {
  const params = useMemo(() => ({ documentId: item.id }), [item.id]);
  const Icon = item.isCancelled ? FileX2 : FileCheck2;
  return (
    <Link
      to="/certificats/$documentId"
      params={params}
      className="flex min-h-[72px] items-center gap-3 border-t border-[#EEF2F6] px-3.5 py-3 hover:bg-[#F7F9FB] lg:min-h-16"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[10px] lg:size-9",
          item.isCancelled ? "bg-[#F1F5F9] text-[#94A3B8]" : "bg-[#E6F4EE] text-[#0E7C5A]",
        )}
      >
        <Icon aria-hidden="true" className="size-5 lg:size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-[15px] font-semibold lg:text-sm",
            item.isCancelled && "text-[#94A3B8] line-through",
          )}
        >
          {`${item.equipmentName} · ${item.number}`}
        </span>
        <span className="text-[13px] text-[#64748B]">{detailOf(item)}</span>
      </span>
      <span
        className={cn(
          "shrink-0 self-start rounded-[7px] px-2 py-0.5 text-xs font-semibold lg:self-center",
          item.isCancelled ? "bg-[#FDECEC] text-[#B42318]" : "bg-[#E6F4EE] text-[#0B6349]",
        )}
      >
        {item.isCancelled ? text.historyCancelled : text.historySigned}
      </span>
    </Link>
  );
};

const HistoryEmpty = () => (
  <div className="flex flex-col items-start gap-1 px-3.5 py-4">
    <span className="text-[15px] font-semibold lg:text-[13px]">{text.historyEmptyTitle}</span>
    <span className="text-[13px] text-[#475569]">{text.historyEmptyText}</span>
  </div>
);

const HistoryRows = ({ items }: { readonly items: readonly CertificateHistoryItem[] }) =>
  items.length === 0 ? (
    <HistoryEmpty />
  ) : (
    <div className="flex flex-col">
      {items.map((item) => (
        <HistoryRow key={item.id} item={item} />
      ))}
    </div>
  );

export const HistoryCard = ({ items }: { readonly items: readonly CertificateHistoryItem[] }) => (
  <section className={CARD_CLASS}>
    <div className="flex items-baseline justify-between gap-3 px-3.5 pt-3.5">
      <h2 className="text-[15px] font-bold lg:text-sm">{text.history}</h2>
      {items.length > 0 && (
        <span className="text-[13px] text-[#64748B]">{text.historyCount(items.length)}</span>
      )}
    </div>
    <HistoryRows items={items} />
  </section>
);
