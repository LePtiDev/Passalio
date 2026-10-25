import { Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { callsFr } from "../../fr-calls";
import { EmptyFrame } from "../list/list-states";
import type { SessionProgress } from "./session-progress";

const text = callsFr.session;

const PRIMARY_LINK_CLASS = buttonVariants();

const SECONDARY_LINK_CLASS = cn(buttonVariants({ variant: "secondary" }));

export const SessionDone = ({ progress }: { readonly progress: SessionProgress }) => (
  <section
    aria-labelledby="session-done"
    className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-[14px] border border-[#E3E8EF] bg-white p-6 text-center lg:mt-10 lg:rounded-xl"
  >
    <span
      aria-hidden="true"
      className="flex size-12 items-center justify-center rounded-full bg-[#E6F4EE] text-[#0E7C5A]"
    >
      <CircleCheck className="size-6" strokeWidth={1.8} />
    </span>
    <h2 id="session-done" className="text-lg font-bold">
      {text.doneTitle}
    </h2>
    <p className="text-[15px] text-[#475569] lg:text-[13px]">
      {text.doneText(progress.logged)} {text.tally(progress.answered, progress.voicemail)}.
    </p>
    <span className="flex w-full flex-col gap-2 pt-1 lg:w-auto lg:flex-row">
      <Link to="/admin/journee" className={PRIMARY_LINK_CLASS}>
        {text.myDay}
      </Link>
      <Link to="/admin/appels" className={SECONDARY_LINK_CLASS}>
        {text.newSeries}
      </Link>
    </span>
  </section>
);

export const SessionEmpty = () => (
  <div className="mx-auto w-full max-w-xl lg:mt-10">
    <EmptyFrame title={text.emptyTitle} description={text.emptyText}>
      <Link to="/admin/appels" className={PRIMARY_LINK_CLASS}>
        {text.emptyAction}
      </Link>
    </EmptyFrame>
  </div>
);
