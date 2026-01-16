import { useActiveOffers } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { OfferCard } from "@/components/OfferCard";
import { Loader2, Tag } from "lucide-react";

export default function Offers() {
  const { data: offers, isLoading } = useActiveOffers();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="العروض" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl">العروض الحالية</h2>
            <p className="text-muted-foreground text-sm">أفضل العروض من شركائنا</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : offers && offers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد عروض حالياً</p>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
