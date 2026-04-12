import { useState, useEffect, useRef } from "react";
import { Bell, BellDot, CheckCheck, Zap, Award, MessageCircle, Megaphone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  questionId: number | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcon: Record<string, React.ReactNode> = {
  new_answer: <MessageCircle className="h-4 w-4 text-blue-500" />,
  gold_ribbon: <Award className="h-4 w-4 text-amber-500" />,
  badge_earned: <Zap className="h-4 w-4 text-indigo-500" />,
  announcement: <Megaphone className="h-4 w-4 text-rose-500" />,
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    const res = await fetch("/api/notifications?limit=20", { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnread(data.unreadCount ?? 0);
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT", headers: getAuthHeaders() });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PUT", headers: getAuthHeaders() });
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        {unread > 0 ? <BellDot className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[360px] bg-white rounded-xl shadow-2xl border border-border/60 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-border/40 last:border-0 cursor-pointer transition-colors ${
                    n.isRead ? "bg-white" : "bg-primary/3"
                  } hover:bg-gray-50`}
                  onClick={() => {
                    markRead(n.id);
                    if (n.questionId) setOpen(false);
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {typeIcon[n.type] ?? <Bell className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.questionId ? (
                      <Link href={`/questions/${n.questionId}`}>
                        <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
