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
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "misinformation", label: "Incorrect or misleading information" },
  { value: "off_topic", label: "Off-topic or irrelevant" },
  { value: "other", label: "Other" },
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
      toast({ title: "Please select a reason", variant: "destructive" });
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
        toast({ title: data.error || "Failed to submit report", variant: "destructive" });
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
              <h2 className="font-bold text-foreground text-sm">Report Content</h2>
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
            <h3 className="font-bold text-foreground mb-2">Report submitted</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Thank you for helping keep StudyWave safe. Our team will review this report.
            </p>
            <Button onClick={onClose} className="gradient-primary text-white border-0 h-9 px-6 rounded-xl font-semibold">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Please only report content that genuinely violates our community guidelines. Abuse of the report system may lead to account suspension.
              </p>
            </div>

            {/* Reason selection */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Why are you reporting this?</label>
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
                Additional details <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Provide any additional context that may help our team..."
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
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm"
                disabled={loading || !reason}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
