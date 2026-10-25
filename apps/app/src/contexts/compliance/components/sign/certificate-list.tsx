import { requiresUsageAdvice } from "@passalio/trades";
import { Link } from "@tanstack/react-router";
import { BookOpen, FileCheck2, FilePen } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { CARD_CLASS, equipmentNameOf, Fieldset } from "@/contexts/customers";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import type { CertificateFormValues } from "../../certificate-form";
import { draftSummaryOf } from "../../certificate-summary";
import { complianceFr } from "../../fr";
import { sweptEquipmentOf } from "../../swept-equipment";
import { AdviceSheet } from "./advice-sheet";

const text = complianceFr.sign;

const ACTION_CLASS =
  "flex min-h-12 shrink-0 items-center px-1 text-[15px] font-semibold text-[#0E7C5A] lg:min-h-8 lg:text-[13px]";

const CertificateRow = ({
  interventionId,
  equipment,
  values,
}: {
  readonly interventionId: string;
  readonly equipment: EquipmentRecord;
  readonly values: CertificateFormValues | undefined;
}) => {
  const isFilled = values !== undefined;
  const params = useMemo(
    () => ({ interventionId, equipmentId: equipment.id }),
    [interventionId, equipment.id],
  );
  const Icon = isFilled ? FileCheck2 : FilePen;
  return (
    <li className="flex items-center gap-3 border-t border-[#EEF2F6] px-3.5 py-3 first:border-t-0">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
          isFilled ? "bg-[#E6F4EE] text-[#0E7C5A]" : "bg-[#FFF4E5] text-[#B45309]",
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold lg:text-[13px]">
          {equipmentNameOf(equipment)}
        </span>
        <span
          className={cn("truncate text-[13px]", isFilled ? "text-[#64748B]" : "text-[#B45309]")}
        >
          {isFilled ? draftSummaryOf(values) : text.toFill}
        </span>
      </span>
      <Link
        to="/passages/$interventionId/certificat/$equipmentId"
        params={params}
        className={ACTION_CLASS}
      >
        {isFilled ? text.edit : text.fill}
      </Link>
    </li>
  );
};

export const CertificateList = ({
  interventionId,
  equipments,
  drafts,
  error,
}: {
  readonly interventionId: string;
  readonly equipments: readonly EquipmentRecord[];
  readonly drafts: ReadonlyMap<string, CertificateFormValues | undefined>;
  readonly error: string | undefined;
}) => {
  const [adviceFor, setAdviceFor] = useState<EquipmentRecord | null>(null);
  const advised = equipments.find((equipment) => requiresUsageAdvice(sweptEquipmentOf(equipment)));
  const openAdvice = useCallback(() => setAdviceFor(advised ?? null), [advised]);
  const closeAdvice = useCallback(() => setAdviceFor(null), []);
  return (
    <Fieldset title={text.certificates} text={text.certificatesText}>
      <div className={cn(CARD_CLASS, error !== undefined && "border-[#B42318]")}>
        <ul>
          {equipments.map((equipment) => (
            <CertificateRow
              key={equipment.id}
              interventionId={interventionId}
              equipment={equipment}
              values={drafts.get(equipment.id)}
            />
          ))}
        </ul>
        {advised === undefined ? null : (
          <div className="flex items-start gap-3 border-t border-[#EEF2F6] bg-[#F7F9FB] px-3.5 py-3">
            <BookOpen aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#64748B]" />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold lg:text-[13px]">{text.advice}</span>
              <span className="text-[13px] text-[#64748B]">{text.adviceText}</span>
            </span>
            <button type="button" onClick={openAdvice} className={cn(ACTION_CLASS, "-my-3")}>
              {text.read}
            </button>
          </div>
        )}
      </div>
      {error === undefined ? null : (
        <p role="alert" className="text-sm text-destructive lg:text-[13px]">
          {error}
        </p>
      )}
      <AdviceSheet equipment={adviceFor} onClose={closeAdvice} />
    </Fieldset>
  );
};
