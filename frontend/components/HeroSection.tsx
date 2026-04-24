"use client";

import { Zap, Brain, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HeroSection() {
  const { t } = useTranslation();
  
  return (
    <section className="relative pt-16 pb-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/20 mb-6 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-saffron-400" />
          <span className="text-xs font-medium text-saffron-400">
            {t("hero_badge")}
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 animate-slide-up">
          <span className="gradient-text">{t("hero_title_1")}</span>
          <br />
          <span className="text-foreground">{t("hero_title_2")}</span>
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up">
          {t("hero_desc_1")}{" "}
          <span className="text-saffron-400 font-medium">{t("hero_desc_highlight")}</span>
          {t("hero_desc_2")}
        </p>

        <div className="flex flex-wrap justify-center gap-6 animate-fade-in">
          <Feature icon={<Brain className="w-4 h-4" />} text={t("feat_classification")} />
          <Feature icon={<Zap className="w-4 h-4" />} text={t("feat_routing")} />
          <Feature icon={<Clock className="w-4 h-4" />} text={t("feat_prediction")} />
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="text-saffron-400">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
