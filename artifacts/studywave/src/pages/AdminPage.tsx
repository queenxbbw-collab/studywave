import { useState, useEffect } from "react";
import {
  useAdminGetStats, useAdminListUsers, useAdminListQuestions, useListBadges,
  useAdminUpdateUser, useAdminDeleteUser, useAdminDeleteQuestion,
  useAdminCreateBadge, useAdminDeleteBadge,
  getAdminListUsersQueryKey, getAdminListQuestionsQueryKey,
  getListBadgesQueryKey, getAdminGetStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, HelpCircle, Star, BarChart2, Trash2, Ban, CheckCircle2,
  Plus, ChevronLeft, ChevronRight, TrendingUp, Award, MessageCircle,
  ArrowUpRight, Activity, Search, BookOpen, Flag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Report {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: number; username: string; displayName: string };
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const [newBadge, setNewBadge] = useState({
    name: "", description: "", icon: "Star", color: "#6366f1", pointsRequired: 0, category: "general"
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/reports", { headers: getAuthHeaders() });
      if (res.ok) setReports(await res.json());
    } finally {
      setReportsLoading(false);
    }
  };

  const updateReportStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const { data: stats } = useAdminGetStats();
  const { data: usersData } = useAdminListUsers({ page: userPage, limit: 12, search: userSearch || undefined });
  const { data: questionsData } = useAdminListQuestions({ page: questionPage, limit: 12 });
  const { data: badges } = useListBadges();

  const updateUser = useAdminUpdateUser();
  const deleteQuestion = useAdminDeleteQuestion();
  const createBadge = useAdminCreateBadge();
  const deleteBadge = useAdminDeleteBadge();

  if (!user || user.role !== "admin") { navigate("/"); return null; }

  const handleToggleUser = (userId: number, isActive: boolean) => {
    updateUser.mutate({ id: userId, data: { isActive: !isActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: isActive ? "Utilizator dezactivat" : "Utilizator activat" });
      },
    });
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (!confirm("Stergi aceasta intrebare si toate raspunsurile sale?")) return;
    deleteQuestion.mutate({ id: questionId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListQuestionsQueryKey() });
        toast({ title: "Intrebare stearsa" });
      },
    });
  };

  const handleCreateBadge = (e: React.FormEvent) => {
    e.preventDefault();
    createBadge.mutate({ data: newBadge }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBadgesQueryKey() });
        setNewBadge({ name: "", description: "", icon: "Star", color: "#6366f1", pointsRequired: 0, category: "general" });
        toast({ title: "Badge creat cu succes!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteBadge = (badgeId: number) => {
    if (!confirm("Stergi acest badge?")) return;
    deleteBadge.mutate({ id: badgeId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBadgesQueryKey() });
        toast({ title: "Badge sters" });
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Panou Admin</h1>
            <p className="text-xs text-muted-foreground">Controleaza si monitorizeaza platforma StudyWave</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-emerald-700">Sistem online</span>
        </div>
      </div>

      <Tabs defaultValue="stats" onValueChange={v => { if (v === "reports") fetchReports(); }}>
        <TabsList className="bg-white border border-border/60 p-1 rounded-xl shadow-xs mb-6 w-full flex">
          {[
            { value: "stats", icon: BarChart2, label: "Stats" },
            { value: "users", icon: Users, label: "Users" },
            { value: "questions", icon: HelpCircle, label: "Questions" },
            { value: "badges", icon: Star, label: "Badges" },
            { value: "reports", icon: Flag, label: "Reports" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 gap-2 rounded-lg text-sm data-[state=active]:shadow-sm">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* STATS TAB */}
        <TabsContent value="stats">
          {stats && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Utilizatori totali", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: `+${stats.newUsersThisWeek} sapt.` },
                  { label: "Intrebari totale", value: stats.totalQuestions, icon: HelpCircle, color: "text-violet-600", bg: "bg-violet-50", trend: `+${stats.newQuestionsThisWeek} sapt.` },
                  { label: "Raspunsuri", value: stats.totalAnswers, icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50", trend: null },
                  { label: "Funditze acordate", value: stats.totalAwardedAnswers, icon: Award, color: "text-amber-600", bg: "bg-amber-50", trend: null },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-border/60 p-5 shadow-xs">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                      </div>
                      {stat.trend && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Intrebari rezolvate", value: stats.solvedQuestions, pct: stats.totalQuestions ? Math.round(stats.solvedQuestions / stats.totalQuestions * 100) : 0 },
                  { label: "Badge-uri active", value: stats.totalBadges, pct: null },
                  { label: "Noi utilizatori (sapt.)", value: stats.newUsersThisWeek, pct: null },
                  { label: "Noi intrebari (sapt.)", value: stats.newQuestionsThisWeek, pct: null },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-border/60 p-4 shadow-xs">
                    <p className="text-xl font-extrabold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    {stat.pct !== null && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Rata rezolvare</span>
                          <span className="text-xs font-bold text-primary">{stat.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${stat.pct}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Subject distribution */}
              {stats.topSubjects.length > 0 && (
                <div className="bg-white rounded-xl border border-border/60 p-6 shadow-xs">
                  <h3 className="font-bold mb-5 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Distributie pe subiecte
                  </h3>
                  <div className="space-y-3">
                    {stats.topSubjects.map((s, i) => {
                      const pct = stats.totalQuestions ? Math.round(s.count / stats.totalQuestions * 100) : 0;
                      const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                      return (
                        <div key={s.subject} className="flex items-center gap-4">
                          <div className="w-24 flex-shrink-0">
                            <span className="text-sm font-medium text-foreground/80 truncate block">{s.subject}</span>
                          </div>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${colors[i % colors.length]}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center gap-2 w-16 flex-shrink-0 text-right">
                            <span className="text-sm font-bold text-foreground ml-auto">{s.count}</span>
                            <span className="text-xs text-muted-foreground">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-gray-50/50 flex items-center justify-between gap-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Utilizatori ({usersData?.total || 0})
              </h2>
              <form onSubmit={e => { e.preventDefault(); setUserSearch(userSearchInput); setUserPage(1); }} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={userSearchInput}
                    onChange={e => setUserSearchInput(e.target.value)}
                    placeholder="Cauta utilizator..."
                    className="pl-9 h-8 w-52 rounded-lg text-xs border-border/70"
                  />
                </div>
                <Button type="submit" className="h-8 px-3 rounded-lg text-xs gradient-primary text-white border-0">Cauta</Button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-gray-50/30">
                    {["Utilizator", "Email", "Puncte", "Rol", "Status", "Inscris", "Actiuni"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersData?.users.map(u => (
                    <tr key={u.id} className="border-b border-border/40 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link href={`/profile/${u.id}`}>
                          <div className="flex items-center gap-2.5 cursor-pointer group">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={u.avatarUrl || undefined} />
                              <AvatarFallback className="gradient-primary text-white text-xs font-bold">{u.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{u.displayName}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-primary">{u.points.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.role === "admin" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                        }`}>
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          {u.isActive ? "Activ" : "Blocat"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleToggleUser(u.id, u.isActive)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive
                                ? "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={u.isActive ? "Blocheaza" : "Deblocheaza"}
                          >
                            {u.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {usersData && usersData.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-gray-50/30">
                <p className="text-xs text-muted-foreground">
                  Pagina {userPage} din {usersData.totalPages} · {usersData.total} utilizatori
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-lg text-xs" onClick={() => setUserPage(p => p - 1)} disabled={userPage === 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-lg text-xs" onClick={() => setUserPage(p => p + 1)} disabled={userPage === usersData.totalPages}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions">
          <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-gray-50/50">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Intrebari ({questionsData?.total || 0})
              </h2>
            </div>
            <div className="divide-y divide-border/40">
              {questionsData?.questions.map(q => (
                <div key={q.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <Link href={`/questions/${q.id}`}>
                      <p className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1">
                        {q.title}
                      </p>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">@{q.authorUsername}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{q.subject}</span>
                      <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {q.answerCount} rasp.
                      </span>
                      {q.isSolved && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Rezolvata
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {questionsData && questionsData.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-gray-50/30">
                <p className="text-xs text-muted-foreground">Pagina {questionPage} din {questionsData.totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-lg text-xs" onClick={() => setQuestionPage(p => p - 1)} disabled={questionPage === 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-lg text-xs" onClick={() => setQuestionPage(p => p + 1)} disabled={questionPage === questionsData.totalPages}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* BADGES TAB */}
        <TabsContent value="badges">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            {/* Badge list */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Badge-uri active ({badges?.length || 0})
                </h2>
              </div>
              <div className="divide-y divide-border/40">
                {badges?.map(badge => (
                  <div key={badge.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ backgroundColor: badge.color + "15", border: `1.5px solid ${badge.color}25` }}
                    >
                      {({ Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥", Zap: "⚡", Crown: "👑", BookOpen: "📖" } as Record<string, string>)[badge.icon] || "🏅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: badge.color }}>{badge.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {badge.pointsRequired === 0 ? "La inreg." : `${badge.pointsRequired} pts`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{badge.category}</span>
                      <button
                        onClick={() => handleDeleteBadge(badge.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create badge form */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden h-fit">
              <div className="px-5 py-4 border-b border-border/50 bg-gray-50/50">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Creeaza badge nou
                </h2>
              </div>
              <form onSubmit={handleCreateBadge} className="p-5 space-y-3">
                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-border/60">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: newBadge.color + "15", border: `1.5px solid ${newBadge.color}30` }}
                  >
                    {({ Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥", Zap: "⚡", Crown: "👑" } as Record<string, string>)[newBadge.icon] || "🏅"}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: newBadge.color }}>
                      {newBadge.name || "Nume badge"}
                    </p>
                    <p className="text-xs text-muted-foreground">{newBadge.description || "Descriere..."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground mb-1 block">Nume *</label>
                    <Input value={newBadge.name} onChange={e => setNewBadge(b => ({ ...b, name: e.target.value }))} placeholder="Ex: Maestru" className="h-9 rounded-lg text-sm" required />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground mb-1 block">Descriere *</label>
                    <Input value={newBadge.description} onChange={e => setNewBadge(b => ({ ...b, description: e.target.value }))} placeholder="Cand se acorda?" className="h-9 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Icon</label>
                    <Input value={newBadge.icon} onChange={e => setNewBadge(b => ({ ...b, icon: e.target.value }))} placeholder="Star, Trophy..." className="h-9 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Culoare</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newBadge.color}
                        onChange={e => setNewBadge(b => ({ ...b, color: e.target.value }))}
                        className="h-9 w-10 rounded-lg border border-border/70 cursor-pointer p-0.5 bg-white"
                      />
                      <Input value={newBadge.color} onChange={e => setNewBadge(b => ({ ...b, color: e.target.value }))} className="h-9 rounded-lg text-sm flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Puncte necesare</label>
                    <Input type="number" value={newBadge.pointsRequired} onChange={e => setNewBadge(b => ({ ...b, pointsRequired: parseInt(e.target.value) || 0 }))} min={0} className="h-9 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Categorie</label>
                    <Input value={newBadge.category} onChange={e => setNewBadge(b => ({ ...b, category: e.target.value }))} placeholder="general" className="h-9 rounded-lg text-sm" />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-white border-0 h-9 rounded-xl font-semibold shadow-sm hover:opacity-90 gap-2"
                  disabled={createBadge.isPending}
                >
                  <Plus className="h-4 w-4" />
                  {createBadge.isPending ? "Se creeaza..." : "Creeaza badge"}
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" /> User Reports
              </h2>
              <Button variant="outline" size="sm" onClick={fetchReports} className="h-8 rounded-lg text-xs">
                Refresh
              </Button>
            </div>

            {reportsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-border/60 p-4 animate-pulse h-20"></div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center">
                <Flag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-muted-foreground">No reports yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Reports from users will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Filter by status */}
                <div className="flex gap-2">
                  {["all", "pending", "reviewed", "dismissed"].map(status => {
                    const count = status === "all" ? reports.length : reports.filter(r => r.status === status).length;
                    return (
                      <span key={status} className="text-xs px-2.5 py-1 rounded-full bg-white border border-border/60 text-muted-foreground font-medium">
                        {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                      </span>
                    );
                  })}
                </div>

                {reports.map(report => (
                  <div key={report.id} className={`bg-white rounded-xl border overflow-hidden shadow-xs ${
                    report.status === "pending" ? "border-amber-200" : "border-border/60"
                  }`}>
                    <div className="flex items-start justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            report.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            report.status === "reviewed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}>
                            {report.status.toUpperCase()}
                          </span>
                          <span className="text-xs font-semibold text-primary bg-primary/6 px-2 py-0.5 rounded-full">
                            {report.targetType}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{report.targetId}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-0.5">
                          {report.reason.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </p>
                        {report.details && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{report.details}"</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>By <strong>{report.reporter.displayName}</strong> (@{report.reporter.username})</span>
                          <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, "reviewed")}
                            className="h-8 px-3 rounded-lg text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, "dismissed")}
                            className="h-8 px-3 rounded-lg text-xs text-muted-foreground"
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
