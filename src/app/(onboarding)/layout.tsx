import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";
import { getCurrentUserId } from "@/lib/current-user";

// Lit la base par requête (réglages utilisateur) — jamais de prérendu statique.
export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const userId = await getCurrentUserId();
  if (await getOnboardingCompleted(userId)) {
    redirect("/");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">{children}</main>
  );
}
