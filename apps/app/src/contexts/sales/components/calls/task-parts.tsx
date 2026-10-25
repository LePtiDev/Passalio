import type { ProspectTaskResponse } from "@passalio/shared";
import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { whenLabel } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";
import { isOverdue } from "./my-day-summary";

const KIND_CHIP_CLASS = {
  callback: "bg-[#FEF3E2] text-[#B45309]",
  demo: "bg-[#EEF3F8] text-[#0F2A44]",
} as const;

export const TaskKindChip = ({
  kind,
  className,
}: {
  readonly kind: ProspectTaskResponse["kind"];
  readonly className?: string;
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-[7px] px-2 py-0.5 text-xs font-semibold",
      KIND_CHIP_CLASS[kind],
      className,
    )}
  >
    {callsFr.taskKinds[kind]}
  </span>
);

export const TaskTime = ({
  task,
  now,
  className,
}: {
  readonly task: ProspectTaskResponse;
  readonly now: Date;
  readonly className?: string;
}) => {
  const isLate = isOverdue(task, now);
  return (
    <span
      className={cn(
        "font-bold tabular-nums",
        isLate ? "text-[#B42318]" : "text-[#0F2A44]",
        className,
      )}
    >
      {whenLabel(new Date(task.dueAt), now)}
      {isLate ? <span className="sr-only">{` (${callsFr.myDay.late})`}</span> : null}
    </span>
  );
};

export const taskWhoOf = (task: ProspectTaskResponse) =>
  callsFr.myDay.taskLine(task.contact?.name ?? null, task.company.name, task.company.city);

export const taskOwnerOf = (task: ProspectTaskResponse) =>
  task.owner === null ? callsFr.myDay.unassigned : callsFr.myDay.owner(task.owner.name);

export const TaskCallLink = ({
  task,
  className,
  children,
  label,
}: {
  readonly task: ProspectTaskResponse;
  readonly className: string;
  readonly children: ReactNode;
  readonly label?: string;
}) => {
  const search = useMemo(
    () => ({ entreprise: task.company.id, tache: task.id }),
    [task.company.id, task.id],
  );
  return (
    <Link to="/admin/appels/serie" search={search} aria-label={label} className={className}>
      {children}
    </Link>
  );
};
