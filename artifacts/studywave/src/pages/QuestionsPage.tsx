import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { useListQuestions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Search, Plus, ChevronLeft, ChevronRight, X } from "lucide-react";

const SUBJECTS = [
  "all","Mathematics","Physics","Chemistry","Biology","History","Geography",
  "Literature","Computer Science","Economics","Languages",
  "Philosophy","Psychology","Music","Art","Engineering","Medicine","Environment","Law","Sports",
  "Other"
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function QuestionsPage() {
  usePageTitle("Questions");
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [subject, setSubject] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(inputValue, 350);

  const { data, isLoading } = useListQuestions({
    search: debouncedSearch || undefined,
    subject: subject !== "all" ? subject : undefined,
    sort,
    page,
    limit: 15,
  });

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, subject, sort]);

  const hasFilters = !!debouncedSearch || subject !== "all" || sort !== "newest";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Questions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? (
              <span><strong className="text-foreground">{data.total.toLocaleString()}</strong> questions published</span>
            ) : "Loading..."}
          </p>
        </div>
        {user && (
          <Link href="/ask">
            <Button className="gradient-primary text-white border-0 gap-2 h-9 px-4 rounded-xl font-semibold shadow-sm hover:opacity-90">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Ask a Question
            </Button>
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-border/60 p-4 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search questions, authors... (live)"
              className="pl-10 h-9 rounded-lg border-border/70 bg-gray-50 focus-visible:bg-white"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={subject} onValueChange={v => setSubject(v)}>
              <SelectTrigger className="h-9 w-44 rounded-lg border-border/70 text-sm">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All subjects" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={v => setSort(v)}>
              <SelectTrigger className="h-9 w-40 rounded-lg border-border/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="most-voted">Most voted</SelectItem>
                <SelectItem value="unsolved">Unsolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/40">
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                Search: "{debouncedSearch}"
                <button onClick={() => setInputValue("")} className="hover:text-primary/60"><X className="h-3 w-3" /></button>
              </span>
            )}
            {subject !== "all" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                {subject}
                <button onClick={() => setSubject("all")} className="hover:text-primary/60"><X className="h-3 w-3" /></button>
              </span>
            )}
            {sort !== "newest" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                {sort === "oldest" ? "Oldest first" : sort === "most-voted" ? "Most voted" : "Unsolved"}
                <button onClick={() => setSort("newest")} className="hover:text-primary/60"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              onClick={() => { setInputValue(""); setSubject("all"); setSort("newest"); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: "newest", label: "Newest" },
          { value: "trending", label: "Trending" },
          { value: "most-voted", label: "Most Voted" },
          { value: "unsolved", label: "Unsolved" },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setSort(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              sort === tab.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/60 p-5 animate-pulse h-28"></div>
          ))}
        </div>
      ) : data?.questions.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No questions found</p>
          <p className="text-sm text-muted-foreground">Try different search terms or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.questions.map(q => <QuestionCard key={q.id} question={q} />)}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-3 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(7, data.totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    p === page ? "gradient-primary text-white shadow-sm" : "bg-white border border-border/60 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="h-9 px-3 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
