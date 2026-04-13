import { useEffect, useMemo, useState } from "react";
import {
  type ScoreResult,
  SECTION_LABELS,
  SECTION_ORDER,
  type SectionStatus,
} from "../lib/scoreSpec";

interface Props {
  result: ScoreResult;
  filename: string;
  onDownloadScored: () => void;
  onCopyImplCommand: () => void;
  justCopied: boolean;
}

const STAGGER_MS = 200;

function statusColor(status: SectionStatus): string {
  if (status === "PASS") return "var(--zai-teal)";
  if (status === "SKIP") return "var(--zai-purple)";
  return "#E15B5B";
}

function statusLabel(status: SectionStatus): string {
  return status;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ScorePanel({
  result,
  filename,
  onDownloadScored,
  onCopyImplCommand,
  justCopied,
}: Props) {
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const totalSections = SECTION_ORDER.length;
  const [revealed, setRevealed] = useState(reducedMotion ? totalSections : 0);

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(totalSections);
      return;
    }
    setRevealed(0);
    const timers: number[] = [];
    for (let i = 1; i <= totalSections; i++) {
      timers.push(
        window.setTimeout(() => setRevealed(i), i * STAGGER_MS)
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [result.evaluated_at, reducedMotion, totalSections]);

  const running = revealed < totalSections;
  const passCountSoFar = SECTION_ORDER.slice(0, revealed).filter(
    (k) => result.sections[k] === "PASS" || result.sections[k] === "SKIP"
  ).length;

  const statusText = running
    ? "evaluating…"
    : result.passed
    ? "cleared to ship"
    : `${SECTION_ORDER.filter((k) => result.sections[k] === "FAIL").length} sections failed`;

  const badge = running
    ? { text: "RUNNING", color: "var(--zai-amber)" }
    : result.passed
    ? { text: `${passCountSoFar}/7 PASS`, color: "var(--zai-teal)" }
    : {
        text: `${SECTION_ORDER.filter((k) => result.sections[k] === "FAIL").length}/7 FAIL`,
        color: "#E15B5B",
      };

  return (
    <div
      className="rounded-xl border border-[var(--zai-border)] bg-[var(--zai-card)] p-6 sm:p-8"
      style={{
        animation: reducedMotion
          ? undefined
          : "zai-fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) both",
      }}
      data-testid="score-panel"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--zai-muted)]">
            Spec score
          </div>
          <div
            className="mt-1 text-6xl sm:text-7xl"
            style={{
              fontFamily: "var(--font-mono-zai)",
              color: "var(--zai-teal)",
              fontWeight: 500,
              lineHeight: 1,
            }}
            data-testid="score-counter"
          >
            {passCountSoFar}/7
          </div>
          <div className="mt-2 text-sm text-[var(--zai-muted)]">{statusText}</div>
        </div>
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            fontFamily: "var(--font-mono-zai)",
            color: badge.color,
            border: `1px solid ${badge.color}`,
            background: `${badge.color}1a`,
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: badge.color }}
          />
          {badge.text}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {SECTION_ORDER.map((key, i) => {
          const status = result.sections[key];
          const isRevealed = i < revealed;
          const fill = isRevealed ? 100 : 0;
          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto] gap-3 items-center"
              data-testid={`section-${key}`}
            >
              <div
                className="text-xs sm:text-sm text-neutral-300"
                style={{ fontFamily: "var(--font-mono-zai)" }}
              >
                {SECTION_LABELS[key]}
              </div>
              <div className="hidden sm:block h-2 rounded-full bg-[var(--zai-border)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${fill}%`,
                    background: statusColor(status),
                    transition: reducedMotion
                      ? undefined
                      : "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <span
                className="justify-self-end text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  fontFamily: "var(--font-mono-zai)",
                  color: statusColor(status),
                  border: `1px solid ${statusColor(status)}`,
                  opacity: isRevealed ? 1 : 0.25,
                  transition: "opacity 200ms",
                }}
              >
                {statusLabel(status)}
              </span>
            </div>
          );
        })}
      </div>

      {result.gates.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[var(--zai-border)]">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--zai-amber)] mb-2">
            Pre-deploy gates
          </div>
          <ul className="space-y-1.5">
            {result.gates.map((gate, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                <span
                  className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: "var(--zai-amber)" }}
                />
                {gate}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-[var(--zai-border)] text-[11px] text-[var(--zai-muted)]">
        <span style={{ fontFamily: "var(--font-mono-zai)" }}>
          {filename} · Scored · {result.evaluated_at} · rubric v{result.rubric_version}
        </span>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onDownloadScored}
          className="flex-1 px-4 py-2.5 rounded-md border border-[var(--zai-border)] text-neutral-200 hover:bg-[var(--zai-border)]/40 transition-colors"
          style={{ fontFamily: "var(--font-sans-zai)" }}
        >
          Download scored spec ↓
        </button>
        <button
          type="button"
          onClick={onCopyImplCommand}
          className="flex-1 px-4 py-2.5 rounded-md bg-[var(--zai-teal)] text-white font-medium hover:opacity-90 transition-opacity"
          style={{ fontFamily: "var(--font-sans-zai)" }}
        >
          {justCopied ? "Copied!" : "Run impl →"}
        </button>
      </div>
    </div>
  );
}
