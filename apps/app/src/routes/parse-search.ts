import { defaultParseSearch } from "@tanstack/react-router";
import { returnToSearch } from "./return-to-search";

export const parseSearchWithoutForeignReturn = (searchString: string) => {
  const search = defaultParseSearch(searchString);
  if (!("retour" in search) || returnToSearch.safeParse({ retour: search["retour"] }).success) {
    return search;
  }
  const { retour: _foreignReturn, ...rest } = search;
  return rest;
};
