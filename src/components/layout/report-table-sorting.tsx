"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { compareTableValues } from "@/lib/table-sort";

const EXCLUDED_HEADERS = new Set([
  "",
  "detay",
  "se\u00E7",
  "yazd\u0131r",
  "sil",
  "g\u00FCncelle",
  "i\u015Flem",
  "i\u015Flemler",
]);

function isSortingScreen(pathname: string) {
  return (
    pathname.startsWith("/raporlar") ||
    pathname === "/kurbanlar/sorgu" ||
    pathname === "/kurbanlar/bagis" ||
    pathname === "/bagislar/yeni"
  );
}

export function ReportTableSorting() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isSortingScreen(pathname)) return;

    const decorate = () => {
      document.querySelectorAll<HTMLTableElement>("main table").forEach((table) => {
        table.querySelectorAll<HTMLTableCellElement>("thead th").forEach((header) => {
          const label = header.textContent?.replace(/[\u2195\u2191\u2193]/g, "").trim() ?? "";
          if (
            header.colSpan > 1 ||
            header.querySelector("button") ||
            EXCLUDED_HEADERS.has(label.toLocaleLowerCase("tr-TR"))
          ) return;

          header.dataset.reportSortable = "true";
          header.tabIndex = 0;
          header.title = `${label} s\u00FCtununu s\u0131rala`;
          header.classList.add("cursor-pointer", "select-none");
          if (!header.querySelector("[data-sort-indicator]")) {
            const indicator = document.createElement("span");
            indicator.dataset.sortIndicator = "true";
            indicator.textContent = " \u2195";
            indicator.className = "ml-1 inline-block text-[10px] opacity-60";
            header.append(indicator);
          }
        });
      });
    };

    const sortByHeader = (header: HTMLTableCellElement) => {
      const table = header.closest("table");
      const body = table?.tBodies[0];
      const headerRow = header.parentElement;
      if (!table || !body || !headerRow) return;

      const column = Array.from(headerRow.children).indexOf(header);
      if (column < 0) return;

      const previousColumn = Number(table.dataset.sortColumn ?? -1);
      const direction = previousColumn === column && table.dataset.sortDirection === "asc" ? "desc" : "asc";
      const rows = Array.from(body.rows);
      const sortable = rows.filter((row) => row.cells.length > column && row.cells[column].colSpan === 1);
      const fixed = rows.filter((row) => !sortable.includes(row));

      sortable.sort((left, right) => {
        const comparison = compareTableValues(
          left.cells[column]?.textContent ?? "",
          right.cells[column]?.textContent ?? "",
        );
        return direction === "asc" ? comparison : -comparison;
      });
      body.append(...sortable, ...fixed);

      table.dataset.sortColumn = String(column);
      table.dataset.sortDirection = direction;
      table.querySelectorAll<HTMLElement>("[data-sort-indicator]").forEach((item) => {
        item.textContent = " \u2195";
        item.classList.add("opacity-60");
      });
      table.querySelectorAll("th[aria-sort]").forEach((item) => item.removeAttribute("aria-sort"));

      const indicator = header.querySelector<HTMLElement>("[data-sort-indicator]");
      if (indicator) {
        indicator.textContent = direction === "asc" ? " \u2191" : " \u2193";
        indicator.classList.remove("opacity-60");
      }
      header.setAttribute("aria-sort", direction === "asc" ? "ascending" : "descending");
    };

    const click = (event: MouseEvent) => {
      const header = (event.target as HTMLElement).closest<HTMLTableCellElement>(
        "th[data-report-sortable='true']",
      );
      if (header) sortByHeader(header);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const header = (event.target as HTMLElement).closest<HTMLTableCellElement>(
        "th[data-report-sortable='true']",
      );
      if (!header) return;
      event.preventDefault();
      sortByHeader(header);
    };

    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", click);
    document.addEventListener("keydown", keydown);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", keydown);
    };
  }, [pathname]);

  return null;
}
