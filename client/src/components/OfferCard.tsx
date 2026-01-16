import { Link } from "wouter";
import { Tag, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { Offer, Business } from "@shared/schema";
import { motion } from "framer-motion";
import { usePreview } from "@/lib/preview-context";

interface OfferCardProps {
  offer: Offer & { business?: Business };
  index?: number;
  showBusiness?: boolean;
}

export function OfferCard({ offer, index = 0, showBusiness = true }: OfferCardProps) {
  const { prefixLink } = usePreview();
  const isExpiringSoon = offer.validUntil && 
    new Date(offer.validUntil).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl overflow-hidden"
      data-testid={`offer-${offer.id}`}
    >
      {offer.imageUrl && (
        <div className="w-full h-32 md:h-40 overflow-hidden">
          <img 
            src={offer.imageUrl} 
            alt={offer.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground line-clamp-1">{offer.title}</h4>
            {showBusiness && offer.business && (
              <Link 
                href={prefixLink(`/businesses/${offer.business.id}`)}
                className="text-sm text-primary hover:underline"
              >
                {offer.business.name}
              </Link>
            )}
          </div>
        </div>

      {offer.description && (
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {offer.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {offer.validUntil ? (
          <div className={`flex items-center gap-1 text-xs ${isExpiringSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" />
            <span>
              ينتهي {formatDistanceToNow(new Date(offer.validUntil), {
                addSuffix: true,
                locale: ar,
              })}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">عرض مستمر</span>
        )}

        {showBusiness && offer.business && (
          <Link 
            href={prefixLink(`/businesses/${offer.business.id}`)}
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
          >
            التفاصيل
            <ArrowLeft className="w-3 h-3" />
          </Link>
        )}
      </div>
      </div>
    </motion.div>
  );
}
