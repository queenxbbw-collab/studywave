import { useState, useEffect, useRef } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Zap, Star, Crown, Rocket, ChevronLeft, CheckCircle2, Loader2, ShoppingCart, Infinity } from "lucide-react";

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
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [premiumSuccess, setPremiumSuccess] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setSuccess(true);
      setSuccessPoints(parseInt(params.get("points") || "0"));
      window.history.replaceState({}, "", "/buy-points");
      refreshUser();
    }
    if (params.get("premium_success")) {
      const sessionId = params.get("session_id");
      window.history.replaceState({}, "", "/buy-points");
      if (sessionId && !verifiedRef.current) {
        verifiedRef.current = true;
        fetch(`${getBaseUrl()}/payments/verify-premium`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setPremiumSuccess(true);
              refreshUser();
            }
          })
          .catch(() => {
            setPremiumSuccess(true);
          });
      } else {
        setPremiumSuccess(true);
      }
    }
    fetch(`${getBaseUrl()}/payments/packages`)
      .then(r => r.json())
      .then(d => setPackages(d.packages || []))
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoadingSubscribe(true);
    try {
      const res = await fetch(`${getBaseUrl()}/payments/subscribe`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Something went wrong", variant: "destructive" });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoadingSubscribe(false);
    }
  };

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
      if (data.url) window.location.href = data.url;
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
        <Link href={`/profile/${user.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <h1 className="text-2xl font-black text-foreground">Plans & Points</h1>
        <p className="text-sm text-muted-foreground mt-1">Upgrade to Premium or purchase extra points.</p>
      </div>

      {premiumSuccess && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <CheckCircle2 className="h-6 w-6 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-700">Welcome to Premium!</p>
            <p className="text-sm text-amber-600">You now have unlimited questions per day and a Premium badge.</p>
          </div>
        </div>
      )}

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

      {/* Premium Subscription Card */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Premium Plan</h2>
        <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-6 w-6 text-white" />
                  <span className="text-xl font-black text-white">Premium</span>
                </div>
                <p className="text-amber-100 text-sm">Everything you need, no limits</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">$4.99</p>
                <p className="text-amber-200 text-xs">/month</p>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              {[
                { icon: Infinity, text: "Unlimited questions per day" },
                { icon: Crown, text: "Exclusive Premium badge on your profile" },
                { icon: Star, text: "Priority in community recognition" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-white text-sm">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
            {user.isPremium ? (
              <div className="w-full bg-white/20 border border-white/30 rounded-xl h-10 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span className="font-bold text-white text-sm">You're already Premium!</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleSubscribe}
                  disabled={loadingSubscribe}
                  className="w-full bg-white text-amber-600 hover:bg-amber-50 font-bold rounded-xl border-0 shadow-sm h-10"
                >
                  {loadingSubscribe ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    <><Crown className="h-4 w-4 mr-2" /> Upgrade to Premium</>
                  )}
                </Button>
                <p className="text-amber-200 text-xs text-center mt-2">Cancel anytime. Billed monthly.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Point Packages */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Buy Points</h2>
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
                    disabled={isLoading || !!loadingPkg || loadingSubscribe}
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
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Payments are processed securely via Stripe.
      </p>
    </div>
  );
}
