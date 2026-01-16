import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Delini_1768321622197.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "تم تسجيل الدخول بنجاح" });
        setLocation("/admin");
      } else {
        toast({ 
          title: "خطأ في تسجيل الدخول", 
          description: data.message,
          variant: "destructive" 
        });
      }
    } catch {
      toast({ 
        title: "خطأ في الاتصال", 
        description: "تأكد من اتصالك بالإنترنت",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mb-8">
        <Link href="/">
          <Button 
            variant="outline" 
            className="gap-2"
            data-testid="button-back-to-site"
          >
            <ArrowRight className="w-4 h-4" />
            القائمة الرئيسية
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-28 h-28 mb-4">
            <img src={logoImg} alt="Delini" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <CardTitle className="text-2xl font-display">لوحة التحكم</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">سجل دخولك للوصول إلى لوحة التحكم</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10"
                  required
                  data-testid="input-admin-username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  required
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
