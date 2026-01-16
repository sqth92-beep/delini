import { db } from "./db";
import {
  cities,
  type City,
  type InsertCity,
  categories,
  type Category,
  type InsertCategory,
  businesses,
  type Business,
  type InsertBusiness,
  type BusinessResponse,
  reviews,
  type Review,
  type InsertReview,
  offers,
  type Offer,
  type InsertOffer,
  type OfferResponse,
  adminUsers,
  type AdminUser,
  appSettings,
  type AppSetting,
  activityLogs,
  type ActivityLog,
  type InsertActivityLog,
  offerRatings,
  type OfferRating,
  type InsertOfferRating,
  getSubscriptionInfo,
} from "@shared/schema";
import { eq, ilike, and, sql, desc, gte, asc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Cities
  getCities(): Promise<City[]>;
  getCity(id: number): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;
  deleteCity(id: number): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  updateCategoryOrder(ids: number[]): Promise<void>;

  // Businesses
  getBusinesses(categoryId?: number, search?: string, minRating?: number, cityId?: number, includeExpired?: boolean): Promise<BusinessResponse[]>;
  getBusiness(id: number, includeExpired?: boolean): Promise<BusinessResponse | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, data: Partial<InsertBusiness>): Promise<Business | undefined>;
  deleteBusiness(id: number): Promise<boolean>;
  getBusinessesWithLocation(includeExpired?: boolean): Promise<BusinessResponse[]>;

  // Reviews
  getReviews(businessId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAverageRating(businessId: number): Promise<{ avg: number; count: number }>;
  deleteReview(id: number): Promise<boolean>;
  getAllReviewsWithBusiness(): Promise<Array<Review & { businessName: string; categoryId: number; categoryName: string }>>;

  // Offers
  getOffers(businessId?: number): Promise<OfferResponse[]>;
  getActiveOffers(): Promise<OfferResponse[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, data: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: number): Promise<boolean>;

  // Admin
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(username: string, password: string): Promise<AdminUser>;
  validateAdminPassword(username: string, password: string): Promise<AdminUser | null>;
  updateAdminLastLogin(id: number): Promise<void>;

  // App Settings
  getAppSettings(): Promise<Record<string, string>>;
  getAppSetting(key: string): Promise<string | undefined>;
  setAppSetting(key: string, value: string): Promise<void>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;

  // Offer Ratings
  createOfferRating(rating: InsertOfferRating): Promise<OfferRating>;
  getOfferRatings(offerId: number): Promise<OfferRating[]>;
  getOfferAverageRating(offerId: number): Promise<{ avg: number; count: number }>;
}

export class DatabaseStorage implements IStorage {
  // Helper function to check if a business has an active subscription
  private isSubscriptionActive(business: Business): boolean {
    const subInfo = getSubscriptionInfo(
      business.joinDate,
      business.subscriptionActivatedAt,
      business.subscriptionTier
    );
    // Active if: trial not expired, or paid subscription not expired
    return subInfo.status === 'trial' || subInfo.status === 'active';
  }

  private normalizeArabic(text: string): string {
    return text
      .replace(/[أإآا]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[ؤ]/g, "و")
      .replace(/[ئ]/g, "ي")
      .replace(/[\u064B-\u065F]/g, "");
  }

  private fuzzyMatch(search: string, target: string): boolean {
    if (search.length < 2) return false;
    let searchIdx = 0;
    for (let i = 0; i < target.length && searchIdx < search.length; i++) {
      if (target[i] === search[searchIdx]) {
        searchIdx++;
      }
    }
    return searchIdx >= search.length * 0.7;
  }

  // Cities
  async getCities(): Promise<City[]> {
    return await db.select().from(cities);
  }

  async getCity(id: number): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.id, id));
    return city;
  }

  async createCity(city: InsertCity): Promise<City> {
    const [newCity] = await db.insert(cities).values(city).returning();
    return newCity;
  }

  async deleteCity(id: number): Promise<boolean> {
    const result = await db.delete(cities).where(eq(cities.id, id)).returning();
    return result.length > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async updateCategoryOrder(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await db.update(categories).set({ sortOrder: i }).where(eq(categories.id, ids[i]));
    }
  }

  // Businesses
  async getBusinesses(categoryId?: number, search?: string, minRating?: number, cityId?: number, includeExpired: boolean = false): Promise<BusinessResponse[]> {
    const results = await db
      .select({
        business: businesses,
        category: categories,
        city: cities,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .leftJoin(cities, eq(businesses.cityId, cities.id));

    const businessesWithRatings = await Promise.all(
      results.map(async (row) => {
        const rating = await this.getAverageRating(row.business.id);
        return {
          ...row.business,
          category: row.category || undefined,
          city: row.city || undefined,
          averageRating: rating.avg,
          reviewCount: rating.count,
        };
      })
    );

    let filtered = businessesWithRatings;

    // Filter out expired subscriptions for public view
    if (!includeExpired) {
      filtered = filtered.filter((b) => this.isSubscriptionActive(b));
    }

    if (categoryId) {
      filtered = filtered.filter((b) => b.categoryId === categoryId);
    }
    if (cityId) {
      filtered = filtered.filter((b) => b.cityId === cityId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      const normalizedSearch = this.normalizeArabic(searchLower);
      filtered = filtered.filter((b) => {
        const normalizedName = this.normalizeArabic(b.name.toLowerCase());
        const normalizedDesc = this.normalizeArabic(b.description?.toLowerCase() || "");
        const normalizedAddress = this.normalizeArabic(b.address?.toLowerCase() || "");
        const normalizedCategory = this.normalizeArabic(b.category?.name?.toLowerCase() || "");
        const normalizedServices = b.services?.map(s => this.normalizeArabic(s.toLowerCase())).join(" ") || "";
        const categoryKeywords = b.category?.keywords?.map(k => this.normalizeArabic(k.toLowerCase())).join(" ") || "";
        const categoryKeywordsEn = b.category?.keywordsEn?.map(k => k.toLowerCase()).join(" ") || "";
        
        return (
          normalizedName.includes(normalizedSearch) ||
          normalizedDesc.includes(normalizedSearch) ||
          normalizedAddress.includes(normalizedSearch) ||
          normalizedCategory.includes(normalizedSearch) ||
          normalizedServices.includes(normalizedSearch) ||
          categoryKeywords.includes(normalizedSearch) ||
          categoryKeywordsEn.includes(searchLower) ||
          this.fuzzyMatch(normalizedSearch, normalizedName)
        );
      });
    }
    if (minRating) {
      filtered = filtered.filter((b) => b.averageRating >= minRating);
    }

    return filtered;
  }

  async getBusiness(id: number, includeExpired: boolean = false): Promise<BusinessResponse | undefined> {
    const [result] = await db
      .select({
        business: businesses,
        category: categories,
        city: cities,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .leftJoin(cities, eq(businesses.cityId, cities.id))
      .where(eq(businesses.id, id));

    if (!result) return undefined;

    // Check if subscription is expired for public view
    if (!includeExpired && !this.isSubscriptionActive(result.business)) {
      return undefined;
    }

    const rating = await this.getAverageRating(id);

    return {
      ...result.business,
      category: result.category || undefined,
      city: result.city || undefined,
      averageRating: rating.avg,
      reviewCount: rating.count,
    };
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await db.insert(businesses).values(business).returning();
    return newBusiness;
  }

  async updateBusiness(id: number, data: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [updated] = await db.update(businesses).set(data).where(eq(businesses.id, id)).returning();
    return updated;
  }

  async deleteBusiness(id: number): Promise<boolean> {
    await db.delete(reviews).where(eq(reviews.businessId, id));
    await db.delete(offers).where(eq(offers.businessId, id));
    const result = await db.delete(businesses).where(eq(businesses.id, id)).returning();
    return result.length > 0;
  }

  async getBusinessesWithLocation(includeExpired: boolean = false): Promise<BusinessResponse[]> {
    const results = await db
      .select({
        business: businesses,
        category: categories,
        city: cities,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .leftJoin(cities, eq(businesses.cityId, cities.id));

    const businessesWithRatings = await Promise.all(
      results
        .filter((row) => row.business.latitude && row.business.longitude)
        .filter((row) => includeExpired || this.isSubscriptionActive(row.business))
        .map(async (row) => {
          const rating = await this.getAverageRating(row.business.id);
          return {
            ...row.business,
            category: row.category || undefined,
            city: row.city || undefined,
            averageRating: rating.avg,
            reviewCount: rating.count,
          };
        })
    );

    return businessesWithRatings;
  }

  // Reviews
  async getReviews(businessId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.businessId, businessId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getAverageRating(businessId: number): Promise<{ avg: number; count: number }> {
    const result = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        count: sql<number>`COUNT(${reviews.id})`,
      })
      .from(reviews)
      .where(eq(reviews.businessId, businessId));

    return {
      avg: Number(result[0]?.avg) || 0,
      count: Number(result[0]?.count) || 0,
    };
  }

  // Offers
  async getOffers(businessId?: number): Promise<OfferResponse[]> {
    const results = await db
      .select({
        offer: offers,
        business: businesses,
      })
      .from(offers)
      .leftJoin(businesses, eq(offers.businessId, businesses.id))
      .orderBy(desc(offers.createdAt));

    let filtered = results;
    if (businessId) {
      filtered = results.filter((r) => r.offer.businessId === businessId);
    }

    return filtered.map((row) => ({
      ...row.offer,
      business: row.business || undefined,
    }));
  }

  async getActiveOffers(): Promise<OfferResponse[]> {
    const now = new Date();
    const results = await db
      .select({
        offer: offers,
        business: businesses,
      })
      .from(offers)
      .leftJoin(businesses, eq(offers.businessId, businesses.id))
      .where(eq(offers.isActive, true))
      .orderBy(desc(offers.createdAt));

    return results
      .filter((row) => !row.offer.validUntil || new Date(row.offer.validUntil) > now)
      .map((row) => ({
        ...row.offer,
        business: row.business || undefined,
      }));
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
  }

  async updateOffer(id: number, data: Partial<InsertOffer>): Promise<Offer | undefined> {
    const [updated] = await db.update(offers).set(data).where(eq(offers.id, id)).returning();
    return updated;
  }

  async deleteOffer(id: number): Promise<boolean> {
    const result = await db.delete(offers).where(eq(offers.id, id)).returning();
    return result.length > 0;
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    return result.length > 0;
  }

  async getAllReviewsWithBusiness(): Promise<Array<Review & { businessName: string; categoryId: number; categoryName: string }>> {
    const result = await db
      .select({
        id: reviews.id,
        businessId: reviews.businessId,
        visitorName: reviews.visitorName,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        businessName: businesses.name,
        categoryId: businesses.categoryId,
        categoryName: categories.name,
      })
      .from(reviews)
      .leftJoin(businesses, eq(reviews.businessId, businesses.id))
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .orderBy(desc(reviews.createdAt));
    
    return result.map(r => ({
      id: r.id,
      businessId: r.businessId,
      visitorName: r.visitorName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      businessName: r.businessName || 'غير معروف',
      categoryId: r.categoryId || 0,
      categoryName: r.categoryName || 'غير معروف',
    }));
  }

  // Admin methods
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async createAdmin(username: string, password: string): Promise<AdminUser> {
    const passwordHash = await bcrypt.hash(password, 10);
    const [admin] = await db.insert(adminUsers).values({ username, passwordHash }).returning();
    return admin;
  }

  async validateAdminPassword(username: string, password: string): Promise<AdminUser | null> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return null;
    const valid = await bcrypt.compare(password, admin.passwordHash);
    return valid ? admin : null;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
  }

  // App Settings
  async getAppSettings(): Promise<Record<string, string>> {
    const settings = await db.select().from(appSettings);
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  async getAppSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value;
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    const existing = await this.getAppSetting(key);
    if (existing !== undefined) {
      await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }

  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }

  // Offer Ratings
  async createOfferRating(rating: InsertOfferRating): Promise<OfferRating> {
    const [result] = await db.insert(offerRatings).values(rating).returning();
    return result;
  }

  async getOfferRatings(offerId: number): Promise<OfferRating[]> {
    return await db.select().from(offerRatings).where(eq(offerRatings.offerId, offerId)).orderBy(desc(offerRatings.createdAt));
  }

  async getOfferAverageRating(offerId: number): Promise<{ avg: number; count: number }> {
    const result = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${offerRatings.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(offerRatings)
      .where(eq(offerRatings.offerId, offerId));
    return { avg: Number(result[0]?.avg) || 0, count: Number(result[0]?.count) || 0 };
  }
}

export const storage = new DatabaseStorage();
