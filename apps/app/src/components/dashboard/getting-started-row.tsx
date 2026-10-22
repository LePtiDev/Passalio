import { Link } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { fr } from "@/fr";
import { cn } from "@/lib/utils";
import type { GettingStartedTask } from "./getting-started-tasks";

const ROW_CLASS =
  "flex min-h-14 items-center gap-3 border-b border-[#EEF2F6] px-3.5 last:border-b-0 lg:min-h-0 lg:px-4 lg:py-3";

const ACTION_CLASS = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "border border-[#D5DDE6] bg-white text-[#0F2A44] hover:bg-[#F7F9FB]",
} as const;

const StatusDot = ({ isDone }: { readonly isDone: boolean }) => (
  <span
    className={cn(
      "flex size-[22px] shrink-0 items-center justify-center rounded-full lg:size-5",
      isDone ? "bg-success" : "border-[1.5px] border-[#CBD5E1] bg-white",
    )}
  >
    {isDone ? (
      <Check aria-hidden="true" className="size-3 text-white lg:size-[11px]" strokeWidth={3.4} />
    ) : null}
  </span>
);

const TaskText = ({ task }: { readonly task: GettingStartedTask }) => {
  const isDone = task.status === "done";
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-px">
      <span
        className={cn(
          "text-[15px] font-semibold lg:text-[13px]",
          isDone && "text-[#64748B] line-through",
        )}
      >
        {task.title}
      </span>
      <span className="hidden text-xs text-[#64748B] lg:block">{task.text}</span>
    </span>
  );
};

type GettingStartedRowProps = {
  readonly task: GettingStartedTask;
  readonly isNext: boolean;
};

export const GettingStartedRow = ({ task, isNext }: GettingStartedRowProps) => {
  const isDone = task.status === "done";
  if (task.action !== null) {
    return (
      <li className="border-b border-[#EEF2F6] last:border-b-0">
        <Link to={task.action.to} className={cn(ROW_CLASS, "border-b-0 hover:bg-[#F7F9FB]")}>
          <StatusDot isDone={isDone} />
          <TaskText task={task} />
          <span
            className={cn(
              "hidden h-[30px] items-center rounded-[7px] px-3 text-xs font-semibold lg:inline-flex",
              ACTION_CLASS[isNext ? "primary" : "secondary"],
            )}
          >
            {task.action.label}
          </span>
          <ChevronRight aria-hidden="true" className="size-[18px] text-[#94A3B8] lg:hidden" />
        </Link>
      </li>
    );
  }
  return (
    <li className={ROW_CLASS}>
      <StatusDot isDone={isDone} />
      <TaskText task={task} />
      {task.status === "soon" ? (
        <span className="rounded-full bg-[#EEF3F8] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
          {fr.shell.soon}
        </span>
      ) : null}
    </li>
  );
};
