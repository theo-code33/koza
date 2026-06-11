import { prisma } from "@/lib/prisma";

// Stub temporaire (sous-projet #2) : renvoie l'utilisateur de démo (le 1er créé).
// Remplacé par auth() (Auth.js) au sous-projet #3.
export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("no_current_user");
  return user.id;
}
