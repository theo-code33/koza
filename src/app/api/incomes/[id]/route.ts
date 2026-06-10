import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";
import { isMonthOpen } from "@/lib/period-guard";

type RouteContext = { params: Promise<{ id: string }> };

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  const { month } = parsed.data;
  if (!(await isMonthOpen(month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
  try {
    const income = await prisma.income.update({
      where: { id },
      data: { ...parsed.data, date },
    });
    return NextResponse.json(income, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!(await isMonthOpen(existing.month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
