import { test, expect } from "@playwright/test";

const SAMPLE_SPEC = `# sample

## Intent
A short intent paragraph.

## Decision Tree
| Option | Decision |
|---|---|
| A | ✅ |

Trigger for change: condition flips.

## Draft-of-thoughts
Reasoning.

## Final Spec
Details.

## Acceptance Criteria
- [ ] one
- [ ] two
- [ ] three

## Game Theory Review
Who benefits: users.
Abuse vector: gaming.
Mitigation: rate limits.

## Subject Migration Summary
| | |
|---|---|
| Open questions | confirm name |

## Files
\`\`\`
src/foo.ts
\`\`\`
`;

test.describe("/app spec scorer", () => {
  test("renders header and upload zone, hides score panel initially", async ({
    page,
  }) => {
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: /Score your spec before it ships/i })
    ).toBeVisible();
    await expect(page.getByTestId("upload-zone")).toBeVisible();
    await expect(page.getByTestId("score-panel-placeholder")).toBeVisible();
    await expect(page.getByTestId("score-panel")).toHaveCount(0);
    await expect(page.getByText(/Coming soon/i)).toHaveCount(0);
  });

  test("uploads a compliant spec and shows 7/7 score panel", async ({
    page,
  }) => {
    await page.goto("/app");

    const input = page.getByTestId("upload-input");
    await input.setInputFiles({
      name: "sample-spec.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(SAMPLE_SPEC),
    });

    const panel = page.getByTestId("score-panel");
    await expect(panel).toBeVisible();

    const counter = page.getByTestId("score-counter");
    await expect(counter).toContainText("7/7", { timeout: 5000 });

    await expect(panel.getByText(/cleared to ship/i)).toBeVisible();
    await expect(panel.getByRole("button", { name: /Run impl/i })).toBeVisible();
  });

  test("pipeline explainer renders three steps", async ({ page }) => {
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: /From spec to shipped code/i })
    ).toBeVisible();
    await expect(page.getByTestId("pipeline-step-01")).toBeVisible();
    await expect(page.getByTestId("pipeline-step-02")).toBeVisible();
    await expect(page.getByTestId("pipeline-step-03")).toBeVisible();
  });
});
