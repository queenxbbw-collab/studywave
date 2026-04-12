import { useListBadges } from "@workspace/api-client-react";
import { Star, Trophy, Shield, Award, Zap, Flame, BookOpen, HelpCircle, MessageCircle, Crown } from "lucide-react";

const BADGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Trophy, Star, Award, Shield, Flame, Zap, BookOpen, HelpCircle, MessageCircle, Crown,
};

const EMOJI_MAP: Record<string, string> = {
  Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥", Zap: "⚡",
  Crown: "👑", BookOpen: "📖", HelpCircle: "❓", MessageCircle: "💬",
};

export default function BadgesPage() {
  const { data: badges, isLoading } = useListBadges();

  const grouped = badges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  const categoryNames: Record<string, string> = {
    general: "General",
    points: "Puncte",
    questions: "Intrebari",
    answers: "Raspunsuri",
    awards: "Premii",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Badge-uri</h1>
          <p className="text-sm text-muted-foreground">Castiga badge-uri prin activitate pe platforma</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(grouped || {}).map(([category, categoryBadges]) => (
          <div key={category} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {categoryNames[category] || category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categoryBadges?.map(badge => {
                const IconComponent = BADGE_ICONS[badge.icon];
                return (
                  <div
                    key={badge.id}
                    className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-all group"
                  >
                    <div
                      className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: badge.color + "20" }}
                    >
                      {EMOJI_MAP[badge.icon] || "🏅"}
                    </div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: badge.color }}>
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 leading-tight">{badge.description}</p>
                    <div
                      className="text-xs px-2 py-0.5 rounded-full font-medium inline-block"
                      style={{ backgroundColor: badge.color + "15", color: badge.color }}
                    >
                      {badge.pointsRequired === 0 ? "La inregistrare" : `${badge.pointsRequired} puncte`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
