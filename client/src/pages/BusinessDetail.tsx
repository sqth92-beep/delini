import { useRoute, Link } from "wouter";
import { useBusiness, useBusinessOffers } from "@/hooks/use-directory";
import { Header } from "@/components/Navigation";
import { RatingStars } from "@/components/RatingStars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { OfferCard } from "@/components/OfferCard";
import { Loader2, Phone, MapPin, BadgeCheck, MessageCircle, Share2, Clock, Globe, Instagram, Facebook, CheckCircle, Tag, Navigation, GalleryHorizontal, ChevronLeft, ChevronRight, X, Heart, Copy } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePreview } from "@/lib/preview-context";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function BusinessDetail() {
  const [, params] = useRoute("/businesses/:id");
  const [, previewParams] = useRoute("/preview/businesses/:id");
  const id = params?.id ? parseInt(params.id) : (previewParams?.id ? parseInt(previewParams.id) : 0);
  const { prefixLink } = usePreview();
  
  const { data: business, isLoading } = useBusiness(id);
  const { data: offers } = useBusinessOffers(id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط المحل",
      });
    } catch {
      toast({
        title: "خطأ",
        description: "لم يتم نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h2 className="text-xl font-bold">المحل غير موجود</h2>
        <Link href={prefixLink("/")} className="text-primary hover:underline">العودة للرئيسية</Link>
      </div>
    );
  }

  const storefrontImage = (business as any).storefrontImageUrl || business.imageUrl || `https://placehold.co/800x600/1a1a2e/d4a655?text=${encodeURIComponent(business.name)}`;
  const galleryImages: string[] = (business as any).galleryImages || [];
  const hasLocation = business.latitude && business.longitude;
  const allImages = [storefrontImage, ...galleryImages].filter(Boolean);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative h-[40vh] w-full cursor-pointer" onClick={() => openLightbox(0)}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <Link href={prefixLink("/")} className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/50 transition-colors" data-testid="button-back" onClick={(e) => e.stopPropagation()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-1.5">
            <GalleryHorizontal className="w-4 h-4" />
            <span>{allImages.length} صور</span>
          </div>
        )}
        <img 
          src={storefrontImage} 
          alt={business.name} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20 space-y-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-3xl shadow-xl p-6 border border-border/40"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              {business.category && (
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                  {business.category.name}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2">
                {business.name}
                {business.subscriptionTier === 'vip' && <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-50" />}
              </h1>
            </div>
            <div className="flex flex-col items-end">
              <RatingStars 
                rating={business.averageRating || 0} 
                showValue 
                reviewCount={business.reviewCount}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground mb-4">
            <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
            <p className="leading-snug">{business.address || "العنوان غير متوفر"}</p>
          </div>


          <div className="flex flex-wrap gap-2 mb-4">
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors" data-testid="link-website">
                <Globe className="w-4 h-4 text-primary" />
                <span>الموقع</span>
              </a>
            )}
            {business.instagram && (
              <a href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors" data-testid="link-instagram">
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>انستغرام</span>
              </a>
            )}
            {business.facebook && (
              <a href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors" data-testid="link-facebook">
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>فيسبوك</span>
              </a>
            )}
            {(business as any).tiktok && (
              <a href={(business as any).tiktok.startsWith('http') ? (business as any).tiktok : `https://tiktok.com/@${(business as any).tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors" data-testid="link-tiktok">
                <SiTiktok className="w-4 h-4" />
                <span>تيك توك</span>
              </a>
            )}
            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4 text-primary" />
              <span>نسخ الرابط</span>
            </button>
            <button 
              onClick={() => toggleFavorite(id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isFavorite(id) 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
              data-testid="button-favorite-detail"
            >
              <Heart className={`w-4 h-4 ${isFavorite(id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              <span>{isFavorite(id) ? 'في المفضلة' : 'أضف للمفضلة'}</span>
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/50">
            <h3 className="font-bold text-lg">عن {business.name}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {business.description || "لا يوجد وصف متوفر لهذا المحل حالياً."}
            </p>
          </div>

          {business.services && business.services.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <h3 className="font-bold text-lg mb-3">الخدمات</h3>
              <div className="flex flex-wrap gap-2">
                {business.services.map((service, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                    <CheckCircle className="w-3 h-3" />
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {galleryImages.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl shadow-xl p-6 border border-border/40"
          >
            <div className="flex items-center gap-2 mb-4">
              <GalleryHorizontal className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">صور المحل</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {galleryImages.map((img, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(index + 1)}
                  data-testid={`gallery-image-${index}`}
                >
                  <img 
                    src={img} 
                    alt={`صورة ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {offers && offers.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl shadow-xl p-6 border border-border/40"
          >
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">العروض الحالية</h3>
            </div>
            <div className="space-y-3">
              {offers.map((offer, i) => (
                <OfferCard key={offer.id} offer={offer} index={i} showBusiness={false} />
              ))}
            </div>
          </motion.div>
        )}

        {hasLocation && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl shadow-xl p-6 border border-border/40"
          >
            <h3 className="font-bold text-lg mb-4">الموقع على الخريطة</h3>
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-border">
              <MapContainer
                center={[business.latitude!, business.longitude!]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[business.latitude!, business.longitude!]} icon={customIcon}>
                  <Popup>{business.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl shadow-xl p-6 border border-border/40"
        >
          <h3 className="font-bold text-lg mb-4">التقييمات والآراء</h3>
          <ReviewList businessId={id} />
          <div className="mt-6 pt-4 border-t border-border/50">
            <ReviewForm businessId={id} />
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-lg border-t border-border z-30">
        <div className="container mx-auto flex gap-3">
          {business.phone && (
            <button 
              onClick={() => {
                window.location.href = `tel:${business.phone}`;
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/25"
              data-testid="button-call"
            >
              <Phone className="w-5 h-5" />
              <span>اتصال</span>
            </button>
          )}
          
          {business.whatsapp && (
            <a 
              href={`https://wa.me/${business.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#25D366]/25"
              data-testid="button-whatsapp"
            >
              <MessageCircle className="w-5 h-5" />
              <span>واتساب</span>
            </a>
          )}

          {hasLocation && (
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white p-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/25"
              data-testid="button-directions"
            >
              <Navigation className="w-5 h-5" />
            </a>
          )}

          <button 
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: business.name,
                    text: business.description || "",
                    url: window.location.href,
                  });
                } catch {
                  // User cancelled or share failed
                }
              } else {
                // Fallback: copy link to clipboard
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "تم النسخ",
                    description: "تم نسخ رابط المحل",
                  });
                } catch {
                  toast({
                    title: "خطأ",
                    description: "لم يتم نسخ الرابط",
                    variant: "destructive",
                  });
                }
              }
            }}
            className="bg-muted hover:bg-muted/80 text-foreground p-3.5 rounded-xl transition-colors"
            data-testid="button-share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={closeLightbox}
            data-testid="button-close-lightbox"
          >
            <X className="w-8 h-8" />
          </button>
          
          {allImages.length > 1 && (
            <>
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                data-testid="button-next-image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                data-testid="button-prev-image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </>
          )}
          
          <div className="max-w-4xl max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img 
              src={allImages[currentImageIndex]} 
              alt={`صورة ${currentImageIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <p className="text-center text-white/70 mt-2">{currentImageIndex + 1} / {allImages.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
