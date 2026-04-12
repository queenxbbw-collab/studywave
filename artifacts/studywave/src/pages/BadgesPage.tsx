import { usePageTitle } from "@/hooks/use-page-title";
import { useListBadges } from "@workspace/api-client-react";
import {
  Star, Lock, Sparkles, Trophy, Award, Shield, Flame, Zap,
  Crown, BookOpen, HelpCircle, MessageCircle, Target, Medal,
  CheckCircle, Lightbulb, Brain, Rocket, Heart
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy, Star, Award, Shield, Flame, Zap, Crown,
  BookOpen, HelpCircle, MessageCircle, Target, Medal,
  CheckCircle, Lightbulb, Brain, Rocket, Heart, Sparkles,
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon; desc: string; color: string }> = {
  general:   { label: "General",   icon: Star,       desc: "Awarded for general activity on the platform", color: "text-violet-600 bg-violet-50 border-violet-200" },
  points:    { label: "Points",    icon: Zap,        desc: "Awarded for accumulating points",              color: "text-amber-600 bg-amber-50 border-amber-200" },
  questions: { label: "Questions", icon: HelpCircle, desc: "Awarded for publishing questions",             color: "text-blue-600 bg-blue-50 border-blue-200" },
  answers:   { label: "Answers",   icon: MessageCircle, desc: "Awarded for quality answers",              color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  awards:    { label: "Awards",    icon: Trophy,     desc: "Awarded for Gold Ribbons received",            color: "text-orange-600 bg-orange-50 border-orange-200" },
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

function BadgeIcon({ iconName, colorClass }: { iconName: string; colorClass: string }) {
  const Icon = ICON_MAP[iconName] || Star;
  return (
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-md mx-auto mb-3`}>
      <Icon className="h-7 w-7 text-white" strokeWidth={2} />
    </div>
  );
}

export default function BadgesPage() {
  usePageTitle("Badges");
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
          <Trophy className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Badges</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Earn exclusive badges through your activity on StudyWave. Every badge reflects an achievement!
        </p>
      </div>

      {/* Stats */}
      {badges && (
        <div className="flex items-center justify-center gap-6 mb-8 p-4 bg-white rounded-xl border border-border/60 shadow-xs">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">{badges.length}</p>
            <p className="text-xs text-muted-foreground">Total badges</p>
          </div>
          <div className="w-px h-10 bg-border"></div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">{Object.keys(grouped || {}).length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
          <div className="w-px h-10 bg-border"></div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">{badges.filter(b => b.pointsRequired === 0).length}</p>
            <p className="text-xs text-muted-foreground">On registration</p>
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
            const config = CATEGORY_CONFIG[category] || { label: category, icon: Star, desc: "", color: "text-gray-600 bg-gray-50 border-gray-200" };
            const CatIcon = config.icon;
            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full shadow-xs ${config.color}`}>
                    <CatIcon className="h-4 w-4" />
                    <span className="text-sm font-bold">{config.label}</span>
                    <span className="text-xs font-medium bg-white/60 px-1.5 py-0.5 rounded-full ml-1">
                      {(categoryBadges as typeof badges)?.length}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border/60"></div>
                  <span className="text-xs text-muted-foreground hidden sm:block">{config.desc}</span>
                </div>

                {/* Badge grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(categoryBadges as typeof badges)?.map(badge => {
                    const gradient = BADGE_COLOR_MAP[badge.color] || "from-primary to-violet-600";
                    return (
                      <div
                        key={badge.id}
                        className="group bg-white rounded-xl border border-border/60 p-5 text-center hover:shadow-md hover:border-primary/30 transition-all duration-200"
                      >
                        <BadgeIcon iconName={badge.icon} colorClass={gradient} />
                        <h3 className="font-bold text-sm text-foreground mb-1 leading-tight">{badge.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{badge.description}</p>
                        {badge.pointsRequired === 0 ? (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <Sparkles className="h-3 w-3" />
                            On join
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Zap className="h-3 w-3" />
                            {badge.pointsRequired.toLocaleString()} pts
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
