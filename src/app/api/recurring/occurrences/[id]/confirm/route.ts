import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { occurrenceConfirmSchema } from "@/lib/validators";
import { getCurrentUserId } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

function firstOfMonth(month: string): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = occurrenceConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  const occurrence = await prisma.recurringOccurrence.findUnique({
    where: { id },
    include: { recurring: true },
  });
  if (!occurrence || occurrence.userId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (occurrence.status !== "PENDING") {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }
  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: parsed.data.amount,
      description: occurrence.recurring.label,
      date: firstOfMonth(occurrence.month),
      month: occurrence.month,
      category: occurrence.recurring.category,
      subcategory: occurrence.recurring.subcategory,
      recurringId: occurrence.recurringId,
    },
  });
  await prisma.recurringOccurrence.update({
    where: { id },
    data: { status: "CONFIRMED", expenseId: expense.id },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
