import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validators";
import { isMonthOpen } from "@/lib/period-guard";
import { getCurrentUserId } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_expense" }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;
  const month = date.slice(0, 7);
  if (!(await isMonthOpen(userId, month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  const owned = await prisma.expense.findFirst({ where: { id, userId } });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const expense = await prisma.expense.update({
    where: { id },
    data: { ...rest, date: new Date(date), month },
  });
  return NextResponse.json(expense, { status: 200 });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!(await isMonthOpen(userId, existing.month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
