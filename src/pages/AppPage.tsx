import { useCallback, useMemo, useState } from "react";
import UploadZone from "../components/UploadZone";
import ScorePanel from "../components/ScorePanel";
import ScoreExample from "../components/ScoreExample";
import PipelineSteps from "../components/PipelineSteps";
import { scoreSpec, type ScoreResult } from "../lib/scoreSpec";
import { SPEC_TEMPLATE } from "../lib/specTemplate";

function downloadBlob(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildScoredSpec(
  originalFilename: string,
  originalMarkdown: string,
  result: ScoreResult
): string {
  const lines: string[] = [];
  lines.push(originalMarkdown.replace(/\s+$/, ""));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## ZAI Spec Score");
  lines.push("");
  lines.push(`- **Rubric version:** ${result.rubric_version}`);
  lines.push(`- **Spec type:** ${result.spec_type}`);
  lines.push(`- **Evaluated at:** ${result.evaluated_at}`);
  lines.push(`- **Score:** ${result.score}`);
  lines.push(`- **Passed:** ${result.passed ? "YES" : "NO"}`);
  lines.push("");
  lines.push("| Section | Status |");
  lines.push("|---|---|");
  for (const [key, status] of Object.entries(result.sections)) {
    lines.push(`| ${key} | ${status} |`);
  }
  if (result.gates.length > 0) {
    lines.push("");
    lines.push("### Pre-deploy gates");
    for (const g of result.gates) lines.push(`- [ ] ${g}`);
  }
  lines.push("");
  lines.push(`_Source: ${originalFilename}_`);
  lines.push("");
  return lines.join("\n");
}

export default function AppPage() {
  const [filename, setFilename] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [justCopied, setJustCopied] = useState(false);

  const handleFile = useCallback((name: string, contents: string) => {
    setFilename(name);
    setMarkdown(contents);
    setResult(scoreSpec(contents, name));
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    downloadBlob("spec-template.md", SPEC_TEMPLATE);
  }, []);

  const handleDownloadScored = useCallback(() => {
    if (!filename || !markdown || !result) return;
    const out = buildScoredSpec(filename, markdown, result);
    const scoredName = filename.replace(/\.md$/i, "") + ".scored.md";
    downloadBlob(scoredName, out);
  }, [filename, markdown, result]);

  const handleCopyImplCommand = useCallback(async () => {
    if (!filename) return;
    const cmd = `impl i ${filename}`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // silently ignore — toast still fires
    }
    setJustCopied(true);
    window.setTimeout(() => setJustCopied(false), 1600);
  }, [filename]);

  const header = useMemo(
    () => (
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--zai-muted)]">
          <span style={{ fontFamily: "var(--font-mono-zai)" }}>
            ZAI · spec scorer
          </span>
        </div>
        <h1
          className="mt-3 font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-sans-zai)",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            lineHeight: 1.1,
          }}
        >
          Score your spec before it ships
        </h1>
        <p
          className="mt-4 text-[var(--zai-muted)] max-w-2xl"
          style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}
        >
          Upload a spec file to get a deterministic 7-section score. No LLM
          judgment — pure structural analysis. Structural checks. Human review
          still required.
        </p>
      </section>
    ),
    []
  );

  return (
    <div className="bg-[#0a0a0a]">
      {header}

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <UploadZone
            onFile={handleFile}
            onDownloadTemplate={handleDownloadTemplate}
            loadedFilename={filename}
          />
          {result && filename ? (
            <ScorePanel
              result={result}
              filename={filename}
              onDownloadScored={handleDownloadScored}
              onCopyImplCommand={handleCopyImplCommand}
              justCopied={justCopied}
            />
          ) : (
            <div
              className="rounded-xl border border-dashed border-[var(--zai-border)] bg-[var(--zai-card)]/40 p-8 flex items-center justify-center text-sm text-[var(--zai-muted)]"
              data-testid="score-panel-placeholder"
            >
              Score panel appears here after a spec is loaded.
            </div>
          )}
        </div>
      </section>

      <ScoreExample />
      <PipelineSteps />

      <section className="max-w-6xl mx-auto px-6 py-10 border-t border-[var(--zai-border)]">
        <div
          className="text-[11px] text-[var(--zai-muted)]"
          style={{ fontFamily: "var(--font-mono-zai)" }}
        >
          ZAI · Zero Ambiguity Intelligence · HTU Foundation · zzv.io
        </div>
      </section>
    </div>
  );
}
