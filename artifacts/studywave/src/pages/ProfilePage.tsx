import { useRoute } from "wouter";
import { useGetUser, useGetUserQuestions, useGetUserAnswers, useListBadges } from "@workspace/api-client-react";
import { getGetUserQueryKey, getGetUserQuestionsQueryKey, getGetUserAnswersQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings, Trophy, Star, MessageCircle, HelpCircle, Award, Calendar, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const BADGE_ICON_MAP: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">Utilizatorul nu a fost gasit.</div>;

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                {profile.role === "admin" && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="text-sm mt-2 text-foreground/80">{profile.bio}</p>}
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Membru din {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Editare profil
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profile.points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Trophy className="h-3 w-3" /> Puncte</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.questionCount}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><HelpCircle className="h-3 w-3" /> Intrebari</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.answerCount}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><MessageCircle className="h-3 w-3" /> Raspunsuri</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{profile.awardedAnswerCount}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Award className="h-3 w-3" /> Funditze</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Badge-uri ({profile.badges.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.badges.map(badge => (
              <div
                key={badge.id}
                title={`${badge.name}: ${badge.description}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: badge.color + "20",
                  borderColor: badge.color + "40",
                  color: badge.color,
                }}
              >
                <span className="text-base">{
                  ["Trophy","Star","Award","Shield","Flame","Zap"].includes(badge.icon)
                    ? { Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥", Zap: "⚡", Crown: "👑", BookOpen: "📖", HelpCircle: "❓", MessageCircle: "💬" }[badge.icon] || "🏅"
                    : "🏅"
                }</span>
                {badge.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="questions">
        <TabsList className="w-full">
          <TabsTrigger value="questions" className="flex-1">Intrebari ({questions?.length || 0})</TabsTrigger>
          <TabsTrigger value="answers" className="flex-1">Raspunsuri ({answers?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4 space-y-4">
          {questions?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-xl">
              <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nicio intrebare inca</p>
            </div>
          ) : (
            questions?.map(q => <QuestionCard key={q.id} question={q} />)
          )}
        </TabsContent>

        <TabsContent value="answers" className="mt-4 space-y-4">
          {answers?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-xl">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Niciun raspuns inca</p>
            </div>
          ) : (
            answers?.map(a => (
              <div key={a.id} className={`bg-card border rounded-xl p-4 ${a.isAwarded ? "border-amber-500/40" : "border-border"}`}>
                {a.isAwarded && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                    <Award className="h-3 w-3" /> Cel mai bun raspuns
                  </div>
                )}
                <p className="text-sm text-foreground/80 line-clamp-3">{a.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  <span>{a.upvotes} voturi</span>
                  <Link href={`/questions/${a.questionId}`} className="text-primary hover:underline">
                    Vezi intrebarea
                  </Link>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
