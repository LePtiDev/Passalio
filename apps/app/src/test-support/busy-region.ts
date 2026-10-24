import { waitFor } from "@testing-library/react";

export const busyRegions = () => [...document.querySelectorAll<HTMLElement>('[aria-busy="true"]')];

export const findBusyRegion = async () =>
  waitFor(() => {
    const [region] = busyRegions();
    if (region === undefined) {
      throw new Error("no region is marked as busy");
    }
    return region;
  });
