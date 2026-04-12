import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { Bookmark, Trash2, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BookmarkedQuestion {
  bookmarkId: number;
  id: number;
  title: string;
  subject: string;
  upvotes: number;
  isSolved: boolean;
  hasAwardedAnswer: boolean;
  createdAt: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  bookmarkedAt: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-50 text-blue-700",
  Physics: "bg-purple-50 text-purple-700",
  Chemistry: "bg-emerald-50 text-emerald-700",
  Biology: "bg-green-50 text-green-700",
  History: "bg-amber-50 text-amber-700",
  Geography: "bg-orange-50 text-orange-700",
  Literature: "bg-rose-50 text-rose-700",
  "Computer Science": "bg-cyan-50 text-cyan-700",
  Economics: "bg-yellow-50 text-yellow-700",
  Languages: "bg-pink-50 text-pink-700",
  Other: "bg-gray-50 text-gray-600",
};

export default function BookmarksPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    const res = await fetch("/api/bookmarks", { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data.bookmarks ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (questionId: number) => {
    await fetch(`/api/bookmarks/${questionId}`, { method: "DELETE", headers: getAuthHeaders() });
    setBookmarks(b => b.filter(x => x.id !== questionId));
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bookmark className="h-5 w-5 text-primary fill-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My Bookmarks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Questions you saved for later</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-white animate-pulse" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground mb-4">Save questions you want to revisit later</p>
          <Link href="/questions">
            <Button variant="outline" className="rounded-xl">Browse Questions</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(bq => (
            <div key={bq.bookmarkId} className="bg-white border border-border/60 rounded-xl p-4 hover:shadow-sm transition-shadow group">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUBJECT_COLORS[bq.subject] ?? "bg-gray-50 text-gray-600"}`}>
                      {bq.subject}
                    </span>
                    {bq.isSolved && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Solved
                      </span>
                    )}
                  </div>
                  <Link href={`/questions/${bq.id}`}>
                    <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 cursor-pointer">
                      {bq.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={bq.authorAvatarUrl || undefined} />
                        <AvatarFallback className="text-[8px] gradient-primary text-white">
                          {bq.authorDisplayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{bq.authorDisplayName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Bookmarked {formatDistanceToNow(new Date(bq.bookmarkedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/questions/${bq.id}`}>
                    <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => removeBookmark(bq.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
