import { z } from "zod";
import { isValidSubcategory } from "@/lib/subcategories";

// Identifiants de compte (login / signup).
export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Normalise la virgule décimale (clavier FR mobile) en point. Utilisé par les formulaires
// via `setValueAs` pour que la validation client accepte « 12,50 », et par les schémas Zod.
export function normalizeAmount(value: string): string {
  return value.replace(",", ".");
}

// À passer en `setValueAs` du `register("amount")` : normalise la saisie avant validation.
export const amountSetValueAs = (value: unknown): unknown =>
  typeof value === "string" ? normalizeAmount(value) : value;

// Montant en string : normalise la virgule décimale en point, puis valide le format et la
// positivité. Partagé par tous les schémas avec montant.
const amountString = z
  .string()
  .transform((value) => normalizeAmount(value.trim()))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0);

export const incomeCreateSchema = z.object({
  source: z.string().trim().min(1).max(80),
  amount: amountString,
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const settingsUpdateSchema = z
  .object({
    onboardingCompleted: z.boolean().optional(),
    theme: z.enum(["light", "dark"]).optional(),
    locale: z.enum(["fr", "en"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0);

export const expenseCreateSchema = z
  .object({
    amount: amountString,
    description: z.string().trim().min(1).max(120),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(["essential", "leisure", "savings"]),
    subcategory: z.string(),
    budgetId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => isValidSubcategory(data.category, data.subcategory));

export const budgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: amountString,
  category: z.enum(["essential", "leisure", "savings"]),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const monthString = z.string().regex(/^\d{4}-\d{2}$/);

export const recurringCreateSchema = z.object({
  label: z.string().trim().min(1).max(80),
  type: z.enum(["FIXED", "VARIABLE"]),
  amount: amountString,
  category: z.enum(["essential", "leisure", "savings"]),
  subcategory: z.string().min(1),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  anchorMonth: monthString,
  endMonth: monthString.nullable().optional(),
  active: z.boolean().optional(),
});

export const occurrenceConfirmSchema = z.object({ amount: amountString });

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>;
export type RecurringCreateInput = z.infer<typeof recurringCreateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
