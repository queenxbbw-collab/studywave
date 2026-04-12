import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateQuestion } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, HelpCircle } from "lucide-react";
import { Link } from "wouter";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Literature", "Computer Science", "Economics", "Languages", "Other"];

export default function AskPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");

  const createQuestion = useCreateQuestion();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !subject) {
      toast({ title: "Completeaza toate campurile", variant: "destructive" });
      return;
    }
    createQuestion.mutate({ data: { title, content, subject } }, {
      onSuccess: (q) => {
        toast({ title: "Intrebare publicata cu succes! +5 puncte" });
        navigate(`/questions/${q.id}`);
      },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/questions">
        <Button variant="ghost" size="sm" className="gap-2 mb-6">
          <ChevronLeft className="h-4 w-4" />
          Inapoi
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pune o intrebare</h1>
          <p className="text-sm text-muted-foreground">Fii clar si detaliat pentru a primi cel mai bun raspuns</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Titlul intrebarii *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Cum calculez derivata unui produs?"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/200 caractere</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Subiect *</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Alege subiectul" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Detalii intrebare *</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Descrie problema ta in detaliu. Cu cat mai multe detalii, cu atat mai bun raspunsul!"
              rows={8}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Postarea unei intrebari iti aduce <span className="text-primary font-medium">+5 puncte</span>
          </div>
          <Button type="submit" disabled={createQuestion.isPending} className="px-8">
            {createQuestion.isPending ? "Se publica..." : "Publica intrebarea"}
          </Button>
        </div>
      </form>
    </div>
  );
}
