import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  XCircle,
  CheckCircle2,
  Loader2,
  Scale
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { BusinessResponse, Category } from "@shared/schema";

const STORAGE_KEY = "compare_businesses";

export default function Compare() {
  const { t, language } = useI18n();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelectedIds(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
  }, [selectedIds]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: businesses, isLoading } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/businesses"],
  });

  const selectedBusinesses = businesses?.filter(b => selectedIds.includes(b.id)) || [];

  const addToCompare = (id: number) => {
    if (!selectedIds.includes(id) && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeFromCompare = (id: number) => {
    setSelectedIds(selectedIds.filter(sid => sid !== id));
  };

  const clearCompare = () => {
    setSelectedIds([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-display font-bold">{t("compare.title")}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("compare.select")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Select onValueChange={(val) => addToCompare(parseInt(val))}>
                <SelectTrigger className="w-full sm:w-64" data-testid="select-compare-business">
                  <SelectValue placeholder={t("compare.select")} />
                </SelectTrigger>
                <SelectContent>
                  {businesses?.filter(b => !selectedIds.includes(b.id)).map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {language === "ar" ? b.name : (b.nameEn || b.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedIds.length > 0 && (
                <Button variant="outline" onClick={clearCompare} data-testid="button-clear-compare">
                  {t("compare.clear")}
                </Button>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedBusinesses.map(b => (
                  <Badge 
                    key={b.id} 
                    variant="secondary" 
                    className="gap-1 px-3 py-1.5"
                    data-testid={`badge-compare-${b.id}`}
                  >
                    {language === "ar" ? b.name : (b.nameEn || b.name)}
                    <button 
                      onClick={() => removeFromCompare(b.id)}
                      className="mr-1 hover:text-destructive"
                      data-testid={`button-remove-compare-${b.id}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedBusinesses.length >= 2 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 border border-border bg-muted text-right font-medium">
                    المعايير
                  </th>
                  {selectedBusinesses.map(b => (
                    <th key={b.id} className="p-3 border border-border bg-muted min-w-[200px]">
                      <div className="flex flex-col items-center gap-2">
                        {b.imageUrl && (
                          <img 
                            src={b.imageUrl} 
                            alt={b.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-bold text-center">
                          {language === "ar" ? b.name : (b.nameEn || b.name)}
                        </span>
                        {b.isVerified && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            موثق
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      التقييم
                    </div>
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-primary fill-primary" />
                        <span className="font-bold">{b.averageRating?.toFixed(1) || "-"}</span>
                        <span className="text-muted-foreground text-sm">
                          ({b.reviewCount || 0})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      العنوان
                    </div>
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border text-center">
                      {language === "ar" ? b.address : (b.addressEn || b.address)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      الهاتف
                    </div>
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border text-center" dir="ltr">
                      {b.phone || "-"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      ساعات العمل
                    </div>
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border text-center">
                      {b.workingHoursJson || "-"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    القسم
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border text-center">
                      <Badge variant="outline">
                        {language === "ar" 
                          ? b.category?.name 
                          : (b.category?.nameEn || b.category?.name)
                        }
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    الخدمات
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border">
                      <div className="flex flex-wrap justify-center gap-1">
                        {b.services?.slice(0, 3).map((service, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {(b.services?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(b.services?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-border font-medium">
                    التفاصيل
                  </td>
                  {selectedBusinesses.map(b => (
                    <td key={b.id} className="p-3 border border-border text-center">
                      <Link href={`/business/${b.id}`}>
                        <Button size="sm" data-testid={`button-view-${b.id}`}>
                          عرض المحل
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">{t("compare.empty")}</p>
              <p className="text-sm text-muted-foreground mt-2">
                اختر محلين على الأقل من القائمة أعلاه للمقارنة بينهم
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
