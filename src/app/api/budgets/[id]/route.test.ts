// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { update: vi.fn(), delete: vi.fn() } },
}));

import { Prisma } from "@/generated/prisma/client";
import { PUT, DELETE } from "@/app/api/budgets/[id]/route";
import { prisma } from "@/lib/prisma";

const validBody = { name: "Vacances", targetAmount: "1500.00", category: "leisure" };

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/budgets/b1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const notFound = new Prisma.PrismaClientKnownRequestError("missing", {
  code: "P2025",
  clientVersion: "7",
});

describe("PUT /api/budgets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a budget and returns 200", async () => {
    vi.mocked(prisma.budget.update).mockResolvedValue({ id: "b1" } as never);
    const res = await PUT(putRequest(validBody), params("b1"));
    expect(res.status).toBe(200);
    expect(prisma.budget.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { name: "Vacances", targetAmount: "1500.00", category: "leisure", deadline: null },
    });
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(putRequest({ ...validBody, targetAmount: "0" }), params("b1"));
    expect(res.status).toBe(400);
    expect(prisma.budget.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the budget does not exist", async () => {
    vi.mocked(prisma.budget.update).mockRejectedValue(notFound);
    const res = await PUT(putRequest(validBody), params("nope"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/budgets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a budget and returns 200", async () => {
    vi.mocked(prisma.budget.delete).mockResolvedValue({ id: "b1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/budgets/b1", { method: "DELETE" }),
      params("b1"),
    );
    expect(res.status).toBe(200);
    expect(prisma.budget.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
  });

  it("returns 404 when the budget does not exist", async () => {
    vi.mocked(prisma.budget.delete).mockRejectedValue(notFound);
    const res = await DELETE(
      new Request("http://localhost/api/budgets/nope", { method: "DELETE" }),
      params("nope"),
    );
    expect(res.status).toBe(404);
  });
});
