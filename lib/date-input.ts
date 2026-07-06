/** Fecha local en formato YYYY-MM-DD (para inputs type="date"). */
export function todayLocalDateInput(timeZone = "America/Argentina/Buenos_Aires"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dateInputToIso(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

/** Valor para input type="datetime-local" (hora local del navegador). */
export function nowDatetimeLocalValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
