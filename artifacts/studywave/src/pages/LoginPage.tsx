import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, Users, Award } from "lucide-react";

export default function LoginPage() {
  usePageTitle("Sign In");
  const { login, user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/");
  }, [authLoading, user, navigate]);

  if (authLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      toast({ title: err.message || "Sign in failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden border-r border-border/60 gradient-hero">
        <div className="absolute inset-0 dot-bg opacity-60"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/6 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <BookOpen className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-foreground">StudyWave</span>
          </Link>

          <h2 className="text-3xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
            Welcome<br />back!
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Continue your learning journey. The community is waiting with new questions and answers.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: CheckCircle2, text: "Community-verified answers", color: "text-emerald-500" },
              { icon: Users, text: "Thousands of students worldwide", color: "text-blue-500" },
              { icon: Award, text: "Unique rewards & recognition system", color: "text-amber-500" },
              { icon: Sparkles, text: "Quality content across all subjects", color: "text-violet-500" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${item.color}`} />
                <span className="text-sm text-foreground/75 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="p-4 bg-white/80 backdrop-blur rounded-xl border border-border/60 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">A</div>
              <div>
                <p className="text-xs font-semibold">Alex Johnson</p>
                <p className="text-xs text-muted-foreground">1,240 pts · Top 3</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              "StudyWave helped me truly understand calculus. The answers are clear, detailed, and always helpful!"
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8 lg:text-left">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sign In</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 rounded-xl border-border/70 bg-white shadow-xs focus-visible:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="h-11 rounded-xl border-border/70 bg-white shadow-xs pr-12 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-white border-0 h-11 rounded-xl font-semibold shadow-sm hover:opacity-95 transition-all gap-2 text-base mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <>Sign In <ArrowRight className="h-4.5 w-4.5" /></>
              )}
            </Button>
          </form>

          <div className="mt-4 p-3.5 bg-gray-50 border border-border/60 rounded-xl">
            <p className="text-xs font-semibold text-foreground mb-1.5">Demo accounts:</p>
            <button onClick={() => { setEmail("admin@studywave.com"); setPassword("admin123"); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors block">
              Admin: admin@studywave.com / admin123
            </button>
            <button onClick={() => { setEmail("alex@studywave.com"); setPassword("user123"); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors block mt-0.5">
              User: alex@studywave.com / user123
            </button>
          </div>

          <div className="mt-5 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Sign up for free
              </Link>
            </p>
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
