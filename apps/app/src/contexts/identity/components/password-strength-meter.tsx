import { passwordStrength } from "@passalio/shared";
import { cn } from "@/lib/utils";
import { identityFr } from "../fr";

const BAR_COLORS = ["", "bg-destructive", "bg-warning", "bg-success", "bg-success"] as const;

const LEVELS = [1, 2, 3, 4] as const;

export const PasswordStrengthMeter = ({
  password,
  id,
}: {
  readonly password: string;
  readonly id: string;
}) => {
  const strength = passwordStrength(password);
  const label = identityFr.fields.strength[strength];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {LEVELS.map((level) => (
          <span
            key={level}
            className={cn(
              "h-1 rounded-full bg-[#E3E8EF]",
              level <= strength && BAR_COLORS[strength],
            )}
          />
        ))}
      </div>
      <span id={id} aria-live="polite" className="text-xs text-muted-foreground">
        {label === ""
          ? identityFr.fields.strengthHint
          : `${label} ${identityFr.fields.passwordTooShort}`}
      </span>
    </div>
  );
};
