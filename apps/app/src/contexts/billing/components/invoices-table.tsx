import type { InvoiceResponse, WorkspaceState } from "@passalio/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDateWithYear } from "@/lib/format-date";
import { billingFr } from "../billing-fr";
import { formatCents, invoiceStateOf, type InvoiceState } from "../subscription-view";
import { BillingPill, type PillTone } from "./billing-pill";

const text = billingFr.invoices;

const STATE_TONES: Readonly<Record<InvoiceState, PillTone>> = {
  paid: "green",
  processing: "blue",
  unpaid: "amber",
  due: "amber",
  void: "slate",
};

const COLUMNS = "grid grid-cols-[120px_minmax(0,1fr)_100px_110px_60px] items-center gap-3.5";

const SKELETON_ROWS = ["first", "second"] as const;

const InvoiceRow = ({
  invoice,
  workspaceState,
}: {
  readonly invoice: InvoiceResponse;
  readonly workspaceState: WorkspaceState;
}) => {
  const state = invoiceStateOf(invoice.status, workspaceState);
  const number = invoice.number ?? text.noNumber;
  return (
    <li className={`${COLUMNS} border-b border-[#EEF2F6] px-4 py-2.5`}>
      <span>{formatShortDateWithYear(new Date(invoice.issuedAt))}</span>
      <span className="truncate text-[#475569]">{number}</span>
      <span className="text-right tabular-nums">{formatCents(invoice.totalCents)}</span>
      <span>
        <BillingPill tone={STATE_TONES[state]}>{text.states[state]}</BillingPill>
      </span>
      {invoice.pdfUrl === null ? (
        <span />
      ) : (
        <a
          href={invoice.pdfUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={text.downloadLabel(number)}
          className="font-semibold text-[#0E7C5A] hover:text-[#0F2A44]"
        >
          {text.download}
        </a>
      )}
    </li>
  );
};

type InvoicesTableProps = {
  readonly invoices: readonly InvoiceResponse[] | undefined;
  readonly isError: boolean;
  readonly workspaceState: WorkspaceState;
};

const InvoicesBody = ({ invoices, isError, workspaceState }: InvoicesTableProps) => {
  if (isError) {
    return <p className="px-4 py-3 text-[13px] text-destructive">{text.loadFailed}</p>;
  }
  if (invoices === undefined) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3 px-4 py-3">
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} className="h-5 w-full" />
        ))}
      </div>
    );
  }
  if (invoices.length === 0) {
    return <p className="px-4 py-3 text-[13px] text-[#475569]">{text.empty}</p>;
  }
  return (
    <ul>
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.id} invoice={invoice} workspaceState={workspaceState} />
      ))}
    </ul>
  );
};

export const InvoicesTable = (props: InvoicesTableProps) => (
  <section
    aria-labelledby="invoices-title"
    className="hidden overflow-hidden rounded-xl border border-[#E3E8EF] text-[13px] lg:block"
  >
    <h2 id="invoices-title" className="px-4 py-3.5 text-sm font-bold">
      {text.title}
    </h2>
    <div
      aria-hidden="true"
      className={`${COLUMNS} border-y border-[#E3E8EF] bg-[#F7F9FB] px-4 py-2 font-semibold text-[#64748B]`}
    >
      <span>{text.date}</span>
      <span>{text.number}</span>
      <span className="text-right">{text.amount}</span>
      <span>{text.state}</span>
      <span />
    </div>
    <InvoicesBody {...props} />
    <p className="px-4 py-2.5 text-xs text-[#64748B]">{text.stripeNote}</p>
  </section>
);
