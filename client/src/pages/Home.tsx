import { useCategories, useBusinesses, useActiveOffers } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import { BusinessCard } from "@/components/BusinessCard";
import { OfferCard } from "@/components/OfferCard";
import { Loader2, ArrowLeft, Tag, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "@/lib/preview-context";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import logoImg from "@assets/Delini_1768321622197.png";

const NEW_OFFERS_IDS_KEY = "delini_seen_offer_ids";

export default function Home() {
  const { t } = useI18n();
  const { prefixLink } = usePreview();
  const { toast } = useToast();
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredBusinesses, isLoading: isBizLoading } = useBusinesses();
  const { data: offers } = useActiveOffers();
  
  const hasIncremented = useRef(false);
  const hasCheckedOffers = useRef(false);
  
  const { data: visitorData } = useQuery<{ count: number }>({
    queryKey: ["/api/visitors/count"],
  });
  
  useEffect(() => {
    if (!hasIncremented.current) {
      hasIncremented.current = true;
      fetch("/api/visitors/increment", { method: "POST" });
    }
  }, []);

  useEffect(() => {
    if (offers && offers.length > 0 && !hasCheckedOffers.current) {
      hasCheckedOffers.current = true;
      
      const seenIdsStr = localStorage.getItem(NEW_OFFERS_IDS_KEY);
      const seenIds: number[] = seenIdsStr ? JSON.parse(seenIdsStr) : [];
      
      const newOffers = offers.filter(o => !seenIds.includes(o.id));
      
      if (newOffers.length > 0) {
        toast({
          title: `${newOffers.length} عروض جديدة`,
          description: newOffers[0].title + (newOffers.length > 1 ? ` و ${newOffers.length - 1} عروض أخرى` : ''),
          duration: 5000,
        });
      }
      
      const currentIds = offers.map(o => o.id);
      localStorage.setItem(NEW_OFFERS_IDS_KEY, JSON.stringify(currentIds));
    }
  }, [offers, toast]);
  
  const displayedVisitors = (visitorData?.count || 0) * 73;

  const topCategories = categories?.slice(0, 8);
  // Only show VIP businesses in featured section
  const featured = featuredBusinesses?.filter(b => b.subscriptionTier === 'vip').slice(0, 5);
  const topOffers = offers?.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-10">
        
        {/* Hero Section - Logo blends with page */}
        <section className="text-center space-y-6 -mx-4 px-4">
          <div className="relative -mt-6">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            <img 
              src={logoImg} 
              alt="Delini" 
              className="w-full h-auto object-contain" 
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
              {t("home.hero.title")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t("home.hero.subtitle")}
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <SearchBar />
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-display font-bold text-xl text-foreground">{t("home.categories")}</h3>
            <Link href={prefixLink("/categories")} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              {t("home.viewAll")}
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          
          {isCatLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {topCategories?.map((category, idx) => (
                <CategoryCard key={category.id} category={category} index={idx} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Businesses Section - Only VIP */}
        {featured && featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-display font-bold text-xl text-foreground">{t("home.featured")}</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x snap-mandatory">
              {featured.map((business, idx) => (
                <div key={business.id} className="min-w-[280px] w-[80%] md:w-[320px] snap-center">
                  <BusinessCard business={business} layout="grid" index={idx} />
                </div>
              ))}
              <div className="w-2" />
            </div>
          </section>
        )}

        {/* Offers Section */}
        {topOffers && topOffers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-xl text-foreground">{t("home.offers")}</h3>
              </div>
              <Link href={prefixLink("/offers")} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                {t("home.viewAll")}
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {topOffers.map((offer, idx) => (
                <OfferCard key={offer.id} offer={offer} index={idx} />
              ))}
            </div>
          </section>
        )}

        {/* Visitor Counter */}
        {displayedVisitors > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 mt-6" data-testid="visitor-counter">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {displayedVisitors.toLocaleString('en-US')} زائر
            </span>
          </div>
        )}

      </main>

      <BottomNavigation />
    </div>
  );
}
