export type PrintTable = {
  title?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  footer?: Array<string | number>;
};

export type PrintReportOptions = {
  title: string;
  subtitle?: string;
  orientation?: "portrait" | "landscape";
  summaries?: Array<{ label: string; value: string }>;
  tables: PrintTable[];
  note?: string;
};

const escapeHtml = (value: string | number) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function printReportDocument(options: PrintReportOptions) {
  const popup = window.open("", `report-${Date.now()}`, "width=1250,height=900");
  if (!popup) {
    window.alert("Yazdırma penceresi açılamadı. Bu site için açılır pencere izni verip yeniden deneyin.");
    return;
  }
  const maxColumns = Math.max(...options.tables.map((table) => table.headers.length), 1);
  const fontSize = maxColumns > 12 ? 6.6 : maxColumns > 8 ? 7.5 : 8.5;
  const summaries = options.summaries?.map((item) => `<div class="metric"><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong></div>`).join("") ?? "";
  const tables = options.tables.map((table) => `<section class="table-section">${table.title ? `<h2>${escapeHtml(table.title)}</h2>` : ""}<table><thead><tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${table.rows.length ? table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${table.headers.length}" class="empty">Kayıt bulunamadı.</td></tr>`}</tbody>${table.footer ? `<tfoot><tr>${table.footer.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr></tfoot>` : ""}</table></section>`).join("");
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title><style>
  @page{size:A4 ${options.orientation ?? "landscape"};margin:9mm}*{box-sizing:border-box}body{margin:0;color:#173244;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{width:100%}.brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #02b3aa;padding-bottom:9px}.identity{display:flex;align-items:center;gap:9px}.logo{width:44px;height:44px;object-fit:contain}.identity h1{margin:0;font-size:16px}.identity p,.document p{margin:2px 0 0;color:#64748b;font-size:7.5px}.document{text-align:right}.document strong{display:block;font-size:11px}.hero{display:flex;justify-content:space-between;gap:15px;margin:10px 0;padding:10px 12px;border-radius:8px;background:linear-gradient(120deg,#e6faf5,#eff8fb)}.hero h2{margin:0;font-size:13px}.hero p{margin:3px 0 0;font-size:7.5px;color:#526978}.metrics{display:grid;grid-template-columns:repeat(${Math.max(options.summaries?.length ?? 1, 1)},1fr);gap:6px;margin:8px 0}.metric{border:1px solid #cce9e2;border-radius:7px;background:#f4fcfa;padding:7px}.metric small{display:block;font-size:6.5px;color:#4d716a;text-transform:uppercase}.metric strong{display:block;margin-top:3px;font-size:11px}.table-section{margin-top:10px;break-inside:avoid}.table-section h2{margin:0;padding:7px 9px;background:#02b3aa;color:white;font-size:9px;text-transform:uppercase}table{width:100%;border-collapse:collapse;table-layout:auto;font-size:${fontSize}px}thead{display:table-header-group}th{padding:5px 4px;background:#02b3aa;color:#fff;text-align:left;vertical-align:bottom}td{padding:4px;border:1px solid #dce7e9;vertical-align:top;word-break:break-word}tbody tr:nth-child(even){background:#f4f8f8}tfoot td{background:#376bc1;color:white;font-weight:700}.empty{text-align:center;padding:20px}.note{margin-top:8px;padding:6px 8px;background:#f8fafc;color:#526978;font-size:7px}.footer{display:flex;justify-content:space-between;margin-top:10px;border-top:1px solid #bed0d5;padding-top:6px;color:#64748b;font-size:6.5px}.toolbar{position:fixed;z-index:5;right:16px;bottom:16px;display:flex;gap:8px}.toolbar button{border:0;border-radius:8px;padding:9px 14px;color:white;font-weight:700;cursor:pointer}.toolbar .print{background:#02b3aa}.toolbar .close{background:#64748b}@media print{.toolbar{display:none}.table-section{break-inside:auto}tr{break-inside:avoid}}
  </style></head><body><main class="sheet"><header class="brand"><div class="identity"><img class="logo" src="/yedirenk-logo.png" alt="Yedirenk Derneği"><div><h1>Yedirenk Derneği</h1><p>BAĞIŞ YÖNETİMİ</p></div></div><div class="document"><strong>${escapeHtml(options.title)}</strong><p>${escapeHtml(new Date().toLocaleString("tr-TR"))}</p></div></header><section class="hero"><div><h2>${escapeHtml(options.title)}</h2><p>${escapeHtml(options.subtitle ?? "Filtrelenmiş rapor sonucu")}</p></div></section>${summaries ? `<section class="metrics">${summaries}</section>` : ""}${tables}${options.note ? `<p class="note">${escapeHtml(options.note)}</p>` : ""}<footer class="footer"><span>Yedirenk Derneği · Kurumsal Rapor</span><span>Belge oluşturma: ${escapeHtml(new Date().toLocaleString("tr-TR"))}</span></footer></main><div class="toolbar"><button class="close" onclick="window.close()">Kapat</button><button class="print" onclick="window.print()">Yazdır / PDF Kaydet</button></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));<\/script></body></html>`);
  popup.document.close();
}
