import { Copy } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { twoFactorFr } from "../../two-factor-fr";
import { AuthHeading } from "../auth-heading";

const text = twoFactorFr.backupCodes;

type BackupCodesProps = {
  readonly codes: readonly string[];
  readonly onDone: () => void;
};

export const BackupCodes = ({ codes, onDone }: BackupCodesProps) => {
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(codes.join("\n"));
    toast.success(text.copied);
  }, [codes]);
  return (
    <div className="flex flex-col gap-5 lg:gap-[22px]">
      <AuthHeading title={text.title} subtitle={text.subtitle} />
      <ul
        aria-label={text.listLabel}
        className="grid grid-cols-2 gap-2 rounded-xl border border-[#E3E8EF] bg-[#F7F9FB] p-3 font-mono text-[15px] tabular-nums lg:text-sm"
      >
        {codes.map((code) => (
          <li key={code} className="rounded-md bg-white px-2.5 py-1.5 text-center">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3">
        <Button variant="secondary" onClick={copy}>
          <Copy aria-hidden="true" />
          {text.copy}
        </Button>
        <Button onClick={onDone}>{text.done}</Button>
      </div>
    </div>
  );
};
