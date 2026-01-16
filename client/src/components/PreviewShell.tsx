import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings } from "lucide-react";
import { PreviewProvider } from "@/lib/preview-context";

interface AdminUser {
  id: number;
  username: string;
}

export function PreviewShell({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  
  const { data: admin, isLoading } = useQuery<AdminUser>({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  if (isLoading) {
    return <>{children}</>;
  }

  if (!admin) {
    setLocation("/");
    return null;
  }

  return (
    <PreviewProvider>
      <div className="relative min-h-screen">
        <div className="fixed top-4 left-4 z-[9999] flex items-center gap-2 bg-primary/95 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">وضع المعاينة</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setLocation("/admin")}
            className="mr-2 gap-1"
            data-testid="button-return-admin"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
        </div>
        {children}
      </div>
    </PreviewProvider>
  );
}
