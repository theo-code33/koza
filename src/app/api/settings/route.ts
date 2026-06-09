import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsUpdateSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_settings" }, { status: 400 });
  }
  const settings = await prisma.userSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  return NextResponse.json(settings, { status: 200 });
}
