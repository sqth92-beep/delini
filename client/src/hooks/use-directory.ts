import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Review, Offer, BusinessResponse, City } from "@shared/schema";

// ============================================
// CITIES HOOKS
// ============================================

// GET /api/cities
export function useCities() {
  return useQuery({
    queryKey: ['/api/cities'],
    queryFn: async () => {
      const res = await fetch('/api/cities');
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json() as Promise<City[]>;
    },
  });
}

// ============================================
// DIRECTORY HOOKS
// ============================================

// Category type that includes all fields from the API
interface CategoryWithImage {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  keywords: string[] | null;
  keywordsEn: string[] | null;
  sortOrder: number;
}

// GET /api/categories
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error('Failed to fetch categories');
      // Don't use Zod parse - it may strip fields. Return raw JSON.
      return res.json() as Promise<CategoryWithImage[]>;
    },
  });
}

// GET /api/categories/:id
export function useCategory(id: number) {
  return useQuery({
    queryKey: [api.categories.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.categories.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch category');
      return api.categories.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// GET /api/businesses
export function useBusinesses(params?: { 
  categoryId?: number; 
  search?: string; 
  minRating?: number; 
  cityId?: number;
  userLat?: number | null;
  userLng?: number | null;
  sortByDistance?: boolean;
}) {
  const queryKey = [api.businesses.list.path, params];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.categoryId) searchParams.append('categoryId', String(params.categoryId));
      if (params?.search) searchParams.append('search', params.search);
      if (params?.minRating) searchParams.append('minRating', String(params.minRating));
      if (params?.cityId) searchParams.append('cityId', String(params.cityId));
      if (params?.userLat !== undefined && params?.userLat !== null) searchParams.append('userLat', String(params.userLat));
      if (params?.userLng !== undefined && params?.userLng !== null) searchParams.append('userLng', String(params.userLng));
      if (params?.sortByDistance) searchParams.append('sortByDistance', 'true');

      const url = `${api.businesses.list.path}?${searchParams.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch businesses');
      return res.json() as Promise<(BusinessResponse & { distance?: number })[]>;
    },
  });
}

// GET /api/businesses/:id
export function useBusiness(id: number) {
  return useQuery({
    queryKey: [api.businesses.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.businesses.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch business');
      return res.json() as Promise<BusinessResponse>;
    },
    enabled: !!id,
  });
}

// GET /api/businesses/map
export function useBusinessesWithLocation() {
  return useQuery({
    queryKey: ['/api/businesses/map'],
    queryFn: async () => {
      const res = await fetch('/api/businesses/map');
      if (!res.ok) throw new Error('Failed to fetch businesses');
      return res.json() as Promise<BusinessResponse[]>;
    },
  });
}

// ============================================
// REVIEWS HOOKS
// ============================================

// GET /api/businesses/:businessId/reviews
export function useReviews(businessId: number) {
  return useQuery({
    queryKey: ['/api/businesses', businessId, 'reviews'],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json() as Promise<Review[]>;
    },
    enabled: !!businessId,
  });
}

// POST /api/businesses/:businessId/reviews
export function useCreateReview(businessId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { visitorName: string; rating: number; comment?: string }) => {
      const res = await fetch(`/api/businesses/${businessId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create review');
      }
      return res.json() as Promise<Review>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', businessId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: [api.businesses.get.path, businessId] });
      queryClient.invalidateQueries({ queryKey: [api.businesses.list.path] });
    },
  });
}

// ============================================
// OFFERS HOOKS
// ============================================

// GET /api/offers/active
export function useActiveOffers() {
  return useQuery({
    queryKey: ['/api/offers/active'],
    queryFn: async () => {
      const res = await fetch('/api/offers/active');
      if (!res.ok) throw new Error('Failed to fetch offers');
      return res.json() as Promise<(Offer & { business?: BusinessResponse })[]>;
    },
  });
}

// GET /api/businesses/:businessId/offers
export function useBusinessOffers(businessId: number) {
  return useQuery({
    queryKey: ['/api/businesses', businessId, 'offers'],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/offers`);
      if (!res.ok) throw new Error('Failed to fetch offers');
      return res.json() as Promise<Offer[]>;
    },
    enabled: !!businessId,
  });
}
