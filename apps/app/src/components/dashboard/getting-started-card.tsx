import { fr } from "@/fr";
import type { GettingStartedTask } from "./getting-started-tasks";
import { GettingStartedRow } from "./getting-started-row";

const PROGRESS_WIDTH_CLASS = [
  "w-0",
  "w-1/6",
  "w-2/6",
  "w-3/6",
  "w-4/6",
  "w-5/6",
  "w-full",
] as const;

const ProgressBar = ({ done }: { readonly done: number }) => (
  <span
    aria-hidden="true"
    className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#EEF3F8] lg:w-[120px]"
  >
    <span className={`bg-success ${PROGRESS_WIDTH_CLASS[done] ?? "w-full"}`} />
  </span>
);

export const GettingStartedCard = ({
  tasks,
}: {
  readonly tasks: readonly GettingStartedTask[];
}) => {
  const doneCount = tasks.filter(({ status }) => status === "done").length;
  const nextKey = tasks.find(({ status }) => status === "todo")?.key;
  return (
    <section className="min-w-0 flex-[2_1_520px] overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:rounded-[10px]">
      <div className="flex flex-col gap-2 border-b border-[#EEF2F6] p-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:border-[#E3E8EF] lg:px-4">
        <span className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold lg:text-sm">{fr.home.gettingStarted}</h2>
          <span className="text-sm text-[#64748B] lg:hidden" aria-hidden="true">
            {fr.home.progress(doneCount, tasks.length)}
          </span>
        </span>
        <span className="flex items-center gap-2.5 text-xs text-[#475569]">
          <ProgressBar done={doneCount} />
          <span className="hidden whitespace-nowrap lg:inline" aria-hidden="true">
            {fr.home.progress(doneCount, tasks.length)}
          </span>
          <span className="sr-only">{fr.home.progressLabel(doneCount, tasks.length)}</span>
        </span>
      </div>
      <ul>
        {tasks.map((task) => (
          <GettingStartedRow key={task.key} task={task} isNext={task.key === nextKey} />
        ))}
      </ul>
    </section>
  );
};
