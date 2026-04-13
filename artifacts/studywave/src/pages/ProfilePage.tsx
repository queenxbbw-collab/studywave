import { usePageTitle } from "@/hooks/use-page-title";
import { useRoute } from "wouter";
import { useGetUserQuestions, useGetUserAnswers } from "@workspace/api-client-react";
import { getGetUserQuestionsQueryKey, getGetUserAnswersQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Settings, Trophy, HelpCircle, MessageCircle, Award, Calendar, Shield,
  Star, Zap, TrendingUp, Lock, Sparkles, Flame, Globe, Twitter, Github, Linkedin, ExternalLink,
  Crown, BookOpen, Target, Medal, CheckCircle, Lightbulb, Brain, Rocket, Heart,
  UserPlus, UserCheck, Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy, Star, Award, Shield, Flame, Zap, Crown,
  BookOpen, HelpCircle, MessageCircle, Target, Medal,
  CheckCircle, Lightbulb, Brain, Rocket, Heart, Sparkles,
};

const BADGE_COLOR_MAP: Record<string, string> = {
  gold:    "from-amber-400 to-yellow-500",
  silver:  "from-slate-300 to-slate-400",
  bronze:  "from-orange-400 to-amber-500",
  blue:    "from-blue-400 to-indigo-500",
  green:   "from-emerald-400 to-teal-500",
  purple:  "from-violet-400 to-purple-500",
  red:     "from-rose-400 to-red-500",
};

export default function ProfilePage() {
  usePageTitle("Profile");
  const [, params] = useRoute("/profile/:id");
  const rawParam = params?.id || "";
  const numericId = parseInt(rawParam, 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === rawParam;

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [followLoading, setFollowLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", rawParam],
    queryFn: async () => {
      const r = await fetch(`/api/users/${rawParam}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!rawParam,
  });

  const resolvedId: number = profile?.id ?? (isNumeric ? numericId : 0);

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", resolvedId],
    queryFn: async () => {
      if (!currentUser || !resolvedId) return { isFollowing: false };
      const r = await fetch(`/api/users/${resolvedId}/follow-status`, { headers: getAuthHeaders() });
      if (!r.ok) return { isFollowing: false };
      return r.json();
    },
    enabled: !!currentUser && !!resolvedId,
  });

  const followStatusValue = followStatus?.isFollowing ?? false;

  const handleFollowToggle = async () => {
    if (!currentUser) { toast({ title: "Sign in to follow users", variant: "destructive" }); return; }
    setFollowLoading(true);
    try {
      const method = followStatusValue ? "DELETE" : "POST";
      const r = await fetch(`/api/users/${resolvedId}/follow`, { method, headers: getAuthHeaders() });
      if (r.ok) {
        queryClient.invalidateQueries({ queryKey: ["follow-status", resolvedId] });
        queryClient.invalidateQueries({ queryKey: ["user-profile", rawParam] });
        toast({ title: followStatusValue ? "Unfollowed" : `Now following ${profile?.displayName}` });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  const { data: questions } = useGetUserQuestions(resolvedId, {
    query: { enabled: !!resolvedId, queryKey: getGetUserQuestionsQueryKey(resolvedId) },
  });
  const { data: answers } = useGetUserAnswers(resolvedId, {
    query: { enabled: !!resolvedId, queryKey: getGetUserAnswersQueryKey(resolvedId) },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-white rounded-2xl border border-border/60 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-100 rounded w-40"></div>
                <div className="h-4 bg-gray-100 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === resolvedId;

  // Calculate rank/level based on points
  const getLevel = (points: number) => {
    if (points >= 5000) return { label: "Expert", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: "🏆" };
    if (points >= 2000) return { label: "Advanced", color: "text-purple-600 bg-purple-50 border-purple-200", icon: "💎" };
    if (points >= 1000) return { label: "Intermediate", color: "text-blue-600 bg-blue-50 border-blue-200", icon: "🔥" };
    if (points >= 100) return { label: "Beginner", color: "text-green-600 bg-green-50 border-green-200", icon: "⭐" };
    return { label: "New", color: "text-gray-600 bg-gray-50 border-gray-200", icon: "🌱" };
  };
  const level = getLevel(profile.points);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-xs mb-6">
        {/* Cover gradient */}
        <div
          className={`h-24 relative overflow-hidden${!(profile as any).bannerColor ? " gradient-hero" : ""}`}
          style={(profile as any).bannerColor ? { background: (profile as any).bannerColor } : undefined}
        >
          <div className="absolute inset-0 dot-bg opacity-40"></div>
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {(profile as any).isPremium ? (
                <div className="h-20 w-20 rounded-full p-[3px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-lg shadow-amber-200/60">
                  <Avatar className="h-full w-full border-2 border-white">
                    <AvatarImage src={profile.avatarUrl || undefined} />
                    <AvatarFallback className="gradient-primary text-white text-2xl font-black">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="gradient-primary text-white text-2xl font-black">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="flex items-center gap-2">
              {!isOwnProfile && currentUser && (
                <Button
                  variant={followStatusValue ? "outline" : "default"}
                  size="sm"
                  disabled={followLoading}
                  onClick={handleFollowToggle}
                  className={`h-8 px-3.5 rounded-xl gap-2 text-xs font-semibold ${followStatusValue ? "" : "gradient-primary text-white border-0 hover:opacity-90"}`}
                >
                  {followStatusValue ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {followStatusValue ? "Following" : "Follow"}
                </Button>
              )}
              {isOwnProfile && (
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="h-8 px-3.5 rounded-xl gap-2 text-xs font-semibold">
                    <Settings className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">{profile.displayName}</h1>
            {(profile as any).isPremium && (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <Crown className="h-3 w-3" /> Premium
                </span>
                {isOwnProfile && (profile as any).premiumExpiresAt && (
                  <span className="text-xs text-amber-600/70 font-medium">
                    expires {new Date((profile as any).premiumExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </>
            )}
            {profile.role === "admin" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${level.color}`}>
              <span>{level.icon}</span> {level.label}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-1">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm text-foreground/75 mt-2 max-w-lg leading-relaxed">{profile.bio}</p>
          )}

          {/* Social links */}
          {((profile as any).website || (profile as any).twitter || (profile as any).github || (profile as any).linkedin) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {(profile as any).website && (
                <a href={(profile as any).website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border/50 hover:border-border bg-gray-50/50 hover:bg-gray-100">
                  <Globe className="h-3 w-3" /> Website <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </a>
              )}
              {(profile as any).twitter && (
                <a href={(profile as any).twitter.startsWith("http") ? (profile as any).twitter : `https://twitter.com/${(profile as any).twitter.replace("@","")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-600 transition-colors px-2 py-1 rounded-lg border border-border/50 hover:border-sky-200 bg-gray-50/50 hover:bg-sky-50">
                  <Twitter className="h-3 w-3" /> Twitter
                </a>
              )}
              {(profile as any).github && (
                <a href={(profile as any).github.startsWith("http") ? (profile as any).github : `https://github.com/${(profile as any).github}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border/50 hover:border-border bg-gray-50/50 hover:bg-gray-100">
                  <Github className="h-3 w-3" /> GitHub
                </a>
              )}
              {(profile as any).linkedin && (
                <a href={(profile as any).linkedin.startsWith("http") ? (profile as any).linkedin : `https://linkedin.com/in/${(profile as any).linkedin}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-600 transition-colors px-2 py-1 rounded-lg border border-border/50 hover:border-blue-200 bg-gray-50/50 hover:bg-blue-50">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Member since {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 sm:grid-cols-8 border-t border-border/50 divide-x divide-border/50">
          {[
            { icon: Trophy, label: "Points", value: profile.points.toLocaleString(), color: "text-amber-600", bg: "bg-amber-50" },
            { icon: HelpCircle, label: "Questions", value: (profile as any).questionCount ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: MessageCircle, label: "Answers", value: (profile as any).answerCount ?? 0, color: "text-violet-600", bg: "bg-violet-50" },
            { icon: Award, label: "Ribbons", value: (profile as any).awardedAnswerCount ?? 0, color: "text-amber-600", bg: "bg-amber-50" },
            { icon: Users, label: "Followers", value: (profile as any).followersCount ?? 0, color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: UserPlus, label: "Following", value: (profile as any).followingCount ?? 0, color: "text-teal-600", bg: "bg-teal-50" },
            { icon: Flame, label: "Streak", value: (profile as any).currentStreak ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
            { icon: TrendingUp, label: "Best", value: (profile as any).longestStreak ?? 0, color: "text-rose-600", bg: "bg-rose-50" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center py-4 px-1 text-center gap-1">
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <p className="text-base font-extrabold text-foreground leading-none tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/60 p-5 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <div className="w-7 h-7 bg-primary/8 rounded-lg flex items-center justify-center">
                <Star className="h-3.5 w-3.5 text-primary" />
              </div>
              Badges ({profile.badges.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {profile.badges.map(badge => {
              const Icon = ICON_MAP[badge.icon] || Star;
              const gradient = BADGE_COLOR_MAP[badge.color] || "from-primary to-violet-600";
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  className="group bg-gray-50/60 rounded-xl border border-border/60 p-4 text-center hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-default"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm mx-auto mb-2.5`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <p className="font-bold text-xs text-foreground leading-tight mb-1">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="bg-white border border-border/60 p-1 rounded-xl shadow-xs w-full">
          <TabsTrigger value="questions" className="flex-1 rounded-lg text-sm data-[state=active]:shadow-sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Questions ({questions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="answers" className="flex-1 rounded-lg text-sm data-[state=active]:shadow-sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Answers ({answers?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-0">
          {questions?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-border/60">
              <HelpCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground/60">No questions posted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions?.map(q => <QuestionCard key={q.id} question={q} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="mt-0">
          {answers?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-border/60">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground/60">No answers posted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {answers?.map(a => (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    a.isAwarded ? "border-amber-200 ring-1 ring-amber-100" : "border-border/60 hover:border-border"
                  }`}
                >
                  {a.isAwarded && (
                    <div className="flex items-center gap-2 text-amber-700 text-xs font-bold mb-3 pb-2.5 border-b border-amber-100">
                      <Award className="h-3.5 w-3.5" /> Best Answer · Gold Ribbon
                    </div>
                  )}
                  <p className="text-sm text-foreground/85 line-clamp-3 leading-relaxed">{a.content}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <TrendingUp className="h-3 w-3" /> {a.upvotes - a.downvotes} votes
                    </span>
                    <Link href={`/questions/${a.questionId}`}>
                      <span className="ml-auto text-xs text-primary font-semibold hover:underline cursor-pointer">
                        View question →
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
