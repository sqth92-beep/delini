import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, 
  Grid3X3, 
  Store, 
  LogOut, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Palette,
  Home,
  Eye,
  MapPin,
  Image as ImageIcon,
  GalleryHorizontal as Images,
  Tag,
  Calendar,
  CreditCard,
  Menu,
  X,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  Crown,
  Users,
  XCircle,
  MessageCircle,
  Star
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/CategoryCard";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category, Business, BusinessResponse, WorkingHours, DayHours, SubscriptionInfo } from "@shared/schema";
import { parseWorkingHours, getSubscriptionInfo } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tab = "dashboard" | "categories" | "cities" | "businesses" | "subscriptions" | "offers" | "reviews" | "settings";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: adminData, isLoading: checkingAuth, error: authError } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (authError) {
      setLocation("/admin/login");
    }
  }, [authError, setLocation]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      setLocation("/admin/login");
    },
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminData) return null;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="button-toggle-sidebar"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 right-0 z-40
        w-64 bg-card border-l border-border p-4 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-8">
          <h1 className="text-xl font-display font-bold text-primary">دلّيني</h1>
          <p className="text-sm text-muted-foreground">لوحة التحكم</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "dashboard" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            الرئيسية
          </button>
          <button
            onClick={() => handleTabChange("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "categories" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-categories"
          >
            <Grid3X3 className="w-5 h-5" />
            الأقسام
          </button>
          <button
            onClick={() => handleTabChange("cities")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "cities" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-cities"
          >
            <MapPin className="w-5 h-5" />
            المدن
          </button>
          <button
            onClick={() => handleTabChange("businesses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "businesses" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-businesses"
          >
            <Store className="w-5 h-5" />
            المحلات
          </button>
          <button
            onClick={() => handleTabChange("subscriptions")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "subscriptions" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-subscriptions"
          >
            <CreditCard className="w-5 h-5" />
            الاشتراكات
          </button>
          <button
            onClick={() => handleTabChange("offers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "offers" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-offers"
          >
            <Tag className="w-5 h-5" />
            العروض
          </button>
          <button
            onClick={() => handleTabChange("reviews")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "reviews" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-reviews"
          >
            <MessageCircle className="w-5 h-5" />
            المراجعات
          </button>
          <button
            onClick={() => handleTabChange("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-settings"
          >
            <Palette className="w-5 h-5" />
            المظهر
          </button>
        </nav>

        <div className="border-t border-border pt-4 space-y-2">
          <Link href="/preview">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10"
              data-testid="button-preview-site"
            >
              <Eye className="w-5 h-5" />
              معاينة الموقع
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="w-5 h-5" />
              القائمة الرئيسية
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="outline" className="gap-2" data-testid="button-back-to-site">
              <ArrowRight className="w-4 h-4" />
              القائمة الرئيسية
            </Button>
          </Link>
        </div>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "cities" && <CitiesTab />}
        {activeTab === "businesses" && <BusinessesTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "offers" && <OffersTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

interface Statistics {
  totalBusinesses: number;
  verifiedBusinesses: number;
  vipBusinesses: number;
  normalBusinesses: number;
  trialBusinesses: number;
  totalReviews: number;
  averageRating: number | string;
  activeOffers: number;
  totalOffers: number;
  totalCategories: number;
  businessesByCategory: { name: string; count: number }[];
  recentReviews: number;
  monthlyRevenue: number;
  topRatedBusinesses: { id: number; name: string; rating: number | null; reviewCount: number | null }[];
  mostReviewedBusinesses: { id: number; name: string; rating: number | null; reviewCount: number | null }[];
}

interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: string | null;
  adminUsername: string;
  createdAt: string;
}

function DashboardTab() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ["/api/admin/statistics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/statistics");
      return res.json();
    },
  });

  const { data: activityLogs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/activity-logs?limit=10");
      return res.json();
    },
  });

  const { data: businesses } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/admin/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/businesses");
      return res.json();
    },
  });

  const expiringSubscriptions = businesses?.filter(b => {
    const subInfo = getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier);
    return subInfo.daysRemaining !== null && subInfo.daysRemaining > 0 && subInfo.daysRemaining <= 7;
  }).map(b => ({
    ...b,
    daysRemaining: getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier).daysRemaining
  })) || [];

  // Expired subscriptions - hidden from public view
  const expiredSubscriptions = businesses?.filter(b => {
    const subInfo = getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier);
    return subInfo.status === 'expired' || subInfo.status === 'trial_expired';
  }).map(b => ({
    ...b,
    status: getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier).status
  })) || [];

  const handleExport = async (type: 'businesses' | 'subscriptions' | 'reviews') => {
    try {
      const res = await fetch(`/api/admin/export/${type}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "تم تصدير البيانات بنجاح" });
    } catch {
      toast({ title: "خطأ في تصدير البيانات", variant: "destructive" });
    }
  };

  if (statsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">نظرة عامة</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('businesses')} data-testid="button-export-businesses">
            تصدير المحلات
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('subscriptions')} data-testid="button-export-subscriptions">
            تصدير الاشتراكات
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('reviews')} data-testid="button-export-reviews">
            تصدير المراجعات
          </Button>
        </div>
      </div>

      {expiredSubscriptions.length > 0 && (
        <Card className="border-red-500 bg-red-500/10">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <CardTitle className="text-sm font-medium text-red-500">
              اشتراكات منتهية - مخفية عن المستخدمين ({expiredSubscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredSubscriptions.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <span>{b.name}</span>
                  <Badge variant="destructive" className="text-xs">
                    {b.status === 'trial_expired' ? 'انتهت الفترة التجريبية' : 'انتهى الاشتراك'}
                  </Badge>
                </div>
              ))}
              {expiredSubscriptions.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  و {expiredSubscriptions.length - 5} محل آخر...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {expiringSubscriptions.length > 0 && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-sm font-medium text-amber-500">
              اشتراكات تنتهي قريباً ({expiringSubscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringSubscriptions.slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <span>{b.name}</span>
                  <span className="text-amber-500">باقي {b.daysRemaining} يوم</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحلات</CardTitle>
            <Store className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBusinesses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">محلات VIP</CardTitle>
            <Crown className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.vipBusinesses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">محلات عادية</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.normalBusinesses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">تجريبي</CardTitle>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.trialBusinesses || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المراجعات</CardTitle>
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentReviews || 0} في آخر 30 يوم
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقييم</CardTitle>
            <Star className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.averageRating || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">العروض النشطة</CardTitle>
            <Tag className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeOffers || 0}</div>
            <p className="text-xs text-muted-foreground">
              من إجمالي {stats?.totalOffers || 0} عرض
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">الإيرادات الشهرية المتوقعة</CardTitle>
          <TrendingUp className="w-5 h-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {(stats?.monthlyRevenue || 0).toLocaleString('en')} ر.س
          </div>
          <p className="text-xs text-muted-foreground">
            VIP: 10,000 ر.س | عادي: 5,000 ر.س
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أعلى المحلات تقييماً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topRatedBusinesses?.map((b, i) => (
                <div key={b.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="truncate">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span>{b.rating?.toFixed(1) || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">التوزيع حسب الأقسام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.businessesByCategory?.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span>{cat.count}</span>
                  </div>
                  <Progress 
                    value={(cat.count / (stats.totalBusinesses || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل العمليات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs && activityLogs.length > 0 ? (
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground">{log.entityType}</span>
                    {log.details && <span className="text-muted-foreground">- {log.details}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">لا توجد عمليات مسجلة</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم إضافة القسم بنجاح" });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم تحديث القسم بنجاح" });
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم حذف القسم" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">الأقسام</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-category">
              <Plus className="w-4 h-4" />
              إضافة قسم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة قسم جديد</DialogTitle>
            </DialogHeader>
            <CategoryForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {categories?.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate">{category.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{category.nameEn || category.slug}</p>
                    {category.icon && (
                      <p className="text-xs text-muted-foreground">أيقونة: {category.icon}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingCategory(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>تعديل القسم</DialogTitle>
                      </DialogHeader>
                      <CategoryForm 
                        category={category}
                        onSubmit={(data) => updateMutation.mutate({ id: category.id, data })}
                        isLoading={updateMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف هذا القسم نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(category.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({ 
  category, 
  onSubmit, 
  isLoading 
}: { 
  category?: Category; 
  onSubmit: (data: Partial<Category>) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(category?.name || "");
  const [nameEn, setNameEn] = useState(category?.nameEn || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [icon, setIcon] = useState(category?.icon || "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || "");
  const [keywords, setKeywords] = useState(category?.keywords?.join(", ") || "");
  const [keywordsEn, setKeywordsEn] = useState(category?.keywordsEn?.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywordsArray = keywords.split(",").map(k => k.trim()).filter(k => k);
    const keywordsEnArray = keywordsEn.split(",").map(k => k.trim()).filter(k => k);
    onSubmit({ 
      name, 
      nameEn, 
      slug, 
      icon, 
      imageUrl: imageUrl || null,
      keywords: keywordsArray.length > 0 ? keywordsArray : null,
      keywordsEn: keywordsEnArray.length > 0 ? keywordsEnArray : null,
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">الاسم بالعربية *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-category-name" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">الاسم بالإنجليزية</label>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} data-testid="input-category-name-en" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">المعرف (slug) *</label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} required data-testid="input-category-slug" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">الأيقونة *</label>
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} required placeholder="مثال: Utensils" data-testid="input-category-icon" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">رابط الصورة</label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." data-testid="input-category-image" />
        {imageUrl && (
          <div className="mt-2 relative w-full h-32 bg-muted rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt="معاينة الصورة" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">كلمات مفتاحية بالعربية</label>
        <Input 
          value={keywords} 
          onChange={(e) => setKeywords(e.target.value)} 
          placeholder="مثال: أكل, طعام, سندويج, مطعم (افصل بفاصلة)"
          data-testid="input-category-keywords" 
        />
        <p className="text-xs text-muted-foreground">افصل بين الكلمات بفاصلة - تستخدم لتحسين نتائج البحث</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">كلمات مفتاحية بالإنجليزية</label>
        <Input 
          value={keywordsEn} 
          onChange={(e) => setKeywordsEn(e.target.value)} 
          placeholder="e.g: food, eat, sandwich, restaurant"
          data-testid="input-category-keywords-en" 
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-category">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : category ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );
}

// Cities Tab
interface City {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
}

function CitiesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityNameEn, setNewCityNameEn] = useState("");
  const [newCitySlug, setNewCitySlug] = useState("");

  const { data: cities, isLoading } = useQuery<City[]>({
    queryKey: ["/api/admin/cities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cities", { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; nameEn: string; slug: string }) => {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      toast({ title: "تم إضافة المدينة بنجاح" });
      setIsAddOpen(false);
      setNewCityName("");
      setNewCityNameEn("");
      setNewCitySlug("");
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/cities/${id}`, { 
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      toast({ title: "تم حذف المدينة" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !newCitySlug.trim()) {
      toast({ title: "خطأ", description: "الاسم والرابط مطلوبان", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: newCityName.trim(),
      nameEn: newCityNameEn.trim(),
      slug: newCitySlug.trim().toLowerCase().replace(/\s+/g, '-'),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">المدن</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-city">
              <Plus className="w-4 h-4" />
              إضافة مدينة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مدينة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم المدينة بالعربية *</label>
                <Input
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="مثال: البصرة"
                  data-testid="input-city-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم المدينة بالإنجليزية</label>
                <Input
                  value={newCityNameEn}
                  onChange={(e) => setNewCityNameEn(e.target.value)}
                  placeholder="e.g: Basra"
                  data-testid="input-city-name-en"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الرابط (Slug) *</label>
                <Input
                  value={newCitySlug}
                  onChange={(e) => setNewCitySlug(e.target.value)}
                  placeholder="مثال: basra"
                  data-testid="input-city-slug"
                />
                <p className="text-xs text-muted-foreground">يستخدم في الروابط - بالإنجليزية فقط</p>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-city">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : cities && cities.length > 0 ? (
        <div className="grid gap-4">
          {cities.map((city) => (
            <Card key={city.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{city.name}</h3>
                    <p className="text-sm text-muted-foreground">{city.nameEn || city.slug}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-city-${city.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف مدينة "{city.name}" نهائياً. المحلات المرتبطة بهذه المدينة لن تتأثر.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(city.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد مدن مضافة</p>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة أول مدينة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BusinessesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessResponse | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const { data: businesses, isLoading } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/admin/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/businesses");
      return res.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.json();
    },
  });

  // Group businesses by category
  const businessesByCategory = (businesses || []).reduce((acc, business) => {
    const catId = business.categoryId?.toString() || "uncategorized";
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(business);
    return acc;
  }, {} as Record<string, BusinessResponse[]>);

  // Filter businesses based on selected category
  const filteredBusinesses = selectedCategoryFilter === "all" 
    ? businesses 
    : businesses?.filter(b => b.categoryId?.toString() === selectedCategoryFilter);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Business>) => {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "تم إضافة المحل بنجاح" });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Business> }) => {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "تم تحديث المحل بنجاح" });
      setEditingBusiness(null);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "تم حذف المحل" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-2xl font-display font-bold">المحلات</h2>
        <div className="flex items-center gap-3">
          <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
            <SelectTrigger className="w-48" data-testid="filter-category">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name} ({businessesByCategory[cat.id.toString()]?.length || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-business">
                <Plus className="w-4 h-4" />
                إضافة محل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة محل جديد</DialogTitle>
              </DialogHeader>
              <BusinessForm 
                categories={categories || []}
                onSubmit={(data) => createMutation.mutate(data)} 
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : selectedCategoryFilter === "all" ? (
        // Grouped view by category
        <div className="space-y-6">
          {categories?.map((category) => {
            const categoryBusinesses = businessesByCategory[category.id.toString()] || [];
            if (categoryBusinesses.length === 0) return null;
            
            return (
              <div key={category.id}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-primary">
                  <Grid3X3 className="w-5 h-5" />
                  {category.name}
                  <span className="text-sm text-muted-foreground font-normal">({categoryBusinesses.length})</span>
                </h3>
                <div className="grid gap-3 pr-4">
                  {categoryBusinesses.map((business) => (
                    <BusinessCard 
                      key={business.id}
                      business={business}
                      categories={categories}
                      editingBusiness={editingBusiness}
                      setEditingBusiness={setEditingBusiness}
                      onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isUpdating={updateMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Filtered view - single category
        <div className="grid gap-4">
          {filteredBusinesses?.map((business) => (
            <BusinessCard 
              key={business.id}
              business={business}
              categories={categories || []}
              editingBusiness={editingBusiness}
              setEditingBusiness={setEditingBusiness}
              onUpdate={(id, data) => updateMutation.mutate({ id, data })}
              onDelete={(id) => deleteMutation.mutate(id)}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessCard({
  business,
  categories,
  editingBusiness,
  setEditingBusiness,
  onUpdate,
  onDelete,
  isUpdating,
}: {
  business: BusinessResponse;
  categories: Category[];
  editingBusiness: BusinessResponse | null;
  setEditingBusiness: (b: BusinessResponse | null) => void;
  onUpdate: (id: number, data: Partial<Business>) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}) {
  const subInfo = getSubscriptionInfo(
    (business as any).joinDate,
    (business as any).subscriptionActivatedAt,
    (business as any).subscriptionTier
  );
  const isExpired = subInfo.status === 'expired' || subInfo.status === 'trial_expired';

  return (
    <Card className={isExpired ? "border-red-500/50 bg-red-500/5" : ""}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden relative">
            {business.imageUrl ? (
              <img 
                src={business.imageUrl} 
                alt={business.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            {isExpired && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{business.name}</h3>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  {subInfo.status === 'trial_expired' ? 'تجريبي منتهي' : 'منتهي'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{business.category?.name}</p>
            {business.isVerified && !isExpired && (
              <span className="text-xs text-primary">موثق</span>
            )}
            {isExpired && (
              <p className="text-xs text-red-500">مخفي عن المستخدمين</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={editingBusiness?.id === business.id} onOpenChange={(open) => !open && setEditingBusiness(null)}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setEditingBusiness(business)}
                data-testid={`button-edit-business-${business.id}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تعديل المحل</DialogTitle>
              </DialogHeader>
              <BusinessForm 
                business={business}
                categories={categories || []}
                onSubmit={(data) => onUpdate(business.id, data)}
                isLoading={isUpdating}
              />
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive"
                data-testid={`button-delete-business-${business.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف هذا المحل وجميع التقييمات والعروض المرتبطة به نهائياً.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(business.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationPicker({ 
  position, 
  onPositionChange 
}: { 
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
}

function BusinessForm({ 
  business, 
  categories,
  onSubmit, 
  isLoading 
}: { 
  business?: BusinessResponse; 
  categories: Category[];
  onSubmit: (data: Partial<Business>) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(business?.name || "");
  const [nameEn, setNameEn] = useState(business?.nameEn || "");
  const [categoryId, setCategoryId] = useState(business?.categoryId?.toString() || "");
  const [description, setDescription] = useState(business?.description || "");
  const [address, setAddress] = useState(business?.address || "");
  const [phone, setPhone] = useState(business?.phone || "");
  const [whatsapp, setWhatsapp] = useState(business?.whatsapp || "");
  const [imageUrl, setImageUrl] = useState(business?.imageUrl || "");
  const [storefrontImageUrl, setStorefrontImageUrl] = useState((business as any)?.storefrontImageUrl || "");
  const [galleryImages, setGalleryImages] = useState<string[]>((business as any)?.galleryImages || ["", "", "", ""]);
  const [isVerified, setIsVerified] = useState(business?.isVerified || false);
  const [latitude, setLatitude] = useState(business?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(business?.longitude?.toString() || "");
  const [showMap, setShowMap] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [instagram, setInstagram] = useState(business?.instagram || "");
  const [facebook, setFacebook] = useState(business?.facebook || "");
  const [tiktok, setTiktok] = useState((business as any)?.tiktok || "");
  const [joinDate, setJoinDate] = useState<string>((business as any)?.joinDate ? new Date((business as any).joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [subscriptionActivatedAt, setSubscriptionActivatedAt] = useState<string>((business as any)?.subscriptionActivatedAt ? new Date((business as any).subscriptionActivatedAt).toISOString().split('T')[0] : "");
  const [subscriptionTier, setSubscriptionTier] = useState<string>((business as any)?.subscriptionTier || "trial");
  
  const defaultDayHours: DayHours = { isOpen: true, openTime: "09:00", closeTime: "21:00" };
  const existingHours = parseWorkingHours((business as any)?.workingHoursJson);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    sunday: existingHours?.sunday || { ...defaultDayHours },
    monday: existingHours?.monday || { ...defaultDayHours },
    tuesday: existingHours?.tuesday || { ...defaultDayHours },
    wednesday: existingHours?.wednesday || { ...defaultDayHours },
    thursday: existingHours?.thursday || { ...defaultDayHours },
    friday: existingHours?.friday || { isOpen: false },
    saturday: existingHours?.saturday || { ...defaultDayHours },
  });
  
  const dayNames: Record<string, string> = {
    sunday: "الأحد",
    monday: "الإثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
  };
  
  const updateDayHours = (day: keyof WorkingHours, field: keyof DayHours, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };
  
  const defaultCenter: [number, number] = [31.9539, 35.9106];
  const position: [number, number] | null = latitude && longitude 
    ? [parseFloat(latitude), parseFloat(longitude)] 
    : null;

  const handlePositionChange = (pos: [number, number]) => {
    setLatitude(pos[0].toFixed(6));
    setLongitude(pos[1].toFixed(6));
  };

  const handleGalleryImageChange = (index: number, value: string) => {
    const newGallery = [...galleryImages];
    newGallery[index] = value;
    setGalleryImages(newGallery);
  };

  const addGallerySlot = () => {
    setGalleryImages([...galleryImages, ""]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredGallery = galleryImages.filter(url => url.trim() !== "");
    onSubmit({ 
      name, 
      nameEn: nameEn || null,
      categoryId: parseInt(categoryId), 
      description: description || null,
      address: address || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      imageUrl: imageUrl || null,
      storefrontImageUrl: storefrontImageUrl || null,
      galleryImages: filteredGallery.length > 0 ? filteredGallery : null,
      isVerified: subscriptionTier === 'vip' ? true : isVerified,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      workingHoursJson: JSON.stringify(workingHours),
      instagram: instagram || null,
      facebook: facebook || null,
      tiktok: tiktok || null,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      subscriptionActivatedAt: subscriptionActivatedAt ? new Date(subscriptionActivatedAt) : null,
      subscriptionTier,
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">الاسم بالعربية *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-business-name" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">الاسم بالإنجليزية</label>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} data-testid="input-business-name-en" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">القسم *</label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger data-testid="select-business-category">
            <SelectValue placeholder="اختر القسم" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">الوصف</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-business-description" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">العنوان</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} data-testid="input-business-address" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">الهاتف</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-business-phone" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">واتساب</label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} data-testid="input-business-whatsapp" />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
        <h4 className="font-medium text-sm">روابط التواصل الاجتماعي</h4>
        <div className="space-y-2">
          <label className="text-sm font-medium">Instagram</label>
          <Input 
            value={instagram} 
            onChange={(e) => setInstagram(e.target.value)} 
            placeholder="https://instagram.com/..."
            data-testid="input-business-instagram" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Facebook</label>
          <Input 
            value={facebook} 
            onChange={(e) => setFacebook(e.target.value)} 
            placeholder="https://facebook.com/..."
            data-testid="input-business-facebook" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">TikTok</label>
          <Input 
            value={tiktok} 
            onChange={(e) => setTiktok(e.target.value)} 
            placeholder="https://tiktok.com/@..."
            data-testid="input-business-tiktok" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          صورة الشعار
        </label>
        <ImageUploadField
          value={imageUrl}
          onChange={setImageUrl}
          placeholder="https://..."
          testId="input-business-image"
          previewClassName="w-24 h-24"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Store className="w-4 h-4" />
          صورة الواجهة
        </label>
        <ImageUploadField
          value={storefrontImageUrl}
          onChange={setStorefrontImageUrl}
          placeholder="https://..."
          testId="input-business-storefront"
          previewClassName="w-full h-40"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Images className="w-4 h-4" />
          صور المحل (4 صور على الأقل)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {galleryImages.map((url, index) => (
            <div key={index}>
              <ImageUploadField
                value={url}
                onChange={(newUrl) => handleGalleryImageChange(index, newUrl)}
                placeholder={`صورة ${index + 1}`}
                testId={`input-gallery-image-${index}`}
                previewClassName="w-full h-24"
              />
            </div>
          ))}
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addGallerySlot}
          className="w-full mt-2"
          data-testid="button-add-gallery-image"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة صورة أخرى
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          الموقع على الخريطة
        </label>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowMap(!showMap)}
          className="w-full"
          data-testid="button-toggle-map"
        >
          {showMap ? "إخفاء الخريطة" : "تحديد الموقع على الخريطة"}
        </Button>
        
        {showMap && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border" style={{ height: "250px" }}>
            <MapContainer
              center={position || defaultCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker position={position} onPositionChange={handlePositionChange} />
            </MapContainer>
          </div>
        )}

        {position && (
          <p className="text-xs text-muted-foreground mt-1">
            الإحداثيات: {latitude}, {longitude}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-xs text-muted-foreground">خط العرض</label>
            <Input 
              value={latitude} 
              onChange={(e) => setLatitude(e.target.value)} 
              placeholder="31.9539"
              data-testid="input-business-latitude" 
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">خط الطول</label>
            <Input 
              value={longitude} 
              onChange={(e) => setLongitude(e.target.value)} 
              placeholder="35.9106"
              data-testid="input-business-longitude" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          أوقات الدوام
        </label>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowHours(!showHours)}
          className="w-full"
          data-testid="button-toggle-hours"
        >
          {showHours ? "إخفاء أوقات الدوام" : "تحديد أوقات الدوام"}
        </Button>
        
        {showHours && (
          <div className="mt-2 space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
            {(Object.keys(dayNames) as Array<keyof WorkingHours>).map((day) => (
              <div key={day} className="flex items-center gap-2 flex-wrap">
                <div className="w-20 text-sm font-medium">{dayNames[day]}</div>
                <input
                  type="checkbox"
                  checked={workingHours[day]?.isOpen ?? false}
                  onChange={(e) => updateDayHours(day, "isOpen", e.target.checked)}
                  className="w-4 h-4"
                  data-testid={`checkbox-hours-${day}`}
                />
                <span className="text-xs text-muted-foreground">
                  {workingHours[day]?.isOpen ? "مفتوح" : "مغلق"}
                </span>
                {workingHours[day]?.isOpen && (
                  <>
                    <Input
                      type="time"
                      value={workingHours[day]?.openTime || "09:00"}
                      onChange={(e) => updateDayHours(day, "openTime", e.target.value)}
                      className="w-24 h-8 text-xs"
                      data-testid={`input-hours-${day}-open`}
                    />
                    <span className="text-xs">-</span>
                    <Input
                      type="time"
                      value={workingHours[day]?.closeTime || "21:00"}
                      onChange={(e) => updateDayHours(day, "closeTime", e.target.value)}
                      className="w-24 h-8 text-xs"
                      data-testid={`input-hours-${day}-close`}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          إدارة الاشتراك
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">تاريخ الانضمام</label>
            <Input 
              type="date" 
              value={joinDate} 
              onChange={(e) => setJoinDate(e.target.value)}
              data-testid="input-business-join-date"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">تاريخ تفعيل الاشتراك</label>
            <Input 
              type="date" 
              value={subscriptionActivatedAt} 
              onChange={(e) => setSubscriptionActivatedAt(e.target.value)}
              data-testid="input-business-subscription-activated"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">نوع الاشتراك</label>
          <Select value={subscriptionTier} onValueChange={setSubscriptionTier}>
            <SelectTrigger data-testid="select-subscription-tier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">فترة تجريبية (مجاني - شهرين)</SelectItem>
              <SelectItem value="regular">عادي (5,000 د.ع/شهر)</SelectItem>
              <SelectItem value="vip">VIP (10,000 د.ع/شهر) - موثق + عروض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {subscriptionTier === 'vip' && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-sm text-amber-400">
            اشتراك VIP يمنح المحل شارة التوثيق تلقائياً وإمكانية إضافة عروض خاصة
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isVerified"
          checked={subscriptionTier === 'vip' ? true : isVerified} 
          onChange={(e) => setIsVerified(e.target.checked)}
          disabled={subscriptionTier === 'vip'}
          className="w-4 h-4 disabled:opacity-50"
          data-testid="checkbox-business-verified"
        />
        <label htmlFor="isVerified" className="text-sm font-medium">
          محل موثق
          {subscriptionTier === 'vip' && <span className="text-xs text-muted-foreground mr-2">(تلقائي مع VIP)</span>}
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-business">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : business ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );
}

// Subscription status types
type SubscriptionStatus = 'trial' | 'trial_expired' | 'active' | 'expired';

interface BusinessWithSubscription extends BusinessResponse {
  subscriptionInfo: SubscriptionInfo;
}

function SubscriptionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const { data: businesses, isLoading } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/admin/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/businesses");
      return res.json();
    },
  });

  const businessesWithSubscription: BusinessWithSubscription[] = (businesses || []).map(b => ({
    ...b,
    subscriptionInfo: getSubscriptionInfo(
      (b as any).joinDate,
      (b as any).subscriptionActivatedAt,
      (b as any).subscriptionTier
    )
  }));

  const activeBusinesses = businessesWithSubscription.filter(b => 
    b.subscriptionInfo.status === 'trial' || b.subscriptionInfo.status === 'active'
  );
  const expiredBusinesses = businessesWithSubscription.filter(b => 
    b.subscriptionInfo.status === 'trial_expired' || b.subscriptionInfo.status === 'expired'
  );
  const vipBusinesses = businessesWithSubscription.filter(b => b.subscriptionInfo.tier === 'vip');
  
  const expiringBusinesses = businessesWithSubscription.filter(b => 
    (b.subscriptionInfo.status === 'trial' || b.subscriptionInfo.status === 'active') &&
    b.subscriptionInfo.daysRemaining <= 7 && b.subscriptionInfo.daysRemaining > 0
  );

  const monthlyRevenue = businessesWithSubscription.reduce((total, b) => {
    if (b.subscriptionInfo.status === 'active') {
      return total + (b.subscriptionInfo.tier === 'vip' ? 10000 : 5000);
    }
    return total;
  }, 0);

  const getFilteredBusinesses = () => {
    let filtered: BusinessWithSubscription[] = [];
    switch(selectedFilter) {
      case 'active': filtered = activeBusinesses; break;
      case 'expired': filtered = expiredBusinesses; break;
      case 'vip': filtered = vipBusinesses; break;
      case 'expiring': filtered = expiringBusinesses; break;
      default: filtered = businessesWithSubscription;
    }
    return filtered.sort((a, b) => a.subscriptionInfo.daysRemaining - b.subscriptionInfo.daysRemaining);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      toast({ title: "تم تحديث الاشتراك بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleRenew = (businessId: number, tier: string) => {
    const now = new Date().toISOString();
    updateMutation.mutate({ 
      id: businessId, 
      data: { 
        subscriptionTier: tier,
        subscriptionActivatedAt: now,
        isVerified: tier === 'vip' ? true : undefined
      } 
    });
  };

  const handleResetTrial = (businessId: number) => {
    const now = new Date().toISOString();
    updateMutation.mutate({ 
      id: businessId, 
      data: { 
        subscriptionTier: 'trial',
        joinDate: now,
        subscriptionActivatedAt: null
      } 
    });
  };

  const getExpirationDate = (daysRemaining: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysRemaining);
    return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getProgressValue = (daysRemaining: number, tier: string) => {
    const totalDays = tier === 'trial' ? 60 : 30;
    return Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  };

  const getProgressColor = (daysRemaining: number) => {
    if (daysRemaining <= 0) return 'bg-red-500';
    if (daysRemaining <= 7) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredBusinesses = getFilteredBusinesses();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">إدارة الاشتراكات</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover-elevate ${selectedFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setSelectedFilter('all')}
          data-testid="filter-all"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الكل</p>
                <p className="text-2xl font-bold">{businessesWithSubscription.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover-elevate ${selectedFilter === 'active' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setSelectedFilter('active')}
          data-testid="filter-active"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-green-400">نشط</p>
                <p className="text-2xl font-bold text-green-400">{activeBusinesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover-elevate ${selectedFilter === 'expired' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setSelectedFilter('expired')}
          data-testid="filter-expired"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-red-400">منتهي</p>
                <p className="text-2xl font-bold text-red-400">{expiredBusinesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover-elevate ${selectedFilter === 'vip' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setSelectedFilter('vip')}
          data-testid="filter-vip"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-primary">مميز</p>
                <p className="text-2xl font-bold text-primary">{vipBusinesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {expiringBusinesses.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              تنبيه: محلات ستنتهي خلال أسبوع ({expiringBusinesses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expiringBusinesses.map(b => (
                <div 
                  key={b.id} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 cursor-pointer hover-elevate"
                  onClick={() => setSelectedFilter('expiring')}
                  data-testid={`alert-expiring-${b.id}`}
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                    {b.subscriptionInfo.daysRemaining} يوم
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الاشتراك العادي</p>
                <p className="text-xl font-bold">5,000 <span className="text-sm font-normal text-muted-foreground">د.ع/شهر</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-primary">اشتراك مميز</p>
                <p className="text-xl font-bold text-primary">10,000 <span className="text-sm font-normal text-primary/70">د.ع/شهر</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-green-400">الإيرادات الشهرية</p>
                <p className="text-xl font-bold text-green-400">{monthlyRevenue.toLocaleString('ar-IQ')} <span className="text-sm font-normal">د.ع</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>
              {selectedFilter === 'all' ? 'جميع المحلات' : 
               selectedFilter === 'active' ? 'المحلات النشطة' :
               selectedFilter === 'expired' ? 'المحلات المنتهية' :
               selectedFilter === 'vip' ? 'المحلات المميزة' :
               selectedFilter === 'expiring' ? 'ستنتهي قريباً' : 'جميع المحلات'}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredBusinesses.length} محل) - مرتبة حسب تاريخ الانتهاء
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBusinesses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد محلات في هذا التصنيف</p>
          ) : (
            <div className="space-y-3">
              {filteredBusinesses.map((business) => (
                <div 
                  key={business.id} 
                  className="p-4 rounded-lg border border-border bg-card/50"
                  data-testid={`subscription-item-${business.id}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {business.imageUrl ? (
                        <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                          {business.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm">{business.name}</h3>
                        {business.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                        {business.subscriptionInfo.tier === 'vip' && (
                          <Crown className="w-3 h-3 text-primary" />
                        )}
                        {business.subscriptionInfo.status === 'trial' && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400">تجريبي</span>
                        )}
                        {business.subscriptionInfo.status === 'active' && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400">فعال</span>
                        )}
                        {(business.subscriptionInfo.status === 'expired' || business.subscriptionInfo.status === 'trial_expired') && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400">منتهي</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{business.category?.name || "بدون قسم"}</p>
                    </div>

                    <div className="text-left flex-shrink-0">
                      <div className={`text-lg font-bold ${business.subscriptionInfo.daysRemaining <= 7 ? 'text-orange-400' : business.subscriptionInfo.daysRemaining <= 0 ? 'text-red-400' : 'text-foreground'}`}>
                        {business.subscriptionInfo.daysRemaining}
                      </div>
                      <div className="text-[10px] text-muted-foreground">يوم</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getProgressColor(business.subscriptionInfo.daysRemaining)}`}
                        style={{ width: `${getProgressValue(business.subscriptionInfo.daysRemaining, business.subscriptionInfo.tier)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">ينتهي: {getExpirationDate(business.subscriptionInfo.daysRemaining)}</span>
                    </div>
                  </div>
                    
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 flex-1"
                      onClick={() => handleRenew(business.id, 'regular')}
                      disabled={updateMutation.isPending}
                      data-testid={`button-renew-regular-${business.id}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      عادي
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1 flex-1"
                      onClick={() => handleRenew(business.id, 'vip')}
                      disabled={updateMutation.isPending}
                      data-testid={`button-renew-vip-${business.id}`}
                    >
                      <Crown className="w-3 h-3" />
                      مميز
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => handleResetTrial(business.id)}
                      disabled={updateMutation.isPending}
                      data-testid={`button-reset-trial-${business.id}`}
                    >
                      تجريبي
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface OfferResponse {
  id: number;
  businessId: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string | null;
  business?: {
    id: number;
    name: string;
    categoryId: number;
  };
}

function OffersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferResponse | null>(null);

  const { data: offers, isLoading } = useQuery<OfferResponse[]>({
    queryKey: ["/api/admin/offers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/offers");
      return res.json();
    },
  });

  const { data: businesses } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/admin/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/businesses");
      return res.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({ title: "تم إضافة العرض بنجاح" });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({ title: "تم تحديث العرض بنجاح" });
      setEditingOffer(null);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({ title: "تم حذف العرض" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">العروض الخاصة</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-offer">
              <Plus className="w-4 h-4" />
              إضافة عرض
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة عرض جديد</DialogTitle>
            </DialogHeader>
            <OfferForm
              businesses={businesses || []}
              categories={categories || []}
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingOffer} onOpenChange={(open) => !open && setEditingOffer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل العرض</DialogTitle>
          </DialogHeader>
          {editingOffer && (
            <OfferForm
              offer={editingOffer}
              businesses={businesses || []}
              categories={categories || []}
              onSubmit={(data) => updateMutation.mutate({ id: editingOffer.id, data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {offers?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد عروض حالياً
            </CardContent>
          </Card>
        ) : (
          offers?.map((offer) => (
            <Card key={offer.id} className={`${!offer.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{offer.title}</h3>
                    {!offer.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">غير نشط</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Store className="w-3 h-3" />
                      {offer.business?.name || "محل غير محدد"}
                    </span>
                    {offer.validUntil && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        صالح حتى: {new Date(offer.validUntil).toLocaleDateString("ar")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingOffer(offer)}
                    data-testid={`button-edit-offer-${offer.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-offer-${offer.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف العرض</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(offer.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function OfferForm({ 
  offer, 
  businesses,
  categories,
  onSubmit, 
  isLoading 
}: { 
  offer?: OfferResponse | null;
  businesses: BusinessResponse[];
  categories: Category[];
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const initialCategoryId = offer?.business?.categoryId?.toString() || "";
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [title, setTitle] = useState(offer?.title || "");
  const [description, setDescription] = useState(offer?.description || "");
  const [imageUrl, setImageUrl] = useState(offer?.imageUrl || "");
  const [businessId, setBusinessId] = useState<string>(offer?.businessId?.toString() || "");
  const [validUntil, setValidUntil] = useState(offer?.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : "");
  const [isActive, setIsActive] = useState(offer?.isActive ?? true);

  const filteredBusinesses = categoryId 
    ? businesses.filter(b => b.category?.id === parseInt(categoryId))
    : businesses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    onSubmit({
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      businessId: parseInt(businessId),
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">القسم *</label>
        <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setBusinessId(""); }}>
          <SelectTrigger data-testid="select-offer-category">
            <SelectValue placeholder="اختر القسم أولاً" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">المحل *</label>
        <Select value={businessId} onValueChange={setBusinessId} disabled={!categoryId}>
          <SelectTrigger data-testid="select-offer-business">
            <SelectValue placeholder={categoryId ? "اختر المحل" : "اختر القسم أولاً"} />
          </SelectTrigger>
          <SelectContent>
            {filteredBusinesses.map((b) => (
              <SelectItem key={b.id} value={b.id.toString()}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">عنوان العرض *</label>
        <Input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="مثال: خصم 20% على جميع المنتجات"
          required
          data-testid="input-offer-title"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">تفاصيل العرض</label>
        <Textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          placeholder="تفاصيل إضافية عن العرض..."
          data-testid="input-offer-description"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">صورة العرض</label>
        <ImageUploadField
          value={imageUrl}
          onChange={setImageUrl}
          placeholder="رابط صورة العرض (اختياري)"
          testId="input-offer-image"
          previewClassName="w-full h-32"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">صالح حتى</label>
        <Input 
          type="date"
          value={validUntil} 
          onChange={(e) => setValidUntil(e.target.value)}
          data-testid="input-offer-valid-until"
        />
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="offerIsActive" 
          checked={isActive} 
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4"
          data-testid="checkbox-offer-active"
        />
        <label htmlFor="offerIsActive" className="text-sm font-medium">عرض نشط</label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !businessId || !title} data-testid="button-submit-offer">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : offer ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );
}

interface ReviewWithBusiness {
  id: number;
  businessId: number;
  categoryId: number;
  visitorName: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date | null;
  businessName: string;
  categoryName: string;
}

function ReviewsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.json();
    },
  });

  const { data: allBusinesses } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/admin/businesses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/businesses");
      return res.json();
    },
  });

  const { data: reviews, isLoading } = useQuery<ReviewWithBusiness[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reviews");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "تم حذف التقييم" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const businessesInCategory = selectedCategoryId 
    ? allBusinesses?.filter(b => b.categoryId === selectedCategoryId) || []
    : [];

  const filteredReviews = reviews?.filter(review => {
    if (selectedBusinessId) {
      return review.businessId === selectedBusinessId;
    }
    if (selectedCategoryId) {
      return review.categoryId === selectedCategoryId;
    }
    return true;
  }) || [];

  const handleCategoryChange = (value: string) => {
    const catId = value === "all" ? null : parseInt(value);
    setSelectedCategoryId(catId);
    setSelectedBusinessId(null);
  };

  const handleBusinessChange = (value: string) => {
    const bizId = value === "all" ? null : parseInt(value);
    setSelectedBusinessId(bizId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-6">إدارة المراجعات</h2>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            تصفية المراجعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر القسم أولاً</label>
              <Select value={selectedCategoryId?.toString() || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger data-testid="select-review-category">
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ثم اختر المحل</label>
              <Select 
                value={selectedBusinessId?.toString() || "all"} 
                onValueChange={handleBusinessChange}
                disabled={!selectedCategoryId}
              >
                <SelectTrigger data-testid="select-review-business">
                  <SelectValue placeholder={selectedCategoryId ? "اختر المحل" : "اختر القسم أولاً"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المحلات في القسم</SelectItem>
                  {businessesInCategory.map((biz) => (
                    <SelectItem key={biz.id} value={biz.id.toString()}>
                      {biz.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            المراجعات ({filteredReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div 
                  key={review.id} 
                  className="p-4 bg-muted/50 rounded-lg border border-border/50"
                  data-testid={`review-item-${review.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-bold">{review.visitorName}</span>
                        <div className="flex items-center gap-0.5 text-primary">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-30'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs ml-2">{review.categoryName}</span>
                        على: <span className="font-medium text-foreground">{review.businessName}</span>
                      </p>
                      {review.comment && (
                        <p className="text-sm">{review.comment}</p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-review-${review.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف التقييم</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(review.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {selectedCategoryId || selectedBusinessId 
                ? "لا توجد مراجعات للمحل أو القسم المحدد"
                : "لا توجد مراجعات حتى الآن"
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return res.json();
    },
  });

  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || "#d4a017");
  const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || "#1a1a1a");

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primaryColor || "#d4a017");
      setBackgroundColor(settings.backgroundColor || "#1a1a1a");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "تم حفظ الإعدادات" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ primaryColor, backgroundColor });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-6">إعدادات المظهر</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">اللون الأساسي</label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
                data-testid="input-primary-color"
              />
              <Input 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">لون الخلفية</label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
                data-testid="input-background-color"
              />
              <Input 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-settings">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ الإعدادات"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
