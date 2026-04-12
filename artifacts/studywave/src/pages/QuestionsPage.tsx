import { useState } from "react";
import { useListQuestions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuestionCard from "@/components/QuestionCard";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Search, Plus, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";

const SUBJECTS = ["all", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Literature", "Computer Science", "Economics", "Languages", "Other"];

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Intrebari</h1>
          {data && <p className="text-sm text-muted-foreground mt-1">{data.total} intrebari total</p>}
        </div>
        {user && (
          <Link href="/ask">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Pune intrebare
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Cauta intrebari..."
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">Cauta</Button>
        </form>
        <Select value={subject} onValueChange={v => { setSubject(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Subiect" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(s => (
              <SelectItem key={s} value={s}>{s === "all" ? "Toate subiectele" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sortare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Cele mai noi</SelectItem>
            <SelectItem value="oldest">Cele mai vechi</SelectItem>
            <SelectItem value="most-voted">Cele mai votate</SelectItem>
            <SelectItem value="unsolved">Nerezolvate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : data?.questions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nu s-au gasit intrebari</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data?.questions.map(q => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page} din {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
