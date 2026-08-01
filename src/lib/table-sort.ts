export type SortValue = { kind: "number"; value: number } | { kind: "text"; value: string };

export function parseTableSortValue(raw: string): SortValue {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || text === "\u2014" || text === "-") return { kind: "text", value: "" };

  const dateMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dateMatch) {
    const [, day, month, year, hour = "0", minute = "0"] = dateMatch;
    return {
      kind: "number",
      value: Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)),
    };
  }

  const numericText = text
    .replace(/[\u20BA$\u20AC\u00A3]/g, "")
    .replace(/\b(?:TL|TRY|USD|EUR|adet|kay\u0131t|birim|hisse)\b/gi, "")
    .trim();
  if (/^-?[\d.]+(?:,\d+)?$/.test(numericText)) {
    const normalized = numericText.includes(",")
      ? numericText.replace(/\./g, "").replace(",", ".")
      : numericText.replace(/(?<=\d)\.(?=\d{3}(?:\D|$))/g, "");
    const value = Number(normalized);
    if (Number.isFinite(value)) return { kind: "number", value };
  }

  return { kind: "text", value: text.toLocaleLowerCase("tr-TR") };
}

export function compareTableValues(left: string, right: string) {
  const a = parseTableSortValue(left);
  const b = parseTableSortValue(right);
  if (a.kind === "number" && b.kind === "number") return a.value - b.value;
  return String(a.value).localeCompare(String(b.value), "tr", { numeric: true, sensitivity: "base" });
}
