import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Flag, X, AlertTriangle } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

interface ReportModalProps {
  targetType: "question" | "answer" | "user";
  targetId: number;
  targetLabel?: string;
  onClose: () => void;
}

const REASONS = [
  { value: "spam", label: "Spam sau publicitate" },
  { value: "harassment", label: "Hărțuire sau intimidare" },
  { value: "inappropriate_content", label: "Conținut inadecvat" },
  { value: "misinformation", label: "Informații incorecte sau înșelătoare" },
  { value: "off_topic", label: "În afara subiectului" },
  { value: "other", label: "Altele" },
];

export default function ReportModal({ targetType, targetId, targetLabel, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast({ title: "Te rugăm să selectezi un motiv", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ targetType, targetId, reason, details: details || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Raportarea a eșuat", variant: "destructive" });
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl border border-border/60 shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <Flag className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm">Raportează Conținut</h2>
              {targetLabel && <p className="text-xs text-muted-foreground">{targetLabel}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <Flag className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Raport trimis</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Mulțumim că ajuți la menținerea StudyWave în siguranță. Echipa noastră va analiza acest raport.
            </p>
            <Button onClick={onClose} className="gradient-primary text-white border-0 h-9 px-6 rounded-xl font-semibold">
              Închide
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Te rugăm să raportezi doar conținut care încalcă cu adevărat regulile comunității. Abuzul sistemului de raportare poate duce la suspendarea contului.
              </p>
            </div>

            {/* Reason selection */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">De ce raportezi acest conținut?</label>
              <div className="space-y-2">
                {REASONS.map(r => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reason === r.value
                        ? "border-primary/40 bg-primary/6"
                        : "border-border/60 hover:border-border hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Detalii suplimentare <span className="text-xs font-normal text-muted-foreground">(opțional)</span>
              </label>
              <Textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Oferă orice context suplimentar care poate ajuta echipa noastră..."
                rows={3}
                className="resize-none rounded-xl border-border/70 text-sm"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-9 rounded-xl font-semibold"
              >
                Anulează
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm"
                disabled={loading || !reason}
              >
                {loading ? "Se trimite..." : "Trimite Raport"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
