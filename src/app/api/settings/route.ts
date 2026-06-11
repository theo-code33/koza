import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsUpdateSchema } from "@/lib/validators";
import { getCurrentUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_settings" }, { status: 400 });
  }
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });
  return NextResponse.json(settings, { status: 200 });
}
