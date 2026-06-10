"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Toggle } from "@/components/ui/toggle";
import { CatSelect } from "@/components/ui/cat-select";
import { SubcatChips } from "@/components/expenses/subcat-chips";
import { defaultSubcategory } from "@/lib/subcategories";

interface FormValues {
  label: string;
  type: "FIXED" | "VARIABLE";
  amount: string;
  category: "essential" | "leisure" | "savings";
  subcategory: string;
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  anchorMonth: string;
  endMonth: string;
  active: boolean;
}

export interface RecurringModel {
  id: string;
  label: string;
  type: FormValues["type"];
  amount: string;
  category: FormValues["category"];
  subcategory: string;
  frequency: FormValues["frequency"];
  anchorMonth: string;
  endMonth: string | null;
  active: boolean;
}

interface RecurringFormProps {
  model?: RecurringModel;
  onSuccess: () => void;
  onCancel: () => void;
}

const currentMonthValue = () => new Date().toISOString().slice(0, 7);

export function RecurringForm({ model, onSuccess, onCancel }: RecurringFormProps) {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        label: z.string().trim().min(1, tv("nameRequired")).max(80),
        type: z.enum(["FIXED", "VARIABLE"]),
        amount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, tv("amountInvalid"))
          .refine((value) => Number(value) > 0, tv("amountPositive")),
        category: z.enum(["essential", "leisure", "savings"]),
        subcategory: z.string().min(1),
        frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
        anchorMonth: z.string().regex(/^\d{4}-\d{2}$/, tv("monthRequired")),
        endMonth: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .or(z.literal("")),
        active: z.boolean(),
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
      label: model?.label ?? "",
      type: model?.type ?? "FIXED",
      amount: model?.amount ?? "",
      category: model?.category ?? "essential",
      subcategory: model?.subcategory ?? "housing",
      frequency: model?.frequency ?? "MONTHLY",
      anchorMonth: model?.anchorMonth ?? currentMonthValue(),
      endMonth: model?.endMonth ?? "",
      active: model?.active ?? true,
    },
  });
  const category = watch("category");

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(model ? `/api/recurring/${model.id}` : "/api/recurring", {
        method: model ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: values.label,
          type: values.type,
          amount: values.amount,
          category: values.category,
          subcategory: values.subcategory,
          frequency: values.frequency,
          anchorMonth: values.anchorMonth,
          endMonth: values.endMonth === "" ? null : values.endMonth,
          active: values.active,
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
      <h2 className="font-serif text-[24px] text-text">{model ? t("editTitle") : t("newTitle")}</h2>
      <Field label={tc("name")} hint={errors.label?.message}>
        <input
          {...register("label")}
          placeholder={t("namePlaceholder")}
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <Segmented
            options={[
              { value: "FIXED", label: t("typeFixed") },
              { value: "VARIABLE", label: t("typeVariable") },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Field label={tc("amount")} hint={errors.amount?.message}>
        <input
          {...register("amount")}
          inputMode="decimal"
          placeholder="800"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <CatSelect
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              setValue("subcategory", defaultSubcategory(next));
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
      <Controller
        control={control}
        name="frequency"
        render={({ field }) => (
          <Segmented
            options={[
              { value: "MONTHLY", label: t("freqMonthly") },
              { value: "QUARTERLY", label: t("freqQuarterly") },
              { value: "YEARLY", label: t("freqYearly") },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Field label={t("anchorLabel")} hint={errors.anchorMonth?.message}>
        <input
          {...register("anchorMonth")}
          type="month"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label={t("endLabel")}>
        <input
          {...register("endMonth")}
          type="month"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <div className="flex items-center justify-between">
        <span className="text-[15px] text-text">{t("activeLabel")}</span>
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <Toggle on={field.value} onChange={field.onChange} label={t("activeToggleAria")} />
          )}
        />
      </div>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          {tc("cancel")}
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {model ? tc("save") : tc("add")}
        </Button>
      </div>
    </form>
  );
}
