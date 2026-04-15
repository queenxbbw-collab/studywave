import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  usePageTitle("Resetare Parolă");
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Parolele nu coincid");
      return;
    }
    if (newPassword.length < 6) {
      setError("Parola trebuie să aibă cel puțin 6 caractere");
      return;
    }
    if (!token.trim()) {
      setError("Tokenul de resetare este obligatoriu");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Resetarea a eșuat. Tokenul poate fi expirat."); return; }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
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
                <h1 className="text-lg font-extrabold text-foreground">Setează Parola Nouă</h1>
                <p className="text-xs text-muted-foreground">Introdu tokenul de resetare și noua parolă</p>
              </div>
            </div>

            {success ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Parola a fost actualizată!</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecționare către autentificare...</p>
                </div>
                <Link href="/login">
                  <Button className="gradient-primary text-white border-0 rounded-xl font-semibold h-10 w-full">
                    Autentifică-te Acum
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Token de Resetare</Label>
                  <Input
                    type="text"
                    placeholder="Lipește tokenul de resetare aici"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="h-11 rounded-xl border-border/70 focus-visible:border-primary font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Nu ai un token?{" "}
                    <Link href="/forgot-password">
                      <span className="text-primary hover:underline cursor-pointer">Solicită unul aici</span>
                    </Link>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Parolă Nouă</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Cel puțin 6 caractere"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-11 rounded-xl border-border/70 focus-visible:border-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Confirmă Parola Nouă</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repetă noua parolă"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`h-11 rounded-xl border-border/70 focus-visible:border-primary ${confirmPassword && confirmPassword !== newPassword ? "border-red-400" : ""}`}
                    required
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Parolele nu coincid
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !token.trim() || !newPassword || newPassword !== confirmPassword}
                  className="w-full gradient-primary text-white border-0 h-11 rounded-xl font-semibold shadow-sm hover:opacity-90"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Se actualizează...
                    </span>
                  ) : "Actualizează Parola"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Îți amintești parola?{" "}
                  <Link href="/login">
                    <span className="text-primary font-medium hover:underline cursor-pointer">Autentifică-te</span>
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
