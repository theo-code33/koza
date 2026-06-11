import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";
import { isMonthOpen } from "@/lib/period-guard";
import { getCurrentUserId } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  const { month } = parsed.data;
  if (!(await isMonthOpen(userId, month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  const owned = await prisma.income.findFirst({ where: { id, userId } });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
  const income = await prisma.income.update({
    where: { id },
    data: { ...parsed.data, date },
  });
  return NextResponse.json(income, { status: 200 });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const existing = await prisma.income.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!(await isMonthOpen(userId, existing.month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
