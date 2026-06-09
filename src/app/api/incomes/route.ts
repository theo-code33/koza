import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  const income = await prisma.income.create({ data: parsed.data });
  return NextResponse.json(income, { status: 201 });
}
