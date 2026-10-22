import { Eye, EyeOff } from "lucide-react";
import { useCallback, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { identityFr } from "../fr";

export const PasswordInput = ({ className, ...props }: Omit<ComponentProps<"input">, "type">) => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = useCallback(() => setIsVisible((visible) => !visible), []);
  const label = isVisible ? identityFr.fields.hidePassword : identityFr.fields.showPassword;
  return (
    <div className="relative flex items-center">
      <Input type={isVisible ? "text" : "password"} className={cn("pr-12", className)} {...props} />
      <button
        type="button"
        aria-label={label}
        aria-pressed={isVisible}
        onClick={toggleVisibility}
        className="absolute right-0 flex size-12 items-center justify-center rounded-lg text-[#64748B] outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:size-10"
      >
        {isVisible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
};
