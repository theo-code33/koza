// Mois courant au format "YYYY-MM".
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Bornes [start, end) d'un mois "YYYY-MM" (premier jour du mois → premier jour du mois suivant).
export function monthRange(month: string): { start: Date; end: Date } {
  const [year, m] = month.split("-").map(Number);
  return { start: new Date(year, m - 1, 1), end: new Date(year, m, 1) };
}
