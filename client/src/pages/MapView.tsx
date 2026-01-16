import { useState } from "react";
import { Link } from "wouter";
import { useBusinessesWithLocation } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { RatingStars } from "@/components/RatingStars";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Phone, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { BusinessResponse } from "@shared/schema";
import { usePreview } from "@/lib/preview-context";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView() {
  const { data: businesses, isLoading } = useBusinessesWithLocation();
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(null);
  const { prefixLink } = usePreview();

  const defaultCenter: [number, number] = [31.9539, 35.9106];
  const center = businesses && businesses.length > 0
    ? [businesses[0].latitude!, businesses[0].longitude!] as [number, number]
    : defaultCenter;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header title="الخريطة" />
      
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {businesses?.map((business) => (
            <Marker
              key={business.id}
              position={[business.latitude!, business.longitude!]}
              icon={customIcon}
              eventHandlers={{
                click: () => setSelectedBusiness(business),
              }}
            >
              <Popup>
                <div className="text-center p-1">
                  <strong>{business.name}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{business.category?.name}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {selectedBusiness && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl shadow-2xl border border-border p-4 z-[1000]"
          >
            <button
              onClick={() => setSelectedBusiness(null)}
              className="absolute top-2 left-2 p-1 rounded-full bg-muted hover:bg-muted/80"
              data-testid="button-close-popup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                <img 
                  src={selectedBusiness.imageUrl || `https://placehold.co/200x200/1a1a2e/d4a655?text=${encodeURIComponent(selectedBusiness.name.charAt(0))}`}
                  alt={selectedBusiness.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-primary font-medium">{selectedBusiness.category?.name}</span>
                <h3 className="font-bold text-lg line-clamp-1">{selectedBusiness.name}</h3>
                <RatingStars 
                  rating={selectedBusiness.averageRating || 0} 
                  size="sm"
                  reviewCount={selectedBusiness.reviewCount}
                />
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{selectedBusiness.address}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Link 
                href={prefixLink(`/businesses/${selectedBusiness.id}`)}
                className="flex-1 bg-primary text-primary-foreground font-medium py-2 px-4 rounded-xl text-center flex items-center justify-center gap-1"
                data-testid="link-view-details"
              >
                التفاصيل
                <ArrowLeft className="w-4 h-4" />
              </Link>
              {selectedBusiness.phone && (
                <a 
                  href={`tel:${selectedBusiness.phone}`}
                  className="bg-muted text-foreground p-2 rounded-xl"
                  data-testid="button-call-map"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
