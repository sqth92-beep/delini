import { useCategories } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { CategoryCard } from "@/components/CategoryCard";
import { Loader2 } from "lucide-react";

export default function CategoryList() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="تصفح الأقسام" backHref="/" />
      
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories?.map((category, idx) => (
              <CategoryCard key={category.id} category={category} index={idx} />
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
