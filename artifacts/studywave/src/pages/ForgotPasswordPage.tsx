import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  usePageTitle("Parolă Uitată");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Ceva nu a mers bine. Încearcă din nou.");
        return;
      }
      setSent(true);
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="h-2 gradient-primary" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-foreground">Parolă Uitată</h1>
                <p className="text-xs text-muted-foreground">Îți vom trimite un link de resetare pe email</p>
              </div>
            </div>

            {sent ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Verifică-ți căsuța de email</p>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Dacă <span className="font-medium">{email}</span> este înregistrat pe StudyWave, vei primi în scurt timp un link de resetare. Linkul expiră în 1 oră.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <span className="font-semibold">Nu ai primit emailul?</span> Verifică folderul spam sau contactează administratorul platformei.
                  </p>
                </div>

                <Link href="/login">
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Înapoi la Autentificare
                  </button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold">Adresă de email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@exemplu.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-9 h-11 rounded-xl border-border/70 focus-visible:border-primary"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full gradient-primary text-white border-0 h-11 rounded-xl font-semibold shadow-sm hover:opacity-90"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Se trimite...
                    </span>
                  ) : "Trimite Link de Resetare"}
                </Button>

                <div className="text-center">
                  <Link href="/login">
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
                      <ArrowLeft className="h-4 w-4" /> Înapoi la Autentificare
                    </button>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
