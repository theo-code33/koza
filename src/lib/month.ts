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

// Nombre de mois signés de `a` à `b` ("YYYY-MM").
export function monthDiff(a: string, b: string): number {
  const ya = Number(a.slice(0, 4));
  const ma = Number(a.slice(5, 7));
  const yb = Number(b.slice(0, 4));
  const mb = Number(b.slice(5, 7));
  return (yb - ya) * 12 + (mb - ma);
}

// Année courante "YYYY".
export function currentYear(): string {
  return String(new Date().getFullYear());
}

// Année précédente / suivante "YYYY".
export function previousYear(year: string): string {
  return String(Number(year) - 1);
}

export function nextYear(year: string): string {
  return String(Number(year) + 1);
}

// Année "YYYY" d'un mois "YYYY-MM".
export function yearOf(month: string): string {
  return month.slice(0, 4);
}
