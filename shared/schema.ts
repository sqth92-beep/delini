import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

// Admin authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// App settings for customization
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visitor counter
export const visitorCounter = pgTable("visitor_counter", {
  id: serial("id").primaryKey(),
  count: integer("count").default(0).notNull(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  imageUrl: text("image_url"),
  keywords: text("keywords").array(),
  keywordsEn: text("keywords_en").array(),
  sortOrder: integer("sort_order").default(0),
});

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  cityId: integer("city_id").references(() => cities.id),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description"),
  descriptionEn: text("description_en"),
  address: text("address"),
  addressEn: text("address_en"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  imageUrl: text("image_url"),
  storefrontImageUrl: text("storefront_image_url"),
  galleryImages: text("gallery_images").array(),
  isVerified: boolean("is_verified").default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  workingHoursJson: text("working_hours_json"),
  website: text("website"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  services: text("services").array(),
  servicesEn: text("services_en").array(),
  sortOrder: integer("sort_order").default(0),
  joinDate: timestamp("join_date").defaultNow(),
  subscriptionActivatedAt: timestamp("subscription_activated_at"),
  subscriptionTier: text("subscription_tier").default("trial"),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  visitorName: text("visitor_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  entityName: text("entity_name"),
  details: text("details"),
  adminUsername: text("admin_username"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const offerRatings = pgTable("offer_ratings", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => offers.id).notNull(),
  visitorName: text("visitor_name").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const citiesRelations = relations(cities, ({ many }) => ({
  businesses: many(businesses),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  category: one(categories, {
    fields: [businesses.categoryId],
    references: [categories.id],
  }),
  city: one(cities, {
    fields: [businesses.cityId],
    references: [cities.id],
  }),
  reviews: many(reviews),
  offers: many(offers),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  business: one(businesses, {
    fields: [offers.businessId],
    references: [businesses.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertCitySchema = createInsertSchema(cities).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, sortOrder: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, sortOrder: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true }).extend({
  rating: z.number().int().min(1).max(5),
  visitorName: z.string().min(1).max(100),
  comment: z.string().max(1000).optional(),
});
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, lastLoginAt: true });
export const insertAppSettingSchema = createInsertSchema(appSettings).omit({ id: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertOfferRatingSchema = createInsertSchema(offerRatings).omit({ id: true, createdAt: true }).extend({
  rating: z.number().int().min(1).max(5),
  visitorName: z.string().min(1).max(100),
});

// Admin login schema
export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

// === EXPLICIT API CONTRACT TYPES ===
export type City = typeof cities.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type OfferRating = typeof offerRatings.$inferSelect;

export type InsertCity = z.infer<typeof insertCitySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertOfferRating = z.infer<typeof insertOfferRatingSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;

export type CreateBusinessRequest = InsertBusiness;
export type UpdateBusinessRequest = Partial<InsertBusiness>;
export type CreateReviewRequest = InsertReview;
export type CreateOfferRequest = InsertOffer;

// Response types
export type CityResponse = City;
export type CategoryResponse = Category;
export type BusinessResponse = Business & { 
  category?: Category;
  city?: City;
  averageRating?: number;
  reviewCount?: number;
};
export type ReviewResponse = Review;
export type OfferResponse = Offer & { business?: Business };

// Query types
export interface BusinessQueryParams {
  categoryId?: number;
  search?: string;
  minRating?: number;
  hasOffers?: boolean;
}

// Working hours type
export interface DayHours {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface WorkingHours {
  sunday?: DayHours;
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
}

export function parseWorkingHours(json: string | null | undefined): WorkingHours | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as WorkingHours;
  } catch {
    return null;
  }
}

export function isBusinessOpen(workingHours: WorkingHours | null): boolean {
  if (!workingHours) return true;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDay = days[now.getDay()];
  const dayHours = workingHours[currentDay];
  
  if (!dayHours || !dayHours.isOpen) return false;
  if (!dayHours.openTime || !dayHours.closeTime) return dayHours.isOpen;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = dayHours.openTime.split(':').map(Number);
  const [closeH, closeM] = dayHours.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  
  if (closeMinutes < openMinutes) {
    return currentTime >= openMinutes || currentTime <= closeMinutes;
  }
  
  return currentTime >= openMinutes && currentTime <= closeMinutes;
}

export type SubscriptionTier = 'trial' | 'regular' | 'vip';
export type SubscriptionStatus = 'trial' | 'trial_expired' | 'active' | 'expired';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  daysRemaining: number;
  isVip: boolean;
  canAddOffers: boolean;
}

export function getSubscriptionInfo(
  joinDate: Date | string | null,
  subscriptionActivatedAt: Date | string | null,
  subscriptionTier: string | null
): SubscriptionInfo {
  const now = new Date();
  const tier = (subscriptionTier || 'trial') as SubscriptionTier;
  const join = joinDate ? new Date(joinDate) : now;
  
  const TRIAL_DAYS = 60;
  const SUBSCRIPTION_DAYS = 30;
  
  const daysSinceJoin = Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, TRIAL_DAYS - daysSinceJoin);
  
  if (tier === 'trial') {
    if (trialDaysRemaining > 0) {
      return {
        status: 'trial',
        tier: 'trial',
        daysRemaining: trialDaysRemaining,
        isVip: false,
        canAddOffers: false,
      };
    } else {
      return {
        status: 'trial_expired',
        tier: 'trial',
        daysRemaining: 0,
        isVip: false,
        canAddOffers: false,
      };
    }
  }
  
  if (subscriptionActivatedAt) {
    const activated = new Date(subscriptionActivatedAt);
    const daysSinceActivation = Math.floor((now.getTime() - activated.getTime()) / (1000 * 60 * 60 * 24));
    const subscriptionDaysRemaining = Math.max(0, SUBSCRIPTION_DAYS - daysSinceActivation);
    
    if (subscriptionDaysRemaining > 0) {
      return {
        status: 'active',
        tier,
        daysRemaining: subscriptionDaysRemaining,
        isVip: tier === 'vip',
        canAddOffers: tier === 'vip',
      };
    } else {
      return {
        status: 'expired',
        tier,
        daysRemaining: 0,
        isVip: false,
        canAddOffers: false,
      };
    }
  }
  
  return {
    status: 'expired',
    tier,
    daysRemaining: 0,
    isVip: false,
    canAddOffers: false,
  };
}
