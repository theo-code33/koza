import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recurringCreateSchema } from "@/lib/validators";
import { getCurrentUserId } from "@/lib/current-user";
import { materializeRecurring } from "@/lib/recurring";
import { currentMonth } from "@/lib/month";

export async function GET() {
  const userId = await getCurrentUserId();
  const models = await prisma.recurringExpense.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(models, { status: 200 });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = recurringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_recurring" }, { status: 400 });
  }
  const { endMonth, active, ...rest } = parsed.data;
  const model = await prisma.recurringExpense.create({
    data: { ...rest, userId, endMonth: endMonth ?? null, active: active ?? true },
  });
  // Matérialise l'échéance du mois courant : reconcile ne le fait qu'à la création
  // d'un period, donc une récurrente ajoutée en cours de mois resterait invisible sinon.
  await materializeRecurring(userId, currentMonth());
  return NextResponse.json(model, { status: 201 });
}
