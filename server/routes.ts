import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { api, errorSchemas } from "@shared/routes";
import { insertReviewSchema, adminLoginSchema, insertCategorySchema, insertBusinessSchema, insertOfferSchema, adminUsers, visitorCounter } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Admin session middleware
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    adminUsername?: string;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === Visitor Counter ===
  app.post("/api/visitors/increment", async (req, res) => {
    try {
      // Get current count or create if not exists
      let counter = await db.select().from(visitorCounter).limit(1);
      if (counter.length === 0) {
        await db.insert(visitorCounter).values({ count: 1 });
        res.json({ count: 1 });
      } else {
        const newCount = counter[0].count + 1;
        await db.update(visitorCounter).set({ count: newCount }).where(eq(visitorCounter.id, counter[0].id));
        res.json({ count: newCount });
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating visitor count" });
    }
  });

  app.get("/api/visitors/count", async (req, res) => {
    try {
      const counter = await db.select().from(visitorCounter).limit(1);
      const count = counter.length > 0 ? counter[0].count : 0;
      res.json({ count });
    } catch (error) {
      res.json({ count: 0 });
    }
  });

  // === Cities ===
  app.get("/api/cities", async (req, res) => {
    const cities = await storage.getCities();
    res.json(cities);
  });

  // === Categories ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.categories.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const category = await storage.getCategory(id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    
    res.json(category);
  });

  // === Businesses ===
  app.get("/api/businesses/map", async (req, res) => {
    const businesses = await storage.getBusinessesWithLocation();
    res.json(businesses);
  });

  app.get(api.businesses.list.path, async (req, res) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const search = req.query.search as string | undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : undefined;
    const userLat = req.query.userLat !== undefined ? parseFloat(req.query.userLat as string) : undefined;
    const userLng = req.query.userLng !== undefined ? parseFloat(req.query.userLng as string) : undefined;
    const sortByDistance = req.query.sortByDistance === 'true';

    const businesses = await storage.getBusinesses(categoryId, search, minRating, cityId);

    if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
      const businessesWithDistance = businesses.map(b => {
        if (b.latitude !== null && b.latitude !== undefined && b.longitude !== null && b.longitude !== undefined) {
          const distance = calculateDistance(userLat, userLng, b.latitude, b.longitude);
          return { ...b, distance };
        }
        return { ...b, distance: undefined as number | undefined };
      });

      if (sortByDistance) {
        businessesWithDistance.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }

      res.json(businessesWithDistance);
    } else {
      res.json(businesses);
    }
  });

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  app.get(api.businesses.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const business = await storage.getBusiness(id);
    if (!business) return res.status(404).json({ message: "Business not found" });
    
    res.json(business);
  });

  // === Reviews ===
  app.get("/api/businesses/:businessId/reviews", async (req, res) => {
    const businessId = parseInt(req.params.businessId);
    if (isNaN(businessId)) return res.status(400).json({ message: "Invalid business ID" });

    const reviews = await storage.getReviews(businessId);
    res.json(reviews);
  });

  app.post("/api/businesses/:businessId/reviews", async (req, res) => {
    const businessId = parseInt(req.params.businessId);
    if (isNaN(businessId)) return res.status(400).json({ message: "Invalid business ID" });

    try {
      const data = insertReviewSchema.parse({ ...req.body, businessId });
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      throw error;
    }
  });

  // === Offers ===
  app.get(api.offers.list.path, async (req, res) => {
    const offers = await storage.getOffers();
    res.json(offers);
  });

  app.get(api.offers.active.path, async (req, res) => {
    const offers = await storage.getActiveOffers();
    res.json(offers);
  });

  app.get("/api/businesses/:businessId/offers", async (req, res) => {
    const businessId = parseInt(req.params.businessId);
    if (isNaN(businessId)) return res.status(400).json({ message: "Invalid business ID" });

    const offers = await storage.getOffers(businessId);
    res.json(offers);
  });

  // === App Settings (public) ===
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getAppSettings();
    res.json(settings);
  });

  // === ADMIN ROUTES ===

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Admin Login with rate limiting
  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Check if IP is locked out
      const attempts = loginAttempts.get(clientIP);
      if (attempts?.lockedUntil && attempts.lockedUntil > now) {
        const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
        return res.status(429).json({ 
          message: `تم قفل تسجيل الدخول. حاول مرة أخرى بعد ${remainingMinutes} دقيقة`,
          lockedUntil: attempts.lockedUntil
        });
      }
      
      const { username, password } = adminLoginSchema.parse(req.body);
      const admin = await storage.validateAdminPassword(username, password);
      
      if (!admin) {
        // Increment failed attempts
        const currentAttempts = loginAttempts.get(clientIP) || { count: 0, lockedUntil: null };
        currentAttempts.count += 1;
        
        if (currentAttempts.count >= MAX_LOGIN_ATTEMPTS) {
          currentAttempts.lockedUntil = now + LOCKOUT_DURATION;
          loginAttempts.set(clientIP, currentAttempts);
          return res.status(429).json({ 
            message: `تم قفل تسجيل الدخول لمدة 5 دقائق بسبب محاولات فاشلة متكررة`,
            lockedUntil: currentAttempts.lockedUntil
          });
        }
        
        loginAttempts.set(clientIP, currentAttempts);
        const remaining = MAX_LOGIN_ATTEMPTS - currentAttempts.count;
        return res.status(401).json({ 
          message: `اسم المستخدم أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${remaining}`
        });
      }

      // Successful login - reset attempts
      loginAttempts.delete(clientIP);
      
      await storage.updateAdminLastLogin(admin.id);
      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      
      res.json({ success: true, username: admin.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      throw error;
    }
  });

  // Admin Logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "فشل تسجيل الخروج" });
      }
      res.json({ success: true });
    });
  });

  // Check admin session
  app.get("/api/admin/me", requireAdmin, (req, res) => {
    res.json({ id: req.session.adminId, username: req.session.adminUsername });
  });

  // Admin Categories CRUD
  app.get("/api/admin/categories", requireAdmin, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      throw error;
    }
  });

  app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const category = await storage.updateCategory(id, req.body);
    if (!category) return res.status(404).json({ message: "القسم غير موجود" });
    
    res.json(category);
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const deleted = await storage.deleteCategory(id);
    if (!deleted) return res.status(404).json({ message: "القسم غير موجود" });
    
    res.json({ success: true });
  });

  app.put("/api/admin/categories/reorder", requireAdmin, async (req, res) => {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids)) return res.status(400).json({ message: "يجب توفير قائمة المعرفات" });

    await storage.updateCategoryOrder(ids);
    res.json({ success: true });
  });

  // Admin Cities CRUD
  app.get("/api/admin/cities", requireAdmin, async (req, res) => {
    const cities = await storage.getCities();
    res.json(cities);
  });

  app.post("/api/admin/cities", requireAdmin, async (req, res) => {
    try {
      const { name, nameEn, slug } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ message: "الاسم والرابط مطلوبان" });
      }
      const city = await storage.createCity({ name, nameEn, slug });
      res.status(201).json(city);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء إضافة المدينة" });
    }
  });

  app.delete("/api/admin/cities/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const deleted = await storage.deleteCity(id);
    if (!deleted) return res.status(404).json({ message: "المدينة غير موجودة" });
    
    res.json({ success: true });
  });

  // Admin Businesses CRUD
  app.get("/api/admin/businesses", requireAdmin, async (req, res) => {
    // Include expired subscriptions for admin view
    const businesses = await storage.getBusinesses(undefined, undefined, undefined, undefined, true);
    res.json(businesses);
  });

  app.post("/api/admin/businesses", requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.joinDate) body.joinDate = new Date(body.joinDate);
      if (body.subscriptionActivatedAt) body.subscriptionActivatedAt = new Date(body.subscriptionActivatedAt);
      if (body.subscriptionTier === 'vip') body.isVerified = true;
      
      const data = insertBusinessSchema.parse(body);
      const business = await storage.createBusiness(data);
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      throw error;
    }
  });

  app.put("/api/admin/businesses/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const body = { ...req.body };
    if (body.joinDate) body.joinDate = new Date(body.joinDate);
    if (body.subscriptionActivatedAt) body.subscriptionActivatedAt = new Date(body.subscriptionActivatedAt);
    if (body.subscriptionTier === 'vip') body.isVerified = true;

    const business = await storage.updateBusiness(id, body);
    if (!business) return res.status(404).json({ message: "المحل غير موجود" });
    
    res.json(business);
  });

  app.delete("/api/admin/businesses/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const deleted = await storage.deleteBusiness(id);
    if (!deleted) return res.status(404).json({ message: "المحل غير موجود" });
    
    res.json({ success: true });
  });

  // Admin Offers
  app.get("/api/admin/offers", requireAdmin, async (req, res) => {
    const offers = await storage.getOffers();
    res.json(offers);
  });

  app.post("/api/admin/offers", requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.validUntil) {
        body.validUntil = new Date(body.validUntil);
      }
      const data = insertOfferSchema.parse(body);
      const offer = await storage.createOffer(data);
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      throw error;
    }
  });

  app.put("/api/admin/offers/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const body = { ...req.body };
    if (body.validUntil) {
      body.validUntil = new Date(body.validUntil);
    }

    const offer = await storage.updateOffer(id, body);
    if (!offer) return res.status(404).json({ message: "العرض غير موجود" });
    
    res.json(offer);
  });

  app.delete("/api/admin/offers/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const deleted = await storage.deleteOffer(id);
    if (!deleted) return res.status(404).json({ message: "العرض غير موجود" });
    
    res.json({ success: true });
  });

  // Admin Reviews
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    const reviews = await storage.getAllReviewsWithBusiness();
    res.json(reviews);
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });

    const deleted = await storage.deleteReview(id);
    if (!deleted) return res.status(404).json({ message: "التقييم غير موجود" });
    
    res.json({ success: true });
  });

  // Admin Settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAppSettings();
    res.json(settings);
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = req.body as Record<string, string>;
    
    for (const [key, value] of Object.entries(settings)) {
      await storage.setAppSetting(key, value);
    }
    
    res.json({ success: true });
  });

  // Activity Logs
  app.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await storage.getActivityLogs(limit);
    res.json(logs);
  });

  app.post("/api/admin/activity-logs", requireAdmin, async (req, res) => {
    const log = await storage.createActivityLog({
      ...req.body,
      adminUsername: req.session?.adminUsername || 'unknown',
    });
    res.status(201).json(log);
  });

  // Export Data
  app.get("/api/admin/export/businesses", requireAdmin, async (req, res) => {
    const businesses = await storage.getBusinesses();
    const csvHeader = "ID,Name,Category,Address,Phone,Verified,Rating,Tier\n";
    const csvRows = businesses.map(b => 
      `${b.id},"${b.name}","${b.category?.name || ''}","${b.address || ''}","${b.phone || ''}",${b.isVerified},${b.averageRating || 0},${b.subscriptionTier || 'trial'}`
    ).join("\n");
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=businesses.csv');
    res.send('\uFEFF' + csvHeader + csvRows);
  });

  app.get("/api/admin/export/subscriptions", requireAdmin, async (req, res) => {
    const businesses = await storage.getBusinesses();
    const csvHeader = "ID,Name,Tier,ActivatedAt,JoinDate\n";
    const csvRows = businesses.map(b => 
      `${b.id},"${b.name}","${b.subscriptionTier || 'trial'}","${b.subscriptionActivatedAt || ''}","${b.joinDate || ''}"`
    ).join("\n");
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
    res.send('\uFEFF' + csvHeader + csvRows);
  });

  app.get("/api/admin/export/reviews", requireAdmin, async (req, res) => {
    const reviews = await storage.getAllReviewsWithBusiness();
    const csvHeader = "ID,Business,Visitor,Rating,Comment,Date\n";
    const csvRows = reviews.map(r => 
      `${r.id},"${r.businessName}","${r.visitorName}",${r.rating},"${(r.comment || '').replace(/"/g, '""')}","${r.createdAt}"`
    ).join("\n");
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=reviews.csv');
    res.send('\uFEFF' + csvHeader + csvRows);
  });

  // Statistics API
  app.get("/api/admin/statistics", requireAdmin, async (req, res) => {
    const businesses = await storage.getBusinesses();
    const reviews = await storage.getAllReviewsWithBusiness();
    const offers = await storage.getOffers();
    const categories = await storage.getCategories();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalBusinesses: businesses.length,
      verifiedBusinesses: businesses.filter(b => b.isVerified).length,
      vipBusinesses: businesses.filter(b => b.subscriptionTier === 'vip').length,
      normalBusinesses: businesses.filter(b => b.subscriptionTier === 'normal').length,
      trialBusinesses: businesses.filter(b => b.subscriptionTier === 'trial').length,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0,
      activeOffers: offers.filter(o => o.isActive).length,
      totalOffers: offers.length,
      totalCategories: categories.length,
      businessesByCategory: categories.map(c => ({
        name: c.name,
        count: businesses.filter(b => b.categoryId === c.id).length,
      })),
      recentReviews: reviews.filter(r => new Date(r.createdAt!) >= thirtyDaysAgo).length,
      monthlyRevenue: businesses.reduce((total, b) => {
        if (b.subscriptionTier === 'vip') return total + 10000;
        if (b.subscriptionTier === 'normal') return total + 5000;
        return total;
      }, 0),
      topRatedBusinesses: [...businesses].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 5).map(b => ({
        id: b.id,
        name: b.name,
        rating: b.averageRating,
        reviewCount: b.reviewCount,
      })),
      mostReviewedBusinesses: [...businesses].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 5).map(b => ({
        id: b.id,
        name: b.name,
        rating: b.averageRating,
        reviewCount: b.reviewCount,
      })),
    };

    res.json(stats);
  });

  // Offer Ratings
  app.post("/api/offers/:id/ratings", async (req, res) => {
    const offerId = parseInt(req.params.id);
    if (isNaN(offerId)) return res.status(400).json({ message: "معرف غير صالح" });

    try {
      const rating = await storage.createOfferRating({
        offerId,
        visitorName: req.body.visitorName,
        rating: req.body.rating,
      });
      res.status(201).json(rating);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إضافة التقييم" });
    }
  });

  app.get("/api/offers/:id/ratings", async (req, res) => {
    const offerId = parseInt(req.params.id);
    if (isNaN(offerId)) return res.status(400).json({ message: "معرف غير صالح" });

    const ratings = await storage.getOfferRatings(offerId);
    const avgData = await storage.getOfferAverageRating(offerId);
    res.json({ ratings, ...avgData });
  });

  // === Seed Data ===
  await seedDatabase();
  await seedAdmin();

  return httpServer;
}

async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  if (existingCategories.length > 0) return;

  console.log("Seeding database...");

  const citiesData = [
    { name: "عمّان", nameEn: "Amman", slug: "amman" },
    { name: "إربد", nameEn: "Irbid", slug: "irbid" },
    { name: "الزرقاء", nameEn: "Zarqa", slug: "zarqa" },
    { name: "العقبة", nameEn: "Aqaba", slug: "aqaba" },
  ];

  const createdCities = [];
  for (const city of citiesData) {
    createdCities.push(await storage.createCity(city));
  }

  const categoriesData = [
    { name: "مطاعم", nameEn: "Restaurants", slug: "restaurants", icon: "Utensils" },
    { name: "سيارات", nameEn: "Cars", slug: "cars", icon: "Car" },
    { name: "موبايلات", nameEn: "Mobiles", slug: "mobiles", icon: "Smartphone" },
    { name: "صيانة", nameEn: "Maintenance", slug: "maintenance", icon: "Wrench" },
    { name: "صحة", nameEn: "Health", slug: "health", icon: "Activity" },
    { name: "ملابس", nameEn: "Clothing", slug: "clothes", icon: "Shirt" },
  ];

  const createdCategories = [];
  for (const cat of categoriesData) {
    createdCategories.push(await storage.createCategory(cat));
  }

  const businessesData = [
    {
      categoryId: createdCategories[0].id,
      cityId: createdCities[0].id,
      name: "شاورما الملك",
      nameEn: "Shawarma King",
      description: "أطيب شاورما في المدينة، خدمة توصيل سريعة. نستخدم أجود أنواع اللحوم الطازجة مع خلطة التوابل السرية.",
      descriptionEn: "The best shawarma in town with fast delivery. We use the finest fresh meats with our secret spice blend.",
      address: "شارع فلسطين، وسط البلد",
      addressEn: "Palestine Street, Downtown",
      phone: "0790000001",
      whatsapp: "962790000001",
      isVerified: true,
      latitude: 31.9539,
      longitude: 35.9106,
      workingHours: "10:00 AM - 12:00 AM",
      instagram: "shawarma_king_jo",
      services: ["شاورما لحم", "شاورما دجاج", "وجبات عائلية", "توصيل مجاني"],
      servicesEn: ["Beef Shawarma", "Chicken Shawarma", "Family Meals", "Free Delivery"],
    },
    {
      categoryId: createdCategories[0].id,
      name: "برجر هاوس",
      description: "برجر مشوي على الفحم مع صلصات خاصة. تجربة طعم لا تُنسى مع أفضل المكونات الطازجة.",
      address: "دوار السابع",
      phone: "0790000002",
      whatsapp: "962790000002",
      isVerified: false,
      latitude: 31.9579,
      longitude: 35.8947,
      workingHours: "12:00 م - 11:00 م",
      instagram: "burger_house_amman",
      facebook: "burgerhouseamman",
      services: ["برجر كلاسيك", "برجر دبل", "وجبات أطفال", "سلطات"],
    },
    {
      categoryId: createdCategories[0].id,
      name: "مطعم الديار",
      description: "مأكولات عربية أصيلة من المنسف إلى المقلوبة. جو عائلي ممتاز.",
      address: "جبل عمان، الدوار الأول",
      phone: "0790000010",
      whatsapp: "962790000010",
      isVerified: true,
      latitude: 31.9505,
      longitude: 35.9247,
      workingHours: "11:00 ص - 11:00 م",
      services: ["منسف", "مقلوبة", "مشاوي", "حلويات عربية"],
    },
    {
      categoryId: createdCategories[1].id,
      name: "مركز الأمير للسيارات",
      description: "بيع وشراء السيارات المستعملة والجديدة. فحص شامل مجاني لكل سيارة.",
      address: "المنطقة الحرة",
      phone: "0790000003",
      whatsapp: "962790000003",
      isVerified: true,
      latitude: 31.9730,
      longitude: 35.8521,
      workingHours: "9:00 ص - 6:00 م",
      website: "https://ameer-cars.jo",
      services: ["بيع سيارات", "شراء سيارات", "فحص مجاني", "تمويل"],
    },
    {
      categoryId: createdCategories[1].id,
      name: "ورشة النجم الذهبي",
      description: "صيانة جميع أنواع السيارات الأوروبية والآسيوية. خبرة 20 عام.",
      address: "ماركا الشمالية",
      phone: "0790000011",
      whatsapp: "962790000011",
      isVerified: true,
      latitude: 31.9850,
      longitude: 35.9456,
      workingHours: "8:00 ص - 5:00 م",
      services: ["تغيير زيت", "فحص كمبيوتر", "صيانة محركات", "كهرباء سيارات"],
    },
    {
      categoryId: createdCategories[2].id,
      name: "تك فيكس",
      description: "صيانة جميع أنواع الهواتف الذكية وبيع الاكسسوارات الأصلية.",
      address: "شارع الجامعة",
      phone: "0790000004",
      whatsapp: "962790000004",
      isVerified: true,
      latitude: 31.9563,
      longitude: 35.8611,
      workingHours: "10:00 ص - 9:00 م",
      instagram: "techfix_jo",
      services: ["تصليح شاشات", "تغيير بطاريات", "فتح قفل", "بيع اكسسوارات"],
    },
    {
      categoryId: createdCategories[2].id,
      name: "موبايل ستور",
      description: "أحدث الهواتف الذكية بأفضل الأسعار مع ضمان رسمي.",
      address: "سيتي مول",
      phone: "0790000012",
      whatsapp: "962790000012",
      isVerified: true,
      latitude: 31.9412,
      longitude: 35.8734,
      workingHours: "10:00 ص - 10:00 م",
      website: "https://mobilestore.jo",
      services: ["هواتف جديدة", "هواتف مستعملة", "تقسيط", "ملحقات"],
    },
    {
      categoryId: createdCategories[3].id,
      name: "المهندس للصيانة المنزلية",
      description: "سباكة، كهرباء، وتكييف. خدمة طوارئ 24 ساعة.",
      address: "جبل عمان",
      phone: "0790000005",
      whatsapp: "962790000005",
      isVerified: false,
      latitude: 31.9510,
      longitude: 35.9234,
      workingHours: "24 ساعة",
      services: ["سباكة", "كهرباء", "تكييف", "دهان"],
    },
    {
      categoryId: createdCategories[4].id,
      name: "عيادة الشفاء",
      description: "عيادة طب عام وأسنان. كادر طبي متخصص وأحدث الأجهزة.",
      address: "شارع المدينة المنورة",
      phone: "0790000013",
      whatsapp: "962790000013",
      isVerified: true,
      latitude: 31.9634,
      longitude: 35.8856,
      workingHours: "9:00 ص - 8:00 م",
      services: ["طب عام", "طب أسنان", "تحاليل", "أشعة"],
    },
    {
      categoryId: createdCategories[5].id,
      name: "بوتيك الأناقة",
      description: "أحدث صيحات الموضة النسائية والرجالية. ماركات عالمية.",
      address: "مكة مول",
      phone: "0790000014",
      whatsapp: "962790000014",
      isVerified: true,
      latitude: 31.9789,
      longitude: 35.8523,
      workingHours: "10:00 ص - 10:00 م",
      instagram: "elegance_boutique_jo",
      services: ["ملابس نسائية", "ملابس رجالية", "اكسسوارات", "أحذية"],
    },
  ];

  for (const bus of businessesData) {
    await storage.createBusiness(bus);
  }

  // Add sample reviews
  const sampleReviews = [
    { businessId: 1, visitorName: "أحمد محمد", rating: 5, comment: "أفضل شاورما في عمان! الطعم ممتاز والخدمة سريعة." },
    { businessId: 1, visitorName: "سارة علي", rating: 4, comment: "شاورما لذيذة جداً، لكن الانتظار كان طويل قليلاً." },
    { businessId: 1, visitorName: "محمود خالد", rating: 5, comment: "تجربة رائعة، سأعود مرة أخرى بالتأكيد." },
    { businessId: 2, visitorName: "ليلى أحمد", rating: 4, comment: "برجر طازج ولذيذ، الأسعار معقولة." },
    { businessId: 2, visitorName: "عمر حسن", rating: 5, comment: "أفضل برجر جربته!" },
    { businessId: 4, visitorName: "فادي نادر", rating: 5, comment: "تعامل ممتاز وأسعار منافسة. أنصح بشدة." },
    { businessId: 6, visitorName: "رنا سمير", rating: 5, comment: "صلّحوا شاشة هاتفي بسرعة وبسعر ممتاز." },
    { businessId: 6, visitorName: "كريم وليد", rating: 4, comment: "خدمة جيدة والموظفين متعاونين." },
  ];

  for (const review of sampleReviews) {
    await storage.createReview(review);
  }

  // Add sample offers
  const sampleOffers = [
    { 
      businessId: 1, 
      title: "خصم 20% على الوجبات العائلية", 
      description: "احصل على خصم 20% على جميع الوجبات العائلية كل يوم جمعة",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    { 
      businessId: 2, 
      title: "وجبة برجر + مشروب مجاني", 
      description: "اطلب أي وجبة برجر واحصل على مشروب غازي مجاناً",
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    { 
      businessId: 6, 
      title: "فحص مجاني للهاتف", 
      description: "فحص مجاني شامل لهاتفك عند أي خدمة صيانة",
      isActive: true,
    },
    { 
      businessId: 4, 
      title: "فحص سيارة مجاني", 
      description: "فحص 50 نقطة مجاناً عند شراء أي سيارة",
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ];

  for (const offer of sampleOffers) {
    await storage.createOffer(offer);
  }

  console.log("Database seeded successfully!");
}

async function seedAdmin() {
  const existingAdmin = await storage.getAdminByUsername("Saqer_Albasry");
  if (existingAdmin) return;

  // Delete old admin if exists
  const oldAdmin = await storage.getAdminByUsername("admin");
  if (oldAdmin) {
    await db.delete(adminUsers).where(eq(adminUsers.username, "admin"));
  }

  console.log("Creating admin user...");
  await storage.createAdmin("Saqer_Albasry", "Thabet@19441122");
  console.log("Admin user created successfully");
}
