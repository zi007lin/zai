import { useCallback, useMemo, useState } from "react";
import UploadZone, { type UploadState } from "../components/UploadZone";
import ScorePanel from "../components/ScorePanel";
import ScoreExample from "../components/ScoreExample";
import PipelineSteps from "../components/PipelineSteps";
import ErrorBanner from "../components/ErrorBanner";
import TypeSelector from "../components/TypeSelector";
import {
  scoreSpec,
  scoreSpecWithType,
  SpecTypeError,
  type ScoreResult,
  type SpecType,
} from "../lib/scoreSpec";
import { renderScoredSpec } from "../lib/renderScoredSpec";
import { SPEC_TEMPLATE } from "../lib/specTemplate";
import { parseRepoHeader } from "../lib/parseRepoHeader";

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

export default function AppPage() {
  const [filename, setFilename] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [implState, setImplState] = useState<ImplState>("idle");
  const [issueNumber, setIssueNumber] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [uploadState, setUploadState] = useState<UploadState>({
    kind: "preupload",
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Track whether the upload error was specifically the detector's
  // "unresolvable spec type" case. The TypeSelector renders only when
  // this is true; other errors (file read failure, future cases) show
  // the bare ErrorBanner because picking a type would not help them.
  const [unresolvableTypeError, setUnresolvableTypeError] = useState(false);

  const postScoreTelemetry = useCallback((scored: ScoreResult) => {
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

  const handleFile = useCallback(
    async (name: string, contents: string) => {
      setUploadState({ kind: "loading", filename: name });
      setUploadError(null);
      setUnresolvableTypeError(false);
      // Yield once so the loading state is observable; scoring itself is
      // synchronous CPU work, but the UI contract requires preupload →
      // loading → loaded|error with no skipped transitions.
      await Promise.resolve();
      try {
        const scored = scoreSpec(contents, name);
        setFilename(name);
        setMarkdown(contents);
        setResult(scored);
        setUploadState({ kind: "loaded", filename: name });
        setImplState("idle");
        setIssueNumber(null);
        setErrorMsg("");
        postScoreTelemetry(scored);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to score spec.";
        // Keep filename + markdown around so the TypeSelector path can
        // re-score the same upload without forcing a re-attach. Result
        // stays null so the right panel renders ErrorBanner instead of
        // ScorePanel.
        setFilename(name);
        setMarkdown(contents);
        setResult(null);
        setUploadState({ kind: "error" });
        setUploadError(message);
        setUnresolvableTypeError(err instanceof SpecTypeError);
      }
    },
    [postScoreTelemetry],
  );

  const handleTypeSelect = useCallback(
    async (manualType: SpecType) => {
      if (!filename || !markdown) return;
      setUploadState({ kind: "loading", filename });
      // Yield so the loading transition is observable (same reason as
      // handleFile: the contract forbids skipping `loading`).
      await Promise.resolve();
      try {
        const scored = scoreSpecWithType(markdown, manualType);
        setResult(scored);
        setUploadState({ kind: "loaded", filename });
        setUploadError(null);
        setUnresolvableTypeError(false);
        setImplState("idle");
        setIssueNumber(null);
        setErrorMsg("");
        postScoreTelemetry(scored);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to score spec.";
        setResult(null);
        setUploadState({ kind: "error" });
        setUploadError(message);
        setUnresolvableTypeError(false);
      }
    },
    [filename, markdown, postScoreTelemetry],
  );

  const handleDownloadTemplate = useCallback(() => {
    downloadBlob("spec-template.md", SPEC_TEMPLATE);
  }, []);

  const handleDownloadScored = useCallback(() => {
    if (!filename || !markdown || !result) return;
    const out = renderScoredSpec(filename, markdown, result);
    const scoredName = filename.replace(/\.md$/i, "") + ".scored.md";
    downloadBlob(scoredName, out);
  }, [filename, markdown, result]);

  // Re-parse on every render from the currently-loaded markdown — never
  // retain a target_repo value across spec loads. See bug #67.
  const targetRepo = useMemo(
    () => (markdown ? parseRepoHeader(markdown) : null),
    [markdown]
  );

  // The "Run impl" button is gated on `targetRepo` in ScorePanel, so this
  // handler is unreachable when the header is missing. Missing-header UX
  // lives entirely in the disabled-state hint — runtime error channel is
  // reserved for genuine dispatch failures (network, auth, rate-limit).
  // See BUG #97.
  const handleRunImpl = useCallback(async () => {
    if (!filename || !markdown || !result || !result.passed || !targetRepo) return;
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
          // BUG #86: filename drives the `issues/<base>.scored.md`
          // commit on the target repo so the audit-trail invariant
          // ("every scored spec has a committed file") holds.
          filename,
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
            state={uploadState}
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
          ) : uploadError ? (
            <div>
              <ErrorBanner message={uploadError} />
              {unresolvableTypeError && (
                <TypeSelector
                  onSelect={handleTypeSelect}
                  disabled={uploadState.kind === "loading"}
                />
              )}
            </div>
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
