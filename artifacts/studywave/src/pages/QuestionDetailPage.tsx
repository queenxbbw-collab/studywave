import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetQuestion, useVoteQuestion, useCreateAnswer, useVoteAnswer, useAwardAnswer, useDeleteQuestion, useDeleteAnswer, getGetQuestionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, Award, CheckCircle2, Trash2, ChevronLeft, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Physics: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Chemistry: "bg-green-500/20 text-green-300 border-green-500/30",
  Biology: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  History: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Geography: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Literature: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Computer Science": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Economics: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Languages: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export default function QuestionDetailPage() {
  const [, params] = useRoute("/questions/:id");
  const questionId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [answerContent, setAnswerContent] = useState("");

  const { data: question, isLoading } = useGetQuestion(questionId, {
    query: { enabled: !!questionId, queryKey: getGetQuestionQueryKey(questionId) },
  });

  const voteQuestion = useVoteQuestion();
  const createAnswer = useCreateAnswer();
  const voteAnswer = useVoteAnswer();
  const awardAnswer = useAwardAnswer();
  const deleteQuestion = useDeleteQuestion();
  const deleteAnswer = useDeleteAnswer();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(questionId) });

  const handleVoteQuestion = (type: string) => {
    if (!user) { toast({ title: "Autentificare necesara", variant: "destructive" }); return; }
    voteQuestion.mutate({ id: questionId, data: { type } }, { onSuccess: invalidate, onError: (e) => toast({ title: e.message, variant: "destructive" }) });
  };

  const handleVoteAnswer = (answerId: number, type: string) => {
    if (!user) { toast({ title: "Autentificare necesara", variant: "destructive" }); return; }
    voteAnswer.mutate({ id: answerId, data: { type } }, { onSuccess: invalidate, onError: (e) => toast({ title: e.message, variant: "destructive" }) });
  };

  const handleAwardAnswer = (answerId: number) => {
    awardAnswer.mutate({ id: answerId }, {
      onSuccess: () => { invalidate(); toast({ title: "Fundita acordata! Raspunsul a fost marcat ca cel mai bun." }); },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    if (!user) { toast({ title: "Autentificare necesara", variant: "destructive" }); return; }
    createAnswer.mutate({ data: { questionId, content: answerContent } }, {
      onSuccess: () => { setAnswerContent(""); invalidate(); toast({ title: "Raspuns adaugat cu succes!" }); },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteQuestion = () => {
    if (!confirm("Stergi aceasta intrebare?")) return;
    deleteQuestion.mutate({ id: questionId }, {
      onSuccess: () => navigate("/questions"),
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteAnswer = (answerId: number) => {
    if (!confirm("Stergi acest raspuns?")) return;
    deleteAnswer.mutate({ id: answerId }, {
      onSuccess: invalidate,
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!question) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">Intrebarea nu a fost gasita.</div>;

  const isQuestionAuthor = user?.id === question.authorId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/questions">
        <Button variant="ghost" size="sm" className="gap-2 mb-6">
          <ChevronLeft className="h-4 w-4" />
          Inapoi la intrebari
        </Button>
      </Link>

      {/* Question */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => handleVoteQuestion("up")}
              className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
            >
              <ThumbsUp className="h-5 w-5" />
            </button>
            <span className="text-lg font-bold text-foreground">{question.upvotes - question.downvotes}</span>
            <button
              onClick={() => handleVoteQuestion("down")}
              className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
            >
              <ThumbsDown className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SUBJECT_COLORS[question.subject] || SUBJECT_COLORS["Other"]}`}>
                {question.subject}
              </span>
              {question.isSolved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Rezolvata
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">{question.title}</h1>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{question.content}</p>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Link href={`/profile/${question.authorId}`}>
                <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={question.authorAvatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {question.authorDisplayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{question.authorDisplayName}</p>
                    <p className="text-xs text-primary">{question.authorPoints} puncte</p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </span>
                {(isQuestionAuthor || user?.role === "admin") && (
                  <button
                    onClick={handleDeleteQuestion}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          {question.answers.length} {question.answers.length === 1 ? "Raspuns" : "Raspunsuri"}
        </h2>

        {question.answers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-xl">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Nu exista inca niciun raspuns. Fii primul!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {question.answers.map(answer => (
              <div
                key={answer.id}
                className={`bg-card border rounded-xl p-5 transition-all ${
                  answer.isAwarded ? "border-amber-500/50 bg-amber-500/5" : "border-border"
                }`}
              >
                {answer.isAwarded && (
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-3 pb-3 border-b border-amber-500/20">
                    <Award className="h-4 w-4" />
                    Cel mai bun raspuns (Fundita de aur)
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => handleVoteAnswer(answer.id, "up")}
                      className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-bold">{answer.upvotes - answer.downvotes}</span>
                    <button
                      onClick={() => handleVoteAnswer(answer.id, "down")}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{answer.content}</p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <Link href={`/profile/${answer.authorId}`}>
                        <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={answer.authorAvatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {answer.authorDisplayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{answer.authorDisplayName}</p>
                            <p className="text-xs text-primary">{answer.authorPoints} puncte</p>
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                        </span>
                        {isQuestionAuthor && !question.hasAwardedAnswer && !answer.isAwarded && answer.authorId !== user?.id && (
                          <button
                            onClick={() => handleAwardAnswer(answer.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors text-xs font-medium"
                          >
                            <Award className="h-3 w-3" />
                            Acordati fundita
                          </button>
                        )}
                        {(user?.id === answer.authorId || user?.role === "admin") && (
                          <button
                            onClick={() => handleDeleteAnswer(answer.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer form */}
      {user ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Adauga raspunsul tau</h3>
          <form onSubmit={handleSubmitAnswer}>
            <Textarea
              value={answerContent}
              onChange={e => setAnswerContent(e.target.value)}
              placeholder="Scrie raspunsul tau aici... Fii clar si detaliat!"
              rows={5}
              className="mb-3"
            />
            <Button type="submit" disabled={!answerContent.trim() || createAnswer.isPending}>
              {createAnswer.isPending ? "Se trimite..." : "Trimite raspuns"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground mb-3">Autentifica-te pentru a putea raspunde</p>
          <div className="flex justify-center gap-3">
            <Link href="/login"><Button>Autentificare</Button></Link>
            <Link href="/register"><Button variant="outline">Inregistrare</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
