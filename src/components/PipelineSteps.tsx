interface Step {
  num: string;
  name: string;
  body: string;
  accent?: boolean;
}

const STEPS: Step[] = [
  {
    num: "01",
    name: "Write spec",
    body: "Seven sections, one markdown file. Intent through files list.",
  },
  {
    num: "02",
    name: "classify spec",
    body: "Rubric runs. PASS / SKIP / FAIL per section. Pre-deploy gates surfaced.",
    accent: true,
  },
  {
    num: "03",
    name: "impl runs",
    body: "Branch, implement, test, PR. Every hop is recorded.",
  },
];

export default function PipelineSteps() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[var(--zai-border)]">
      <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--zai-muted)]">
        Pipeline
      </div>
      <h2
        className="mt-2 text-3xl sm:text-4xl"
        style={{ fontFamily: "var(--font-sans-zai)", fontWeight: 700 }}
      >
        From spec to shipped code
      </h2>

      <div className="mt-10 grid grid-cols-1 min-[560px]:grid-cols-3 gap-5">
        {STEPS.map((step) => (
          <div
            key={step.num}
            data-testid={`pipeline-step-${step.num}`}
            className="rounded-xl bg-[var(--zai-card)] p-6"
            style={{
              border: step.accent
                ? "1px solid var(--zai-teal)"
                : "1px solid var(--zai-border)",
            }}
          >
            <div
              className="text-[11px] text-[var(--zai-muted)]"
              style={{ fontFamily: "var(--font-mono-zai)" }}
            >
              {step.num}
            </div>
            <div
              className="mt-1 text-xl"
              style={{
                fontFamily: "var(--font-sans-zai)",
                fontWeight: 600,
                color: step.accent ? "var(--zai-teal)" : undefined,
              }}
            >
              {step.name}
            </div>
            <p className="mt-3 text-sm text-[var(--zai-muted)] leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
