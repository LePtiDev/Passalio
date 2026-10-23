import { encode } from "uqr";

type QrCodeProps = {
  readonly value: string;
  readonly label: string;
};

export const QrCode = ({ value, label }: QrCodeProps) => {
  const { data, size } = encode(value, { border: 1 });
  const cells = data.flatMap((row, y) =>
    row.flatMap((isDark, x) => (isDark ? [{ key: `${x}-${y}`, x, y }] : [])),
  );
  return (
    <figure className="shrink-0">
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="crispEdges"
        className="size-[132px] rounded-xl border border-[#E3E8EF] bg-white p-1.5"
      >
        {cells.map(({ key, x, y }) => (
          <rect key={key} x={x} y={y} width={1} height={1} fill="#0F2A44" />
        ))}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
};
