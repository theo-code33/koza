"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CatSelect } from "@/components/ui/cat-select";
import { amountSetValueAs } from "@/lib/validators";

interface FormValues {
  name: string;
  targetAmount: string;
  category: "essential" | "leisure" | "savings";
  deadline: string;
}

interface BudgetFormProps {
  budget?: {
    id: string;
    name: string;
    targetAmount: string;
    category: FormValues["category"];
    deadline: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const t = useTranslations("budgets");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, tv("nameRequired")).max(80),
        targetAmount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, tv("amountInvalid"))
          .refine((value) => Number(value) > 0, tv("amountPositive")),
        category: z.enum(["essential", "leisure", "savings"]),
        deadline: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, tv("dateInvalid"))
          .or(z.literal("")),
      }),
    [tv],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: budget?.name ?? "",
      targetAmount: budget?.targetAmount ?? "",
      category: budget?.category ?? "essential",
      deadline: budget?.deadline ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(budget ? `/api/budgets/${budget.id}` : "/api/budgets", {
        method: budget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          targetAmount: values.targetAmount,
          category: values.category,
          deadline: values.deadline === "" ? null : values.deadline,
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
        {budget ? t("editTitle") : t("newTitle")}
      </h2>
      <Field label={tc("name")} hint={errors.name?.message}>
        <input
          {...register("name")}
          placeholder={t("namePlaceholder")}
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label={t("targetLabel")} hint={errors.targetAmount?.message}>
        <input
          {...register("targetAmount", { setValueAs: amountSetValueAs })}
          inputMode="decimal"
          placeholder="1200"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Controller
        control={control}
        name="category"
        render={({ field }) => <CatSelect value={field.value} onChange={field.onChange} />}
      />
      <Field label={t("deadlineLabel")} hint={errors.deadline?.message}>
        <input
          {...register("deadline")}
          type="date"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          {tc("cancel")}
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {budget ? tc("save") : tc("add")}
        </Button>
      </div>
    </form>
  );
}
