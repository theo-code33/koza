import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";

export default async function Home() {
  if (!(await getOnboardingCompleted())) {
    redirect("/welcome");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center gap-4 px-6">
      <h1 className="font-serif text-[40px] leading-none text-text">kōza</h1>
      <p className="text-base text-text-secondary">Tableau de bord à venir.</p>
    </main>
  );
}
