import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recurringCreateSchema } from "@/lib/validators";
import { getCurrentUserId } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = recurringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_recurring" }, { status: 400 });
  }
  const { endMonth, active, ...rest } = parsed.data;
  const owned = await prisma.recurringExpense.findFirst({ where: { id, userId } });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const model = await prisma.recurringExpense.update({
    where: { id },
    data: { ...rest, endMonth: endMonth ?? null, active: active ?? true },
  });
  return NextResponse.json(model, { status: 200 });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const owned = await prisma.recurringExpense.findFirst({ where: { id, userId } });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await prisma.recurringExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
