import { Prisma } from "@/generated/prisma/client";

// Formate un montant en euros selon la locale (devise toujours EUR).
export function formatEUR(
  amount: Prisma.Decimal | string | number,
  locale: "fr" | "en" = "fr",
): string {
  const value = amount instanceof Prisma.Decimal ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
