import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recurringCreateSchema } from "@/lib/validators";

export async function GET() {
  const models = await prisma.recurringExpense.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(models, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = recurringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_recurring" }, { status: 400 });
  }
  const { endMonth, active, ...rest } = parsed.data;
  const model = await prisma.recurringExpense.create({
    data: { ...rest, endMonth: endMonth ?? null, active: active ?? true },
  });
  return NextResponse.json(model, { status: 201 });
}
