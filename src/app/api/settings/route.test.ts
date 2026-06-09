// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { upsert: vi.fn() } },
}));

import { PATCH } from "@/app/api/settings/route";
import { prisma } from "@/lib/prisma";

function request(body: unknown): Request {
  return new Request("http://localhost/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/settings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the settings and returns 200", async () => {
    vi.mocked(prisma.userSettings.upsert).mockResolvedValue({
      onboardingCompleted: true,
    } as never);
    const res = await PATCH(request({ onboardingCompleted: true }));
    expect(res.status).toBe(200);
    expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
      where: { id: "default" },
      update: { onboardingCompleted: true },
      create: { id: "default", onboardingCompleted: true },
    });
  });

  it("rejects an empty payload with 400", async () => {
    const res = await PATCH(request({}));
    expect(res.status).toBe(400);
    expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
  });
});
