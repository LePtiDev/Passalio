const QUOTE = '"';

export const parseCsv = (content: string, separator = ";"): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let isQuoted = false;
  const text = content.replace(/^﻿/, "");
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (isQuoted) {
      if (character === QUOTE && text[index + 1] === QUOTE) {
        field += QUOTE;
        index += 1;
      } else if (character === QUOTE) {
        isQuoted = false;
      } else {
        field += character;
      }
    } else if (character === QUOTE) {
      isQuoted = true;
    } else if (character === separator) {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

export const recordsOf = (rows: readonly string[][]): Record<string, string>[] => {
  const [header, ...lines] = rows;
  if (header === undefined) {
    return [];
  }
  return lines
    .filter((line) => line.some((value) => value.trim() !== ""))
    .map((line) => Object.fromEntries(header.map((name, index) => [name, line[index] ?? ""])));
};
