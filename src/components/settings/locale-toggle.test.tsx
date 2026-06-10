import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";

const { refresh, setLocaleAction } = vi.hoisted(() => ({
  refresh: vi.fn(),
  setLocaleAction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/locale", () => ({ setLocaleAction }));
vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, useLocale: () => "fr" };
});

import { LocaleToggle } from "@/components/settings/locale-toggle";

describe("LocaleToggle", () => {
  beforeEach(() => {
    refresh.mockClear();
    setLocaleAction.mockClear();
  });

  it("switches locale and refreshes", async () => {
    renderWithIntl(<LocaleToggle />);
    await userEvent.click(screen.getByRole("button", { name: "EN" }));
    await waitFor(() => expect(setLocaleAction).toHaveBeenCalledWith("en"));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
