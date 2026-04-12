import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, HelpCircle, Lightbulb, CheckCircle2, Zap, ArrowRight, X, ImageIcon, AlertCircle, Shield, ShoppingCart, Upload, Loader2 } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { getBaseUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import MarkdownToolbar from "@/components/MarkdownToolbar";

const SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","History","Geography",
  "Literature","Computer Science","Economics","Languages",
  "Philosophy","Psychology","Music","Art","Engineering","Medicine","Environment","Law","Sports",
  "Other"
];

const TIPS = [
  { icon: CheckCircle2, text: "Be specific — title must be at least 15 characters", color: "text-emerald-600 bg-emerald-50" },
  { icon: Lightbulb, text: "Describe what you've tried (min 50 characters)", color: "text-amber-600 bg-amber-50" },
  { icon: Zap, text: "Add image URLs for diagrams or screenshots (up to 5)", color: "text-blue-600 bg-blue-50" },
];

const MIN_TITLE = 15;
const MIN_CONTENT = 50;
const DAILY_LIMIT = 5;
const BUY_COST = 50;
const BUY_EXTRA = 5;

interface DailyLimits {
  questionsToday: number;
  questionsRemaining: number;
  questionLimit: number;
  questionBonusPool: number;
  points: number;
}

export default function AskPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [limits, setLimits] = useState<DailyLimits | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const processImageFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { setIsUploading(false); resolve(); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setImageUrls(prev => [...prev, dataUrl]);
          setIsUploading(false);
          toast({ title: "Image added" });
          resolve();
        };
        img.onerror = () => {
          setIsUploading(false);
          toast({ title: "Could not read image", variant: "destructive" });
          resolve();
        };
        img.src = ev.target?.result as string;
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({ title: "Could not read file", variant: "destructive" });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrls.length >= 5) {
      toast({ title: "Maximum 5 images per question", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    await processImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchLimits = () => {
    if (!user) return;
    fetch(`${getBaseUrl()}/my-limits`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setLimits)
      .catch(() => {});
  };

  useEffect(() => { fetchLimits(); }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const handleBuyExtra = async () => {
    setIsBuying(true);
    try {
      const res = await fetch(`${getBaseUrl()}/questions/buy-extra`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Purchase failed", variant: "destructive" });
        return;
      }
      toast({ title: `Purchased ${BUY_EXTRA} extra question slots!`, description: `${data.points} points remaining.` });
      fetchLimits();
      await refreshUser();
    } finally {
      setIsBuying(false);
    }
  };

  usePageTitle("Ask a Question");

  if (authLoading || !user) return null;

  const removeImageUrl = (idx: number) => setImageUrls(imageUrls.filter((_, i) => i !== idx));

  const titleOk = title.trim().length >= MIN_TITLE;
  const contentOk = content.trim().length >= MIN_CONTENT;
  const canSubmit = titleOk && contentOk && !!subject && !isSubmitting && (limits ? limits.questionsRemaining > 0 : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (limits && limits.questionsRemaining <= 0) {
      toast({ title: `Daily limit reached (${DAILY_LIMIT} questions/day). Come back tomorrow!`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("studywave_token") || "";
      const res = await fetch(`${getBaseUrl()}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), subject, imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to publish", variant: "destructive" });
        return;
      }
      toast({ title: "Question published! +5 points added." });
      navigate(`/questions/${data.id}`);
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const limitReached = limits ? limits.questionsRemaining <= 0 && limits.questionBonusPool <= 0 : false;
  const canBuyMore = limits ? (limits.points >= BUY_COST) : false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/questions">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Questions
          </button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">New Question</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Ask a Question</h1>
                <p className="text-sm text-muted-foreground">+5 points on publish</p>
              </div>
            </div>
          </div>

          {/* Daily limit warning */}
          {limitReached && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Daily limit reached</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You've used all {DAILY_LIMIT} questions for today. Limits reset at midnight UTC.
                  </p>
                </div>
              </div>
              <div className="pl-8">
                <p className="text-xs text-muted-foreground mb-2">
                  Or spend <strong className="text-primary">{BUY_COST} points</strong> to unlock {BUY_EXTRA} extra question slots (your balance: <strong>{limits?.points ?? 0} pts</strong>)
                </p>
                <Button
                  type="button"
                  onClick={handleBuyExtra}
                  disabled={!canBuyMore || isBuying}
                  className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5 gradient-primary text-white border-0 shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {isBuying ? "Purchasing..." : `Buy ${BUY_EXTRA} extra slots — ${BUY_COST} pts`}
                </Button>
                {!canBuyMore && (
                  <p className="text-xs text-red-500 mt-1.5">Not enough points. Earn more by answering questions!</p>
                )}
              </div>
            </div>
          )}

          {/* Bonus pool indicator */}
          {limits && limits.questionBonusPool > 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-emerald-700 font-semibold">
                You have <strong>{limits.questionBonusPool}</strong> extra question slot{limits.questionBonusPool !== 1 ? "s" : ""} available (in addition to daily limit).
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-xl border border-border/60 p-6 shadow-xs space-y-5">
              {/* Subject */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-11 rounded-xl border-border/70 text-sm bg-gray-50/50 focus:bg-white">
                    <SelectValue placeholder="Choose a subject..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SUBJECTS.map(s => <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Question title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. How do I find the derivative of a product of functions?"
                  maxLength={200}
                  className={`h-11 rounded-xl border-border/70 bg-gray-50/50 focus:bg-white text-sm ${title.length > 0 && !titleOk ? "border-amber-400 focus:border-amber-500" : ""}`}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className={`text-xs ${title.length > 0 && !titleOk ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                    {title.length > 0 && !titleOk ? `${MIN_TITLE - title.length} more characters needed` : "Be concise and specific"}
                  </p>
                  <p className={`text-xs ${title.length > 180 ? "text-red-500" : "text-muted-foreground"}`}>{title.length}/200</p>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Question details <span className="text-red-500">*</span>
                </label>
                <MarkdownToolbar
                  textareaRef={contentTextareaRef}
                  value={content}
                  onChange={setContent}
                />
                <Textarea
                  ref={contentTextareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Describe the problem in detail. Explain what you've tried, where you got stuck, and what you don't understand."
                  rows={9}
                  className={`resize-none rounded-t-none rounded-b-xl border-border/70 bg-gray-50/50 focus:bg-white text-sm leading-relaxed ${content.length > 0 && !contentOk ? "border-amber-400 focus:border-amber-500" : ""}`}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className={`text-xs ${content.length > 0 && !contentOk ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                    {content.length > 0 && !contentOk ? `${MIN_CONTENT - content.length} more characters needed` : "More detail = better answers"}
                  </p>
                  <p className={`text-xs ${content.length > 9800 ? "text-red-500" : "text-muted-foreground"}`}>{content.length}/10000</p>
                </div>
              </div>

              {/* Image URLs */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Image URLs <span className="text-xs text-muted-foreground font-normal">(optional, max 5)</span>
                </label>

                {imageUrls.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${imageUrls.length === 1 ? "grid-cols-1" : imageUrls.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-border/50 bg-gray-50">
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-36 object-contain"
                          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageUrls.length < 5 && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-10 rounded-xl border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/4 gap-2 text-sm font-medium"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-primary" />
                          Upload from computer
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">Max 5 images — JPG, PNG, GIF, WebP supported.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>You earn <span className="font-bold text-foreground">+5 points</span> on publish</span>
                {limits && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${limits.questionsRemaining <= 1 ? "bg-red-50 text-red-600" : limits.questionsRemaining <= 3 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {limits.questionsRemaining}/{limits.questionLimit} today
                  </span>
                )}
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto gradient-primary text-white border-0 h-11 px-7 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-all gap-2"
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Publishing...
                  </div>
                ) : <>Publish Question <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </form>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border/60 p-5 shadow-xs">
            <h3 className="font-bold text-sm mb-4">Tips for a great question</h3>
            <div className="space-y-3">
              {TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${tip.color}`}>
                    <tip.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-primary">Points System</p>
            </div>
            <div className="space-y-2 text-xs text-foreground/70">
              <div className="flex justify-between">
                <span>Question published</span>
                <span className="font-bold text-primary">+5 pts</span>
              </div>
              <div className="flex justify-between">
                <span>Answer posted</span>
                <span className="font-bold text-primary">+10 pts</span>
              </div>
              <div className="flex justify-between">
                <span>Gold Ribbon awarded</span>
                <span className="font-bold text-amber-600">+50 pts</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-bold text-sm">Fair Use Policy</h3>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Max questions/day</span>
                <span className="font-semibold text-foreground">5</span>
              </div>
              <div className="flex justify-between">
                <span>Max answers/day</span>
                <span className="font-semibold text-foreground">15</span>
              </div>
              <div className="flex justify-between">
                <span>Min title length</span>
                <span className="font-semibold text-foreground">15 chars</span>
              </div>
              <div className="flex justify-between">
                <span>Min answer length</span>
                <span className="font-semibold text-foreground">30 chars</span>
              </div>
            </div>
          </div>

          {subject && (
            <div className="bg-white rounded-xl border border-border/60 p-5 shadow-xs">
              <h3 className="font-bold text-sm mb-3">Subject preview</h3>
              <p className="text-xs text-muted-foreground mb-2">Your question will appear in:</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                {subject}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
