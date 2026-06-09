import { Prisma } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/categories";

export interface Envelopes {
  essential: Prisma.Decimal;
  leisure: Prisma.Decimal;
  savings: Prisma.Decimal;
}

// Répartit un total mensuel selon les parts 50 / 30 / 20 (Decimal, jamais de float).
export function computeEnvelopes(total: Prisma.Decimal | string | number): Envelopes {
  const value = new Prisma.Decimal(total);
  return {
    essential: value.mul(CATEGORIES.essential.share),
    leisure: value.mul(CATEGORIES.leisure.share),
    savings: value.mul(CATEGORIES.savings.share),
  };
}
