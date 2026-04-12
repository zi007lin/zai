import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
      <div>
        {t("footer.built_on")}{" "}
        <a
          href="https://htu.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-300 hover:text-white"
        >
          HTU Foundation
        </a>{" "}
        · <a href="https://zzv.io" className="hover:text-white">zzv.io</a>
      </div>
    </footer>
  );
}
