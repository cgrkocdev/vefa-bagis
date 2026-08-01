import { describe, expect, it } from "vitest";
import { compareTableValues, parseTableSortValue } from "./table-sort";

describe("report table sorting", () => {
  it("parses Turkish currency values numerically", () => {
    expect(parseTableSortValue("\u20BA14.500,50")).toEqual({ kind: "number", value: 14500.5 });
    expect(compareTableValues("\u20BA900", "\u20BA12.500")).toBeLessThan(0);
  });

  it("sorts Turkish dates chronologically", () => {
    expect(compareTableValues("29.07.2026", "01.08.2026")).toBeLessThan(0);
  });

  it("uses natural numeric ordering for text", () => {
    expect(compareTableValues("Proje 2", "Proje 10")).toBeLessThan(0);
  });
});
