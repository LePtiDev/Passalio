import { customersFr } from "../../fr";
import { CARD_CLASS } from "../customer-styles";

const text = customersFr.file;

export const HistoryCard = () => (
  <section className={CARD_CLASS}>
    <h2 className="px-3.5 pt-3.5 text-[15px] font-bold lg:text-sm">{text.history}</h2>
    <div className="flex flex-col items-start gap-1 px-3.5 py-4">
      <span className="text-[15px] font-semibold lg:text-[13px]">{text.historyEmptyTitle}</span>
      <span className="text-[13px] text-[#475569]">{text.historyEmptyText}</span>
    </div>
  </section>
);
