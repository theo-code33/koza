"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { credentialsSchema } from "@/lib/validators";

export interface AuthResult {
  error?: string;
}

// Crée un compte (email + mot de passe hashé), ses réglages, puis connecte.
export async function signupAction(email: string, password: string): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse({ email, password });
  if (!parsed.success) return { error: "invalidCredentials" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "emailTaken" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, passwordHash, settings: { create: {} } } });

  // Connecte immédiatement (lève une redirection vers /dashboard en cas de succès).
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return {};
}

// Connexion. signIn lève une redirection en cas de succès, une AuthError sinon.
export async function loginAction(email: string, password: string): Promise<AuthResult> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "invalidCredentials" };
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
