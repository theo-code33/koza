"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { currentMonth } from "@/lib/month";

interface FormValues {
  incomes: { source: string; amount: string }[];
}

export function IncomeSetupForm() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        incomes: z
          .array(
            z.object({
              source: z.string().trim().min(1, tv("sourceRequired")),
              amount: z
                .string()
                .regex(/^\d+(\.\d{1,2})?$/, tv("amountInvalid"))
                .refine((value) => Number(value) > 0, tv("amountPositive")),
            }),
          )
          .min(1),
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
    defaultValues: { incomes: [{ source: "", amount: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "incomes" });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const month = currentMonth();
    try {
      for (const income of values.incomes) {
        const res = await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...income, month }),
        });
        if (!res.ok) throw new Error("save_failed");
      }
      router.push("/confirm");
    } catch {
      setSubmitError(tc("genericError"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="flex-1">
            <Field label={tc("source")} hint={errors.incomes?.[index]?.source?.message}>
              <input
                {...register(`incomes.${index}.source`)}
                placeholder={t("sourcePlaceholder")}
                className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
              />
            </Field>
          </div>
          <div className="w-32">
            <Field label={tc("amount")} hint={errors.incomes?.[index]?.amount?.message}>
              <input
                {...register(`incomes.${index}.amount`)}
                inputMode="decimal"
                placeholder="2500"
                className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
              />
            </Field>
          </div>
          {fields.length > 1 ? (
            <IconButton icon={X} label={t("removeSource")} onClick={() => remove(index)} />
          ) : null}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ source: "", amount: "" })}
        className="tap inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> {t("addSource")}
      </button>

      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}

      <Button type="submit" full disabled={isSubmitting}>
        {tc("continue")}
      </Button>
    </form>
  );
}
