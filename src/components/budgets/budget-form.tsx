"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CatSelect } from "@/components/ui/cat-select";

const formSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
    .refine((value) => Number(value) > 0, "Montant positif requis"),
  category: z.enum(["essential", "leisure", "savings"]),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

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
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      setSubmitError("Un souci est survenu. Réessaie dans un instant.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
      <h2 className="font-serif text-[24px] text-text">
        {budget ? "Modifier le budget" : "Nouveau budget"}
      </h2>
      <Field label="Nom" hint={errors.name?.message}>
        <input
          {...register("name")}
          placeholder="Vacances d'été"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label="Montant cible" hint={errors.targetAmount?.message}>
        <input
          {...register("targetAmount")}
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
      <Field label="Échéance (optionnel)" hint={errors.deadline?.message}>
        <input
          {...register("deadline")}
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
          {budget ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
