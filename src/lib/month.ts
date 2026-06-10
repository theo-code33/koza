// Mois courant au format "YYYY-MM".
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Bornes [start, end) d'un mois "YYYY-MM" (premier jour du mois → premier jour du mois suivant).
export function monthRange(month: string): { start: Date; end: Date } {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return { start: new Date(year, m - 1, 1), end: new Date(year, m, 1) };
}

// Mois précédent "YYYY-MM" (gère le passage d'année).
export function previousMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const date = new Date(year, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Mois suivant "YYYY-MM" (gère le passage d'année).
export function nextMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const date = new Date(year, m, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
