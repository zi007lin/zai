import { useEffect, useState } from "react";

// Phase 1 migration banner for the ZiLin Brand Family Migration REFACTOR.
// Shown only on the old domain (zai.htu.io) during dual-run. Dismissal is
// persisted in localStorage. Reference: issues/2026-04-19__refactor__zilin-brand-migration.md §Phase 1.

const STORAGE_KEY = "zilin-migration-banner-dismissed-v1";
const OLD_DOMAIN = "zai.htu.io";
const NEW_DOMAIN = "zilin-spec.htu.io";
const RATIONALE_URL = "/docs/brand/zilin-rename-rationale.md";

function isOldDomain(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === OLD_DOMAIN;
}

function wasDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function MigrationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOldDomain() && !wasDismissed()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore (private mode, SSR edges)
    }
  };

  return (
    <aside
      role="region"
      aria-label="Service renaming announcement"
      className="sticky top-0 z-50 bg-[#0D7C5F] text-white shadow-sm border-b border-white/15 motion-safe:animate-[fadeIn_180ms_ease-out]"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <span aria-hidden="true" className="shrink-0 opacity-90">
          &#x27A4;
        </span>
        <p className="m-0 flex-1 text-sm leading-snug">
          <strong>Renaming to ZiLin-Spec.</strong>{" "}
          This validator is moving to{" "}
          <a
            href={`https://${NEW_DOMAIN}/app`}
            className="underline underline-offset-2 hover:decoration-2 focus-visible:decoration-2"
          >
            {NEW_DOMAIN}
          </a>
          . Both domains work today. The old URL will 301 after the Phase 2
          cutover.{" "}
          <a
            href={RATIONALE_URL}
            className="underline underline-offset-2 hover:decoration-2 focus-visible:decoration-2"
          >
            Why
          </a>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss rename announcement"
          className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded border border-white/30 hover:bg-white/15 hover:border-white/60 focus-visible:bg-white/15 focus-visible:border-white/60 focus-visible:outline-none"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            &times;
          </span>
        </button>
      </div>
    </aside>
  );
}
