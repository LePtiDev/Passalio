import { backofficeFr } from "../../fr";
import { AdminHeading, AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { JournalTimeline } from "./journal-timeline";

const text = backofficeFr.journal;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

export const JournalScreen = () => (
  <AdminPage trail={TRAIL} mobileTitle={text.title} mobileSubtitle={text.mobileSubtitle}>
    <AdminHeading title={text.title} subtitle={text.subtitle} />
    <div className="w-full max-w-[920px]">
      <JournalTimeline accountId={null} />
    </div>
  </AdminPage>
);
