import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetCreateSchema } from "@/lib/validators";
import { getCurrentUserId } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = budgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_budget" }, { status: 400 });
  }
  const { deadline, ...rest } = parsed.data;
  const owned = await prisma.budget.findFirst({ where: { id, userId } });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const budget = await prisma.budget.update({
    where: { id },
    data: { ...rest, deadline: deadline ? new Date(deadline) : null },
  });
  return NextResponse.json(budget, { status: 200 });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const owned = await prisma.budget.findFirst({ where: { id, userId } });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
