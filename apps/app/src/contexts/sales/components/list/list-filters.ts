export type FilterOption = { readonly value: string; readonly label: string };

export type FilterGroup = {
  readonly key: string;
  readonly label: string;
  readonly anyLabel: string;
  readonly value: string | null;
  readonly options: readonly FilterOption[];
  readonly isMobileOnly?: boolean;
  readonly hasChip?: boolean;
  readonly onChange: (value: string | null) => void;
};

export const activeFiltersOf = (groups: readonly FilterGroup[]) =>
  groups.flatMap((group) => {
    if (group.hasChip === false) {
      return [];
    }
    const option = group.options.find(({ value }) => value === group.value);
    return option === undefined ? [] : [{ group, option }];
  });

export type ActiveFilter = ReturnType<typeof activeFiltersOf>[number];
