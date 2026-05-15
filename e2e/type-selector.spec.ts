import { test, expect } from "@playwright/test";

const UNRESOLVABLE_SPEC = `# Some general title that does not start with a recognised type token

This document has no canonical filename prefix, no H1 that starts with
one of the known type tokens, and no YAML frontmatter \`spec_type:\` field.
Uploading it should trigger the detector's final SpecTypeError, which the
web UI catches and surfaces alongside a TypeSelector for in-place
resolution.
`;

const CANONICAL_FEAT_SPEC = `# FEAT: a canonically named spec

## Intent
A short intent paragraph.
`;

test.describe("/app TypeSelector", () => {
  test("unresolvable upload renders ErrorBanner AND TypeSelector with 7 buttons in canonical order", async ({
    page,
  }) => {
    await page.goto("/app");

    await page.getByTestId("upload-input").setInputFiles({
      name: "notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(UNRESOLVABLE_SPEC),
    });

    await expect(page.getByTestId("upload-error-banner")).toBeVisible();
    const selector = page.getByTestId("type-selector");
    await expect(selector).toBeVisible();

    const buttons = selector.getByRole("button");
    await expect(buttons).toHaveCount(7);
    await expect(buttons).toHaveText([
      "FEAT",
      "BUG",
      "SPEC",
      "CHORE",
      "REFACTOR",
      "UX",
      "BRAND",
    ]);
  });

  test("clicking a type button re-scores the upload and shows the score panel with 'manually selected' provenance", async ({
    page,
  }) => {
    await page.goto("/app");

    await page.getByTestId("upload-input").setInputFiles({
      name: "notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(UNRESOLVABLE_SPEC),
    });

    await page.getByTestId("type-selector-button-feat").click();

    await expect(page.getByTestId("score-panel")).toBeVisible();
    await expect(page.getByTestId("spec-type-badge")).toHaveText("FEAT");
    await expect(page.getByTestId("spec-type-provenance")).toHaveText(
      "manually selected",
    );
  });

  test("uploads with a resolvable type do not render the TypeSelector", async ({
    page,
  }) => {
    await page.goto("/app");

    await page.getByTestId("upload-input").setInputFiles({
      name: "notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(CANONICAL_FEAT_SPEC),
    });

    // The H1 fallback resolves `feat`, so the score panel renders and the
    // TypeSelector should not appear.
    await expect(page.getByTestId("score-panel")).toBeVisible();
    await expect(page.getByTestId("type-selector")).toHaveCount(0);
  });
});
