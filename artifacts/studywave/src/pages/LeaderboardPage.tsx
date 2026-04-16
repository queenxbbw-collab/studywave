import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Trophy, Award, MessageCircle, Crown, Medal, HelpCircle,
  TrendingUp, Lightbulb, Send, CheckCircle2, Sparkles, Flame, Star
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const RANK_STYLES = [
  { bg: "from-yellow-400 to-amber-500", ring: "ring-yellow-300", text: "text-amber-600", bar: "bg-gradient-to-r from-yellow-400 to-amber-500" },
  { bg: "from-slate-300 to-slate-400", ring: "ring-slate-200", text: "text-slate-600", bar: "bg-gradient-to-r from-slate-300 to-slate-400" },
  { bg: "from-amber-600 to-amber-700", ring: "ring-amber-400", text: "text-amber-700", bar: "bg-gradient-to-r from-amber-600 to-amber-700" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "În analiză",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewing: { label: "Se revizuiește",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  planned:   { label: "Planificat!",     color: "bg-violet-50 text-violet-700 border-violet-200" },
  done:      { label: "Implementat!",    color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:  { label: "Neplanificat",    color: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default function LeaderboardPage() {
  usePageTitle("Clasament");
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { user } = useAuth();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mySuggestions, setMySuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/suggestions/mine", { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(setMySuggestions)
      .catch(() => {});
  }, [user, submitted]);

  const top3 = leaderboard?.slice(0, 3) || [];
  const podiumOrder = [1, 0, 2];

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Trebuie să fii autentificat pentru a trimite o sugestie", variant: "destructive" }); return; }
    if (sugTitle.trim().length < 5) { toast({ title: "Titlul trebuie să aibă cel puțin 5 caractere", variant: "destructive" }); return; }
    if (sugDesc.trim().length < 20) { toast({ title: "Descrierea trebuie să aibă cel puțin 20 de caractere", variant: "destructive" }); return; }

    setSending(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ title: sugTitle.trim(), description: sugDesc.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error || "Trimitere eșuată", variant: "destructive" });
        return;
      }
      setSubmitted(true);
      setSugTitle("");
      setSugDesc("");
    } catch {
      toast({ title: "Eroare de rețea, încearcă din nou", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSubmitted(false), 300);
  };

  return (
    <div className="min-h-screen">
      {/* Hero gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 pt-12 pb-32">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm border border-white/20">
            <Sparkles className="h-3.5 w-3.5" />
            Actualizat săptămânal
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">Clasament</h1>
          <p className="text-indigo-200 text-base sm:text-lg max-w-xl mx-auto">
            Cei mai activi contribuitori din comunitatea StudyWave — câștigă puncte punând întrebări și oferind răspunsuri valoroase.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/25 backdrop-blur-sm hover:scale-105 active:scale-95"
            >
              <Lightbulb className="h-4 w-4" />
              Sugerează o funcție
            </button>
            <Link href="/ask">
              <button className="inline-flex items-center gap-2 bg-white text-indigo-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20">
                <Star className="h-4 w-4" />
                Câștigă Puncte
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Podium — overlaps hero */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {!isLoading && top3.length >= 3 && (
          <div className="flex items-end justify-center gap-2 sm:gap-5 mb-6">
            {podiumOrder.map((idx) => {
              const entry = top3[idx];
              if (!entry) return null;
              const isFirst = idx === 0;
              const style = RANK_STYLES[idx];
              const heights = ["h-20 sm:h-24", "h-14 sm:h-16", "h-10 sm:h-12"];

              return (
                <Link href={`/profile/${entry.id}`} key={entry.id}>
                  <div className={`flex flex-col items-center cursor-pointer group transition-transform hover:-translate-y-1 ${isFirst ? "w-36 sm:w-44" : "w-28 sm:w-36"}`}>
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-b ${style.bg} flex items-center justify-center shadow-lg mb-2 ring-2 ${style.ring}`}>
                      {idx === 0 ? <Crown className="h-3.5 w-3.5 text-white" /> : <span className="text-white text-xs font-black">{idx + 1}</span>}
                    </div>

                    <div className={`w-full rounded-2xl border shadow-xl overflow-hidden ${
                      isFirst
                        ? "bg-gradient-to-b from-amber-50 to-yellow-50/50 border-yellow-200/70 shadow-yellow-200/40"
                        : "bg-white border-border/60"
                    }`}>
                      <div className="flex flex-col items-center pt-5 pb-3 px-3">
                        <Avatar className={`ring-4 ${style.ring} ${isFirst ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14"}`}>
                          <AvatarImage src={entry.avatarUrl || undefined} />
                          <AvatarFallback className={`bg-gradient-to-b ${style.bg} text-white ${isFirst ? "text-xl font-black" : "text-base font-bold"}`}>
                            {entry.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className={`font-bold text-foreground mt-2.5 text-center leading-tight line-clamp-1 ${isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
                          {entry.displayName}
                        </p>
                        <p className="text-muted-foreground text-xs hidden sm:block">@{entry.username}</p>
                        <div className={`font-extrabold mt-1.5 ${isFirst ? "text-2xl text-amber-600" : "text-lg text-primary"}`}>
                          {entry.points.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-muted-foreground">puncte</p>
                      </div>
                      <div className={`w-full ${heights[idx]} bg-gradient-to-b ${style.bg} opacity-80`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* How to earn points - pill badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: HelpCircle, label: "+10 pts · Pune o întrebare", color: "text-blue-600 bg-blue-50 border-blue-100" },
            { icon: MessageCircle, label: "+20 pts · Oferă un răspuns", color: "text-violet-600 bg-violet-50 border-violet-100" },
            { icon: Award, label: "+50 pts · Panglică de Aur", color: "text-amber-600 bg-amber-50 border-amber-100" },
            { icon: Flame, label: "+5 pts · Streak zilnic", color: "text-orange-600 bg-orange-50 border-orange-100" },
          ].map(item => (
            <span key={item.label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${item.color}`}>
              <item.icon className="h-3 w-3" />
              {item.label}
            </span>
          ))}
        </div>

        {/* Rankings table */}
        <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm mb-12">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Clasament complet
            </h2>
            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
              {leaderboard?.length || 0} membri
            </span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-6 h-4 bg-gray-100 rounded" />
                  <div className="w-10 h-10 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/5" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {leaderboard?.map(entry => {
                const isTop1 = entry.rank === 1;
                const isTop3 = entry.rank <= 3;
                const isMe = user?.id === entry.id;
                return (
                  <Link href={`/profile/${entry.id}`} key={entry.id}>
                    <div className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors group ${
                      isTop1 ? "bg-gradient-to-r from-amber-50/60 to-yellow-50/30" :
                      isTop3 ? "bg-gray-50/30" : ""
                    } ${isMe ? "ring-1 ring-inset ring-primary/20" : ""}`}>
                      {/* Rank */}
                      <div className="w-8 flex justify-center flex-shrink-0">
                        {entry.rank === 1 ? (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-b from-yellow-400 to-amber-500 flex items-center justify-center shadow">
                            <Crown className="h-3.5 w-3.5 text-white" />
                          </div>
                        ) : entry.rank === 2 ? (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-b from-slate-300 to-slate-400 flex items-center justify-center shadow">
                            <Medal className="h-3 w-3 text-white" />
                          </div>
                        ) : entry.rank === 3 ? (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-600 to-amber-700 flex items-center justify-center shadow">
                            <Medal className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-muted-foreground"}`}>{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback className="gradient-primary text-white text-sm font-bold">
                          {entry.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate group-hover:text-primary transition-colors ${isMe ? "text-primary" : "text-foreground"}`}>
                            {entry.displayName}
                          </p>
                          {isMe && (
                            <span className="text-[10px] font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded-full flex-shrink-0">Tu</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">@{entry.username}</p>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground" title="Întrebări">
                          <HelpCircle className="h-3 w-3 text-blue-400" />
                          <span className="font-medium">{entry.questionCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground" title="Răspunsuri">
                          <MessageCircle className="h-3 w-3 text-violet-400" />
                          <span className="font-medium">{entry.answerCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600" title="Panglici de Aur">
                          <Award className="h-3 w-3 text-amber-500" />
                          <span className="font-medium">{entry.awardedAnswerCount}</span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-base font-extrabold ${isTop3 ? "text-amber-600" : isMe ? "text-primary" : "text-foreground"}`}>
                          {entry.points.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">pts</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My Suggestions */}
      {user && mySuggestions.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-gray-50/50 flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Sugestiile mele
              </h2>
              <span className="text-xs text-muted-foreground">{mySuggestions.length} trimise</span>
            </div>
            <div className="divide-y divide-border/40">
              {mySuggestions.map((s: any) => {
                const cfg = STATUS_CONFIG[s.status] || { label: s.status, color: "bg-gray-50 text-gray-600 border-gray-200" };
                return (
                  <div key={s.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground break-words">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2">{s.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Trimisă {new Date(s.createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Suggest a Feature Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              Sugerează o funcție
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Ai o idee care ar face StudyWave mai bun? Ne-ar plăcea să o aflăm! Fiecare sugestie este analizată de echipă.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Mulțumim pentru sugestie!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Echipa noastră o va analiza. Dacă este planificată, o vei vedea pe platformă în curând.
              </p>
              <Button onClick={closeModal} className="mt-6 gradient-primary text-white border-0 rounded-xl px-6">
                Închide
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSuggest} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Titlul funcției</label>
                <Input
                  value={sugTitle}
                  onChange={e => setSugTitle(e.target.value)}
                  placeholder="ex: Mod întunecat, Redare formule matematice..."
                  className="rounded-xl h-10 text-sm"
                  maxLength={100}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{sugTitle.length}/100 · min 5 caractere</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Descriere</label>
                <Textarea
                  value={sugDesc}
                  onChange={e => setSugDesc(e.target.value)}
                  placeholder="Descrie ideea în detaliu — ce ar face, de ce e utilă, cum ar putea funcționa..."
                  className="rounded-xl text-sm resize-none"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{sugDesc.length}/1000 · min 20 caractere</p>
              </div>

              {!user && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Trebuie să fii <Link href="/login" className="font-semibold underline" onClick={closeModal}>autentificat</Link> pentru a trimite o sugestie.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 rounded-xl">
                  Anulează
                </Button>
                <Button
                  type="submit"
                  disabled={sending || !user}
                  className="flex-1 gradient-primary text-white border-0 rounded-xl gap-2"
                >
                  {sending ? (
                    <span className="animate-pulse">Se trimite...</span>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Trimite sugestia</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
