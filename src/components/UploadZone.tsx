import { useCallback, useRef, useState } from "react";

interface Props {
  onFile: (name: string, contents: string) => void;
  onDownloadTemplate: () => void;
  loadedFilename: string | null;
}

type DragState = "idle" | "dragging";

export default function UploadZone({
  onFile,
  onDownloadTemplate,
  loadedFilename,
}: Props) {
  const [dragState, setDragState] = useState<DragState>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      setError(null);
      const file = files?.[0];
      if (!file) return;
      if (!/\.md$/i.test(file.name)) {
        setError("Only .md files are accepted.");
        return;
      }
      const text = await file.text();
      onFile(file.name, text);
    },
    [onFile]
  );

  const borderClass =
    dragState === "dragging"
      ? "border-[var(--zai-teal)]"
      : loadedFilename
      ? "border-[var(--zai-teal)]/60"
      : "border-[var(--zai-border)]";

  return (
    <div
      className={`relative flex flex-col rounded-xl border-2 border-dashed ${borderClass} bg-[var(--zai-card)] p-8 transition-colors`}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragState("dragging");
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragState("dragging");
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragState("idle");
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragState("idle");
        handleFiles(e.dataTransfer.files);
      }}
      data-testid="upload-zone"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div
          className="w-14 h-14 rounded-full bg-[var(--zai-teal)]/10 flex items-center justify-center mb-5"
          aria-hidden
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--zai-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h3
          className="text-xl"
          style={{ fontFamily: "var(--font-sans-zai)", fontWeight: 600 }}
        >
          {loadedFilename ? "Spec loaded" : "Drop a spec file"}
        </h3>
        <p className="mt-2 text-sm text-[var(--zai-muted)]">
          {loadedFilename ? (
            <span style={{ fontFamily: "var(--font-mono-zai)" }}>
              {loadedFilename}
            </span>
          ) : (
            <>or click to pick a <span style={{ fontFamily: "var(--font-mono-zai)" }}>.md</span> file</>
          )}
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 px-4 py-2.5 rounded-md bg-[var(--zai-teal)] text-white font-medium hover:opacity-90 transition-opacity"
          style={{ fontFamily: "var(--font-sans-zai)" }}
        >
          Score a spec
        </button>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="flex-1 px-4 py-2.5 rounded-md border border-[var(--zai-border)] text-neutral-200 hover:bg-[var(--zai-border)]/40 transition-colors"
          style={{ fontFamily: "var(--font-sans-zai)" }}
        >
          Download template ↓
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".md,text/markdown"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid="upload-input"
      />
    </div>
  );
}
