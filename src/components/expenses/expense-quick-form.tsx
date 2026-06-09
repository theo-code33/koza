"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CatSelect } from "@/components/ui/cat-select";
import { SubcatChips } from "@/components/expenses/subcat-chips";
import { defaultSubcategory } from "@/lib/subcategories";

const formSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
    .refine((value) => Number(value) > 0, "Montant positif requis"),
  description: z.string().trim().min(1, "Description requise").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
  category: z.enum(["essential", "leisure", "savings"]),
  subcategory: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseQuickFormProps {
  expense?: {
    id: string;
    amount: string;
    description: string;
    date: string;
    category: FormValues["category"];
    subcategory: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseQuickForm({ expense, onSuccess, onCancel }: ExpenseQuickFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    },
  });
  const category = watch("category");

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
        method: expense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("save_failed");
      onSuccess();
    } catch {
      setSubmitError("Un souci est survenu. Réessaie dans un instant.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
      <h2 className="font-serif text-[24px] text-text">
        {expense ? "Modifier la dépense" : "Nouvelle dépense"}
      </h2>
      <input
        {...register("amount")}
        inputMode="decimal"
        autoFocus
        placeholder="0"
        aria-label="Montant"
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
      <Field label="Description" hint={errors.description?.message}>
        <input
          {...register("description")}
          placeholder="Courses, restaurant…"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label="Date">
        <input
          {...register("date")}
          type="date"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {expense ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
