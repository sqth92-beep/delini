import { Link } from "wouter";
import { MapPin, Phone, BadgeCheck, Star, Navigation, Clock, Heart } from "lucide-react";
import type { BusinessResponse } from "@shared/schema";
import { parseWorkingHours, isBusinessOpen } from "@shared/schema";
import { motion } from "framer-motion";
import { usePreview } from "@/lib/preview-context";
import { useI18n } from "@/lib/i18n";
import { useFavorites } from "@/hooks/use-favorites";

interface BusinessCardProps {
  business: BusinessResponse & { distance?: number };
  layout?: "grid" | "list";
  index?: number;
}

function formatDistance(km: number, language: string): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return language === "ar" ? `${meters} م` : `${meters}m`;
  }
  return language === "ar" ? `${km.toFixed(1)} كم` : `${km.toFixed(1)}km`;
}

function addCacheBuster(url: string): string {
  if (!url || url.startsWith('/') || url.startsWith('data:')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=2`;
}

export function BusinessCard({ business, layout = "grid", index = 0 }: BusinessCardProps) {
  const { prefixLink } = usePreview();
  const { language } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const rawImageUrl = business.imageUrl || `https://placehold.co/600x400/1a1a2e/d4a655?text=${encodeURIComponent(business.name)}`;
  const imageUrl = addCacheBuster(rawImageUrl);
  const rating = business.averageRating || 0;
  const workingHoursJson = (business as any).workingHoursJson;
  const workingHours = parseWorkingHours(workingHoursJson);
  const isOpen = workingHours ? isBusinessOpen(workingHours) : null;
  const isFav = isFavorite(business.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(business.id);
  };

  if (layout === "list") {
    return (
      <Link href={prefixLink(`/businesses/${business.id}`)}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="
            flex gap-4 p-3 bg-card rounded-2xl border border-border/40 shadow-sm
            hover:shadow-md hover:border-primary/20 transition-all cursor-pointer
            group overflow-hidden
          "
        >
          <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
            <img 
              src={imageUrl} 
              alt={business.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                {business.name}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {business.subscriptionTier === 'vip' && (
                  <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
                )}
                <button
                  onClick={handleFavoriteClick}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  data-testid={`button-favorite-${business.id}`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {business.category && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {business.category.name}
                </span>
              )}
              {isOpen !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isOpen 
                    ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  <Clock className="w-3 h-3" />
                  {isOpen ? (language === "ar" ? "مفتوح" : "Open") : (language === "ar" ? "مغلق" : "Closed")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-primary">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs mr-1 font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : "-"}</span>
              </div>
              {business.reviewCount !== undefined && business.reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">({business.reviewCount})</span>
              )}
            </div>

            <div className="mt-auto pt-2 flex items-center justify-between text-sm text-muted-foreground gap-2">
              <div className="flex items-center gap-1 truncate min-w-0">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{business.address || "العنوان غير متوفر"}</span>
              </div>
              {business.distance !== undefined && (
                <div className="flex items-center gap-1 text-primary text-xs font-medium flex-shrink-0">
                  <Navigation className="w-3 h-3" />
                  <span>{formatDistance(business.distance, language)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Grid layout (Vertical Card)
  return (
    <Link href={prefixLink(`/businesses/${business.id}`)} className="block h-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="
          flex flex-col h-full bg-card rounded-2xl border border-border/40 shadow-sm
          hover:shadow-xl hover:-translate-y-1 transition-all duration-300
          group overflow-hidden cursor-pointer
        "
      >
        <div className="h-40 w-full relative overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={business.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {isOpen !== null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm ${
                isOpen 
                  ? "bg-green-500/90 text-white" 
                  : "bg-red-500/90 text-white"
              }`}>
                <Clock className="w-2.5 h-2.5" />
                {isOpen ? (language === "ar" ? "مفتوح" : "Open") : (language === "ar" ? "مغلق" : "Closed")}
              </span>
            )}
            {business.subscriptionTier === 'vip' && (
              <div className="bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-sm">
                <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
              </div>
            )}
          </div>
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
            data-testid={`button-favorite-grid-${business.id}`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
            {business.category && (
              <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
                {business.category.name}
              </span>
            )}
            <div className="flex items-center text-primary">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs mr-1 font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : "-"}</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {business.name}
          </h3>
          
          <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground gap-2 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0" />
              <span className="line-clamp-1 text-xs">{business.address || "العنوان غير متوفر"}</span>
            </div>
            {business.distance !== undefined && (
              <div className="flex items-center gap-1 text-primary text-xs font-medium flex-shrink-0">
                <Navigation className="w-3 h-3" />
                <span>{formatDistance(business.distance, language)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
