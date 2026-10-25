import type { ProspectTaskResponse } from "@passalio/shared";
import { Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { callsFr } from "../../fr-calls";
import { EmptyFrame } from "../list/list-states";
import { LIST_HEADER_CLASS } from "../sales-styles";
import { TaskCallLink, TaskKindChip, TaskTime } from "./task-parts";

const text = callsFr.calls;

const GRID_CLASS =
  "lg:grid lg:grid-cols-[150px_minmax(0,1fr)_120px_104px] lg:items-center lg:gap-3";

const placeOf = (task: ProspectTaskResponse) =>
  [task.company.name, task.company.city].filter(Boolean).join(" · ");

const DueTaskRow = ({ task, now }: { readonly task: ProspectTaskResponse; readonly now: Date }) => (
  <li
    className={cn(
      GRID_CLASS,
      "flex items-center gap-3 border-b border-[#EEF2F6] px-3.5 py-3 last:border-b-0 lg:px-[18px]",
    )}
  >
    <span className="hidden flex-col items-start gap-1 lg:flex">
      <TaskKindChip kind={task.kind} />
      <TaskTime task={task} now={now} className="text-xs" />
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex items-center gap-2 lg:hidden">
        <TaskKindChip kind={task.kind} />
        <TaskTime task={task} now={now} className="text-[13px]" />
      </span>
      <span className="truncate text-[15px] font-semibold lg:text-[13px]">
        {task.contact?.name ?? task.company.name}
      </span>
      <span className="truncate text-[13px] text-[#64748B]">{placeOf(task)}</span>
    </span>
    <span className="hidden truncate text-[13px] text-[#475569] lg:block">
      {task.owner?.name ?? callsFr.myDay.unassigned}
    </span>
    <TaskCallLink
      task={task}
      label={`${callsFr.myDay.call} ${task.contact?.name ?? task.company.name}`}
      className={cn(buttonVariants(), "w-12 shrink-0 gap-1.5 px-0 lg:h-8 lg:w-full")}
    >
      <Phone aria-hidden="true" className="size-4 lg:size-3.5" strokeWidth={1.8} />
      <span className="hidden lg:inline">{callsFr.myDay.call}</span>
    </TaskCallLink>
  </li>
);

export const DueTasks = ({
  tasks,
  now,
}: {
  readonly tasks: readonly ProspectTaskResponse[];
  readonly now: Date;
}) => (
  <section aria-labelledby="due-title" className={ADMIN_CARD_CLASS}>
    <h2
      id="due-title"
      className="border-b border-[#EEF2F6] px-3.5 py-3 text-[15px] font-bold lg:px-[18px]"
    >
      {text.dueTitle}
    </h2>
    {tasks.length === 0 ? (
      <div className="p-3.5 lg:p-4">
        <EmptyFrame title={text.dueEmpty} description={text.dueEmptyText}>
          <a href="#volume" className={buttonVariants({ variant: "secondary" })}>
            {text.volumeTitle}
          </a>
        </EmptyFrame>
      </div>
    ) : (
      <>
        <div aria-hidden="true" className={cn(GRID_CLASS, LIST_HEADER_CLASS, "lg:px-[18px]")}>
          <span>{text.columns.when}</span>
          <span>{text.columns.contact}</span>
          <span>{text.columns.owner}</span>
          <span />
        </div>
        <ul>
          {tasks.map((task) => (
            <DueTaskRow key={task.id} task={task} now={now} />
          ))}
        </ul>
      </>
    )}
  </section>
);
