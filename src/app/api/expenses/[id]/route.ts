import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validators";
import { isMonthOpen } from "@/lib/period-guard";

type RouteContext = { params: Promise<{ id: string }> };

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_expense" }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;
  const month = date.slice(0, 7);
  if (!(await isMonthOpen(month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: { ...rest, date: new Date(date), month },
    });
    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!(await isMonthOpen(existing.month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
