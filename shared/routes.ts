import { z } from 'zod';
import { insertBusinessSchema, insertCategorySchema, insertReviewSchema, insertOfferSchema, businesses, categories, reviews, offers } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/categories/:id',
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  businesses: {
    list: {
      method: 'GET' as const,
      path: '/api/businesses',
      input: z.object({
        categoryId: z.coerce.number().optional(),
        search: z.string().optional(),
        minRating: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof businesses.$inferSelect & { category?: typeof categories.$inferSelect; averageRating?: number; reviewCount?: number }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/businesses/:id',
      responses: {
        200: z.custom<typeof businesses.$inferSelect & { category: typeof categories.$inferSelect; averageRating?: number; reviewCount?: number }>(),
        404: errorSchemas.notFound,
      },
    },
    withLocation: {
      method: 'GET' as const,
      path: '/api/businesses/map',
      responses: {
        200: z.array(z.custom<typeof businesses.$inferSelect & { category?: typeof categories.$inferSelect; averageRating?: number; reviewCount?: number }>()),
      },
    },
  },
  reviews: {
    list: {
      method: 'GET' as const,
      path: '/api/businesses/:businessId/reviews',
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/businesses/:businessId/reviews',
      input: insertReviewSchema,
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  offers: {
    list: {
      method: 'GET' as const,
      path: '/api/offers',
      responses: {
        200: z.array(z.custom<typeof offers.$inferSelect & { business?: typeof businesses.$inferSelect }>()),
      },
    },
    active: {
      method: 'GET' as const,
      path: '/api/offers/active',
      responses: {
        200: z.array(z.custom<typeof offers.$inferSelect & { business?: typeof businesses.$inferSelect }>()),
      },
    },
    byBusiness: {
      method: 'GET' as const,
      path: '/api/businesses/:businessId/offers',
      responses: {
        200: z.array(z.custom<typeof offers.$inferSelect>()),
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type CategoryResponse = z.infer<typeof api.categories.list.responses[200]>[number];
export type BusinessListResponse = z.infer<typeof api.businesses.list.responses[200]>;
export type BusinessDetailResponse = z.infer<typeof api.businesses.get.responses[200]>;
export type ReviewResponse = z.infer<typeof api.reviews.list.responses[200]>[number];
export type OfferResponse = z.infer<typeof api.offers.list.responses[200]>[number];
