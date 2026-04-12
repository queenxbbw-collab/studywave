import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Zap, Star, Crown, Rocket, ChevronLeft, CheckCircle2, Loader2, ShoppingCart } from "lucide-react";

interface PointPackage {
  id: string;
  label: string;
  points: number;
  price: number;
  description: string;
}

const PACKAGE_ICONS: Record<string, typeof Zap> = {
  pack_100: Zap,
  pack_500: Star,
  pack_1200: Crown,
  pack_3000: Rocket,
};

const PACKAGE_COLORS: Record<string, string> = {
  pack_100: "from-blue-500 to-blue-600",
  pack_500: "from-indigo-500 to-indigo-600",
  pack_1200: "from-purple-500 to-purple-600",
  pack_3000: "from-amber-500 to-amber-600",
};

export default function BuyPointsPage() {
  usePageTitle("Buy Points");
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setSuccess(true);
      setSuccessPoints(parseInt(params.get("points") || "0"));
      window.history.replaceState({}, "", "/buy-points");
    }
    fetch(`${getBaseUrl()}/payments/packages`)
      .then(r => r.json())
      .then(d => setPackages(d.packages || []))
      .catch(() => {});
  }, []);

  const handleBuy = async (pkg: PointPackage) => {
    setLoadingPkg(pkg.id);
    try {
      const res = await fetch(`${getBaseUrl()}/payments/checkout`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Something went wrong", variant: "destructive" });
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoadingPkg(null);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <h1 className="text-2xl font-black text-foreground">Buy Points</h1>
        <p className="text-sm text-muted-foreground mt-1">Purchase points to unlock more daily questions and features.</p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-700">Payment successful!</p>
            <p className="text-sm text-emerald-600">{successPoints} points have been added to your account.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border/60 shadow-xs p-4 mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your current balance</p>
          <p className="text-xl font-black text-foreground">{user.points.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">points</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {packages.map(pkg => {
          const Icon = PACKAGE_ICONS[pkg.id] || Zap;
          const gradient = PACKAGE_COLORS[pkg.id] || "from-indigo-500 to-indigo-600";
          const isLoading = loadingPkg === pkg.id;
          const isBest = pkg.id === "pack_500";

          return (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl border shadow-xs overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${isBest ? "border-primary ring-1 ring-primary/30" : "border-border/60"}`}
            >
              {isBest && (
                <div className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                  BEST VALUE
                </div>
              )}
              <div className={`bg-gradient-to-br ${gradient} p-5`}>
                <Icon className="h-8 w-8 text-white mb-2 opacity-90" />
                <p className="text-white font-black text-lg">{pkg.label}</p>
                <p className="text-white/80 text-xs mt-0.5">{pkg.description}</p>
              </div>
              <div className="p-4">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-black text-foreground">{pkg.points.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground ml-1">points</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-foreground">${(pkg.price / 100).toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full gradient-primary text-white border-0 rounded-xl font-semibold shadow-sm hover:opacity-90 gap-2"
                  onClick={() => handleBuy(pkg)}
                  disabled={isLoading || !!loadingPkg}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4" /> Buy now</>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Payments are processed securely via Stripe. Points are added instantly after payment.
      </p>
    </div>
  );
}
