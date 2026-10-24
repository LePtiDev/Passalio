import { waitFor } from "@testing-library/react";

export const busyElementIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[aria-busy='true']");

export const findBusyElement = (container: HTMLElement) =>
  waitFor(() => {
    const busy = busyElementIn(container);
    if (busy === null) {
      throw new Error("no element is marked aria-busy");
    }
    return busy;
  });

export const findBusyElements = (container: HTMLElement, count: number) =>
  waitFor(() => {
    const busy = Array.from(container.querySelectorAll<HTMLElement>("[aria-busy='true']"));
    if (busy.length !== count) {
      throw new Error(`expected ${count} elements marked aria-busy, found ${busy.length}`);
    }
    return busy;
  });

export const skeletonsIn = (element: Element) =>
  Array.from(element.querySelectorAll("[data-slot='skeleton']"));
