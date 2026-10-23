import {
  DOCUMENT_NUMBER_BLOCK_SIZE,
  ForbiddenError,
  type OrganizationRole,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemoryComplianceState } from "../infrastructure/in-memory-compliance-dependencies";
import {
  actorOf,
  complianceDependenciesOf,
  DEVICE_ID,
  ORGANIZATION_A,
  ORGANIZATION_B,
  OTHER_DEVICE_ID,
  PREFIX_A,
  seededComplianceState,
} from "./compliance.fixture";
import { reserveNumberBlock } from "./reserve-number-block";

let state: InMemoryComplianceState;
let dependencies: ReturnType<typeof complianceDependenciesOf>;

const reserve = () => reserveNumberBlock(dependencies);

const numbersOf = ({ firstNumber, lastNumber }: { firstNumber: number; lastNumber: number }) =>
  Array.from({ length: lastNumber - firstNumber + 1 }, (_, index) => firstNumber + index);

beforeEach(() => {
  state = seededComplianceState();
  dependencies = complianceDependenciesOf(state);
});

describe("reserveNumberBlock", () => {
  it.each<OrganizationRole>(["owner", "admin", "technician"])(
    "gives the %s a block of consecutive numbers with the organization prefix",
    async (role) => {
      const block = await reserve()(actorOf(role), { deviceId: DEVICE_ID });
      expect(block).toMatchObject({
        organizationId: ORGANIZATION_A,
        userId: `user-${role}`,
        deviceId: DEVICE_ID,
        numberPrefix: PREFIX_A,
        firstNumber: 1,
        lastNumber: DOCUMENT_NUMBER_BLOCK_SIZE,
      });
      expect(DOCUMENT_NUMBER_BLOCK_SIZE).toBe(20);
    },
  );

  it("starts at the next number of the organization", async () => {
    state.numbering.set(ORGANIZATION_A, { numberPrefix: PREFIX_A, nextDocumentNumber: 341 });
    const block = await reserve()(actorOf("technician"), { deviceId: DEVICE_ID });
    expect(block).toMatchObject({ firstNumber: 341, lastNumber: 360 });
  });

  it("forbids the secretary to reserve numbers", async () => {
    await expect(reserve()(actorOf("secretary"), { deviceId: DEVICE_ID })).rejects.toThrow(
      ForbiddenError,
    );
    expect(state.numberBlocks).toHaveLength(0);
  });

  it.each<OrganizationRole>(["owner", "technician"])(
    "refuses a reservation to an impersonated %s",
    async (role) => {
      await expect(
        reserve()(actorOf(role, { isImpersonating: true }), { deviceId: DEVICE_ID }),
      ).rejects.toThrow(ForbiddenError);
      expect(state.numberBlocks).toHaveLength(0);
    },
  );

  it("never gives the same number to two devices or two users", async () => {
    const blocks = [
      await reserve()(actorOf("technician"), { deviceId: DEVICE_ID }),
      await reserve()(actorOf("technician"), { deviceId: OTHER_DEVICE_ID }),
      await reserve()(actorOf("admin"), { deviceId: DEVICE_ID }),
      await reserve()(actorOf("owner"), { deviceId: OTHER_DEVICE_ID }),
    ];
    const numbers = blocks.flatMap(numbersOf);
    expect(new Set(numbers).size).toBe(4 * DOCUMENT_NUMBER_BLOCK_SIZE);
    expect(blocks.map(({ firstNumber }) => firstNumber)).toEqual([1, 21, 41, 61]);
  });

  it("numbers each organization on its own", async () => {
    await reserve()(actorOf("technician"), { deviceId: DEVICE_ID });
    const other = await reserve()(actorOf("technician", { organizationId: ORGANIZATION_B }), {
      deviceId: OTHER_DEVICE_ID,
    });
    expect(other).toMatchObject({ organizationId: ORGANIZATION_B, firstNumber: 1, lastNumber: 20 });
    expect(other.numberPrefix).not.toBe(PREFIX_A);
  });
});
