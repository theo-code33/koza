import { z } from "zod";
import { isValidSubcategory } from "@/lib/subcategories";

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
  })
  .refine((data) => isValidSubcategory(data.category, data.subcategory));

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
