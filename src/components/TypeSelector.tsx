import { useCallback, useRef, useState } from "react";
import { CANONICAL_USER_TYPES, type SpecType } from "../lib/scoreSpec";

interface TypeOption {
  id: SpecType;
  label: string;
}

// One source of truth for the seven canonical author-facing types lives
// in `specTypeDetector.ts` (`CANONICAL_USER_TYPES`). The button row
// derives both label text and click order from it; methodology canonical
// order is enforced by the array's declared order over there.
const TYPES: readonly TypeOption[] = CANONICAL_USER_TYPES.map((id) => ({
  id,
  label: id.toUpperCase(),
}));

export const TYPE_SELECTOR_TYPES = TYPES;

interface Props {
  onSelect: (type: SpecType) => void;
  disabled?: boolean;
}

export default function TypeSelector({ onSelect, disabled = false }: Props) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAt = useCallback((index: number) => {
    const len = TYPES.length;
    const wrapped = ((index % len) + len) % len;
    setFocusedIndex(wrapped);
    buttonRefs.current[wrapped]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          focusAt(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          focusAt(index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(TYPES.length - 1);
          break;
      }
    },
    [focusAt],
  );

  return (
    <div
      className="mt-4 rounded-xl border border-[var(--zai-border)] bg-[var(--zai-card)] p-4"
      data-testid="type-selector"
    >
      <div
        className="text-[11px] uppercase tracking-[0.25em] text-[var(--zai-muted)] mb-3"
        style={{ fontFamily: "var(--font-mono-zai)" }}
        id="type-selector-label"
      >
        Or pick a spec type to score directly
      </div>
      <div
        role="group"
        aria-labelledby="type-selector-label"
        className="flex flex-wrap gap-2"
      >
        {TYPES.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            disabled={disabled}
            tabIndex={focusedIndex === i ? 0 : -1}
            onClick={() => onSelect(t.id)}
            onFocus={() => setFocusedIndex(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--zai-purple)]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zai-purple)]"
            style={{
              fontFamily: "var(--font-mono-zai)",
              color: "var(--zai-purple)",
              borderColor: "var(--zai-purple)",
              letterSpacing: "0.15em",
            }}
            data-testid={`type-selector-button-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
