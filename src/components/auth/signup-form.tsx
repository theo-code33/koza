"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { credentialsSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signupAction } from "@/app/actions/auth";

interface Values {
  email: string;
  password: string;
}

export function SignupForm() {
  const t = useTranslations("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(credentialsSchema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const res = await signupAction(values.email, values.password);
    if (res?.error) setFormError(t(res.error as "emailTaken"));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label={t("email")} hint={errors.email ? t("emailInvalid") : undefined}>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label={t("password")} hint={errors.password ? t("passwordTooShort") : undefined}>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      {formError ? <p className="text-[13px] text-warning">{formError}</p> : null}
      <Button type="submit" full disabled={isSubmitting}>
        {t("signupCta")}
      </Button>
      <Link href="/login" className="text-center text-[14px] text-accent">
        {t("toLogin")}
      </Link>
    </form>
  );
}
