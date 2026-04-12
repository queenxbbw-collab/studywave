import { useRoute } from "wouter";
import { useGetUser, useGetUserQuestions, useGetUserAnswers } from "@workspace/api-client-react";
import { getGetUserQueryKey, getGetUserQuestionsQueryKey, getGetUserAnswersQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Settings, Trophy, HelpCircle, MessageCircle, Award, Calendar, Shield,
  Star, Zap, TrendingUp, Lock, Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const EMOJI_MAP: Record<string, string> = {
  Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥",
  Zap: "⚡", Crown: "👑", BookOpen: "📖", HelpCircle: "❓", MessageCircle: "💬",
};

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const userId = parseInt(params?.id || "0");
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) },
  });
  const { data: questions } = useGetUserQuestions(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQuestionsQueryKey(userId) },
  });
  const { data: answers } = useGetUserAnswers(userId, {
    query: { enabled: !!userId, queryKey: getGetUserAnswersQueryKey(userId) },
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
        <p className="text-muted-foreground">Utilizatorul nu a fost gasit.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  // Calculate rank/level based on points
  const getLevel = (points: number) => {
    if (points >= 5000) return { label: "Expert", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: "🏆" };
    if (points >= 2000) return { label: "Avansat", color: "text-purple-600 bg-purple-50 border-purple-200", icon: "💎" };
    if (points >= 1000) return { label: "Intermediar", color: "text-blue-600 bg-blue-50 border-blue-200", icon: "🔥" };
    if (points >= 100) return { label: "Incepator", color: "text-green-600 bg-green-50 border-green-200", icon: "⭐" };
    return { label: "Nou", color: "text-gray-600 bg-gray-50 border-gray-200", icon: "🌱" };
  };
  const level = getLevel(profile.points);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-xs mb-6">
        {/* Cover gradient */}
        <div className="h-24 gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 dot-bg opacity-60"></div>
          <div className="absolute right-0 top-0 w-48 h-48 bg-primary/8 rounded-full blur-2xl"></div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="gradient-primary text-white text-2xl font-black">
                  {profile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            {isOwnProfile && (
              <Link href="/settings">
                <Button variant="outline" size="sm" className="h-8 px-3.5 rounded-xl gap-2 text-xs font-semibold">
                  <Settings className="h-3.5 w-3.5" /> Editare profil
                </Button>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">{profile.displayName}</h1>
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
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Membru din {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border/50">
          {[
            { icon: Trophy, label: "Puncte", value: profile.points.toLocaleString(), color: "text-amber-600", bg: "bg-amber-50" },
            { icon: HelpCircle, label: "Intrebari", value: profile.questionCount, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: MessageCircle, label: "Raspunsuri", value: profile.answerCount, color: "text-violet-600", bg: "bg-violet-50" },
            { icon: Award, label: "Funditze", value: profile.awardedAnswerCount, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat, i) => (
            <div key={stat.label} className={`flex items-center gap-3 px-5 py-4 ${i < 3 ? "border-r border-border/50" : ""}`}>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
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
              Badge-uri ({profile.badges.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {profile.badges.map(badge => (
              <div
                key={badge.id}
                title={badge.description}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:shadow-sm cursor-default"
                style={{
                  backgroundColor: badge.color + "10",
                  borderColor: badge.color + "30",
                }}
              >
                <span className="text-base">{EMOJI_MAP[badge.icon] || "🏅"}</span>
                <span className="text-xs font-bold" style={{ color: badge.color }}>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="bg-white border border-border/60 p-1 rounded-xl shadow-xs w-full">
          <TabsTrigger value="questions" className="flex-1 rounded-lg text-sm data-[state=active]:shadow-sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Intrebari ({questions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="answers" className="flex-1 rounded-lg text-sm data-[state=active]:shadow-sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Raspunsuri ({answers?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-0">
          {questions?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-border/60">
              <HelpCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground/60">Nicio intrebare publicata</p>
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
              <p className="font-semibold text-foreground/60">Niciun raspuns publicat</p>
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
                      <Award className="h-3.5 w-3.5" /> Cel mai bun raspuns · Fundita de aur
                    </div>
                  )}
                  <p className="text-sm text-foreground/85 line-clamp-3 leading-relaxed">{a.content}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <TrendingUp className="h-3 w-3" /> {a.upvotes - a.downvotes} voturi
                    </span>
                    <Link href={`/questions/${a.questionId}`}>
                      <span className="ml-auto text-xs text-primary font-semibold hover:underline cursor-pointer">
                        Vezi intrebarea →
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
