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
  ArrowUpRight, Activity, Search, BookOpen, Flag, Megaphone, Eye, EyeOff,
  Lightbulb, ChevronDown, ClipboardList, RefreshCw, AlertTriangle, Zap,
  Trophy, Flame, Crown, Target, Medal, CheckCircle, Brain, Rocket, Heart, Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePageTitle } from "@/hooks/use-page-title";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const ADMIN_ICON_MAP: Record<string, LucideIcon> = {
  Trophy, Star, Award, Shield, Flame, Zap, Crown,
  BookOpen, HelpCircle, MessageCircle, Target, Medal,
  CheckCircle, Lightbulb, Brain, Rocket, Heart, Sparkles,
};

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
  usePageTitle("Admin Panel");
  const { user, isLoading: authLoading } = useAuth();
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", type: "info" });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsCategory, setLogsCategory] = useState("all");
  // Danger Zone
  const [dangerLoading, setDangerLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [dangerTarget, setDangerTarget] = useState<"questions" | "users" | "all" | null>(null);
  const [pointsUserId, setPointsUserId] = useState("");
  const [pointsValue, setPointsValue] = useState("");
  const [pointsLoading, setPointsLoading] = useState(false);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/reports", { headers: getAuthHeaders() });
      if (res.ok) setReports(await res.json());
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", { headers: getAuthHeaders() });
      if (res.ok) setAnnouncements(await res.json());
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const notifyAnnouncementsChanged = () => window.dispatchEvent(new CustomEvent("announcementsUpdated"));

  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(newAnnouncement),
    });
    if (res.ok) {
      toast({ title: "Announcement created" });
      setNewAnnouncement({ title: "", content: "", type: "info" });
      fetchAnnouncements();
      notifyAnnouncementsChanged();
    }
  };

  const toggleAnnouncement = async (id: number, isActive: boolean) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ isActive }),
    });
    fetchAnnouncements();
    notifyAnnouncementsChanged();
  };

  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/admin/suggestions", { headers: getAuthHeaders() });
      if (res.ok) setSuggestions(await res.json());
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const fetchLogs = async (page = logsPage, category = logsCategory) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/admin/logs?${params}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setLogsTotalPages(data.totalPages);
        setLogsTotal(data.total);
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const updateSuggestionStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    });
    fetchSuggestions();
  };

  const deleteSuggestion = async (id: number) => {
    await fetch(`/api/admin/suggestions/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setSuggestions(s => s.filter(x => x.id !== id));
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setAnnouncements(a => a.filter(x => x.id !== id));
    notifyAnnouncementsChanged();
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

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) navigate("/");
  }, [authLoading, user, navigate]);

  if (authLoading || !user || user.role !== "admin") return null;

  const handleToggleUser = (userId: number, isActive: boolean) => {
    updateUser.mutate({ id: userId, data: { isActive: !isActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: isActive ? "User deactivated" : "User activated" });
      },
    });
  };

  const handleTogglePremium = (userId: number, isPremium: boolean) => {
    updateUser.mutate({ id: userId, data: { isPremium: !isPremium } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: isPremium ? "Premium removed" : "Premium activated!", description: isPremium ? "User is no longer premium." : "User now has Premium access." });
      },
    });
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (!confirm("Delete this question and all its answers?")) return;
    deleteQuestion.mutate({ id: questionId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListQuestionsQueryKey() });
        toast({ title: "Question deleted" });
      },
    });
  };

  const handleCreateBadge = (e: React.FormEvent) => {
    e.preventDefault();
    createBadge.mutate({ data: newBadge }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBadgesQueryKey() });
        setNewBadge({ name: "", description: "", icon: "Star", color: "#6366f1", pointsRequired: 0, category: "general" });
        toast({ title: "Badge created!" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteBadge = (badgeId: number) => {
    if (!confirm("Delete this badge?")) return;
    deleteBadge.mutate({ id: badgeId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBadgesQueryKey() });
        toast({ title: "Badge deleted" });
      },
    });
  };

  const handleResetData = async () => {
    if (!dangerTarget) return;
    const expected = dangerTarget === "all" ? "DELETE ALL" : dangerTarget === "questions" ? "DELETE CONTENT" : "DELETE USERS";
    if (confirmText !== expected) { toast({ title: "Confirmation text doesn't match", variant: "destructive" }); return; }
    setDangerLoading(true);
    try {
      const r = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ target: dangerTarget }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Reset complete", description: `All ${dangerTarget} data has been deleted.` });
      setConfirmText(""); setDangerTarget(null);
      queryClient.invalidateQueries();
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally { setDangerLoading(false); }
  };

  const handleSetPoints = async () => {
    const uid = parseInt(pointsUserId, 10);
    const pts = parseInt(pointsValue, 10);
    if (isNaN(uid) || isNaN(pts) || pts < 0) { toast({ title: "Invalid user ID or points", variant: "destructive" }); return; }
    setPointsLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${uid}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ points: pts }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Points updated successfully" });
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({ type: "active" });
      setPointsValue("");
    } catch (e: any) {
      toast({ title: "Failed to set points", description: e.message, variant: "destructive" });
    } finally { setPointsLoading(false); }
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
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage and monitor the StudyWave platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-emerald-700">System online</span>
        </div>
      </div>

      <Tabs defaultValue="stats" onValueChange={v => {
        if (v === "reports") fetchReports();
        if (v === "announcements") fetchAnnouncements();
        if (v === "suggestions") fetchSuggestions();
        if (v === "logs") { setLogsPage(1); fetchLogs(1, logsCategory); }
      }}>
        <div className="overflow-x-auto mb-6 pb-1">
          <TabsList className="bg-white border border-border/60 p-1 rounded-xl shadow-xs flex w-max min-w-full gap-0.5">
            {[
              { value: "stats", icon: BarChart2, label: "Stats" },
              { value: "users", icon: Users, label: "Users" },
              { value: "questions", icon: HelpCircle, label: "Questions" },
              { value: "badges", icon: Star, label: "Badges" },
              { value: "reports", icon: Flag, label: "Reports" },
              { value: "announcements", icon: Megaphone, label: "Announcements" },
              { value: "suggestions", icon: Lightbulb, label: "Suggestions" },
              { value: "logs", icon: ClipboardList, label: "Audit Log" },
              { value: "danger", icon: AlertTriangle, label: "Danger Zone" },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm data-[state=active]:shadow-sm whitespace-nowrap">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* STATS TAB */}
        <TabsContent value="stats">
          {stats && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: `+${stats.newUsersThisWeek} this week` },
                  { label: "Total Questions", value: stats.totalQuestions, icon: HelpCircle, color: "text-violet-600", bg: "bg-violet-50", trend: `+${stats.newQuestionsThisWeek} this week` },
                  { label: "Answers", value: stats.totalAnswers, icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50", trend: null },
                  { label: "Gold Ribbons", value: stats.totalAwardedAnswers, icon: Award, color: "text-amber-600", bg: "bg-amber-50", trend: null },
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
                  { label: "Solved Questions", value: stats.solvedQuestions, pct: stats.totalQuestions ? Math.round(stats.solvedQuestions / stats.totalQuestions * 100) : 0 },
                  { label: "Active Badges", value: stats.totalBadges, pct: null },
                  { label: "New Users (week)", value: stats.newUsersThisWeek, pct: null },
                  { label: "New Questions (week)", value: stats.newQuestionsThisWeek, pct: null },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-border/60 p-4 shadow-xs">
                    <p className="text-xl font-extrabold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    {stat.pct !== null && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Resolution rate</span>
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

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject distribution bar chart */}
                {stats.topSubjects.length > 0 && (
                  <div className="bg-white rounded-xl border border-border/60 p-6 shadow-xs">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary" /> Questions by Subject
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.topSubjects.map(s => ({ name: s.subject, count: s.count }))} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                          cursor={{ fill: "#f5f3ff" }}
                        />
                        <Bar dataKey="count" name="Questions" radius={[6,6,0,0]}>
                          {stats.topSubjects.map((_, i) => {
                            const colors = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];
                            return <Cell key={i} fill={colors[i % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Question status pie chart */}
                <div className="bg-white rounded-xl border border-border/60 p-6 shadow-xs">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-primary" /> Question Status
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Solved", value: stats.solvedQuestions },
                          { name: "Unsolved", value: Math.max(0, stats.totalQuestions - stats.solvedQuestions) },
                        ]}
                        cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                        paddingAngle={4} dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Content overview bar chart */}
              <div className="bg-white rounded-xl border border-border/60 p-6 shadow-xs">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                  <BarChart2 className="h-4 w-4 text-primary" /> Platform Overview
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={[
                      { name: "Users", value: stats.totalUsers },
                      { name: "Questions", value: stats.totalQuestions },
                      { name: "Answers", value: stats.totalAnswers },
                      { name: "Awarded", value: stats.totalAwardedAnswers },
                      { name: "Badges", value: stats.totalBadges },
                    ]}
                    margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} cursor={{ fill: "#f5f3ff" }} />
                    <Bar dataKey="value" name="Count" radius={[6,6,0,0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-gray-50/50 flex items-center justify-between gap-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Users ({usersData?.total || 0})
              </h2>
              <form onSubmit={e => { e.preventDefault(); setUserSearch(userSearchInput); setUserPage(1); }} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={userSearchInput}
                    onChange={e => setUserSearchInput(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9 h-8 w-52 rounded-lg text-xs border-border/70"
                  />
                </div>
                <Button type="submit" className="h-8 px-3 rounded-lg text-xs gradient-primary text-white border-0">Search</Button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-gray-50/30">
                    {["User", "Email", "Points", "Role", "Status", "Joined", "Actions"].map(h => (
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
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePremium(u.id, u.isPremium ?? false)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isPremium
                                ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
                            }`}
                            title={u.isPremium ? "Remove Premium" : "Grant Premium"}
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleToggleUser(u.id, u.isActive)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isActive
                                  ? "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.isActive ? "Suspend user" : "Unsuspend user"}
                            >
                              {u.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {usersData && usersData.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-gray-50/30">
                <p className="text-xs text-muted-foreground">
                  Page {userPage} of {usersData.totalPages} · {usersData.total} users
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
                Questions ({questionsData?.total || 0})
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
                <p className="text-xs text-muted-foreground">Page {questionPage} of {questionsData.totalPages}</p>
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
                  <Star className="h-4 w-4 text-primary" /> Active Badges ({badges?.length || 0})
                </h2>
              </div>
              <div className="divide-y divide-border/40">
                {badges?.map(badge => (
                  <div key={badge.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: badge.color + "15", border: `1.5px solid ${badge.color}25` }}
                    >
                      {(() => { const I = ADMIN_ICON_MAP[badge.icon] || Star; return <I className="h-4.5 w-4.5" style={{ color: badge.color }} />; })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: badge.color }}>{badge.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {badge.pointsRequired === 0 ? "On join" : `${badge.pointsRequired} pts`}
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
                  <Plus className="h-4 w-4 text-primary" /> Create New Badge
                </h2>
              </div>
              <form onSubmit={handleCreateBadge} className="p-5 space-y-3">
                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-border/60">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: newBadge.color + "15", border: `1.5px solid ${newBadge.color}30` }}
                  >
                    {(() => { const I = ADMIN_ICON_MAP[newBadge.icon] || Star; return <I className="h-5 w-5" style={{ color: newBadge.color }} />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: newBadge.color }}>
                      {newBadge.name || "Badge name"}
                    </p>
                    <p className="text-xs text-muted-foreground">{newBadge.description || "Description..."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground mb-1 block">Name *</label>
                    <Input value={newBadge.name} onChange={e => setNewBadge(b => ({ ...b, name: e.target.value }))} placeholder="Ex: Master" className="h-9 rounded-lg text-sm" required />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground mb-1 block">Description *</label>
                    <Input value={newBadge.description} onChange={e => setNewBadge(b => ({ ...b, description: e.target.value }))} placeholder="When is it awarded?" className="h-9 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Icon</label>
                    <Input value={newBadge.icon} onChange={e => setNewBadge(b => ({ ...b, icon: e.target.value }))} placeholder="Star, Trophy..." className="h-9 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Color</label>
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
                    <label className="text-xs font-semibold text-foreground mb-1 block">Points required</label>
                    <Input type="number" value={newBadge.pointsRequired} onChange={e => setNewBadge(b => ({ ...b, pointsRequired: parseInt(e.target.value) || 0 }))} min={0} className="h-9 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Category</label>
                    <Input value={newBadge.category} onChange={e => setNewBadge(b => ({ ...b, category: e.target.value }))} placeholder="general" className="h-9 rounded-lg text-sm" />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-white border-0 h-9 rounded-xl font-semibold shadow-sm hover:opacity-90 gap-2"
                  disabled={createBadge.isPending}
                >
                  <Plus className="h-4 w-4" />
                  {createBadge.isPending ? "Creating..." : "Create badge"}
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
        {/* ANNOUNCEMENTS TAB */}
        <TabsContent value="announcements">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> Platform Announcements
                </h2>
                <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="h-8 rounded-lg text-xs">
                  Refresh
                </Button>
              </div>
              {announcementsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl border bg-white animate-pulse" />)}
                </div>
              ) : announcements.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center">
                  <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-muted-foreground">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a: any) => (
                    <div key={a.id} className={`bg-white rounded-xl border p-4 shadow-xs ${a.isActive ? "border-primary/30" : "border-border/60 opacity-60"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              a.type === "info" ? "bg-blue-50 text-blue-700" :
                              a.type === "warning" ? "bg-amber-50 text-amber-700" :
                              "bg-emerald-50 text-emerald-700"
                            }`}>{a.type.toUpperCase()}</span>
                            {a.isActive && <span className="text-xs text-emerald-600 font-medium">● Active</span>}
                          </div>
                          <p className="text-sm font-semibold">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleAnnouncement(a.id, !a.isActive)}
                            className={`p-1.5 rounded-lg transition-colors ${a.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground hover:bg-gray-100"}`}
                            title={a.isActive ? "Deactivate" : "Activate"}
                          >
                            {a.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(a.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create form */}
            <div className="bg-white rounded-xl border border-border/60 p-5 shadow-xs h-fit">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> New Announcement
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement(a => ({ ...a, title: e.target.value }))}
                    placeholder="Announcement title..."
                    className="h-9 rounded-lg text-sm"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement(a => ({ ...a, content: e.target.value }))}
                    placeholder="Announcement content..."
                    rows={3}
                    className="w-full text-sm border border-border/70 rounded-lg px-3 py-2 resize-none bg-gray-50 focus:outline-none focus:border-primary/60 focus:bg-white transition-colors"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={e => setNewAnnouncement(a => ({ ...a, type: e.target.value }))}
                    className="w-full h-9 text-sm border border-border/70 rounded-lg px-3 bg-white focus:outline-none focus:border-primary/60 transition-colors"
                  >
                    <option value="info">Info (blue)</option>
                    <option value="warning">Warning (amber)</option>
                    <option value="success">Success (green)</option>
                  </select>
                </div>
                <Button
                  onClick={createAnnouncement}
                  disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                  className="w-full gradient-primary text-white border-0 h-9 rounded-lg font-semibold shadow-sm hover:opacity-90 gap-2"
                >
                  <Megaphone className="h-4 w-4" /> Publish Announcement
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SUGGESTIONS TAB */}
        <TabsContent value="suggestions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Feature Suggestions ({suggestions.length})
              </h2>
              <Button variant="outline" size="sm" onClick={fetchSuggestions} className="h-8 rounded-lg text-xs">
                Refresh
              </Button>
            </div>

            {suggestionsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl border bg-white animate-pulse" />)}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-muted-foreground">No suggestions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Users can suggest features from the Leaderboard page</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s: any) => {
                  const statusCfg: Record<string, { label: string; color: string }> = {
                    pending:   { label: "Pending",      color: "bg-amber-50 text-amber-700 border-amber-200" },
                    reviewing: { label: "Reviewing",    color: "bg-blue-50 text-blue-700 border-blue-200" },
                    planned:   { label: "Planned",      color: "bg-violet-50 text-violet-700 border-violet-200" },
                    done:      { label: "Done",         color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    rejected:  { label: "Not Planned",  color: "bg-gray-50 text-gray-600 border-gray-200" },
                  };
                  const cfg = statusCfg[s.status] ?? statusCfg.pending;
                  return (
                    <div key={s.id} className="bg-white rounded-xl border border-border/60 p-4 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                            {s.author && (
                              <span className="text-xs text-muted-foreground">by <span className="font-medium">{s.author.displayName}</span> @{s.author.username}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <select
                            value={s.status}
                            onChange={e => updateSuggestionStatus(s.id, e.target.value)}
                            className="text-xs border border-border/70 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary/60"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="planned">Planned</option>
                            <option value="done">Done</option>
                            <option value="rejected">Not Planned</option>
                          </select>
                          <button
                            onClick={() => deleteSuggestion(s.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete suggestion"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* AUDIT LOG TAB */}
        <TabsContent value="logs">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> Admin Audit Log
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Every admin action recorded — {logsTotal.toLocaleString()} total entries
                </p>
              </div>
              <Button
                variant="outline" size="sm"
                onClick={() => fetchLogs(logsPage, logsCategory)}
                disabled={logsLoading}
                className="h-8 rounded-lg text-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All", color: "bg-gray-100 text-gray-700 border-gray-200" },
                { key: "users", label: "Users", color: "bg-blue-50 text-blue-700 border-blue-200" },
                { key: "content", label: "Content", color: "bg-violet-50 text-violet-700 border-violet-200" },
                { key: "badges", label: "Badges", color: "bg-amber-50 text-amber-700 border-amber-200" },
                { key: "moderation", label: "Moderation", color: "bg-red-50 text-red-700 border-red-200" },
                { key: "announcements", label: "Announcements", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { key: "suggestions", label: "Suggestions", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => {
                    setLogsCategory(key);
                    setLogsPage(1);
                    fetchLogs(1, key);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    logsCategory === key
                      ? color + " ring-2 ring-offset-1 ring-current/30 shadow-sm"
                      : "bg-white text-muted-foreground border-border/60 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Log table */}
            {logsLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl border bg-white animate-pulse" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-border p-16 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/25 mx-auto mb-3" />
                <p className="font-semibold text-muted-foreground">No log entries yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Admin actions will be recorded here automatically
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-gray-50/70">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-40">Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-28">Admin</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-32">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-40">Action</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-36">Target</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {logs.map((log: any) => {
                        const ACTION_LABELS: Record<string, { label: string; color: string }> = {
                          "user.suspend":             { label: "Suspend",        color: "bg-red-50 text-red-700 border-red-200" },
                          "user.unsuspend":           { label: "Unsuspend",      color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          "user.delete":              { label: "Delete user",    color: "bg-red-100 text-red-800 border-red-300" },
                          "user.role_change":         { label: "Role change",    color: "bg-blue-50 text-blue-700 border-blue-200" },
                          "user.points_edit":         { label: "Edit points",    color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                          "question.delete":          { label: "Del. question",  color: "bg-orange-50 text-orange-700 border-orange-200" },
                          "badge.create":             { label: "Create badge",   color: "bg-amber-50 text-amber-700 border-amber-200" },
                          "badge.update":             { label: "Update badge",   color: "bg-amber-50 text-amber-700 border-amber-200" },
                          "badge.delete":             { label: "Delete badge",   color: "bg-orange-100 text-orange-800 border-orange-300" },
                          "report.reviewed":          { label: "Reviewed",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          "report.dismissed":         { label: "Dismissed",      color: "bg-gray-50 text-gray-600 border-gray-200" },
                          "report.pending":           { label: "Re-opened",      color: "bg-amber-50 text-amber-700 border-amber-200" },
                          "announcement.create":      { label: "Post ann.",      color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          "announcement.toggle":      { label: "Toggle ann.",    color: "bg-blue-50 text-blue-700 border-blue-200" },
                          "announcement.delete":      { label: "Del. ann.",      color: "bg-red-50 text-red-700 border-red-200" },
                          "suggestion.status_change": { label: "Status change",  color: "bg-violet-50 text-violet-700 border-violet-200" },
                          "suggestion.delete":        { label: "Del. suggestion", color: "bg-red-50 text-red-700 border-red-200" },
                        };
                        const CAT_COLORS: Record<string, string> = {
                          users:         "bg-blue-50 text-blue-600",
                          content:       "bg-violet-50 text-violet-600",
                          badges:        "bg-amber-50 text-amber-600",
                          moderation:    "bg-red-50 text-red-600",
                          announcements: "bg-emerald-50 text-emerald-600",
                          suggestions:   "bg-indigo-50 text-indigo-600",
                        };
                        const actionCfg = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-50 text-gray-600 border-gray-200" };
                        const catColor = CAT_COLORS[log.category] ?? "bg-gray-50 text-gray-600";
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold text-foreground">@{log.adminUsername}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                                {log.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${actionCfg.color}`}>
                                {actionCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                              {log.targetLabel ?? (log.targetType ? `${log.targetType} #${log.targetId}` : "—")}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={log.details ?? ""}>
                              {log.details ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-gray-50/50">
                    <span className="text-xs text-muted-foreground">
                      Page {logsPage} of {logsTotalPages} · {logsTotal} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => { const p = Math.max(1, logsPage - 1); setLogsPage(p); fetchLogs(p, logsCategory); }}
                        disabled={logsPage === 1 || logsLoading}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => { const p = Math.min(logsTotalPages, logsPage + 1); setLogsPage(p); fetchLogs(p, logsCategory); }}
                        disabled={logsPage === logsTotalPages || logsLoading}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* DANGER ZONE TAB */}
        <TabsContent value="danger">
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Irreversible actions. Admin accounts are always preserved.</p>
            </div>

            {/* SET POINTS */}
            <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-xs">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-primary" /> Set Points for a User
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Overwrite the points balance of any user directly.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Select user</label>
                  <select
                    value={pointsUserId}
                    onChange={e => setPointsUserId(e.target.value)}
                    className="w-full rounded-lg border border-border/70 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— choose user —</option>
                    {(usersData?.users ?? []).map((u: any) => (
                      <option key={u.id} value={u.id}>#{u.id} {u.displayName} (@{u.username}) — {u.points} pts</option>
                    ))}
                  </select>
                </div>
                <div className="w-40">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">New points</label>
                  <Input
                    type="number"
                    min={0}
                    max={9999999}
                    value={pointsValue}
                    onChange={e => setPointsValue(e.target.value)}
                    placeholder="e.g. 0"
                    className="rounded-lg h-9 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSetPoints}
                    disabled={pointsLoading || !pointsUserId || pointsValue === ""}
                    className="gradient-primary text-white border-0 rounded-xl h-9 px-4 text-sm font-semibold whitespace-nowrap"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    {pointsLoading ? "Saving..." : "Set Points"}
                  </Button>
                </div>
              </div>
            </div>

            {/* CLEAR DATA */}
            <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-xs">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-1 text-red-700">
                <Trash2 className="h-4 w-4" /> Clear Platform Data
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Choose what to delete. Admin accounts are never touched.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {([
                  { id: "questions" as const, label: "Content only", desc: "Questions, answers, comments, votes, reports", confirm: "DELETE CONTENT", color: "border-amber-300 bg-amber-50 text-amber-800" },
                  { id: "users" as const, label: "User accounts", desc: "All non-admin accounts and their data", confirm: "DELETE USERS", color: "border-orange-300 bg-orange-50 text-orange-800" },
                  { id: "all" as const, label: "Everything", desc: "Content + all non-admin user accounts", confirm: "DELETE ALL", color: "border-red-300 bg-red-50 text-red-800" },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setDangerTarget(opt.id); setConfirmText(""); }}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${dangerTarget === opt.id ? opt.color + " ring-2 ring-offset-1 ring-red-400" : "border-border/50 bg-gray-50 hover:border-border"}`}
                  >
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {dangerTarget && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-red-700">
                    To confirm, type <span className="font-mono font-bold bg-red-100 px-1.5 py-0.5 rounded">
                      {dangerTarget === "all" ? "DELETE ALL" : dangerTarget === "questions" ? "DELETE CONTENT" : "DELETE USERS"}
                    </span> below:
                  </p>
                  <div className="flex gap-3">
                    <Input
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      placeholder="Type confirmation text..."
                      className="rounded-lg h-9 text-sm font-mono border-red-300 bg-white flex-1"
                    />
                    <Button
                      onClick={handleResetData}
                      disabled={dangerLoading || confirmText !== (dangerTarget === "all" ? "DELETE ALL" : dangerTarget === "questions" ? "DELETE CONTENT" : "DELETE USERS")}
                      variant="destructive"
                      className="h-9 px-4 rounded-xl text-sm font-semibold whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {dangerLoading ? "Deleting..." : "Confirm Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setDangerTarget(null); setConfirmText(""); }}
                      className="h-9 px-3 rounded-xl text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
