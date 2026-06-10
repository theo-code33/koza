import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";
import { AppNav } from "@/components/nav/app-nav";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: ReactNode }) {
  if (!(await getOnboardingCompleted())) {
    redirect("/welcome");
  }
  return (
    <div className="lg:pl-20">
      <AppNav />
      <div className="pb-24 lg:pb-0">{children}</div>
    </div>
  );
}
