import { useGetLeaderboard } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Trophy, Award, MessageCircle, Crown, Medal } from "lucide-react";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Clasament</h1>
          <p className="text-sm text-muted-foreground">Cei mai activi utilizatori pe StudyWave</p>
        </div>
      </div>

      {/* Top 3 podium */}
      {!isLoading && leaderboard && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 0, 2].map(i => {
            const entry = leaderboard[i];
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            return (
              <Link href={`/profile/${entry.id}`} key={entry.id}>
                <div className={`bg-card border rounded-2xl p-4 text-center cursor-pointer hover:border-primary/40 transition-all ${
                  isFirst ? "border-yellow-500/50 ring-1 ring-yellow-500/20" : "border-border"
                }`}>
                  <div className="flex justify-center mb-2">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <Avatar className={`mx-auto ${isFirst ? "h-16 w-16" : "h-12 w-12"}`}>
                    <AvatarImage src={entry.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {entry.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold mt-2 text-sm truncate">{entry.displayName}</p>
                  <p className={`font-bold ${isFirst ? "text-xl text-yellow-400" : "text-lg text-primary"}`}>
                    {entry.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">puncte</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard?.map(entry => (
            <Link href={`/profile/${entry.id}`} key={entry.id}>
              <div className={`bg-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all ${
                entry.rank <= 3 ? "border-primary/20" : "border-border"
              }`}>
                <div className="w-8 flex justify-center flex-shrink-0">
                  <RankIcon rank={entry.rank} />
                </div>
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={entry.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {entry.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{entry.username}</p>
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{entry.answerCount}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-amber-400">
                    <Award className="h-4 w-4" />
                    <span>{entry.awardedAnswerCount}</span>
                  </div>
                  <div className="font-bold text-primary text-right">
                    {entry.points.toLocaleString()}
                    <p className="text-xs text-muted-foreground font-normal">puncte</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
