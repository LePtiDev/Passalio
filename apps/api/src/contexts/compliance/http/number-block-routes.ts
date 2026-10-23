import { reserveNumberBlockBody } from "@passalio/shared";
import { Hono } from "hono";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson } from "../../../platform/validation";
import { reserveNumberBlock } from "../application/reserve-number-block";
import { complianceDependencies } from "./compliance-context";

export const numberBlockRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .post("/document-number-blocks", validateJson(reserveNumberBlockBody), async (context) => {
    const block = await reserveNumberBlock(complianceDependencies(context.var))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return context.json(
      {
        id: block.id,
        deviceId: block.deviceId,
        numberPrefix: block.numberPrefix,
        firstNumber: block.firstNumber,
        lastNumber: block.lastNumber,
      },
      201,
    );
  });
