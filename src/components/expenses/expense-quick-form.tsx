"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CatSelect } from "@/components/ui/cat-select";
import { SubcatChips } from "@/components/expenses/subcat-chips";
import { defaultSubcategory } from "@/lib/subcategories";

interface FormValues {
  amount: string;
  description: string;
  date: string;
  category: "essential" | "leisure" | "savings";
  subcategory: string;
  budgetId: string;
}

export interface BudgetOption {
  id: string;
  name: string;
  category: FormValues["category"];
}

interface ExpenseQuickFormProps {
  expense?: {
    id: string;
    amount: string;
    description: string;
    date: string;
    category: FormValues["category"];
    subcategory: string;
    budgetId: string | null;
  };
  budgets?: BudgetOption[];
  onSuccess: () => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseQuickForm({
  expense,
  budgets = [],
  onSuccess,
  onCancel,
}: ExpenseQuickFormProps) {
  const t = useTranslations("expenses");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, tv("amountInvalid"))
          .refine((value) => Number(value) > 0, tv("amountPositive")),
        description: z.string().trim().min(1, tv("descriptionRequired")).max(120),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, tv("dateRequired")),
        category: z.enum(["essential", "leisure", "savings"]),
        subcategory: z.string().min(1),
        budgetId: z.string(),
      }),
    [tv],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expense?.amount ?? "",
      description: expense?.description ?? "",
      date: expense?.date ?? today(),
      category: expense?.category ?? "essential",
      subcategory: expense?.subcategory ?? "housing",
      budgetId: expense?.budgetId ?? "",
    },
  });
  const category = watch("category");
  const categoryBudgets = budgets.filter((budget) => budget.category === category);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
        method: expense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          description: values.description,
          date: values.date,
          category: values.category,
          subcategory: values.subcategory,
          budgetId: values.budgetId === "" ? null : values.budgetId,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      onSuccess();
    } catch {
      setSubmitError(tc("genericError"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
      <h2 className="font-serif text-[24px] text-text">
        {expense ? t("editTitle") : t("newTitle")}
      </h2>
      <input
        {...register("amount")}
        inputMode="decimal"
        autoFocus
        placeholder="0"
        aria-label={tc("amount")}
        className="w-full bg-transparent text-center text-[40px] font-light text-text outline-none"
      />
      {errors.amount ? (
        <p className="text-center text-[13px] text-warning">{errors.amount.message}</p>
      ) : null}
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <CatSelect
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              setValue("subcategory", defaultSubcategory(next));
              setValue("budgetId", "");
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="subcategory"
        render={({ field }) => (
          <SubcatChips category={category} value={field.value} onChange={field.onChange} />
        )}
      />
      <Field label={tc("description")} hint={errors.description?.message}>
        <input
          {...register("description")}
          placeholder={t("descriptionPlaceholder")}
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label={tc("date")}>
        <input
          {...register("date")}
          type="date"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label={t("budgetOptional")}>
        <select
          {...register("budgetId")}
          aria-label={t("budgetOptional")}
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        >
          <option value="">{t("noBudget")}</option>
          {categoryBudgets.map((budget) => (
            <option key={budget.id} value={budget.id}>
              {budget.name}
            </option>
          ))}
        </select>
      </Field>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          {tc("cancel")}
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {expense ? tc("save") : tc("add")}
        </Button>
      </div>
    </form>
  );
}
