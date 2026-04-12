import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles, Zap, Award, Gift } from "lucide-react";

const PERKS = [
  { icon: Sparkles, text: "+5 points for every question you ask", color: "text-violet-600 bg-violet-50" },
  { icon: Zap, text: "+10 points for every answer you post", color: "text-blue-600 bg-blue-50" },
  { icon: Award, text: "+50 points when your answer wins Gold Ribbon", color: "text-amber-600 bg-amber-50" },
  { icon: CheckCircle2, text: "Exclusive badges & titles to unlock", color: "text-emerald-600 bg-emerald-50" },
];

export default function RegisterPage() {
  const { register, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "", referralCode: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) { navigate("/"); return null; }

  // Pre-fill referral code from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const urlRef = urlParams.get("ref");
  if (urlRef && !form.referralCode) {
    setForm(f => ({ ...f, referralCode: urlRef }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.displayName) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.displayName, form.referralCode || undefined);
      navigate("/");
    } catch (err: any) {
      toast({ title: err.message || "Registration failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Join thousands of ambitious students worldwide</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Display name</label>
                <Input
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="John Smith"
                  required
                  className="h-10 rounded-xl border-border/70 bg-white shadow-xs"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Username</label>
                <Input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  placeholder="john_smith"
                  required
                  className="h-10 rounded-xl border-border/70 bg-white shadow-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Email address</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
                required
                className="h-10 rounded-xl border-border/70 bg-white shadow-xs"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="h-10 rounded-xl border-border/70 bg-white shadow-xs pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Referral code */}
            {(showReferral || urlRef) ? (
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5 text-emerald-500" />
                  Referral code <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  value={form.referralCode}
                  onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. JOHN1A2B3C"
                  className="h-10 rounded-xl border-emerald-200 bg-emerald-50/40 focus-visible:border-emerald-400 shadow-xs font-mono uppercase"
                />
                <p className="text-xs text-emerald-600 mt-1">Your friend will receive +25 points when you join!</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowReferral(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Gift className="h-3.5 w-3.5" /> Have a referral code? Click to enter it
              </button>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-white border-0 h-11 rounded-xl font-semibold shadow-sm hover:opacity-95 transition-all gap-2 text-base mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                <>Create Free Account <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By signing up you agree to our{" "}
              <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-col justify-center w-[420px] flex-shrink-0 p-12 relative overflow-hidden border-l border-border/60 gradient-hero">
        <div className="absolute inset-0 dot-bg opacity-50"></div>
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/6 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-md mb-6">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">
            What you get for free
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            A StudyWave account gives you access to all platform features — no hidden costs, ever.
          </p>

          <div className="space-y-3 mb-8">
            {PERKS.map(perk => (
              <div key={perk.text} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-border/60 shadow-xs">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${perk.color}`}>
                  <perk.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground/80">{perk.text}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Referral bonus</p>
            <p className="text-xs text-emerald-600">
              Invite friends with your unique referral link and earn <strong>+25 points</strong> each time someone joins!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
