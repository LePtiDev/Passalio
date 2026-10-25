import type { CallOutcome } from "@passalio/shared";

export type SessionProgress = {
  readonly total: number;
  readonly index: number;
  readonly answered: number;
  readonly voicemail: number;
  readonly logged: number;
  readonly isFinished: boolean;
};

export type SessionStep =
  | { readonly type: "logged"; readonly outcome: CallOutcome }
  | { readonly type: "skipped" }
  | { readonly type: "finished" };

export const startProgress = (total: number): SessionProgress => ({
  total,
  index: 0,
  answered: 0,
  voicemail: 0,
  logged: 0,
  isFinished: total === 0,
});

const advanced = (progress: SessionProgress): SessionProgress =>
  progress.index + 1 >= progress.total
    ? { ...progress, isFinished: true }
    : { ...progress, index: progress.index + 1 };

export const nextProgress = (progress: SessionProgress, step: SessionStep): SessionProgress => {
  if (progress.isFinished) {
    return progress;
  }
  if (step.type === "finished") {
    return { ...progress, isFinished: true };
  }
  if (step.type === "skipped") {
    return advanced(progress);
  }
  return advanced({
    ...progress,
    logged: progress.logged + 1,
    answered: progress.answered + (step.outcome === "answered" ? 1 : 0),
    voicemail: progress.voicemail + (step.outcome === "voicemail" ? 1 : 0),
  });
};
