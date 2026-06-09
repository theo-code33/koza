// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { income: { create: vi.fn() } },
}));

import { POST } from "@/app/api/incomes/route";
import { prisma } from "@/lib/prisma";

function request(body: unknown): Request {
  return new Request("http://localhost/api/incomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/incomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an income and returns 201", async () => {
    vi.mocked(prisma.income.create).mockResolvedValue({ id: "abc" } as never);
    const res = await POST(request({ source: "Salaire", amount: "2500.00", month: "2026-06" }));
    expect(res.status).toBe(201);
    expect(prisma.income.create).toHaveBeenCalledWith({
      data: { source: "Salaire", amount: "2500.00", month: "2026-06" },
    });
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await POST(request({ source: "", amount: "-5", month: "nope" }));
    expect(res.status).toBe(400);
    expect(prisma.income.create).not.toHaveBeenCalled();
  });
});
