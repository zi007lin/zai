interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  return (
    <div
      className="rounded-xl border border-[#E15B5B]/40 bg-[#E15B5B]/10 p-6 sm:p-8"
      role="alert"
      data-testid="upload-error-banner"
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5"
          style={{
            color: "#E15B5B",
            border: "1px solid #E15B5B",
            fontFamily: "var(--font-mono-zai)",
            fontSize: "12px",
            lineHeight: 1,
          }}
          aria-hidden
        >
          !
        </span>
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{
              fontFamily: "var(--font-mono-zai)",
              color: "#E15B5B",
            }}
          >
            Spec could not be scored
          </div>
          <p
            className="mt-2 text-sm text-neutral-200"
            style={{ lineHeight: 1.6 }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
