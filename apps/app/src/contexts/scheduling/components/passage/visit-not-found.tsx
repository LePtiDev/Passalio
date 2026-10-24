import { Link } from "@tanstack/react-router";
import { DASHED_CARD_CLASS, SECONDARY_BUTTON_CLASS } from "@/contexts/customers";
import { Button } from "@/components/ui/button";
import { schedulingFr } from "../../fr";

const text = schedulingFr.visit;

export const VisitNotFound = () => (
  <div className="flex w-full flex-col gap-4 p-4 lg:p-6">
    <div className={DASHED_CARD_CLASS}>
      <span className="flex flex-col gap-1">
        <h1 className="text-[17px] font-bold lg:text-[15px]">{text.notFoundTitle}</h1>
        <p className="text-[15px] text-[#475569] lg:text-[13px]">{text.notFoundText}</p>
      </span>
      <Button asChild variant="outline" className={SECONDARY_BUTTON_CLASS}>
        <Link to="/planning">{text.back}</Link>
      </Button>
    </div>
  </div>
);
