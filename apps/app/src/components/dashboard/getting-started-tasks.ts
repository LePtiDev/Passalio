import { fr } from "@/fr";

const text = fr.home.tasks;

export type GettingStartedStatus = "done" | "todo" | "soon";

export type GettingStartedTask = {
  readonly key: string;
  readonly title: string;
  readonly text: string;
  readonly status: GettingStartedStatus;
  readonly action: { readonly label: string; readonly to: "/equipe" } | null;
};

type GettingStartedFacts = {
  readonly isCompanyReady: boolean;
  readonly invitedOrJoinedCount: number;
};

const soon = (key: string, task: { readonly title: string; readonly text: string }) => ({
  key,
  ...task,
  status: "soon" as const,
  action: null,
});

export const gettingStartedTasks = ({
  isCompanyReady,
  invitedOrJoinedCount,
}: GettingStartedFacts): readonly GettingStartedTask[] => {
  const hasTeam = invitedOrJoinedCount > 0;
  return [
    {
      key: "company",
      ...text.company,
      status: isCompanyReady ? "done" : "todo",
      action: null,
    },
    {
      key: "team",
      title: text.team.title,
      text: hasTeam ? text.team.doneText(invitedOrJoinedCount) : text.team.todoText,
      status: hasTeam ? "done" : "todo",
      action: hasTeam ? null : { label: text.team.action, to: "/equipe" },
    },
    soon("customers", text.customers),
    soon("schedule", text.schedule),
    soon("document", text.document),
    soon("reminders", text.reminders),
  ];
};
