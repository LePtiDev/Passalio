import type { z } from "zod";

export type TradeDefinition<TFields extends z.ZodType> = {
  readonly id: string;
  readonly label: string;
  readonly periodicityInMonths: number;
  readonly documentVersion: number;
  readonly fields: TFields;
};

export const defineTrade = <TFields extends z.ZodType>(
  definition: TradeDefinition<TFields>,
): TradeDefinition<TFields> => definition;
