import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";
import { listMonthIncomes } from "@/lib/incomes";
import { currentMonth } from "@/lib/month";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const incomes = await listMonthIncomes(month);
  return NextResponse.json(incomes, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  const { month } = parsed.data;
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
  const income = await prisma.income.create({ data: { ...parsed.data, date } });
  return NextResponse.json(income, { status: 201 });
}
