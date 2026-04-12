import { useTranslation } from "react-i18next";

export default function AppPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">{t("app.title")}</h1>
      <p className="mt-4 text-neutral-400">{t("app.coming_soon")}</p>
    </div>
  );
}
