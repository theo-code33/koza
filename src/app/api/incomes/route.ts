import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";
import { listMonthIncomes } from "@/lib/incomes";
import { isMonthOpen } from "@/lib/period-guard";
import { currentMonth } from "@/lib/month";
import { getCurrentUserId } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const incomes = await listMonthIncomes(userId, month);
  return NextResponse.json(incomes, { status: 200 });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  const { month } = parsed.data;
  if (!(await isMonthOpen(userId, month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
  const income = await prisma.income.create({ data: { ...parsed.data, userId, date } });
  return NextResponse.json(income, { status: 201 });
}
