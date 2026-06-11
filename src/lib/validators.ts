import { z } from "zod";
import { isValidSubcategory } from "@/lib/subcategories";

// Identifiants de compte (login / signup).
export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const incomeCreateSchema = z.object({
  source: z.string().trim().min(1).max(80),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0),
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
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .refine((value) => Number(value) > 0),
    description: z.string().trim().min(1).max(120),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(["essential", "leisure", "savings"]),
    subcategory: z.string(),
    budgetId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => isValidSubcategory(data.category, data.subcategory));

export const budgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0),
  category: z.enum(["essential", "leisure", "savings"]),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const amountString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine((value) => Number(value) > 0);
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
