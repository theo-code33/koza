import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recurringCreateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = recurringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_recurring" }, { status: 400 });
  }
  const { endMonth, active, ...rest } = parsed.data;
  try {
    const model = await prisma.recurringExpense.update({
      where: { id },
      data: { ...rest, endMonth: endMonth ?? null, active: active ?? true },
    });
    return NextResponse.json(model, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.recurringExpense.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}
