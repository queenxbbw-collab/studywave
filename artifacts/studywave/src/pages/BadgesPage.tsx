import { useListBadges } from "@workspace/api-client-react";
import { Star, Lock, Sparkles } from "lucide-react";

const EMOJI_MAP: Record<string, string> = {
  Trophy: "🏆", Star: "⭐", Award: "🎖️", Shield: "🛡️", Flame: "🔥",
  Zap: "⚡", Crown: "👑", BookOpen: "📖", HelpCircle: "❓", MessageCircle: "💬",
};

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; desc: string }> = {
  general: { label: "General", emoji: "🌟", desc: "Badge-uri pentru activitate generala pe platforma" },
  points: { label: "Puncte", emoji: "⚡", desc: "Acordate pentru acumularea de puncte" },
  questions: { label: "Intrebari", emoji: "❓", desc: "Acordate pentru intrebari publicate" },
  answers: { label: "Raspunsuri", emoji: "💬", desc: "Acordate pentru raspunsuri de calitate" },
  awards: { label: "Premii", emoji: "🏆", desc: "Acordate pentru funditze de aur primite" },
};

export default function BadgesPage() {
  const { data: badges, isLoading } = useListBadges();

  const grouped = badges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-md mb-4">
          <Star className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Badge-uri</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Castiga badge-uri exclusive prin activitate pe StudyWave. Fiecare badge reflecta o realizare a ta!
        </p>
      </div>

      {/* Badge count */}
      {badges && (
        <div className="flex items-center justify-center gap-6 mb-8 p-4 bg-white rounded-xl border border-border/60 shadow-xs">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">{badges.length}</p>
            <p className="text-xs text-muted-foreground">Badge-uri totale</p>
          </div>
          <div className="w-px h-10 bg-border"></div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">{Object.keys(grouped || {}).length}</p>
            <p className="text-xs text-muted-foreground">Categorii</p>
          </div>
          <div className="w-px h-10 bg-border"></div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">{badges.filter(b => b.pointsRequired === 0).length}</p>
            <p className="text-xs text-muted-foreground">La inregistrare</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/60 p-5 animate-pulse">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped || {}).map(([category, categoryBadges]) => {
            const config = CATEGORY_CONFIG[category] || { label: category, emoji: "🏅", desc: "" };
            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border/60 rounded-full shadow-xs">
                    <span>{config.emoji}</span>
                    <span className="text-sm font-bold text-foreground">{config.label}</span>
                    <span className="text-xs text-muted-foreground font-medium bg-gray-100 px-1.5 py-0.5 rounded-full ml-1">
                      {categoryBadges?.length}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border/60"></div>
                </div>

                {config.desc && (
                  <p className="text-xs text-muted-foreground mb-4">{config.desc}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {categoryBadges?.map(badge => (
                    <div
                      key={badge.id}
                      className="group bg-white rounded-xl border border-border/60 p-5 text-center hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default relative overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `radial-gradient(ellipse at top, ${badge.color}08 0%, transparent 70%)` }}
                      ></div>
                      <div className="relative">
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl transition-transform group-hover:scale-110 duration-200 shadow-sm"
                          style={{
                            backgroundColor: badge.color + "15",
                            border: `1.5px solid ${badge.color}25`,
                          }}
                        >
                          {EMOJI_MAP[badge.icon] || "🏅"}
                        </div>
                        <h3 className="font-bold text-sm mb-1 transition-colors" style={{ color: badge.color }}>
                          {badge.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-tight mb-3">{badge.description}</p>
                        <div
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: badge.color + "12", color: badge.color }}
                        >
                          {badge.pointsRequired === 0 ? (
                            <><Sparkles className="h-3 w-3" /> La inregistrare</>
                          ) : (
                            <><Lock className="h-3 w-3" /> {badge.pointsRequired.toLocaleString()} pts</>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
