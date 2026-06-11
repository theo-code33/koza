import { prisma } from "@/lib/prisma";

// Garantit l'existence de la ligne de réglages de l'utilisateur.
export async function getOrCreateDefaultSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

// Vrai si l'onboarding a déjà été terminé (false si aucune ligne).
export async function getOnboardingCompleted(userId: string): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return settings?.onboardingCompleted ?? false;
}
