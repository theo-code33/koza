import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Protection des routes via le callback `authorized` (Edge-safe, sans Prisma/bcrypt).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)"],
};
