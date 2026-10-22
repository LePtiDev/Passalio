import { Check } from "lucide-react";
import { identityFr } from "../fr";
import { AuthShowcaseHeading } from "./auth-showcase-heading";

const text = identityFr.authLayout;

const ROUND_STOPS = [
  { time: "08:30", customer: "M. Bernard", isDone: true },
  { time: "09:40", customer: "Mme Durand", isDone: true },
  { time: "11:00", customer: "SCI Les Tilleuls", isDone: false },
] as const;

const CERTIFICATE_ROWS = [
  [text.showcaseCustomer, "Mme Durand, Lyon 3e"],
  [text.showcaseDevice, "Insert bois, conduit maçonné"],
  [text.showcaseIntervention, "22 oct. 2026, 9 h 40"],
  [text.showcaseTechnician, "Marc Lefèvre"],
] as const;

const RoundCard = () => (
  <div className="absolute top-0 right-0 flex w-[230px] flex-col gap-2.5 rounded-[10px] border border-white/12 bg-white/6 p-3 text-xs">
    <div className="flex items-center justify-between">
      <span className="font-bold">{text.showcaseRound}</span>
      <span className="text-[#A9B8C8]">{text.showcaseRoundDate}</span>
    </div>
    {ROUND_STOPS.map((stop) => (
      <div key={stop.time} className="flex items-center gap-2">
        {stop.isDone ? (
          <span className="flex size-4 items-center justify-center rounded-full bg-[var(--brand-mint)]">
            <Check
              aria-hidden="true"
              className="size-2.5 text-[var(--brand-navy)]"
              strokeWidth={3.5}
            />
          </span>
        ) : (
          <span className="size-4 rounded-full border-[1.5px] border-dashed border-white/40" />
        )}
        <span className="text-[#A9B8C8] tabular-nums">{stop.time}</span>
        <span>{stop.customer}</span>
      </div>
    ))}
  </div>
);

const SignatureMark = () => (
  <svg
    aria-hidden="true"
    width="76"
    height="22"
    viewBox="0 0 96 28"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
  >
    <path d="M4 20c6-10 10-14 13-12s-4 14 2 12 8-14 12-12-2 10 3 10 6-8 10-8 2 8 7 8 8-6 13-6 6 4 10 3 8-4 14-5" />
  </svg>
);

const CertificateCard = () => (
  <div className="absolute top-[76px] left-0 w-[320px] overflow-hidden rounded-[10px] bg-white text-xs text-[var(--brand-navy)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(15,42,68,0.08)]">
    <div className="flex items-start justify-between gap-3 border-b border-[#E3E8EF] px-3.5 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-bold">{text.showcaseCertificate}</span>
        <span className="text-[11px] text-[#64748B] tabular-nums">
          {text.showcaseCertificateNumber}
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EE] px-2 py-0.5 text-[11px] font-semibold text-success">
        <span className="size-[5px] rounded-full bg-success" />
        {text.showcaseSigned}
      </span>
    </div>
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-3.5 py-3">
      {CERTIFICATE_ROWS.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-[#64748B]">{label}</dt>
          <dd className="m-0">{value}</dd>
        </div>
      ))}
    </dl>
    <div className="flex items-center justify-between gap-3 border-t border-[#E3E8EF] bg-[#F7F9FB] px-3.5 py-2.5">
      <span className="text-[11px] text-[#475569]">
        {text.showcaseNextVisit} <strong className="text-[var(--brand-navy)]">octobre 2027</strong>
      </span>
      <SignatureMark />
    </div>
  </div>
);

const SentToast = () => (
  <div className="absolute top-[280px] left-[180px] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-[var(--brand-navy)] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)]">
    <span className="flex size-5 items-center justify-center rounded-full bg-[#E6F4EE]">
      <Check aria-hidden="true" className="size-3 text-success" strokeWidth={2.6} />
    </span>
    <span>
      {text.showcaseSent} <strong>Mme Durand</strong>
    </span>
  </div>
);

export const SignInShowcase = () => (
  <>
    <AuthShowcaseHeading badge={text.showcaseBadge} title={text.showcaseTitle} />
    <div aria-hidden="true" className="relative h-[340px] max-w-[480px]">
      <RoundCard />
      <CertificateCard />
      <SentToast />
    </div>
    <p className="text-xs text-[#A9B8C8]">{text.showcaseLegal}</p>
  </>
);
