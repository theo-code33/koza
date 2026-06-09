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
