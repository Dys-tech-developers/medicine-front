import * as XLSX from "xlsx";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function triggerBrowserFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildExportFilename(
  prefix: string,
  options?: { filtered?: boolean; date?: string }
): string {
  const date = options?.date ?? new Date().toISOString().slice(0, 10);
  return options?.filtered ? `${prefix}_${date}_filtrado.xlsx` : `${prefix}_${date}.xlsx`;
}

export type DownloadExcelSheetOptions = {
  headers: readonly string[] | string[];
  rows: (string | number)[][];
  sheetName: string;
  filename: string;
};

export function downloadExcelSheet({
  headers,
  rows,
  sheetName,
  filename,
}: DownloadExcelSheetOptions): void {
  const sheet = XLSX.utils.aoa_to_sheet([[...headers], ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: XLSX_MIME });
  triggerBrowserFileDownload(blob, filename);
}

export function exportBoolSiNo(value: boolean): string {
  return value ? "si" : "no";
}

export function exportDateIso(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(iso.trim());
  return match ? match[1] : iso.trim();
}
