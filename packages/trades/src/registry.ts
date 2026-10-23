import type { z } from "zod";
import { chimneySweepingTrade } from "./chimney-sweeping/trade";
import type { TradeDefinition } from "./define-trade";

export const TRADES: readonly TradeDefinition<z.ZodType>[] = [chimneySweepingTrade];
