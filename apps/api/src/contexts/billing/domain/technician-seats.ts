import { SOLO_TECHNICIAN_LIMIT } from "@passalio/shared";
import type { Subscription } from "./billing-models";

export type SeatSubscription = Pick<Subscription, "plan" | "endedAt">;

export const isLimitedToSolo = (subscription: SeatSubscription | null): boolean =>
  subscription !== null && subscription.plan === "solo" && subscription.endedAt === null;

export const hasFreeTechnicianSeat = (
  subscription: SeatSubscription | null,
  usedSeats: number,
): boolean => !isLimitedToSolo(subscription) || usedSeats < SOLO_TECHNICIAN_LIMIT;
