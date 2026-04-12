import { useState } from "react";
import { useTranslation } from "react-i18next";

type Route = "home" | "app" | "pricing";

interface Props {
  current: Route;
  onNavigate: (route: Route) => void;
}

export default function TopBar({ current, onNavigate }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (r: Route) =>
    `px-3 py-2 text-sm transition-colors ${
      current === r ? "text-white" : "text-neutral-400 hover:text-white"
    }`;

  const go = (r: Route) => {
    setMenuOpen(false);
    onNavigate(r);
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
          className="flex items-center gap-2 text-white font-semibold tracking-wide"
        >
          <span className="inline-block w-7 h-7 rounded-md bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400" />
          ZAI
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
            className={linkClass("home")}
          >
            {t("nav.home")}
          </a>
          <a
            href="/app"
            onClick={(e) => {
              e.preventDefault();
              go("app");
            }}
            className={linkClass("app")}
          >
            {t("nav.app")}
          </a>
          <a
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              go("pricing");
            }}
            className={linkClass("pricing")}
          >
            {t("nav.pricing")}
          </a>
          <a
            href="https://htu.io"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-2 text-sm text-neutral-400 hover:text-white"
          >
            htu.io ↗
          </a>
        </nav>

        {/* Mobile: htu.io link always visible + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href="https://htu.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-2 text-sm text-neutral-400 hover:text-white"
          >
            htu.io ↗
          </a>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-neutral-300 hover:text-white"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <nav className="md:hidden border-t border-neutral-800 bg-neutral-950">
          <div className="flex flex-col px-4 py-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                go("home");
              }}
              className={linkClass("home")}
            >
              {t("nav.home")}
            </a>
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                go("app");
              }}
              className={linkClass("app")}
            >
              {t("nav.app")}
            </a>
            <a
              href="/pricing"
              onClick={(e) => {
                e.preventDefault();
                go("pricing");
              }}
              className={linkClass("pricing")}
            >
              {t("nav.pricing")}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
