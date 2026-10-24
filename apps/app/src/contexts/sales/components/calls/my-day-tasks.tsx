import type { ProspectTaskResponse } from "@passalio/shared";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_PRIMARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { callsFr } from "../../fr-calls";
import { EmptyFrame } from "../list/list-states";
import { TaskCallLink, TaskKindChip, TaskTime, taskOwnerOf, taskWhoOf } from "./task-parts";

const text = callsFr.myDay;

const TaskRow = ({ task, now }: { readonly task: ProspectTaskResponse; readonly now: Date }) => (
  <li className="lg:border-b lg:border-[#EEF2F6]">
    <TaskCallLink
      task={task}
      className="flex min-h-12 items-center gap-3 rounded-[14px] border border-[#E3E8EF] bg-white px-3.5 py-3 hover:bg-[#F7F9FB] lg:gap-3.5 lg:rounded-none lg:border-0 lg:px-[18px]"
    >
      <TaskTime task={task} now={now} className="hidden w-[88px] shrink-0 lg:block" />
      <TaskKindChip kind={task.kind} className="hidden w-24 lg:inline-flex" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 lg:hidden">
          <TaskKindChip kind={task.kind} />
          <TaskTime task={task} now={now} className="text-[13px]" />
        </span>
        <span className="truncate text-[15px] font-semibold lg:text-[13px]">{taskWhoOf(task)}</span>
        <span className="truncate text-[13px] text-[#64748B]">{taskOwnerOf(task)}</span>
      </span>
      <span className="hidden h-[30px] shrink-0 items-center gap-1.5 rounded-[7px] border border-[#E3E8EF] px-3 text-[13px] font-semibold lg:inline-flex">
        <Phone aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
        {text.call}
      </span>
      <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[#94A3B8] lg:hidden" />
    </TaskCallLink>
  </li>
);

const VolumeFooter = () => (
  <Link
    to="/admin/appels"
    className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[14px] border border-[#E3E8EF] bg-white px-3.5 py-3 hover:bg-[#EEF3F8] lg:rounded-none lg:border-0 lg:bg-[#F7F9FB] lg:px-[18px] lg:py-3.5"
  >
    <span className="text-[13px]">
      <strong>{text.volumeLead}</strong>{" "}
      <span className="text-[#64748B]">· {text.volumeLeadHint}</span>
    </span>
    <span className="text-[13px] font-semibold text-[#0E7C5A]">{text.seeList}</span>
  </Link>
);

export const MyDayTasks = ({
  tasks,
  now,
}: {
  readonly tasks: readonly ProspectTaskResponse[];
  readonly now: Date;
}) => (
  <section
    aria-labelledby="my-day-todo"
    className="flex flex-col gap-2.5 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-[#E3E8EF]"
  >
    <header className="flex items-baseline justify-between gap-3 pt-1 lg:border-b lg:border-[#EEF2F6] lg:px-[18px] lg:py-3.5">
      <h2 id="my-day-todo" className="text-base font-bold lg:text-[15px]">
        {text.todo}
      </h2>
      <span className="hidden text-[13px] text-[#64748B] lg:inline">{text.todoHint}</span>
    </header>
    {tasks.length === 0 ? (
      <div className="lg:p-4">
        <EmptyFrame title={text.emptyTitle} description={text.emptyText}>
          <Link to="/admin/appels" className={cn(buttonVariants(), ADMIN_PRIMARY_BUTTON_CLASS)}>
            {text.emptyAction}
          </Link>
        </EmptyFrame>
      </div>
    ) : (
      <>
        <ul className="flex flex-col gap-2.5 lg:gap-0">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} now={now} />
          ))}
        </ul>
        <VolumeFooter />
      </>
    )}
  </section>
);
