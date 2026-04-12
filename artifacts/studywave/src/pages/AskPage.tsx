import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateQuestion } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, HelpCircle, Lightbulb, CheckCircle2, Zap, ArrowRight } from "lucide-react";

const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","History","Geography","Literature","Computer Science","Economics","Languages","Other"];

const TIPS = [
  { icon: CheckCircle2, text: "Fii specific si clar in formularea intrebarii", color: "text-emerald-600 bg-emerald-50" },
  { icon: Lightbulb, text: "Descrie ce ai incercat deja si unde te-ai blocat", color: "text-amber-600 bg-amber-50" },
  { icon: Zap, text: "Adauga exemple concrete pentru mai multa claritate", color: "text-blue-600 bg-blue-50" },
];

export default function AskPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [step, setStep] = useState(1);

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
        toast({ title: "Intrebare publicata! +5 puncte adaugate." });
        navigate(`/questions/${q.id}`);
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/questions">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Intrebari
          </button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">Intrebare noua</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Form */}
        <div>
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Pune o intrebare</h1>
                <p className="text-sm text-muted-foreground">+5 puncte la publicare</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-xl border border-border/60 p-6 shadow-xs space-y-5">
              {/* Subject */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Subiect <span className="text-red-500">*</span>
                </label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-11 rounded-xl border-border/70 text-sm bg-gray-50/50 focus:bg-white">
                    <SelectValue placeholder="Alege materia..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Titlul intrebarii <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Cum calculez derivata unui produs de functii?"
                  maxLength={200}
                  className="h-11 rounded-xl border-border/70 bg-gray-50/50 focus:bg-white text-sm"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground">Fii concis si specific</p>
                  <p className={`text-xs ${title.length > 180 ? "text-red-500" : "text-muted-foreground"}`}>
                    {title.length}/200
                  </p>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Detalii intrebare <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Descrie problema in detaliu. Explica ce ai incercat, unde te-ai blocat si ce anume nu intelegi. Cu cat mai mult context, cu atat mai bun raspunsul primit!"
                  rows={9}
                  className="resize-none rounded-xl border-border/70 bg-gray-50/50 focus:bg-white text-sm leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-amber-500" />
                Primesti <span className="font-bold text-foreground mx-1">+5 puncte</span> la publicare
              </div>
              <Button
                type="submit"
                className="gradient-primary text-white border-0 h-11 px-7 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-all gap-2"
                disabled={createQuestion.isPending || !title.trim() || !content.trim() || !subject}
              >
                {createQuestion.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Se publica...
                  </div>
                ) : (
                  <>Publica intrebarea <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border/60 p-5 shadow-xs">
            <h3 className="font-bold text-sm mb-4">Sfaturi pentru o intrebare buna</h3>
            <div className="space-y-3">
              {TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${tip.color}`}>
                    <tip.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-primary">Sistem de puncte</p>
            </div>
            <div className="space-y-2 text-xs text-foreground/70">
              <div className="flex justify-between">
                <span>Publicare intrebare</span>
                <span className="font-bold text-primary">+5 pts</span>
              </div>
              <div className="flex justify-between">
                <span>Raspuns publicat</span>
                <span className="font-bold text-primary">+10 pts</span>
              </div>
              <div className="flex justify-between">
                <span>Fundita de aur primita</span>
                <span className="font-bold text-amber-600">+50 pts</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5 shadow-xs">
            <h3 className="font-bold text-sm mb-3">Preview subiect</h3>
            {subject ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Intrebarea ta va aparea in categoria:</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  {subject}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Alege un subiect pentru a vedea preview-ul</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
