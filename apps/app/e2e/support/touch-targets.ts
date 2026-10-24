import { expect, type Page } from "@playwright/test";
import { MOBILE } from "./viewports";

export const MIN_TOUCH_TARGET_PX = 48;

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='menuitemradio']",
  "[role='option']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export type SmallTouchTarget = {
  readonly element: string;
  readonly width: number;
  readonly height: number;
};

export const smallTouchTargets = (page: Page, minSize = MIN_TOUCH_TARGET_PX) =>
  page.evaluate(
    ({ selector, min }): SmallTouchTarget[] =>
      Array.from(document.querySelectorAll(selector)).flatMap((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const isHidden =
          box.width <= 1 ||
          box.height <= 1 ||
          style.visibility === "hidden" ||
          element.closest("[aria-hidden='true'], [inert]") !== null;
        const isLinkInSentence =
          element.tagName === "A" &&
          style.display === "inline" &&
          Array.from(element.parentElement?.childNodes ?? []).some(
            (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "",
          );
        if (isHidden || isLinkInSentence) {
          return [];
        }
        const labels =
          "labels" in element && element.labels instanceof NodeList
            ? Array.from(element.labels).filter((label) => label instanceof Element)
            : [];
        const boxes = [box, ...labels.map((label) => label.getBoundingClientRect())];
        if (boxes.some(({ width, height }) => width >= min && height >= min)) {
          return [];
        }
        const name =
          element.getAttribute("aria-label") ??
          element.getAttribute("name") ??
          element.textContent?.trim().slice(0, 40) ??
          "";
        return [
          {
            element: `<${element.tagName.toLowerCase()}> ${name}`.trim(),
            width: Math.round(Math.max(...boxes.map(({ width }) => width))),
            height: Math.round(Math.max(...boxes.map(({ height }) => height))),
          },
        ];
      }),
    { selector: INTERACTIVE_SELECTOR, min: minSize },
  );

export const expectTouchTargetsAtLeast48px = async (page: Page) => {
  expect(page.viewportSize()?.width).toBe(MOBILE.width);
  expect(await smallTouchTargets(page)).toEqual([]);
};
