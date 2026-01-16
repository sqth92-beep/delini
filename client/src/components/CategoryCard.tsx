import { Link } from "wouter";
import { motion } from "framer-motion";
import { usePreview } from "@/lib/preview-context";

import restaurantsImg from "@assets/stock_images/delicious_restaurant_ff60ef77.jpg";
import carsImg from "@assets/stock_images/luxury_car_dealershi_979c1cf5.jpg";
import mobilesImg from "@assets/stock_images/modern_smartphone_mo_0ffab66e.jpg";
import maintenanceImg from "@assets/stock_images/home_maintenance_rep_7b8d9c58.jpg";
import healthImg from "@assets/stock_images/healthcare_medical_c_41a6f1f1.jpg";
import clothesImg from "@assets/stock_images/fashion_clothing_sto_69687f15.jpg";

const categoryImages: Record<string, string> = {
  restaurants: restaurantsImg,
  cars: carsImg,
  mobiles: mobilesImg,
  maintenance: maintenanceImg,
  health: healthImg,
  clothes: clothesImg,
};

interface CategoryData {
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

interface CategoryCardProps {
  category: CategoryData;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const { prefixLink } = usePreview();
  
  // Use category.imageUrl from database first, then fall back to stock images
  let imageUrl: string;
  if (category.imageUrl && category.imageUrl.length > 0) {
    // Use external URL from database directly (no cache buster - like BusinessDetail)
    imageUrl = category.imageUrl;
  } else {
    // Fall back to stock images
    imageUrl = categoryImages[category.slug] || restaurantsImg;
  }

  return (
    <Link href={prefixLink(`/categories/${category.id}`)} className="block h-full">
      <div 
        className="
          relative overflow-hidden rounded-2xl h-36 md:h-44
          shadow-lg hover:shadow-2xl hover:-translate-y-1
          transition-all duration-300 group cursor-pointer
        "
        data-testid={`card-category-${category.id}`}
      >
        <img 
          src={imageUrl} 
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="font-display font-bold text-lg text-white drop-shadow-lg">
            {category.name}
          </span>
        </div>
        <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-primary/40 transition-colors" />
      </div>
    </Link>
  );
}
