import type { MonthlyActivityResponse } from "@passalio/shared";

const WIDTH = 64;
const HEIGHT = 24;

type SparklineProps = {
  readonly months: readonly MonthlyActivityResponse[];
  readonly isDown: boolean;
};

export const Sparkline = ({ months, isDown }: SparklineProps) => {
  const values = months.map(({ activeDays }) => activeDays);
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? WIDTH / (values.length - 1) : WIDTH;
  const path = values
    .map((value, index) => `${(index * step).toFixed(1)},${(22 - (value / max) * 18).toFixed(1)}`)
    .join(" L");
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d={`M${path}`}
        fill="none"
        stroke={isDown ? "#B45309" : "#0E7C5A"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
