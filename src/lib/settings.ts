import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

// Garantit l'existence de la ligne de réglages unique du MVP.
export async function getOrCreateDefaultSettings() {
  return prisma.userSettings.upsert({
    where: { id: DEFAULT_ID },
    update: {},
    create: { id: DEFAULT_ID },
  });
}

// Vrai si l'onboarding a déjà été terminé (false si aucune ligne).
export async function getOnboardingCompleted(): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { id: DEFAULT_ID } });
  return settings?.onboardingCompleted ?? false;
}
