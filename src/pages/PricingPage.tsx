import { useTranslation } from "react-i18next";

interface Tier {
  key: "free" | "pro" | "pro_plus" | "enterprise";
  price: string;
}

const TIERS: Tier[] = [
  { key: "free", price: "$0" },
  { key: "pro", price: "$29/mo" },
  { key: "pro_plus", price: "$99/mo" },
  { key: "enterprise", price: "Custom" },
];

export default function PricingPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-center">{t("pricing.title")}</h1>
      <p className="mt-3 text-center text-neutral-400">
        {t("pricing.subtitle")}
      </p>

      <div className="mt-12 grid md:grid-cols-4 gap-4">
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className="rounded-xl border border-neutral-800 p-6 flex flex-col"
          >
            <div className="text-sm text-neutral-400 uppercase tracking-wide">
              {t(`pricing.${tier.key}.name`)}
            </div>
            <div className="mt-2 text-3xl font-bold">{tier.price}</div>
            <div className="mt-4 text-sm text-neutral-400">
              {t(`pricing.${tier.key}.description`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
