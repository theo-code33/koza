"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { amountSetValueAs } from "@/lib/validators";

interface FormValues {
  source: string;
  amount: string;
}

interface IncomeFormProps {
  month: string;
  income?: { id: string; source: string; amount: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export function IncomeForm({ month, income, onSuccess, onCancel }: IncomeFormProps) {
  const t = useTranslations("incomes");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        source: z.string().trim().min(1, tv("sourceRequired")),
        amount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, tv("amountInvalid"))
          .refine((value) => Number(value) > 0, tv("amountPositive")),
      }),
    [tv],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { source: income?.source ?? "", amount: income?.amount ?? "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(income ? `/api/incomes/${income.id}` : "/api/incomes", {
        method: income ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, month }),
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
        {income ? t("editTitle") : t("newTitle")}
      </h2>
      <Field label={tc("source")} hint={errors.source?.message}>
        <input
          {...register("source")}
          placeholder={t("sourcePlaceholder")}
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label={tc("amount")} hint={errors.amount?.message}>
        <input
          {...register("amount", { setValueAs: amountSetValueAs })}
          inputMode="decimal"
          placeholder="2500"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          {tc("cancel")}
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {income ? tc("save") : tc("add")}
        </Button>
      </div>
    </form>
  );
}
