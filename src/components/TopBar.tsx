import { useTranslation } from "react-i18next";

type Route = "home" | "app" | "pricing";

interface Props {
  current: Route;
  onNavigate: (route: Route) => void;
}

export default function TopBar({ current, onNavigate }: Props) {
  const { t } = useTranslation();

  const linkClass = (r: Route) =>
    `px-3 py-2 text-sm transition-colors ${
      current === r ? "text-white" : "text-neutral-400 hover:text-white"
    }`;

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
          className="flex items-center gap-2 text-white font-semibold tracking-wide"
        >
          <span className="inline-block w-7 h-7 rounded-md bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400" />
          ZAI
        </a>
        <nav className="flex items-center gap-1">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("home");
            }}
            className={linkClass("home")}
          >
            {t("nav.home")}
          </a>
          <a
            href="/app"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("app");
            }}
            className={linkClass("app")}
          >
            {t("nav.app")}
          </a>
          <a
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("pricing");
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
      </div>
    </header>
  );
}
