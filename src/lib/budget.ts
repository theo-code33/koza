import { Prisma } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/categories";
import { monthDiff } from "@/lib/month";

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

// Base 50/30/20 d'un mois = entrées + report entrant.
export function computeBase(income: Prisma.Decimal, carryIn: Prisma.Decimal): Prisma.Decimal {
  return income.plus(carryIn);
}

// Repères 50/30/20 dérivés de la base ; base ≤ 0 → enveloppes à 0 (jamais de négatif).
export function computeTargets(base: Prisma.Decimal): Envelopes {
  if (base.lte(0)) {
    return {
      essential: new Prisma.Decimal(0),
      leisure: new Prisma.Decimal(0),
      savings: new Prisma.Decimal(0),
    };
  }
  return computeEnvelopes(base);
}

// Report sortant = base − total dépensé (peut être négatif).
export function computeCarryOut(base: Prisma.Decimal, spent: Prisma.Decimal): Prisma.Decimal {
  return base.minus(spent);
}

const FREQUENCY_PERIOD = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const;

// Vrai si le mois M est une échéance du modèle (ancré sur anchorMonth, selon la fréquence).
export function isTriggerMonth(
  recurring: { frequency: keyof typeof FREQUENCY_PERIOD; anchorMonth: string },
  month: string,
): boolean {
  const d = monthDiff(recurring.anchorMonth, month);
  if (d < 0) return false;
  return d % FREQUENCY_PERIOD[recurring.frequency] === 0;
}
