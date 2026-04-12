import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Route = "home" | "app" | "pricing";

interface Props {
  onNavigate: (route: Route) => void;
}

export default function HomePage({ onNavigate }: Props) {
  const { t } = useTranslation();
  const [ambiguity, setAmbiguity] = useState(20);
  const [spec, setSpec] = useState(80);

  const color = useMemo(() => {
    const r = Math.round((ambiguity / 100) * 255);
    const g = Math.round((spec / 100) * 255);
    const b = Math.round(((100 - ambiguity) / 100) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }, [ambiguity, spec]);

  return (
    <>
      {/* Hero — fills the viewport below the 56px TopBar */}
      <section
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: "calc(100dvh - 56px)" }}
      >
        <h1
          className="font-bold tracking-tight leading-[1.05] max-w-[18ch]"
          style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
        >
          {t("hero.title")}
        </h1>
        <p
          className="mt-4 text-neutral-400 max-w-[32ch]"
          style={{ fontSize: "clamp(1rem, 2.2vw, 1.5rem)" }}
        >
          {t("hero.tagline")}
        </p>
        <p className="mt-3 text-sm text-neutral-500">
          {t("hero.by")}{" "}
          <a
            href="https://htu.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white underline underline-offset-4"
          >
            High Tech United
          </a>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigate("app")}
            className="px-5 py-2.5 rounded-md bg-white text-neutral-900 font-medium hover:bg-neutral-200 transition-colors"
          >
            {t("hero.cta_try")}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("pricing")}
            className="px-5 py-2.5 rounded-md border border-neutral-700 text-white hover:bg-neutral-900 transition-colors"
          >
            {t("hero.cta_pricing")}
          </button>
        </div>
      </section>

      {/* RGB demo — full-section dynamic background driven by the sliders */}
      <section
        className="relative overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: color }}
        aria-label={`ZAI ambiguity visualizer, current RGB ${color}`}
      >
        {/* Dark overlay keeps text legible at every slider position */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 py-24 text-white">
          <h2
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 5vw, 3.25rem)", lineHeight: 1.15 }}
          >
            {t("demo.title")}
          </h2>
          <p
            className="mt-5 text-neutral-100"
            style={{ fontSize: "1.125rem", lineHeight: 1.7 }}
          >
            {t("demo.description")}
          </p>

          <div className="mt-10 space-y-6">
            <label className="block">
              <span
                className="text-neutral-100"
                style={{ fontSize: "1rem" }}
              >
                {t("demo.ambiguity")}: {ambiguity}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={ambiguity}
                onChange={(e) => setAmbiguity(Number(e.target.value))}
                className="w-full mt-2"
              />
            </label>
            <label className="block">
              <span
                className="text-neutral-100"
                style={{ fontSize: "1rem" }}
              >
                {t("demo.spec_coverage")}: {spec}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={spec}
                onChange={(e) => setSpec(Number(e.target.value))}
                className="w-full mt-2"
              />
            </label>
          </div>
        </div>
      </section>
    </>
  );
}
