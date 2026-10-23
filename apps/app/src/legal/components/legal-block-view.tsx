import { Info } from "lucide-react";
import type { LegalBlock } from "../legal-document";

const TEXT_CLASS = "text-base leading-[1.65] text-[#1E293B]";

const LegalTable = ({
  headers,
  rows,
}: {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}) => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-normal">
      <thead className="bg-muted">
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col" className="px-3.5 py-2.5 font-bold">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("|")} className="border-t border-border align-top">
            {row.map((cell, index) => (
              <td key={headers[index]} className="px-3.5 py-2.5">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const LegalBlockView = ({ block }: { readonly block: LegalBlock }) => {
  switch (block.kind) {
    case "paragraph":
      return <p className={TEXT_CLASS}>{block.text}</p>;
    case "notice":
      return (
        <div className="flex gap-3 rounded-xl bg-muted px-4 py-3.5">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="text-[15px] leading-relaxed text-[#1E293B]">{block.text}</p>
        </div>
      );
    case "list":
      return (
        <ul className={`flex list-disc flex-col gap-1 pl-[22px] ${TEXT_CLASS}`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className={`flex list-decimal flex-col gap-1 pl-[22px] ${TEXT_CLASS}`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "definitions":
      return (
        <ul className={`flex list-disc flex-col gap-1 pl-[22px] ${TEXT_CLASS}`}>
          {block.items.map(({ term, text }) => (
            <li key={term}>
              <strong>{term}</strong> : {text}
            </li>
          ))}
        </ul>
      );
    default:
      return <LegalTable headers={block.headers} rows={block.rows} />;
  }
};
