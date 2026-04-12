import { useGetLeaderboard } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Trophy, Award, MessageCircle, Crown, Medal, HelpCircle, TrendingUp } from "lucide-react";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  const top3 = leaderboard?.slice(0, 3) || [];
  const podiumOrder = [1, 0, 2];

  const medalConfig = [
    { bg: "bg-gradient-to-b from-yellow-400 to-yellow-500", icon: Crown, ring: "ring-yellow-300" },
    { bg: "bg-gradient-to-b from-gray-300 to-gray-400", icon: Medal, ring: "ring-gray-200" },
    { bg: "bg-gradient-to-b from-amber-600 to-amber-700", icon: Medal, ring: "ring-amber-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-md mb-4">
          <Trophy className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">The most active and valuable members of the StudyWave community</p>
      </div>

      {/* Podium */}
      {!isLoading && top3.length >= 3 && (
        <div className="mb-10">
          <div className="flex items-end justify-center gap-3 sm:gap-6 mb-8">
            {podiumOrder.map((idx) => {
              const entry = top3[idx];
              if (!entry) return null;
              const isFirst = idx === 0;
              const medal = medalConfig[idx];

              return (
                <Link href={`/profile/${entry.id}`} key={entry.id}>
                  <div className={`relative flex flex-col items-center cursor-pointer group ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full ${medal.bg} flex items-center justify-center shadow-md z-10 ring-2 ${medal.ring}`}>
                      <span className="text-white text-xs font-black">{idx + 1}</span>
                    </div>

                    <div className={`flex flex-col items-center p-4 sm:p-5 rounded-2xl border transition-all group-hover:-translate-y-1 group-hover:shadow-lg ${
                      isFirst ? "bg-gradient-to-b from-yellow-50 to-amber-50/50 border-yellow-200 w-36 sm:w-44 pt-7" : "bg-white border-border/60 w-28 sm:w-36 pt-7"
                    }`}>
                      <Avatar className={isFirst ? "h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-yellow-300/60" : "h-12 w-12 sm:h-16 sm:w-16"}>
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback className={`${isFirst ? "text-xl font-black" : "text-lg font-bold"} gradient-primary text-white`}>
                          {entry.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className={`font-bold text-foreground mt-2.5 text-center leading-tight ${isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
                        {entry.displayName}
                      </p>
                      <p className={`text-muted-foreground text-xs ${isFirst ? "" : "hidden sm:block"}`}>@{entry.username}</p>
                      <div className={`font-extrabold mt-2 ${isFirst ? "text-2xl text-amber-600" : "text-xl text-primary"}`}>
                        {entry.points.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>

                    <div className={`w-full rounded-b-xl ${medal.bg} ${isFirst ? "h-14 sm:h-16" : idx === 1 ? "h-10 sm:h-12" : "h-8 sm:h-10"}`}></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            All Rankings
          </h2>
          <span className="text-xs text-muted-foreground">{leaderboard?.length || 0} users</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-6 h-4 bg-gray-100 rounded"></div>
                <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/5"></div>
                </div>
                <div className="h-6 bg-gray-100 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {leaderboard?.map(entry => {
              const isTop3 = entry.rank <= 3;
              return (
                <Link href={`/profile/${entry.id}`} key={entry.id}>
                  <div className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 cursor-pointer transition-colors group ${isTop3 ? "bg-yellow-50/20" : ""}`}>
                    <div className="w-8 flex justify-center flex-shrink-0">
                      {entry.rank === 1 ? (
                        <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm"><Crown className="h-3.5 w-3.5 text-white" /></div>
                      ) : entry.rank === 2 ? (
                        <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center shadow-sm"><Medal className="h-3.5 w-3.5 text-white" /></div>
                      ) : entry.rank === 3 ? (
                        <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center shadow-sm"><Medal className="h-3.5 w-3.5 text-white" /></div>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                      )}
                    </div>

                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={entry.avatarUrl || undefined} />
                      <AvatarFallback className="gradient-primary text-white text-sm font-bold">{entry.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{entry.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{entry.username}</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center"><HelpCircle className="h-3 w-3 text-blue-500" /></div>
                        <span className="font-medium">{entry.questionCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <div className="w-5 h-5 bg-violet-50 rounded flex items-center justify-center"><MessageCircle className="h-3 w-3 text-violet-500" /></div>
                        <span className="font-medium">{entry.answerCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <div className="w-5 h-5 bg-amber-50 rounded flex items-center justify-center"><Award className="h-3 w-3 text-amber-500" /></div>
                        <span className="font-medium">{entry.awardedAnswerCount}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className={`text-base font-extrabold ${isTop3 ? "text-amber-600" : "text-primary"}`}>{entry.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
