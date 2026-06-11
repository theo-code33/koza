import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@koza.app";

// Stub temporaire (sous-projet #2) : renvoie l'utilisateur de démo, en l'amorçant
// si la base est vierge (pas d'UI d'auth encore). Remplacé par auth() (Auth.js) au #3.
export async function getCurrentUserId(): Promise<string> {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing.id;

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash: "" },
  });
  return user.id;
}
