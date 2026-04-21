import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Link, useLocation } from "wouter";
import { useListQuestions, useGetPlatformStats, useGetRecentActivity, useGetSubjectStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import {
  Search, Plus, Users, HelpCircle, MessageCircle, CheckCircle2,
  TrendingUp, Activity, ArrowRight, Sparkles, Award, Star, Zap, Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { SUBJECTS_LIST, subjectLabel } from "@/lib/subjects";

const ACTIVITY_ICONS: Record<string, React.FC<{className?: string}>> = {
  question_asked: HelpCircle,
  answer_posted: MessageCircle,
  answer_awarded: Award,
};

const ACTIVITY_LABELS: Record<string, string> = {
  question_asked: "a pus o întrebare",
  answer_posted: "a postat un răspuns",
  answer_awarded: "a primit Panglica de Aur",
};

const ACTIVITY_COLORS: Record<string, string> = {
  question_asked: "bg-blue-100 text-blue-600",
  answer_posted: "bg-violet-100 text-violet-600",
  answer_awarded: "bg-amber-100 text-amber-600",
};

const SUBJECTS = ["all", ...SUBJECTS_LIST];

export default function HomePage() {
  usePageTitle("Acasă");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [inputValue, setInputValue] = useState("");

  const { data: questionsData, isLoading } = useListQuestions({
    subject: subject !== "all" ? subject : undefined,
    search,
    limit: 8,
  });
  const { data: stats } = useGetPlatformStats();
  const { data: activity } = useGetRecentActivity();
  const { data: subjectStats } = useGetSubjectStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate(`/questions?search=${encodeURIComponent(inputValue.trim())}`);
    } else {
      setSearch(inputValue);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 gradient-hero dot-bg"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/6 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Platforma #1 de învățare colaborativă
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground tracking-tight mb-6 leading-[1.1]">
              Învață mai inteligent,{" "}
              <span className="text-gradient">împreună</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Pune întrebări dificile, primește răspunsuri de calitate, câștigă puncte și urcă în clasament pe StudyWave — platforma românească de Q&amp;A pentru elevi ambițioși.
            </p>

            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/ask">
                  <Button size="lg" className="gradient-primary text-white border-0 h-12 px-8 rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all gap-2 text-base">
                    <Plus className="h-5 w-5" /> Pune o Întrebare
                  </Button>
                </Link>
                <Link href="/questions">
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold text-base gap-2 border-border/80">
                    Explorează Întrebările <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register">
                  <Button size="lg" className="gradient-primary text-white border-0 h-12 px-8 rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all gap-2 text-base">
                    <Sparkles className="h-5 w-5" /> Înregistrare Gratuită
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold text-base border-border/80">
                    Autentifică-te
                  </Button>
                </Link>
              </div>
            )}

            {stats && (
              <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <strong className="text-foreground">{stats.totalUsers.toLocaleString("ro-RO")}</strong> elevi
                </span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <strong className="text-foreground">{stats.totalQuestions.toLocaleString("ro-RO")}</strong> întrebări
                </span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <strong className="text-foreground">{stats.solvedQuestions.toLocaleString("ro-RO")}</strong> rezolvate
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="border-b border-border/50 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Elevi Activi", value: stats.totalUsers, color: "text-blue-600", bg: "bg-blue-50" },
                { icon: HelpCircle, label: "Întrebări Puse", value: stats.totalQuestions, color: "text-violet-600", bg: "bg-violet-50" },
                { icon: MessageCircle, label: "Răspunsuri Date", value: stats.totalAnswers, color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: Award, label: "Răspunsuri Premiate", value: stats.totalAwardedAnswers || 0, color: "text-amber-600", bg: "bg-amber-50" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-gray-50/50">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-foreground leading-none">{stat.value.toLocaleString("ro-RO")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-5">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Caută întrebări, subiecte, autori..."
                  className="pl-10 h-10 rounded-xl border-border/70 bg-white shadow-xs focus-visible:ring-primary/30"
                />
              </div>
              <Button type="submit" className="h-10 px-5 rounded-xl gradient-primary text-white border-0 font-semibold shadow-sm">
                Caută
              </Button>
            </form>

            {/* Subject pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                    subject === s
                      ? "gradient-primary text-white border-transparent shadow-sm"
                      : "bg-white text-muted-foreground border-border/70 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {subjectLabel(s)}
                </button>
              ))}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                {search ? (
                  <span>Rezultate pentru <span className="text-primary">"{search}"</span></span>
                ) : subject !== "all" ? (
                  <span>Întrebări · <span className="text-primary">{subjectLabel(subject)}</span></span>
                ) : (
                  "Întrebări Recente"
                )}
              </h2>
              <Link href="/questions">
                <button className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                  Toate întrebările <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>

            {/* Questions list */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-border/60 p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2"><div className="h-5 bg-gray-100 rounded-full w-20"></div><div className="h-5 bg-gray-100 rounded-full w-16"></div></div>
                        <div className="h-5 bg-gray-100 rounded w-4/5"></div>
                        <div className="h-4 bg-gray-100 rounded w-3/5"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : questionsData?.questions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-border/60">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-7 w-7 text-muted-foreground/60" />
                </div>
                <p className="text-base font-semibold text-foreground">Nicio întrebare găsită</p>
                <p className="text-sm text-muted-foreground mt-1">Fii primul care întreabă!</p>
                {user && (
                  <Link href="/ask" className="inline-block mt-4">
                    <Button size="sm" className="gradient-primary text-white border-0">
                      <Plus className="h-4 w-4 mr-2" /> Pune o Întrebare
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {questionsData?.questions.map(q => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {!user && (
              <div className="bg-white rounded-xl border border-border/60 p-5 relative overflow-hidden">
                <div className="absolute inset-0 gradient-hero opacity-60"></div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-sm">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">Alătură-te comunității</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Înregistrează-te gratuit și începe să înveți alături de mii de elevi din România.
                  </p>
                  <Link href="/register">
                    <Button className="w-full gradient-primary text-white border-0 h-9 rounded-lg font-semibold text-sm">
                      Creează Cont Gratuit
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Activity feed */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Activitate Live
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse"></span>
              </div>
              <div className="divide-y divide-border/40">
                {activity?.slice(0, 7).map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] || HelpCircle;
                  const iconCls = ACTIVITY_COLORS[a.type] || "bg-gray-100 text-gray-600";
                  return (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/70 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCls}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">
                          <span className="font-semibold">{a.displayName}</span>{" "}
                          <span className="text-muted-foreground">{ACTIVITY_LABELS[a.type] || "a fost activ"}</span>
                        </p>
                        {a.questionTitle && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{a.questionTitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ro })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top subjects */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border/50">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Materii Populare
                </h3>
              </div>
              <div className="p-3 space-y-1">
                {subjectStats?.slice(0, 7).map((s, i) => (
                  <button
                    key={s.subject}
                    onClick={() => setSubject(s.subject)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-primary/8 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">{subjectLabel(s.subject)}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{s.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Why StudyWave */}
            <div className="bg-white rounded-xl border border-border/60 p-4">
              <h3 className="font-bold text-sm mb-3">De ce StudyWave?</h3>
              <div className="space-y-2.5">
                {[
                  { icon: Zap, text: "Câștigă puncte pentru fiecare contribuție", color: "text-amber-500 bg-amber-50" },
                  { icon: Award, text: "Panglica de Aur pentru cel mai bun răspuns", color: "text-rose-500 bg-rose-50" },
                  { icon: Shield, text: "Moderat de o echipă dedicată", color: "text-blue-500 bg-blue-50" },
                  { icon: Star, text: "Insigne și titluri exclusive de deblocat", color: "text-violet-500 bg-violet-50" },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
