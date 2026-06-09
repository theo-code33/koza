import type { Prisma } from "@/generated/prisma/client";

// Formate un montant en euros selon la locale (devise toujours EUR).
// Import `type` only : éviter de tirer le client Prisma (node:module) dans le bundle client.
export function formatEUR(
  amount: Prisma.Decimal | string | number,
  locale: "fr" | "en" = "fr",
): string {
  const value = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

// Parse "YYYY-MM-DD" en date locale (évite le décalage de fuseau d'un parse UTC).
function toLocalDate(date: string | Date): Date {
  if (typeof date !== "string") return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formate une date selon la locale (JJ/MM/AAAA en FR).
export function formatDate(date: string | Date, locale: "fr" | "en" = "fr"): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US").format(toLocalDate(date));
}
