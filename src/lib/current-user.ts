import { auth } from "@/auth";

// userId de l'utilisateur authentifié (via Auth.js). Lève si non connecté
// (le middleware redirige déjà vers /login pour les routes protégées).
export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  return session.user.id;
}
