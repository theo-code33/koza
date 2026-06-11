import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validators";
import { listMonthExpenses } from "@/lib/expenses";
import { isMonthOpen } from "@/lib/period-guard";
import { currentMonth } from "@/lib/month";
import { getCurrentUserId } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const expenses = await listMonthExpenses(userId, month);
  return NextResponse.json(expenses, { status: 200 });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
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
  const expense = await prisma.expense.create({
    data: { ...rest, userId, date: new Date(date), month },
  });
  return NextResponse.json(expense, { status: 201 });
}
