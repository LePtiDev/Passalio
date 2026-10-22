import { Button } from "@/components/ui/button";
import { fr } from "@/fr";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine, errorMessage } from "@/lib/errors";

type ErrorStateProps = {
  readonly error: unknown;
  readonly onRetry: () => void;
};

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const apiError = apiErrorOf(error);
  const codeLine = errorCodeLine(apiError);
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl"
    >
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold lg:text-sm">{errorMessage(apiError.code)}</span>
        {codeLine === undefined ? null : (
          <span className="text-[13px] text-[#64748B] tabular-nums lg:text-xs">{codeLine}</span>
        )}
      </span>
      <Button
        variant="outline"
        className="h-12 rounded-[10px] border-[#D5DDE6] text-[15px] font-semibold lg:h-8 lg:rounded-[7px] lg:px-3 lg:text-[13px]"
        onClick={onRetry}
      >
        {fr.errors.retry}
      </Button>
    </div>
  );
};
