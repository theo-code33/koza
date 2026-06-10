import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validators";
import { listMonthExpenses } from "@/lib/expenses";
import { isMonthOpen } from "@/lib/period-guard";
import { currentMonth } from "@/lib/month";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const expenses = await listMonthExpenses(month);
  return NextResponse.json(expenses, { status: 200 });
}

export async function POST(request: NextRequest) {
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
  const expense = await prisma.expense.create({
    data: { ...rest, date: new Date(date), month },
  });
  return NextResponse.json(expense, { status: 201 });
}
