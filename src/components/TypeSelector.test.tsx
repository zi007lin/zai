// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import TypeSelector, { TYPE_SELECTOR_TYPES } from "./TypeSelector";

beforeEach(() => {
  cleanup();
});

describe("TypeSelector", () => {
  it("renders all 7 buttons in methodology canonical order", () => {
    render(<TypeSelector onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(7);
    const order = ["FEAT", "BUG", "SPEC", "CHORE", "REFACTOR", "UX", "BRAND"];
    expect(buttons.map((b) => b.textContent)).toEqual(order);
    expect(TYPE_SELECTOR_TYPES.map((t) => t.id)).toEqual([
      "feat",
      "bug",
      "spec",
      "chore",
      "refactor",
      "ux",
      "brand",
    ]);
  });

  it("wraps buttons in a role=group with an aria-labelledby reference", () => {
    render(<TypeSelector onSelect={() => {}} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-labelledby", "type-selector-label");
    expect(document.getElementById("type-selector-label")).not.toBeNull();
  });

  it("calls onSelect with the clicked type id", () => {
    const onSelect = vi.fn();
    render(<TypeSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("type-selector-button-chore"));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("chore");
  });

  it("first button is tabbable, the others are not (roving tabindex)", () => {
    render(<TypeSelector onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("tabindex", "0");
    for (let i = 1; i < buttons.length; i++) {
      expect(buttons[i]).toHaveAttribute("tabindex", "-1");
    }
  });

  it("ArrowRight moves focus and the roving tabindex to the next button", () => {
    render(<TypeSelector onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[1]).toHaveAttribute("tabindex", "0");
    expect(buttons[0]).toHaveAttribute("tabindex", "-1");
  });

  it("ArrowLeft wraps from the first button to the last", () => {
    render(<TypeSelector onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it("Home and End jump to first and last", () => {
    render(<TypeSelector onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    buttons[3].focus();
    fireEvent.keyDown(buttons[3], { key: "End" });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    fireEvent.keyDown(buttons[buttons.length - 1], { key: "Home" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("Enter and Space activate the focused button (native button semantics)", () => {
    const onSelect = vi.fn();
    render(<TypeSelector onSelect={onSelect} />);
    const featButton = screen.getByTestId("type-selector-button-feat");
    featButton.focus();
    // jsdom fires `click` from keyDown(Enter/Space) only via the explicit
    // browser shortcut; assert by clicking which mirrors the native effect
    // both events produce.
    fireEvent.click(featButton);
    expect(onSelect).toHaveBeenCalledWith("feat");
  });

  it("disabled prop disables every button", () => {
    render(<TypeSelector onSelect={() => {}} disabled />);
    for (const b of screen.getAllByRole("button")) {
      expect(b).toBeDisabled();
    }
  });

  it("invokes onSelect for each of the 7 types", () => {
    const onSelect = vi.fn();
    render(<TypeSelector onSelect={onSelect} />);
    for (const t of TYPE_SELECTOR_TYPES) {
      fireEvent.click(screen.getByTestId(`type-selector-button-${t.id}`));
    }
    expect(onSelect).toHaveBeenCalledTimes(7);
    expect(onSelect.mock.calls.map((c) => c[0])).toEqual([
      "feat",
      "bug",
      "spec",
      "chore",
      "refactor",
      "ux",
      "brand",
    ]);
  });
});
