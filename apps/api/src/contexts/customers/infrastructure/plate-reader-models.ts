import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { PlateReader } from "../domain/plate-reading-ports";
import { createAiPlateReader, type NamedModel } from "./ai-plate-reader";
import { createFakePlateReader, FAKE_PLATE_READER_MODEL } from "./fake-plate-reader";

export type PlateReaderSettings = {
  readonly PLATE_READER_MODEL?: string | undefined;
  readonly PLATE_READER_FALLBACK_MODEL?: string | undefined;
  readonly OPENAI_API_KEY?: string | undefined;
  readonly GOOGLE_GENERATIVE_AI_API_KEY?: string | undefined;
  readonly ANTHROPIC_API_KEY?: string | undefined;
  readonly MISTRAL_API_KEY?: string | undefined;
};

type Provider = {
  readonly apiKeyOf: (settings: PlateReaderSettings) => string | undefined;
  readonly modelOf: (apiKey: string, modelId: string) => LanguageModel;
};

const PROVIDERS: Readonly<Record<string, Provider>> = {
  openai: {
    apiKeyOf: (settings) => settings.OPENAI_API_KEY,
    modelOf: (apiKey, modelId) => createOpenAI({ apiKey })(modelId),
  },
  google: {
    apiKeyOf: (settings) => settings.GOOGLE_GENERATIVE_AI_API_KEY,
    modelOf: (apiKey, modelId) => createGoogle({ apiKey })(modelId),
  },
  anthropic: {
    apiKeyOf: (settings) => settings.ANTHROPIC_API_KEY,
    modelOf: (apiKey, modelId) => createAnthropic({ apiKey })(modelId),
  },
  mistral: {
    apiKeyOf: (settings) => settings.MISTRAL_API_KEY,
    modelOf: (apiKey, modelId) => createMistral({ apiKey })(modelId),
  },
};

export const namedModelOf = (
  spec: string | undefined,
  settings: PlateReaderSettings,
): NamedModel | undefined => {
  const separator = spec?.indexOf(":") ?? -1;
  if (spec === undefined || separator <= 0) {
    return undefined;
  }
  const provider = PROVIDERS[spec.slice(0, separator)];
  const modelId = spec.slice(separator + 1).trim();
  const apiKey = provider?.apiKeyOf(settings);
  return provider === undefined || apiKey === undefined || apiKey === "" || modelId === ""
    ? undefined
    : { name: spec, model: provider.modelOf(apiKey, modelId) };
};

export const createPlateReader = (settings: PlateReaderSettings): PlateReader | undefined => {
  if (settings.PLATE_READER_MODEL === FAKE_PLATE_READER_MODEL) {
    return createFakePlateReader();
  }
  const models = [settings.PLATE_READER_MODEL, settings.PLATE_READER_FALLBACK_MODEL].flatMap(
    (spec) => namedModelOf(spec, settings) ?? [],
  );
  return models.length === 0 ? undefined : createAiPlateReader(models);
};
