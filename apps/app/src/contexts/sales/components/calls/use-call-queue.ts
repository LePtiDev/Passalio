import { useState } from "react";
import { useCallSeries, useMyDay } from "../../hooks/use-call-queries";
import type { CallSession, QueuedCall } from "./call-session";

type QueueState =
  | { readonly status: "pending" }
  | { readonly status: "error"; readonly error: unknown; readonly retry: () => void }
  | { readonly status: "ready"; readonly calls: readonly QueuedCall[] };

const useFrozen = <Value>(value: Value | undefined): Value | undefined => {
  const [frozen, setFrozen] = useState<{ readonly value: Value } | null>(null);
  if (frozen === null && value !== undefined) {
    setFrozen({ value });
    return value;
  }
  return frozen?.value;
};

export const useCallQueue = (session: CallSession): QueueState => {
  const series = useCallSeries(session.kind === "series" ? session : null);
  const day = useMyDay(session.kind === "day");
  const fromSeries = series.data?.companies.map((company): QueuedCall => ({
    companyId: company.id,
    taskId: null,
    contactId: company.mainContact?.id ?? null,
    name: company.mainContact?.name ?? company.name,
    dueAt: null,
  }));
  const fromDay = day.data?.tasks.map((task): QueuedCall => ({
    companyId: task.company.id,
    taskId: task.id,
    contactId: task.contact?.id ?? null,
    name: task.contact?.name ?? task.company.name,
    dueAt: task.dueAt,
  }));
  const loaded = { series: fromSeries, day: fromDay, single: undefined }[session.kind];
  const frozen = useFrozen(loaded);
  if (session.kind === "single") {
    return {
      status: "ready",
      calls: [
        {
          companyId: session.companyId,
          taskId: session.taskId,
          contactId: null,
          name: null,
          dueAt: null,
        },
      ],
    };
  }
  if (frozen !== undefined) {
    return { status: "ready", calls: frozen };
  }
  const query = session.kind === "series" ? series : day;
  return query.isError
    ? { status: "error", error: query.error, retry: () => void query.refetch() }
    : { status: "pending" };
};
