"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  const t = useTranslations("auth");
  return (
    <Button variant="surface" onClick={() => logoutAction()}>
      {t("logout")}
    </Button>
  );
}
