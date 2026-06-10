// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { recurringExpense: { findMany: vi.fn(), create: vi.fn() } },
}));

import { GET, POST } from "@/app/api/recurring/route";
import { prisma } from "@/lib/prisma";

const valid = {
  label: "Loyer",
  type: "FIXED",
  amount: "800.00",
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
};

function postReq(body: unknown) {
  return new Request("http://localhost/api/recurring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("recurring route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists models", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("creates a model with normalised endMonth null and active true", async () => {
    vi.mocked(prisma.recurringExpense.create).mockResolvedValue({ id: "r1" } as never);
    const res = await POST(postReq(valid));
    expect(res.status).toBe(201);
    expect(prisma.recurringExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ endMonth: null, active: true }),
      }),
    );
  });

  it("rejects an invalid model with 400", async () => {
    const res = await POST(postReq({ ...valid, amount: "0" }));
    expect(res.status).toBe(400);
  });
});
