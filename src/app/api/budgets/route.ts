import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetCreateSchema } from "@/lib/validators";
import { listBudgetsWithSpent } from "@/lib/budgets";
import { getCurrentUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await getCurrentUserId();
  const budgets = await listBudgetsWithSpent(userId);
  return NextResponse.json(budgets, { status: 200 });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = budgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_budget" }, { status: 400 });
  }
  const { deadline, ...rest } = parsed.data;
  const budget = await prisma.budget.create({
    data: { ...rest, userId, deadline: deadline ? new Date(deadline) : null },
  });
  return NextResponse.json(budget, { status: 201 });
}
