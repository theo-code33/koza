// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { recurringExpense: { update: vi.fn(), delete: vi.fn() } },
}));

import { Prisma } from "@/generated/prisma/client";
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
const notFound = new Prisma.PrismaClientKnownRequestError("missing", {
  code: "P2025",
  clientVersion: "7",
});
const putReq = (b: unknown) =>
  new Request("http://localhost/api/recurring/r1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });

describe("PUT /api/recurring/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates and returns 200", async () => {
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: "r1" } as never);
    expect((await PUT(putReq(valid), params("r1"))).status).toBe(200);
  });

  it("returns 400 on invalid", async () => {
    expect((await PUT(putReq({ ...valid, amount: "0" }), params("r1"))).status).toBe(400);
  });

  it("returns 404 on P2025", async () => {
    vi.mocked(prisma.recurringExpense.update).mockRejectedValue(notFound);
    expect((await PUT(putReq(valid), params("x"))).status).toBe(404);
  });
});

describe("DELETE /api/recurring/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes and returns 200", async () => {
    vi.mocked(prisma.recurringExpense.delete).mockResolvedValue({ id: "r1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/recurring/r1", { method: "DELETE" }),
      params("r1"),
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 on P2025", async () => {
    vi.mocked(prisma.recurringExpense.delete).mockRejectedValue(notFound);
    const res = await DELETE(
      new Request("http://localhost/api/recurring/x", { method: "DELETE" }),
      params("x"),
    );
    expect(res.status).toBe(404);
  });
});
