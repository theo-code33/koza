// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    expense: { create: vi.fn(), findMany: vi.fn() },
    monthlyPeriod: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("u1") }));

import { GET, POST } from "@/app/api/expenses/route";
import { prisma } from "@/lib/prisma";

const validBody = {
  amount: "54.90",
  description: "Courses",
  date: "2026-06-10",
  category: "essential",
  subcategory: "food",
};

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/expenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an expense and returns 201", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: "e1" } as never);
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(201);
    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: {
        amount: "54.90",
        description: "Courses",
        category: "essential",
        subcategory: "food",
        userId: "u1",
        date: new Date("2026-06-10"),
        month: "2026-06",
      },
    });
  });

  it("rejects an inconsistent subcategory with 400", async () => {
    const res = await POST(postRequest({ ...validBody, category: "leisure" }));
    expect(res.status).toBe(400);
    expect(prisma.expense.create).not.toHaveBeenCalled();
  });

  it("rejects a POST on a closed month with 409", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(409);
    expect(prisma.expense.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/expenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists expenses for the requested month", async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ id: "1" }] as never);
    const res = await GET(new Request("http://localhost/api/expenses?month=2026-06"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "1" }]);
  });
});
