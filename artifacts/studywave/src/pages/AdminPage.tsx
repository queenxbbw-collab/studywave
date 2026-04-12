import { useState } from "react";
import { useAdminGetStats, useAdminListUsers, useAdminListQuestions, useListBadges, useAdminUpdateUser, useAdminDeleteUser, useAdminDeleteQuestion, useAdminCreateBadge, useAdminDeleteBadge, getAdminListUsersQueryKey, getAdminListQuestionsQueryKey, getListBadgesQueryKey, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, HelpCircle, Star, BarChart2, Trash2, Ban, CheckCircle2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const [newBadge, setNewBadge] = useState({ name: "", description: "", icon: "Star", color: "#6366f1", pointsRequired: 0, category: "general" });

  const { data: stats } = useAdminGetStats();
  const { data: usersData } = useAdminListUsers({ page: userPage, limit: 15, search: userSearch || undefined });
  const { data: questionsData } = useAdminListQuestions({ page: questionPage, limit: 15 });
  const { data: badges } = useListBadges();

  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();
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
    if (!confirm("Stergi aceasta intrebare?")) return;
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
        toast({ title: "Badge creat!" });
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Panou de administrare</h1>
          <p className="text-sm text-muted-foreground">Controleaza toata platforma StudyWave</p>
        </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="w-full flex flex-wrap gap-1">
          <TabsTrigger value="stats" className="gap-2"><BarChart2 className="h-4 w-4" /> Statistici</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Utilizatori</TabsTrigger>
          <TabsTrigger value="questions" className="gap-2"><HelpCircle className="h-4 w-4" /> Intrebari</TabsTrigger>
          <TabsTrigger value="badges" className="gap-2"><Star className="h-4 w-4" /> Badge-uri</TabsTrigger>
        </TabsList>

        {/* Stats */}
        <TabsContent value="stats" className="mt-6">
          {stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: "Utilizatori totali", value: stats.totalUsers, color: "text-blue-400" },
                  { label: "Intrebari totale", value: stats.totalQuestions, color: "text-purple-400" },
                  { label: "Raspunsuri totale", value: stats.totalAnswers, color: "text-cyan-400" },
                  { label: "Intrebari rezolvate", value: stats.solvedQuestions, color: "text-green-400" },
                  { label: "Funditze acordate", value: stats.totalAwardedAnswers, color: "text-amber-400" },
                  { label: "Badge-uri", value: stats.totalBadges, color: "text-pink-400" },
                  { label: "Utilizatori noi (sapt.)", value: stats.newUsersThisWeek, color: "text-emerald-400" },
                  { label: "Intrebari noi (sapt.)", value: stats.newQuestionsThisWeek, color: "text-orange-400" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.topSubjects.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Subiecte populare</h3>
                  <div className="space-y-3">
                    {stats.topSubjects.map(s => (
                      <div key={s.subject} className="flex items-center gap-3">
                        <span className="text-sm w-40 flex-shrink-0">{s.subject}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (s.count / (stats.totalQuestions || 1)) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-6">
          <div className="flex gap-2 mb-4">
            <Input
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              placeholder="Cauta utilizator..."
              className="max-w-xs"
            />
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Utilizator</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Puncte</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Rol</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Status</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3 font-medium">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarImage src={u.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">{u.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-sm font-medium text-primary">{u.points}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {u.isActive ? "Activ" : "Blocat"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleToggleUser(u.id, u.isActive)}
                          className={`p-1.5 rounded transition-colors ${u.isActive ? "hover:bg-red-500/10 hover:text-red-400 text-muted-foreground" : "hover:bg-green-500/10 hover:text-green-400 text-muted-foreground"}`}
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
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{userPage} / {usersData.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.min(usersData.totalPages, p + 1))} disabled={userPage === usersData.totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Questions */}
        <TabsContent value="questions" className="mt-6">
          <div className="space-y-3">
            {questionsData?.questions.map(q => (
              <div key={q.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/questions/${q.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                    {q.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>@{q.authorUsername}</span>
                    <span>{q.subject}</span>
                    <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                    <span>{q.answerCount} raspunsuri</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {questionsData && questionsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button variant="outline" size="sm" onClick={() => setQuestionPage(p => Math.max(1, p - 1))} disabled={questionPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{questionPage} / {questionsData.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setQuestionPage(p => Math.min(questionsData.totalPages, p + 1))} disabled={questionPage === questionsData.totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="mt-6">
          {/* Create badge */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Creeaza badge nou</h3>
            <form onSubmit={handleCreateBadge} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input value={newBadge.name} onChange={e => setNewBadge(b => ({ ...b, name: e.target.value }))} placeholder="Nume badge *" required />
              <Input value={newBadge.description} onChange={e => setNewBadge(b => ({ ...b, description: e.target.value }))} placeholder="Descriere *" required />
              <Input value={newBadge.icon} onChange={e => setNewBadge(b => ({ ...b, icon: e.target.value }))} placeholder="Icon (Trophy, Star, etc.)" />
              <div className="flex gap-2 items-center">
                <input type="color" value={newBadge.color} onChange={e => setNewBadge(b => ({ ...b, color: e.target.value }))} className="h-10 w-12 rounded border border-border bg-transparent cursor-pointer" />
                <Input value={newBadge.color} onChange={e => setNewBadge(b => ({ ...b, color: e.target.value }))} placeholder="Culoare hex" />
              </div>
              <Input type="number" value={newBadge.pointsRequired} onChange={e => setNewBadge(b => ({ ...b, pointsRequired: parseInt(e.target.value) }))} placeholder="Puncte necesare" min={0} />
              <Input value={newBadge.category} onChange={e => setNewBadge(b => ({ ...b, category: e.target.value }))} placeholder="Categorie (general, points, etc.)" />
              <Button type="submit" className="sm:col-span-2 lg:col-span-3" disabled={createBadge.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Creeaza badge
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges?.map(badge => (
              <div key={badge.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: badge.color + "20" }}
                >
                  {({ Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥", Zap: "⚡", Crown: "👑" } as Record<string, string>)[badge.icon] || "🏅"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: badge.color }}>{badge.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{badge.pointsRequired} puncte</p>
                </div>
                <button
                  onClick={() => handleDeleteBadge(badge.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
