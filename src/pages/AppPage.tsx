import { useCallback, useMemo, useState } from "react";
import UploadZone from "../components/UploadZone";
import ScorePanel from "../components/ScorePanel";
import ScoreExample from "../components/ScoreExample";
import PipelineSteps from "../components/PipelineSteps";
import { scoreSpec, type ScoreResult } from "../lib/scoreSpec";
import { renderScoredSpec } from "../lib/renderScoredSpec";
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

type ImplState = "idle" | "dispatching" | "queued" | "error";

// Non-greedy `.*?` skips any formatting (backticks, whitespace) between the
// **Repo:** marker and the owner/repo token. Owner/repo character class
// matches GitHub's allowed chars; first match on the header line wins.
const REPO_HEADER_REGEX = /\*\*Repo:\*\*.*?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/;

function parseTargetRepo(markdown: string): string | null {
  const match = markdown.match(REPO_HEADER_REGEX);
  return match ? match[1] : null;
}

export default function AppPage() {
  const [filename, setFilename] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [implState, setImplState] = useState<ImplState>("idle");
  const [issueNumber, setIssueNumber] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFile = useCallback((name: string, contents: string) => {
    setFilename(name);
    setMarkdown(contents);
    const scored = scoreSpec(contents, name);
    setResult(scored);
    setImplState("idle");
    setIssueNumber(null);
    setErrorMsg("");

    // Fire-and-forget: log section results to CF Analytics
    const events = scored.section_order.map((key) => ({
      section: key,
      status: scored.sections[key],
      reason: scored.section_reasons[key],
      spec_type: scored.spec_type,
      rubric_version: scored.rubric_version,
    }));
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rubric_version: scored.rubric_version,
        spec_type: scored.spec_type,
        events,
      }),
    }).catch(() => {});
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    downloadBlob("spec-template.md", SPEC_TEMPLATE);
  }, []);

  const handleDownloadScored = useCallback(() => {
    if (!filename || !markdown || !result) return;
    const out = renderScoredSpec(filename, markdown, result);
    const scoredName = filename.replace(/\.md$/i, "") + ".scored.md";
    downloadBlob(scoredName, out);
  }, [filename, markdown, result]);

  // Re-parse on every click from the currently-loaded markdown — never
  // retain a target_repo value across spec loads. See bug #67.
  const targetRepo = useMemo(
    () => (markdown ? parseTargetRepo(markdown) : null),
    [markdown]
  );

  const handleRunImpl = useCallback(async () => {
    if (!filename || !markdown || !result || !result.passed) return;
    if (!targetRepo) {
      setImplState("error");
      setErrorMsg("Cannot dispatch: spec is missing **Repo:** header");
      return;
    }
    setImplState("dispatching");
    setErrorMsg("");
    try {
      const scoredBody = renderScoredSpec(filename, markdown, result);
      const titleSlug = filename.replace(/\.md$/i, "").replace(/^.*__/, "");
      const issueRes = await fetch("/api/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${result.spec_type}: ${titleSlug}`,
          body: scoredBody,
          label: result.spec_type,
          repo: targetRepo,
        }),
      });
      if (!issueRes.ok) {
        throw new Error(`/api/issue ${issueRes.status}: ${await issueRes.text()}`);
      }
      const issueData = (await issueRes.json()) as { issue_number: number };
      setIssueNumber(issueData.issue_number);

      const dispatchRes = await fetch("/api/impl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_number: issueData.issue_number,
          target_repo: targetRepo,
        }),
      });
      if (!dispatchRes.ok) {
        throw new Error(`/api/impl ${dispatchRes.status}: ${await dispatchRes.text()}`);
      }
      setImplState("queued");
    } catch (e) {
      setImplState("error");
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
    }
  }, [filename, markdown, result, targetRepo]);

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
          Upload a spec file to get a deterministic per-type rubric score
          (5–9 structural checks depending on spec type). No LLM judgment —
          pure structural analysis. Human review still required.
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
              onRunImpl={handleRunImpl}
              implState={implState}
              issueNumber={issueNumber}
              errorMsg={errorMsg}
              targetRepo={targetRepo}
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
