// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { recurringExpense: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("u1") }));

import { PUT, DELETE } from "@/app/api/recurring/[id]/route";
import { prisma } from "@/lib/prisma";

const valid = {
  label: "Loyer",
  type: "FIXED",
  amount: "850.00",
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
};
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const putReq = (b: unknown) =>
  new Request("http://localhost/api/recurring/r1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });

describe("PUT /api/recurring/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates and returns 200", async () => {
    vi.mocked(prisma.recurringExpense.findFirst).mockResolvedValue({ id: "r1" } as never);
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: "r1" } as never);
    expect((await PUT(putReq(valid), params("r1"))).status).toBe(200);
  });

  it("returns 400 on invalid", async () => {
    expect((await PUT(putReq({ ...valid, amount: "0" }), params("r1"))).status).toBe(400);
  });

  it("returns 404 when not owned", async () => {
    vi.mocked(prisma.recurringExpense.findFirst).mockResolvedValue(null as never);
    expect((await PUT(putReq(valid), params("x"))).status).toBe(404);
    expect(prisma.recurringExpense.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/recurring/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes and returns 200", async () => {
    vi.mocked(prisma.recurringExpense.findFirst).mockResolvedValue({ id: "r1" } as never);
    vi.mocked(prisma.recurringExpense.delete).mockResolvedValue({ id: "r1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/recurring/r1", { method: "DELETE" }),
      params("r1"),
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 when not owned", async () => {
    vi.mocked(prisma.recurringExpense.findFirst).mockResolvedValue(null as never);
    const res = await DELETE(
      new Request("http://localhost/api/recurring/x", { method: "DELETE" }),
      params("x"),
    );
    expect(res.status).toBe(404);
    expect(prisma.recurringExpense.delete).not.toHaveBeenCalled();
  });
});
