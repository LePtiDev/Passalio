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
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border p-4">
      <p>{errorMessage(apiError.code)}</p>
      {codeLine === undefined ? null : <p className="text-sm text-muted-foreground">{codeLine}</p>}
      <Button variant="outline" className="h-12 text-base" onClick={onRetry}>
        {fr.errors.retry}
      </Button>
    </div>
  );
};
