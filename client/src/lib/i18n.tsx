import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "ar" | "en";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    "app.name": "دلّيني",
    "app.tagline": "دليلك الشامل للخدمات المحلية",
    "nav.home": "الرئيسية",
    "nav.categories": "الأقسام",
    "nav.map": "الخريطة",
    "nav.offers": "العروض",
    "nav.search": "بحث",
    "nav.favorites": "المفضلة",
    "home.hero.title": "ابحث عن أفضل الخدمات بالقرب منك",
    "home.hero.subtitle": "دليلك الشامل للمطاعم، المحلات، والخدمات المحلية في مدينتك",
    "home.categories": "الأقسام",
    "home.featured": "مميز لدينا",
    "home.offers": "عروض حصرية",
    "home.viewAll": "عرض الكل",
    "search.placeholder": "ابحث عن مطعم، مقهى، خدمة...",
    "search.button": "بحث",
    "search.results": "نتائج البحث",
    "search.noResults": "لا توجد نتائج",
    "search.minRating": "الحد الأدنى للتقييم",
    "business.about": "عن",
    "business.services": "الخدمات",
    "business.location": "الموقع على الخريطة",
    "business.reviews": "التقييمات والآراء",
    "business.notFound": "المحل غير موجود",
    "business.backHome": "العودة للرئيسية",
    "business.noAddress": "العنوان غير متوفر",
    "business.noDescription": "لا يوجد وصف متوفر لهذا المحل حالياً.",
    "business.website": "الموقع",
    "business.call": "اتصال",
    "business.whatsapp": "واتساب",
    "business.directions": "اتجاهات",
    "business.currentOffers": "العروض الحالية",
    "review.addReview": "أضف تقييمك",
    "review.yourName": "اسمك",
    "review.yourComment": "تعليقك (اختياري)",
    "review.submit": "إرسال التقييم",
    "review.sending": "جاري الإرسال...",
    "review.noReviews": "لا توجد تقييمات بعد. كن أول من يقيّم!",
    "review.success": "تم إضافة تقييمك بنجاح",
    "review.error": "حدث خطأ أثناء إضافة التقييم",
    "offers.title": "العروض والخصومات",
    "offers.noOffers": "لا توجد عروض حالياً",
    "offers.expiringSoon": "ينتهي قريباً",
    "map.title": "الخريطة",
    "map.noBusinesses": "لا توجد محلات على الخريطة",
    "categories.title": "جميع الأقسام",
    "city.selectCity": "اختر المدينة",
    "city.allCities": "جميع المدن",
    "language.switch": "English",
    "favorites.title": "المفضلة",
    "favorites.empty": "لا توجد محلات مفضلة",
    "favorites.emptyDescription": "اضغط على أيقونة القلب في أي محل لإضافته إلى المفضلة",
    "favorites.browseCategories": "تصفح الأقسام",
    "favorites.count": "محل مفضل",
    "compare.title": "مقارنة المحلات",
    "compare.select": "اختر محلاً للمقارنة",
    "compare.empty": "اختر محلين للمقارنة",
    "compare.add": "أضف للمقارنة",
    "compare.remove": "إزالة من المقارنة",
    "compare.clear": "مسح المقارنة",
    "admin.activityLog": "سجل العمليات",
    "admin.export": "تصدير البيانات",
    "admin.revenue": "الإيرادات",
    "admin.monthlyReport": "التقرير الشهري",
    "admin.notifications": "التنبيهات",
    "admin.expiringSubscriptions": "اشتراكات تنتهي قريباً",
  },
  en: {
    "app.name": "Delini",
    "app.tagline": "Your Complete Local Services Guide",
    "nav.home": "Home",
    "nav.categories": "Categories",
    "nav.map": "Map",
    "nav.offers": "Offers",
    "nav.search": "Search",
    "nav.favorites": "Favorites",
    "home.hero.title": "Find the Best Services Near You",
    "home.hero.subtitle": "Your complete guide to restaurants, shops, and local services in your city",
    "home.categories": "Categories",
    "home.featured": "Featured",
    "home.offers": "Exclusive Offers",
    "home.viewAll": "View All",
    "search.placeholder": "Search for restaurant, cafe, service...",
    "search.button": "Search",
    "search.results": "Search Results",
    "search.noResults": "No results found",
    "search.minRating": "Minimum Rating",
    "business.about": "About",
    "business.services": "Services",
    "business.location": "Location on Map",
    "business.reviews": "Reviews & Ratings",
    "business.notFound": "Business not found",
    "business.backHome": "Back to Home",
    "business.noAddress": "Address not available",
    "business.noDescription": "No description available for this business.",
    "business.website": "Website",
    "business.call": "Call",
    "business.whatsapp": "WhatsApp",
    "business.directions": "Directions",
    "business.currentOffers": "Current Offers",
    "review.addReview": "Add Your Review",
    "review.yourName": "Your Name",
    "review.yourComment": "Your Comment (optional)",
    "review.submit": "Submit Review",
    "review.sending": "Sending...",
    "review.noReviews": "No reviews yet. Be the first to review!",
    "review.success": "Your review has been added successfully",
    "review.error": "An error occurred while adding your review",
    "offers.title": "Offers & Discounts",
    "offers.noOffers": "No offers available",
    "offers.expiringSoon": "Expiring Soon",
    "map.title": "Map",
    "map.noBusinesses": "No businesses on the map",
    "categories.title": "All Categories",
    "city.selectCity": "Select City",
    "city.allCities": "All Cities",
    "language.switch": "العربية",
    "favorites.title": "Favorites",
    "favorites.empty": "No favorites yet",
    "favorites.emptyDescription": "Tap the heart icon on any business to add it to your favorites",
    "favorites.browseCategories": "Browse Categories",
    "favorites.count": "favorite businesses",
    "compare.title": "Compare Businesses",
    "compare.select": "Select a business to compare",
    "compare.empty": "Select two businesses to compare",
    "compare.add": "Add to Compare",
    "compare.remove": "Remove from Compare",
    "compare.clear": "Clear Comparison",
    "admin.activityLog": "Activity Log",
    "admin.export": "Export Data",
    "admin.revenue": "Revenue",
    "admin.monthlyReport": "Monthly Report",
    "admin.notifications": "Notifications",
    "admin.expiringSubscriptions": "Expiring Subscriptions",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language");
      return (saved as Language) || "ar";
    }
    return "ar";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.body.dir = dir;
    document.body.style.direction = dir;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === "ar";

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
