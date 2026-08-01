import { describe, expect, it } from "vitest";
import { parseExcludedProjectNumbers, posterSchema } from "./poster-validation";
import { filterPosterProjects, sortPosterShares, visiblePosterShares } from "./poster-utils";
import type { PosterProject } from "./poster-types";

const project = (projectNumber: number, status = "OPEN"): PosterProject => ({
  id: String(projectNumber), projectNumber, name: `Proje ${projectNumber}`, year: "2026", department: "Büyükbaş",
  type: "Kurban", group: "Vacip", country: "Somali", countryCode: "SO", partner: "Yedirenk", region: "Somali",
  status, isVirtual: false, shareCapacity: 7, shares: [],
});

describe("poster helpers", () => {
  it("hariç proje numaralarını ayrıştırır, tekrarları temizler", () => {
    expect(parseExcludedProjectNumbers("8, 9, 8, 125")).toEqual({ values: [8, 9, 125], invalid: [] });
    expect(parseExcludedProjectNumbers("8, x, -2").invalid).toEqual(["x", "-2"]);
  });

  it("proje aralığını, hariç listesini ve tamamlanma durumunu filtreler", () => {
    const result = filterPosterProjects([project(1), project(2), project(3, "COMPLETED"), project(4)], { first: 2, last: 4, excluded: [4] });
    expect(result.map((item) => item.projectNumber)).toEqual([2]);
  });

  it("hisseleri doğru sıraya koyar ve boşları tercihe göre gizler", () => {
    const shares = [{ shareNumber: 3, status: "FILLED" }, { shareNumber: 1, status: "EMPTY" }, { shareNumber: 2, status: "FILLED" }];
    expect(sortPosterShares(shares).map((item) => item.shareNumber)).toEqual([1, 2, 3]);
    expect(visiblePosterShares(shares, false).map((item) => item.shareNumber)).toEqual([2, 3]);
  });

  it("yatay ve dikey çıktı veri modelini doğrular", () => {
    const base = { name: "Test", projectIds: ["p1"], excludedProjectNumbers: [], associationIds: [], showEmptyShares: true, shareholderNameFormat: "FULL" };
    expect(posterSchema.parse({ ...base, orientation: "LANDSCAPE" }).orientation).toBe("LANDSCAPE");
    expect(posterSchema.parse({ ...base, orientation: "PORTRAIT" }).orientation).toBe("PORTRAIT");
  });
});
