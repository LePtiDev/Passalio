import {
  assertPlatformCan,
  type PlatformActor,
  type ProspectMapResponse,
  type ProspectStage,
} from "@passalio/shared";
import type { SalesDependencies } from "../domain/prospect-ports";

export const getProspectMap =
  ({ companies }: Pick<SalesDependencies, "companies">) =>
  async (
    actor: PlatformActor,
    input: { readonly department?: string | undefined; readonly stage?: ProspectStage | undefined },
  ): Promise<ProspectMapResponse> => {
    assertPlatformCan(actor, "prospects:read");
    return { pins: [...(await companies.pins(input.department, input.stage))] };
  };
