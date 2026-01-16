import { useRoute } from "wouter";
import { useCategory, useBusinesses } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { Loader2, AlertCircle } from "lucide-react";

export default function CategoryDetail() {
  const [, params] = useRoute("/categories/:id");
  const [, previewParams] = useRoute("/preview/categories/:id");
  const categoryId = params?.id ? parseInt(params.id) : (previewParams?.id ? parseInt(previewParams.id) : 0);
  
  const { data: category } = useCategory(categoryId);
  const { data: businesses, isLoading } = useBusinesses({ categoryId });

  if (!categoryId) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title={category?.name || "جار التحميل..."} backHref="/categories" />
      
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => (
               <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
             ))}
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="space-y-4">
            {businesses.map((business, idx) => (
              <BusinessCard key={business.id} business={business} layout="list" index={idx} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground p-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-1">لا توجد محلات</h3>
            <p>لم يتم إضافة أي محلات في هذا القسم حتى الآن.</p>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
