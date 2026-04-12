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

      {/* RGB demo — below the fold */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            {t("demo.title")}
          </h2>
          <p className="mt-3 text-neutral-400">{t("demo.description")}</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-neutral-400">
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
              <span className="text-sm text-neutral-400">
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

        <div className="flex items-center justify-center">
          <div
            className="w-56 h-56 md:w-64 md:h-64 rounded-2xl border border-neutral-800 transition-colors"
            style={{ background: color }}
            aria-label={`RGB preview ${color}`}
          />
        </div>
      </section>
    </>
  );
}
