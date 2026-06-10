// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { create: vi.fn(), findMany: vi.fn() } },
}));

import { GET, POST } from "@/app/api/budgets/route";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/budgets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the budget list", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([]);
  });
});

describe("POST /api/budgets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a budget with a null deadline by default", async () => {
    vi.mocked(prisma.budget.create).mockResolvedValue({ id: "b1" } as never);
    const res = await POST(
      postRequest({ name: "Vacances", targetAmount: "1200.00", category: "leisure" }),
    );
    expect(res.status).toBe(201);
    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: { name: "Vacances", targetAmount: "1200.00", category: "leisure", deadline: null },
    });
  });

  it("rejects an invalid budget with 400", async () => {
    const res = await POST(postRequest({ name: "", targetAmount: "0", category: "leisure" }));
    expect(res.status).toBe(400);
    expect(prisma.budget.create).not.toHaveBeenCalled();
  });
});
