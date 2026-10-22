export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const CHARACTER_CLASSES: readonly RegExp[] = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];

const countCharacterClasses = (password: string) =>
  CHARACTER_CLASSES.filter((characterClass) => characterClass.test(password)).length;

const hasLongRepeat = (password: string) => /(.)\1{3,}/.test(password);

export const passwordStrength = (password: string): PasswordStrength => {
  if (password.length < MIN_PASSWORD_LENGTH || hasLongRepeat(password)) {
    return password.length === 0 ? 0 : 1;
  }
  const classes = countCharacterClasses(password);
  if (password.length >= 20 || (password.length >= 16 && classes >= 2)) {
    return 4;
  }
  if (password.length >= 14 || classes >= 3) {
    return 3;
  }
  return classes >= 2 ? 3 : 2;
};
