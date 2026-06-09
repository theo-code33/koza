import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  if (await getOnboardingCompleted()) {
    redirect("/");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">{children}</main>
  );
}
