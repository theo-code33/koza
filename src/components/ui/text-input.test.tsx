import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextInput } from "@/components/ui/text-input";

describe("TextInput", () => {
  it("calls onChange with the typed value", async () => {
    const onChange = vi.fn();
    // Wrapper contrôlé : la valeur doit remonter pour qu'un input contrôlé accumule la frappe.
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <TextInput
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
          placeholder="Description"
        />
      );
    }
    render(<Harness />);
    await userEvent.type(screen.getByPlaceholderText("Description"), "Loyer");
    expect(onChange).toHaveBeenLastCalledWith("Loyer");
  });
});
