import { Link, useLocation } from "wouter";
import { Home, Grid, Search, Map, Tag, Globe, Settings, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "@/lib/preview-context";

export function BottomNavigation() {
  const [location] = useLocation();
  const { t } = useI18n();
  const { prefixLink, isPreview } = usePreview();

  const navItems = [
    { href: "/", labelKey: "nav.home", icon: Home },
    { href: "/categories", labelKey: "nav.categories", icon: Grid },
    { href: "/favorites", labelKey: "nav.favorites", icon: Heart },
    { href: "/offers", labelKey: "nav.offers", icon: Tag },
    { href: "/search", labelKey: "nav.search", icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border pb-safe z-50 shadow-[0_-4px_30px_-5px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const targetHref = prefixLink(item.href);
          const isActive = isPreview 
            ? location === targetHref || (item.href === "/" && location === "/preview")
            : location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={targetHref} className="flex-1">
              <div className={`
                flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300
                ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              `}>
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header({ title, backHref }: { title?: string, backHref?: string }) {
  const { language, setLanguage, t } = useI18n();
  const { prefixLink, isPreview } = usePreview();

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref ? (
            <Link href={prefixLink(backHref)} className="p-2 -mr-2 rounded-full hover:bg-muted/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          ) : (
            <Link href={prefixLink("/")} className="font-display font-bold text-xl gold-gradient">
              {t("app.name")}
            </Link>
          )}
          {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium transition-colors"
            data-testid="button-language-toggle"
          >
            <Globe className="w-4 h-4" />
            <span>{t("language.switch")}</span>
          </button>
          {!isPreview && (
            <Link href="/admin/login">
              <div className="p-2 text-muted-foreground/30 hover:text-muted-foreground/50 transition-opacity" title="">
                <Settings className="w-3.5 h-3.5" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
