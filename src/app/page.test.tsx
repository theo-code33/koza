import { describe, it, expect, vi } from "vitest";
import { renderWithIntl as render } from "@/test/render-with-intl";

vi.mock("next/navigation", () => ({ redirect: vi.fn(), useRouter: () => ({ push: vi.fn() }) }));

import Home from "@/app/page";

describe("Home", () => {
  it("renders the landing page", () => {
    const { container } = render(<Home />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
