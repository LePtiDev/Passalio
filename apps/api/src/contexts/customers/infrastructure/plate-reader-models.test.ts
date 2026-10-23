import { describe, expect, it } from "vitest";
import { FAKE_PLATE_ANSWER } from "./fake-plate-reader";
import { createPlateReader, namedModelOf } from "./plate-reader-models";

const JPEG = { bytes: new Uint8Array([255, 216]), contentType: "image/jpeg" };

describe("namedModelOf", () => {
  it.each([
    ["openai:gpt-test", { OPENAI_API_KEY: "sk-test" }],
    ["google:gemini-test", { GOOGLE_GENERATIVE_AI_API_KEY: "g-test" }],
    ["anthropic:claude-test", { ANTHROPIC_API_KEY: "a-test" }],
    ["mistral:mistral-test", { MISTRAL_API_KEY: "m-test" }],
  ])("builds %s when its key is set", (spec, settings) => {
    const named = namedModelOf(spec, settings);
    expect(named?.name).toBe(spec);
    expect(named?.model).toBeDefined();
  });

  it("gives no model when the provider key is missing or empty", () => {
    expect(namedModelOf("openai:gpt-test", {})).toBeUndefined();
    expect(namedModelOf("openai:gpt-test", { OPENAI_API_KEY: "" })).toBeUndefined();
    expect(namedModelOf("openai:gpt-test", { GOOGLE_GENERATIVE_AI_API_KEY: "g-test" })).toBe(
      undefined,
    );
  });

  it.each([undefined, "", "gpt-test", ":gpt-test", "openai:", "unknown:model"])(
    "gives no model for the setting %j",
    (spec) => {
      expect(namedModelOf(spec, { OPENAI_API_KEY: "sk-test" })).toBeUndefined();
    },
  );
});

describe("createPlateReader", () => {
  it("is not configured without any model", () => {
    expect(createPlateReader({ OPENAI_API_KEY: "sk-test" })).toBeUndefined();
  });

  it("is not configured when no model has its key", () => {
    expect(
      createPlateReader({
        PLATE_READER_MODEL: "openai:gpt-test",
        PLATE_READER_FALLBACK_MODEL: "google:gemini-test",
      }),
    ).toBeUndefined();
  });

  it("is configured with only the fallback model when the main one has no key", () => {
    expect(
      createPlateReader({
        PLATE_READER_MODEL: "openai:gpt-test",
        PLATE_READER_FALLBACK_MODEL: "google:gemini-test",
        GOOGLE_GENERATIVE_AI_API_KEY: "g-test",
      }),
    ).toBeDefined();
  });

  it("uses the fake reader for local development and tests", async () => {
    const reader = createPlateReader({ PLATE_READER_MODEL: "fake" });
    const reply = await reader?.read(JPEG, "trace-1");
    expect(reply).toEqual({
      isOk: true,
      value: {
        answer: FAKE_PLATE_ANSWER,
        model: "fake",
        usage: { inputTokens: 0, outputTokens: 0 },
      },
    });
  });
});
