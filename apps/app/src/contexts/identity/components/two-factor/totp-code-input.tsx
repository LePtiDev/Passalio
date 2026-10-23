import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Fragment } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export const TOTP_CODE_LENGTH = 6;

const GROUPS = [
  [0, 1, 2],
  [3, 4, 5],
] as const;

const SLOT_CLASS =
  "h-14 w-[50px] border-[#D5DDE6] bg-white text-[22px] font-semibold text-[#0F2A44] tabular-nums shadow-none first:rounded-l-lg last:rounded-r-lg data-[active=true]:border-l data-[active=true]:border-[#0E7C5A] data-[active=true]:ring-[3px] data-[active=true]:ring-[rgb(14_124_90/0.15)] lg:h-[52px] lg:w-12 lg:text-xl";

const INVALID_SLOT_CLASS =
  "border-[#B42318] data-[active=true]:border-[#B42318] data-[active=true]:ring-[rgb(180_35_24/0.12)]";

type TotpCodeInputProps = {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly isInvalid: boolean;
  readonly describedBy: string | undefined;
};

export const TotpCodeInput = ({
  id,
  value,
  onChange,
  isInvalid,
  describedBy,
}: TotpCodeInputProps) => (
  <InputOTP
    id={id}
    value={value}
    onChange={onChange}
    maxLength={TOTP_CODE_LENGTH}
    pattern={REGEXP_ONLY_DIGITS}
    inputMode="numeric"
    autoComplete="one-time-code"
    aria-invalid={isInvalid}
    aria-describedby={describedBy}
    containerClassName="gap-2.5"
  >
    {GROUPS.map((group, groupIndex) => (
      <Fragment key={group[0]}>
        {groupIndex > 0 ? (
          <span aria-hidden="true" className="h-0.5 w-2.5 shrink-0 rounded-full bg-[#94A3B8]" />
        ) : null}
        <InputOTPGroup
          className={cn("rounded-lg", isInvalid && "shadow-[0_0_0_3px_rgba(180,35,24,0.12)]")}
        >
          {group.map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(SLOT_CLASS, isInvalid && INVALID_SLOT_CLASS)}
            />
          ))}
        </InputOTPGroup>
      </Fragment>
    ))}
  </InputOTP>
);
