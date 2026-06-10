// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/export", () => ({ buildExport: vi.fn() }));

import { GET } from "@/app/api/export/route";
import { buildExport } from "@/lib/export";

describe("GET /api/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a downloadable json payload", async () => {
    vi.mocked(buildExport).mockResolvedValue({
      exportedAt: "2026-06-10T00:00:00.000Z",
      incomes: [],
      expenses: [],
      budgets: [],
      settings: null,
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toContain('attachment; filename="koza-export-');
    const body = await res.json();
    expect(body.exportedAt).toBe("2026-06-10T00:00:00.000Z");
  });
});
