import { useState } from "react";
import { useListQuestions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Search, Plus, HelpCircle, ChevronLeft, ChevronRight, SlidersHorizontal, TrendingUp, Clock, ThumbsUp, CircleDot } from "lucide-react";

const SUBJECTS = ["all","Mathematics","Physics","Chemistry","Biology","History","Geography","Literature","Computer Science","Economics","Languages","Other"];

export default function QuestionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [subject, setSubject] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListQuestions({
    search: search || undefined,
    subject: subject !== "all" ? subject : undefined,
    sort,
    page,
    limit: 15,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputValue);
    setPage(1);
  };

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
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Search questions, authors..."
                className="pl-10 h-9 rounded-lg border-border/70 bg-gray-50 focus-visible:bg-white"
              />
            </div>
            <Button type="submit" className="h-9 px-4 rounded-lg gradient-primary text-white border-0 font-semibold">Search</Button>
          </form>
          <div className="flex gap-2">
            <Select value={subject} onValueChange={v => { setSubject(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-44 rounded-lg border-border/70 text-sm">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All subjects" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-44 rounded-lg border-border/70 text-sm">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
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

        {(search || subject !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">
                Search: "{search}"
                <button onClick={() => { setSearch(""); setInputValue(""); }}>×</button>
              </span>
            )}
            {subject !== "all" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">
                {subject}
                <button onClick={() => setSubject("all")}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100/70 p-1 rounded-xl w-fit">
        {[
          { label: "Newest", value: "newest", icon: Clock },
          { label: "Most Voted", value: "most-voted", icon: TrendingUp },
          { label: "Unsolved", value: "unsolved", icon: CircleDot },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setSort(tab.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sort === tab.value ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/60 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-2"><div className="h-5 bg-gray-100 rounded-full w-20"></div><div className="h-5 bg-gray-100 rounded-full w-16"></div></div>
                  <div className="h-5 bg-gray-100 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/5"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.questions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-border/60">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-semibold text-foreground">No questions found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term or subject</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.questions.map(q => <QuestionCard key={q.id} question={q} />)}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Page <strong>{page}</strong> of <strong>{data.totalPages}</strong>
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p < 1 || p > data.totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "gradient-primary text-white shadow-sm" : "text-muted-foreground hover:bg-gray-100"}`}>{p}</button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
