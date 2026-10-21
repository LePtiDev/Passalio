import { err, ok, type Result } from "@passalio/shared";

export const ORGANIZATION_NAME_MIN_LENGTH = 2;
export const ORGANIZATION_NAME_MAX_LENGTH = 100;

const SLUG_SUFFIX_LENGTH = 6;

export const normalizeOrganizationName = (
  rawName: string,
): Result<string, "invalid_organization_name"> => {
  const name = rawName.trim().replaceAll(/\s+/g, " ");
  return name.length >= ORGANIZATION_NAME_MIN_LENGTH && name.length <= ORGANIZATION_NAME_MAX_LENGTH
    ? ok(name)
    : err("invalid_organization_name");
};

export const toSlug = (name: string, uniqueSuffix: string): string => {
  const base = name
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  const suffix = uniqueSuffix.replaceAll("-", "").slice(-SLUG_SUFFIX_LENGTH);
  return base.length > 0 ? `${base}-${suffix}` : suffix;
};
