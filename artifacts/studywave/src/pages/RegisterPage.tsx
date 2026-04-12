import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles, Zap, Award } from "lucide-react";

const PERKS = [
  { icon: Sparkles, text: "+5 puncte la fiecare intrebare", color: "text-violet-600 bg-violet-50" },
  { icon: Zap, text: "+10 puncte la fiecare raspuns", color: "text-blue-600 bg-blue-50" },
  { icon: Award, text: "+50 puncte pentru fundita de aur", color: "text-amber-600 bg-amber-50" },
  { icon: CheckCircle2, text: "Badge-uri si titluri exclusive", color: "text-emerald-600 bg-emerald-50" },
];

export default function RegisterPage() {
  const { register, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) { navigate("/"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.displayName) {
      toast({ title: "Completeaza toate campurile", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.displayName);
      navigate("/");
    } catch (err: any) {
      toast({ title: err.message || "Inregistrare esecuata", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Creeaza contul tau</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Alatura-te comunitatii de studenti ambitiosi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Nume afisat</label>
                <Input
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Ion Popescu"
                  required
                  className="h-10 rounded-xl border-border/70 bg-white shadow-xs"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Username</label>
                <Input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  placeholder="ion_popescu"
                  required
                  className="h-10 rounded-xl border-border/70 bg-white shadow-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ion@exemplu.com"
                required
                className="h-10 rounded-xl border-border/70 bg-white shadow-xs"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Parola</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Minim 6 caractere"
                  minLength={6}
                  required
                  className="h-10 rounded-xl border-border/70 bg-white shadow-xs pr-12"
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
                  Se creeaza contul...
                </div>
              ) : (
                <>Creeaza cont gratuit <ArrowRight className="h-4.5 w-4.5" /></>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Prin inregistrare esti de acord cu{" "}
              <span className="text-primary hover:underline cursor-pointer">Termenii de Utilizare</span>
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Ai deja cont?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Autentifica-te
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
            Ce primesti gratuit?
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Un cont StudyWave iti ofera acces la toate functionalitatile platformei, fara costuri ascunse.
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

          <div className="p-4 bg-primary/6 border border-primary/15 rounded-xl">
            <p className="text-xs font-semibold text-primary mb-1">Complet gratuit, mereu!</p>
            <p className="text-xs text-muted-foreground">
              StudyWave nu are costuri de abonament. Invatarea nu ar trebui sa coste nimic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
