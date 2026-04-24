"use client";

import { Shield, LogOut, Globe, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function Header() {
  const { user, profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: "en", name: "English", label: "EN" },
    { code: "hi", name: "Hindi", label: "HI" },
    { code: "mr", name: "Marathi", label: "MR" },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setShowLangMenu(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-lg shadow-saffron-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="gradient-text-saffron">{t("app_name")}</span>
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest uppercase">
              {t("app_subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-emerald-400 font-medium">{t("ai_online")}</span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold">{currentLang.label}</span>
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-card border border-border shadow-xl z-50 overflow-hidden py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors flex items-center justify-between ${
                        i18n.language === lang.code ? "text-saffron-500 bg-saffron-500/5" : "text-foreground"
                      }`}
                    >
                      {lang.name}
                      {i18n.language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-3 ml-2 border-l border-border/50 pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">{profile?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{profile?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title={t("logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
