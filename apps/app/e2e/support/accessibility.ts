import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const BLOCKING_IMPACTS: ReadonlySet<string> = new Set(["serious", "critical"]);

export type AccessibilityOptions = {
  readonly include?: string;
  readonly exclude?: readonly string[];
};

export const seriousAccessibilityViolations = async (
  page: Page,
  options: AccessibilityOptions = {},
) => {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (options.include !== undefined) {
    builder = builder.include(options.include);
  }
  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }
  const { violations } = await builder.analyze();
  return violations
    .filter(({ impact }) => impact !== undefined && impact !== null && BLOCKING_IMPACTS.has(impact))
    .map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map(({ target }) => target.join(" ")),
    }));
};

export const expectNoSeriousAccessibilityViolations = async (
  page: Page,
  options: AccessibilityOptions = {},
) => {
  expect(await seriousAccessibilityViolations(page, options)).toEqual([]);
};
