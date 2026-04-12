import { useState, useEffect } from "react";
import { Megaphone, X, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "success";
}

const TYPE_CONFIG = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
    text: "text-blue-800",
    close: "text-blue-400 hover:text-blue-600",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
    text: "text-amber-800",
    close: "text-amber-400 hover:text-amber-600",
  },
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
    text: "text-emerald-800",
    close: "text-emerald-400 hover:text-emerald-600",
  },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/announcements")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.announcements) setAnnouncements(data.announcements);
      })
      .catch(() => {});
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {visible.map(a => {
        const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.info;
        return (
          <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg}`}>
            <Megaphone className={`h-4 w-4 flex-shrink-0 mt-0.5 ${cfg.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${cfg.text}`}>{a.title}</p>
              <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{a.content}</p>
            </div>
            <button
              onClick={() => setDismissed(d => new Set([...d, a.id]))}
              className={`flex-shrink-0 ${cfg.close} transition-colors`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
