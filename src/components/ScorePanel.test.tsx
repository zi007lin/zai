// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ScorePanel from "./ScorePanel";
import type { ScoreResult } from "../lib/scoreSpec";

function mockMatchMedia(prefersReduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: prefersReduced,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function buildResult(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    rubric_version: "1.5.0",
    spec_type: "bug",
    score: "8/8",
    required_count: 8,
    passed: true,
    evaluated_at: "2026-05-16T00:00:00.000Z",
    sections: {
      intent: "PASS",
      repro: "PASS",
      fix: "PASS",
      acceptance_criteria: "PASS",
      migration_summary: "PASS",
      files: "PASS",
      legal_triggers: "PASS",
      work_estimate: "PASS",
    },
    section_reasons: {
      intent: null,
      repro: null,
      fix: null,
      acceptance_criteria: null,
      migration_summary: null,
      files: null,
      legal_triggers: null,
      work_estimate: null,
    },
    section_order: [
      "intent",
      "repro",
      "fix",
      "acceptance_criteria",
      "migration_summary",
      "files",
      "legal_triggers",
      "work_estimate",
    ],
    section_labels: {
      intent: "Intent",
      repro: "Repro",
      fix: "Fix",
      acceptance_criteria: "Acceptance Criteria",
      migration_summary: "Migration Summary",
      files: "Files",
      legal_triggers: "Legal Triggers",
      work_estimate: "Work Estimate",
    },
    gates: [],
    type_source: "filename",
    ...overrides,
  };
}

beforeEach(() => {
  cleanup();
  // Reduced-motion path skips the staggered section reveal so the panel
  // renders fully on mount, making button + hint assertions deterministic.
  mockMatchMedia(true);
});

describe("ScorePanel — missing **Repo:** header (disabled-state UX)", () => {
  it("disables the Run impl button with aria-disabled='true' when targetRepo is null", () => {
    render(
      <ScorePanel
        result={buildResult()}
        filename="example.md"
        onDownloadScored={() => {}}
        onRunImpl={() => {}}
        implState="idle"
        issueNumber={null}
        errorMsg=""
        targetRepo={null}
      />
    );
    const button = screen.getByTestId("run-impl-button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("renders the disabled-state hint as a role=note (not a runtime error)", () => {
    render(
      <ScorePanel
        result={buildResult()}
        filename="example.md"
        onDownloadScored={() => {}}
        onRunImpl={() => {}}
        implState="idle"
        issueNumber={null}
        errorMsg=""
        targetRepo={null}
      />
    );
    const hint = screen.getByTestId("run-impl-missing-repo");
    expect(hint).toHaveAttribute("role", "note");
    expect(hint).toHaveAttribute("id", "run-impl-disabled-hint");
    // No leading ❌ — that emoji is reserved for the runtime error channel.
    expect(hint.textContent).not.toContain("❌");
    expect(hint.textContent).toContain("Add");
    expect(hint.textContent).toContain("to your spec body to enable dispatch");
    const code = hint.querySelector("code");
    expect(code).not.toBeNull();
    expect(code!.textContent).toBe("**Repo:** owner/repo");
  });

  it("links the button to the hint via aria-describedby for screen readers", () => {
    render(
      <ScorePanel
        result={buildResult()}
        filename="example.md"
        onDownloadScored={() => {}}
        onRunImpl={() => {}}
        implState="idle"
        issueNumber={null}
        errorMsg=""
        targetRepo={null}
      />
    );
    const button = screen.getByTestId("run-impl-button");
    const hint = screen.getByTestId("run-impl-missing-repo");
    expect(button).toHaveAttribute("aria-describedby", "run-impl-disabled-hint");
    expect(hint).toHaveAttribute("id", "run-impl-disabled-hint");
  });
});

describe("ScorePanel — valid **Repo:** header (enabled-state)", () => {
  it("enables the Run impl button and omits the disabled-state hint", () => {
    render(
      <ScorePanel
        result={buildResult()}
        filename="example.md"
        onDownloadScored={() => {}}
        onRunImpl={() => {}}
        implState="idle"
        issueNumber={null}
        errorMsg=""
        targetRepo="zi007lin/zai"
      />
    );
    const button = screen.getByTestId("run-impl-button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByTestId("run-impl-missing-repo")).toBeNull();
  });

  it("renders no missing-Repo hint and no runtime error in the happy path", () => {
    render(
      <ScorePanel
        result={buildResult()}
        filename="example.md"
        onDownloadScored={() => {}}
        onRunImpl={() => {}}
        implState="idle"
        issueNumber={null}
        errorMsg=""
        targetRepo="zi007lin/zai"
      />
    );
    // Guards against re-introducing a dedicated red missing-Repo banner
    // when the header parses cleanly — the disabled-state hint must not
    // render when targetRepo is non-null.
    expect(screen.queryByTestId("run-impl-missing-repo")).toBeNull();
    expect(screen.queryByTestId("run-impl-error")).toBeNull();
  });
});

describe("ScorePanel — runtime-failure channel is unchanged", () => {
  it.each([
    ["network", "fetch failed: ECONNRESET"],
    ["auth", "/api/issue 401: bad credentials"],
    ["rate-limit", "/api/impl 403: rate limit exceeded"],
    ["server", "/api/issue 500: internal server error"],
  ])("surfaces %s failures via run-impl-error", (_label, message) => {
    render(
      <ScorePanel
        result={buildResult()}
        filename="example.md"
        onDownloadScored={() => {}}
        onRunImpl={vi.fn()}
        implState="error"
        issueNumber={null}
        errorMsg={message}
        targetRepo="zi007lin/zai"
      />
    );
    const errorEl = screen.getByTestId("run-impl-error");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.textContent).toContain(message);
  });
});
