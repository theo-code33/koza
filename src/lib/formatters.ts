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
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return new Date(year, month - 1, day);
}

// Formate une date selon la locale (JJ/MM/AAAA en FR).
export function formatDate(date: string | Date, locale: "fr" | "en" = "fr"): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US").format(toLocalDate(date));
}

// Formate "YYYY-MM" en libellé long ("juin 2026" en FR).
export function formatMonth(month: string, locale: "fr" | "en" = "fr"): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, m - 1, 1));
}
