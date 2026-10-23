import { MCP_ACCESS_LEVELS, type McpAccessLevel } from "@passalio/shared";
import { useCallback, type ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MCP_ACCESS_DESCRIPTIONS, MCP_ACCESS_LABELS, mcpFr } from "../../mcp-fr";

type AccessChoiceProps = {
  readonly value: McpAccessLevel;
  readonly onChange: (access: McpAccessLevel) => void;
};

const NAME = "mcp-access";

const accessOf = (value: string) => MCP_ACCESS_LEVELS.find((access) => access === value);

export const AccessChoice = ({ value, onChange }: AccessChoiceProps) => {
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const access = accessOf(event.target.value);
      if (access !== undefined) {
        onChange(access);
      }
    },
    [onChange],
  );
  return (
    <fieldset className="flex min-w-0 flex-col gap-2.5">
      <legend className="mb-2.5 text-base font-semibold lg:text-sm">{mcpFr.accessLegend}</legend>
      {MCP_ACCESS_LEVELS.map((access) => {
        const isSelected = access === value;
        return (
          <div
            key={access}
            className={cn(
              "relative rounded-[10px] bg-white",
              isSelected ? "border-2 border-[#0F2A44]" : "border border-[#E3E8EF]",
            )}
          >
            <input
              id={`${NAME}-${access}`}
              type="radio"
              name={NAME}
              value={access}
              checked={isSelected}
              onChange={change}
              className={cn(
                "absolute left-3.5 size-[18px] accent-[#0F2A44] lg:size-4",
                isSelected ? "top-[15px]" : "top-4",
              )}
            />
            <Label
              htmlFor={`${NAME}-${access}`}
              className={cn(
                "flex min-h-12 cursor-pointer flex-col items-start gap-0.5 pl-11 text-left lg:pl-10",
                isSelected ? "py-[13px] pr-[13px] lg:py-[11px]" : "py-3.5 pr-3.5 lg:py-3",
              )}
            >
              <span className="text-base font-bold lg:text-sm">{MCP_ACCESS_LABELS[access]}</span>
              <span className="text-sm leading-[1.45] font-normal text-[#475569] lg:leading-normal">
                {MCP_ACCESS_DESCRIPTIONS[access]}
              </span>
            </Label>
          </div>
        );
      })}
    </fieldset>
  );
};
