import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";
import { getCurrentUserId } from "@/lib/current-user";
import { AppNav } from "@/components/nav/app-nav";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const userId = await getCurrentUserId();
  if (!(await getOnboardingCompleted(userId))) {
    redirect("/welcome");
  }
  return (
    <div className="lg:pl-20">
      <AppNav />
      {/* min-h-dvh (pas 100vh) + border-box : la hauteur épouse le viewport visible iOS
          et inclut le padding bas, donc plus de scroll vertical parasite. overflow-x-clip :
          filet anti-débordement horizontal (artefacts de charts, textes longs). */}
      <div className="min-h-dvh overflow-x-clip pb-[calc(6rem_+_env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
    </div>
  );
}
