import type { NextAuthConfig } from "next-auth";

// Routes publiques (pas de session requise).
const PUBLIC = new Set(["/", "/login", "/signup", "/privacy", "/terms"]);

// Config Edge-safe (sans Prisma ni bcrypt) : utilisée par le middleware et étendue
// par auth.ts (qui ajoute le provider Credentials côté Node).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
    authorized({ request, auth }) {
      const { nextUrl } = request;
      const isPublic =
        PUBLIC.has(nextUrl.pathname) ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/health");
      // Exiger un user.id, pas juste un user : un cookie périmé/partiel (token sans id)
      // a un `auth.user` truthy mais ferait lever getCurrentUserId côté Server Component.
      // On le renvoie au login ici, au bord, plutôt que de crasher la page.
      return isPublic || Boolean(auth?.user?.id);
    },
  },
} satisfies NextAuthConfig;
