import { useState } from "react";
import { Link } from "wouter";
import { useListQuestions, useGetPlatformStats, useGetRecentActivity, useGetSubjectStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { Search, Plus, Users, HelpCircle, MessageCircle, CheckCircle2, TrendingUp, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SUBJECTS = ["all", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Literature", "Computer Science", "Economics", "Languages", "Other"];

export default function HomePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [inputValue, setInputValue] = useState("");

  const { data: questionsData, isLoading } = useListQuestions({ subject: subject !== "all" ? subject : undefined, search, limit: 10 });
  const { data: stats } = useGetPlatformStats();
  const { data: activity } = useGetRecentActivity();
  const { data: subjectStats } = useGetSubjectStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputValue);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Invata mai bine,{" "}
          <span className="text-primary">impreuna</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Pune intrebari, primeste raspunsuri, acumuleaza puncte si castiga badge-uri pe StudyWave — platforma internationala pentru studenti.
        </p>
        {!user && (
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Inregistreaza-te gratuit
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Autentificare</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Users, label: "Utilizatori", value: stats.totalUsers },
            { icon: HelpCircle, label: "Intrebari", value: stats.totalQuestions },
            { icon: MessageCircle, label: "Raspunsuri", value: stats.totalAnswers },
            { icon: CheckCircle2, label: "Rezolvate", value: stats.solvedQuestions },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Cauta intrebari..."
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">Cauta</Button>
          </form>

          {/* Subject filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  subject === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {s === "all" ? "Toate" : s}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {search ? `Rezultate pentru "${search}"` : "Intrebari recente"}
            </h2>
            {user && (
              <Link href="/ask">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Pune intrebare
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : questionsData?.questions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nu s-au gasit intrebari</p>
              <p className="text-sm mt-1">Fii primul care pune o intrebare!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionsData?.questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          )}

          {questionsData && questionsData.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Link href="/questions">
                <Button variant="outline">Vezi toate intrebarile</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent activity */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Activitate recenta</h3>
            </div>
            <div className="space-y-3">
              {activity?.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">{a.displayName}</span>{" "}
                      {a.type === "question_asked" ? "a pus o intrebare" : a.type === "answer_posted" ? "a raspuns" : "a primit o fundita"}
                    </p>
                    {a.questionTitle && (
                      <p className="text-xs text-muted-foreground truncate">{a.questionTitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Subiecte populare</h3>
            </div>
            <div className="space-y-2">
              {subjectStats?.slice(0, 6).map(s => (
                <button
                  key={s.subject}
                  onClick={() => setSubject(s.subject)}
                  className="w-full flex items-center justify-between group hover:text-primary transition-colors"
                >
                  <span className="text-sm text-muted-foreground group-hover:text-primary">{s.subject}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {s.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
