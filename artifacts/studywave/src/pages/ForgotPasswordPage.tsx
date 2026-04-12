import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2, Copy, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token: string } | null>(null);
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
      if (!r.ok) { setError(data.error || "Something went wrong"); return; }
      if (data.resetToken) {
        setResult({ token: data.resetToken });
      } else {
        setResult({ token: "" });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (result?.token) {
      navigator.clipboard?.writeText(result.token);
      toast({ title: "Token copied to clipboard" });
    }
  };

  const copyLink = () => {
    if (result?.token) {
      const url = `${window.location.origin}/reset-password?token=${result.token}`;
      navigator.clipboard?.writeText(url);
      toast({ title: "Reset link copied to clipboard" });
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
                <h1 className="text-lg font-extrabold text-foreground">Forgot Password</h1>
                <p className="text-xs text-muted-foreground">We'll generate a reset token for you</p>
              </div>
            </div>

            {result ? (
              <div className="space-y-4">
                {result.token ? (
                  <>
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Reset token generated!</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Copy the reset link below and open it to set a new password. This link expires in 1 hour.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Reset Token</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-gray-50 border border-border/60 rounded-lg px-3 py-2 font-mono truncate text-foreground/80 select-all">
                          {result.token}
                        </code>
                        <button onClick={copyToken} className="p-2 rounded-lg border border-border/60 hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-colors">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/reset-password?token=${result.token}`}>
                        <Button className="flex-1 gradient-primary text-white border-0 rounded-xl font-semibold h-10">
                          Open Reset Page
                        </Button>
                      </Link>
                      <button onClick={copyLink} className="px-3 py-2 border border-border/60 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
                        Copy Link
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">If that email exists, a reset token has been generated. Please contact an admin for assistance.</p>
                  </div>
                )}

                <Link href="/login">
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                  </button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
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
                      Generating...
                    </span>
                  ) : "Generate Reset Token"}
                </Button>

                <div className="text-center">
                  <Link href="/login">
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
                      <ArrowLeft className="h-4 w-4" /> Back to Sign In
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
