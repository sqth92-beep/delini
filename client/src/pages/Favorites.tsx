import { useBusinesses } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { Loader2, Heart, SearchX } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Favorites() {
  const { t } = useI18n();
  const { data: allBusinesses, isLoading } = useBusinesses();
  const { favorites } = useFavorites();

  const favoriteBusinesses = allBusinesses?.filter(b => favorites.includes(b.id)) || [];

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <Header title={t("favorites.title")} />

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : favoriteBusinesses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("favorites.empty")}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t("favorites.emptyDescription")}
            </p>
            <Link href="/categories">
              <Button className="gap-2" data-testid="button-browse-categories">
                <SearchX className="w-4 h-4" />
                {t("favorites.browseCategories")}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              <span className="text-muted-foreground">
                {favoriteBusinesses.length} {t("favorites.count")}
              </span>
            </div>
            <div className="grid gap-4">
              {favoriteBusinesses.map((business, idx) => (
                <BusinessCard 
                  key={business.id} 
                  business={business} 
                  layout="list" 
                  index={idx} 
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
