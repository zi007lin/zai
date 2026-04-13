import { SECTION_LABELS, SECTION_ORDER } from "../lib/scoreSpec";

const EXAMPLE = {
  filename: "2026-04-12__feat__zai-hero-tagline-governance.md",
  snippet: [
    "# 2026-04-12__feat__zai-hero-tagline-governance",
    "",
    "## Intent",
    "Replace the placeholder title on the ZAI hero section",
    "with the governance positioning tagline…",
    "",
    "## Decision Tree",
    "| Option | Claim scope | Decision |",
    "|---|---|---|",
    "| Keep placeholder | No claim | ❌ Reject |",
    "| K's full tagline verbatim | End-to-end | ⚠️ Conditional |",
    "",
    "Trigger for change: When ZZV Chain anchoring goes live in prod…",
    "",
    "## Game Theory Review",
    "Who benefits: enterprise/infra buyers.",
    "Abuse vector: 'complete' is aspirational without chain.",
    "Mitigation: scope claim to spec→PR layer only.",
  ],
  sections: {
    intent: "PASS",
    decision_tree: "PASS",
    draft_of_thoughts: "PASS",
    final_spec: "PASS",
    game_theory: "PASS",
    migration_summary: "PASS",
    files_list: "PASS",
  } as const,
  score: "7/7",
  gates: ["ZZV Chain anchoring status before merge"],
};

export default function ScoreExample() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--zai-muted)]">
        Example
      </div>
      <h2
        className="mt-2 text-3xl sm:text-4xl"
        style={{ fontFamily: "var(--font-sans-zai)", fontWeight: 700 }}
      >
        What a scored spec looks like
      </h2>
      <p className="mt-3 text-[var(--zai-muted)] max-w-2xl">
        The real governance-tagline spec that shipped as PR&nbsp;#13, run through
        the same rubric you'll run.
      </p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--zai-border)] bg-[var(--zai-card)] overflow-hidden">
          <div className="px-4 py-2 border-b border-[var(--zai-border)] text-[11px] text-[var(--zai-muted)]">
            <span style={{ fontFamily: "var(--font-mono-zai)" }}>
              {EXAMPLE.filename}
            </span>
          </div>
          <pre
            className="px-4 py-4 text-[12px] leading-relaxed overflow-x-auto"
            style={{ fontFamily: "var(--font-mono-zai)" }}
          >
            {EXAMPLE.snippet.map((line, i) => {
              let color = "var(--zai-muted)";
              if (line.startsWith("#")) color = "var(--zai-teal)";
              else if (line.startsWith("|")) color = "var(--zai-purple)";
              else if (line.startsWith("Trigger")) color = "var(--zai-amber)";
              else if (line.trim().length > 0) color = "#d4d4d4";
              return (
                <div key={i} style={{ color }}>
                  {line || "\u00a0"}
                </div>
              );
            })}
          </pre>
        </div>

        <div className="rounded-xl border border-[var(--zai-border)] bg-[var(--zai-card)] p-6">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--zai-muted)]">
            Score
          </div>
          <div
            className="mt-1 text-5xl"
            style={{
              fontFamily: "var(--font-mono-zai)",
              color: "var(--zai-teal)",
              fontWeight: 500,
            }}
          >
            {EXAMPLE.score}
          </div>
          <div className="mt-1 text-sm text-[var(--zai-muted)]">
            cleared to ship
          </div>

          <div className="mt-5 space-y-2">
            {SECTION_ORDER.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between text-xs"
              >
                <span
                  className="text-neutral-300"
                  style={{ fontFamily: "var(--font-mono-zai)" }}
                >
                  {SECTION_LABELS[key]}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    fontFamily: "var(--font-mono-zai)",
                    color: "var(--zai-teal)",
                    border: "1px solid var(--zai-teal)",
                  }}
                >
                  {EXAMPLE.sections[key]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--zai-border)]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--zai-amber)] mb-2">
              Pre-deploy gates
            </div>
            <ul className="space-y-1.5">
              {EXAMPLE.gates.map((g, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-neutral-300"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: "var(--zai-amber)" }}
                  />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
