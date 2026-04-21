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
import { SUBJECTS_LIST, subjectLabel } from "@/lib/subjects";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SUBJECTS_WITH_ALL = ["all", ...SUBJECTS_LIST];

export default function QuestionsPage() {
  usePageTitle("Întrebări");
  const { user } = useAuth();

  const initialSearch = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("search") ?? ""
    : "";

  const [inputValue, setInputValue] = useState(initialSearch);
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

  useEffect(() => { setPage(1); }, [debouncedSearch, subject, sort]);

  const hasFilters = !!debouncedSearch || subject !== "all" || sort !== "newest";

  const sortLabel = (s: string) => {
    if (s === "newest") return "Cele mai noi";
    if (s === "oldest") return "Cele mai vechi";
    if (s === "most-voted") return "Cele mai votate";
    if (s === "unsolved") return "Nerezolvate";
    if (s === "trending") return "În tendințe";
    return s;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Întrebări</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? (
              <span><strong className="text-foreground">{data.total.toLocaleString("ro-RO")}</strong> întrebări publicate</span>
            ) : "Se încarcă..."}
          </p>
        </div>
        {user && (
          <Link href="/ask">
            <Button className="gradient-primary text-white border-0 gap-2 h-9 px-4 rounded-xl font-semibold shadow-sm hover:opacity-90">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Pune o Întrebare
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
              placeholder="Caută întrebări, autori... (live)"
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
                <SelectValue placeholder="Materie" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS_WITH_ALL.map(s => (
                  <SelectItem key={s} value={s}>{subjectLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={v => setSort(v)}>
              <SelectTrigger className="h-9 w-44 rounded-lg border-border/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Cele mai noi</SelectItem>
                <SelectItem value="oldest">Cele mai vechi</SelectItem>
                <SelectItem value="most-voted">Cele mai votate</SelectItem>
                <SelectItem value="unsolved">Nerezolvate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/40">
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                Căutare: "{debouncedSearch}"
                <button onClick={() => setInputValue("")} className="hover:text-primary/60"><X className="h-3 w-3" /></button>
              </span>
            )}
            {subject !== "all" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                {subjectLabel(subject)}
                <button onClick={() => setSubject("all")} className="hover:text-primary/60"><X className="h-3 w-3" /></button>
              </span>
            )}
            {sort !== "newest" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                {sortLabel(sort)}
                <button onClick={() => setSort("newest")} className="hover:text-primary/60"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              onClick={() => { setInputValue(""); setSubject("all"); setSort("newest"); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Șterge tot
            </button>
          </div>
        )}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: "newest", label: "Cele mai noi" },
          { value: "trending", label: "În tendințe" },
          { value: "most-voted", label: "Cele mai votate" },
          { value: "unsolved", label: "Nerezolvate" },
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
          <p className="font-semibold text-foreground mb-1">Nicio întrebare găsită</p>
          <p className="text-sm text-muted-foreground">Încearcă alți termeni de căutare sau filtre diferite</p>
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
          <div className="flex gap-1 items-center">
            {(() => {
              const total = data.totalPages;
              const cur = page;
              const pages: (number | "...")[] = [];
              const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
              add(1);
              if (cur - 2 > 2) pages.push("...");
              for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) add(i);
              if (cur + 2 < total - 1) pages.push("...");
              if (total > 1) add(total);
              return pages.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      p === page ? "gradient-primary text-white shadow-sm" : "bg-white border border-border/60 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {p}
                  </button>
                )
              );
            })()}
            {data.totalPages > 7 && (
              <input
                type="number"
                min={1}
                max={data.totalPages}
                placeholder="Pag."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseInt((e.target as HTMLInputElement).value, 10);
                    if (!isNaN(v) && v >= 1 && v <= data.totalPages) setPage(v);
                  }
                }}
                className="w-16 h-9 ml-2 px-2 rounded-lg border border-border/60 text-sm text-center focus:outline-none focus:border-primary/60"
              />
            )}
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
