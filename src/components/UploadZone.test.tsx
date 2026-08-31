// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import UploadZone from "./UploadZone";

describe("UploadZone template selection", () => {
  it("offers FEAT and BUG and downloads the selected type", () => {
    const onDownloadTemplate = vi.fn();
    render(
      <UploadZone
        onFile={vi.fn()}
        onDownloadTemplate={onDownloadTemplate}
        state={{ kind: "preupload" }}
      />,
    );

    const selector = screen.getByLabelText("Template type");
    expect(screen.getByRole("option", { name: "FEAT" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "BUG" })).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: "bug" } });
    fireEvent.click(screen.getByRole("button", { name: /download template/i }));
    expect(onDownloadTemplate).toHaveBeenCalledWith("bug");
  });
});
