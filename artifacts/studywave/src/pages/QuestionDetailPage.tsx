import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetQuestion, useVoteQuestion, useCreateAnswer, useVoteAnswer,
  useAwardAnswer, useDeleteQuestion, useDeleteAnswer, getGetQuestionQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import {
  ThumbsUp, ThumbsDown, Award, CheckCircle2, Trash2, ChevronLeft,
  MessageCircle, ArrowUp, ArrowDown, Sparkles, Share2, BookOpen, Clock, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const SUBJECT_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Mathematics:       { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400" },
  Physics:           { bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-400" },
  Chemistry:         { bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-400" },
  Biology:           { bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-400" },
  History:           { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  Geography:         { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-400" },
  Literature:        { bg: "bg-rose-50",    text: "text-rose-700",   dot: "bg-rose-400" },
  "Computer Science":{ bg: "bg-cyan-50",    text: "text-cyan-700",   dot: "bg-cyan-400" },
  Economics:         { bg: "bg-yellow-50",  text: "text-yellow-700", dot: "bg-yellow-400" },
  Languages:         { bg: "bg-pink-50",    text: "text-pink-700",   dot: "bg-pink-400" },
  Other:             { bg: "bg-gray-50",    text: "text-gray-600",   dot: "bg-gray-400" },
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
    voteQuestion.mutate({ id: questionId, data: { type } }, {
      onSuccess: invalidate,
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleVoteAnswer = (answerId: number, type: string) => {
    if (!user) { toast({ title: "Autentificare necesara", variant: "destructive" }); return; }
    voteAnswer.mutate({ id: answerId, data: { type } }, {
      onSuccess: invalidate,
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleAwardAnswer = (answerId: number) => {
    awardAnswer.mutate({ id: answerId }, {
      onSuccess: () => {
        invalidate();
        toast({ title: "Fundita de aur acordata! +50 puncte pentru respondent." });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    if (!user) { toast({ title: "Autentificare necesara", variant: "destructive" }); return; }
    createAnswer.mutate({ data: { questionId, content: answerContent } }, {
      onSuccess: () => {
        setAnswerContent("");
        invalidate();
        toast({ title: "Raspuns adaugat! +10 puncte" });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteQuestion = () => {
    if (!confirm("Stergi aceasta intrebare?")) return;
    deleteQuestion.mutate({ id: questionId }, {
      onSuccess: () => navigate("/questions"),
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteAnswer = (answerId: number) => {
    if (!confirm("Stergi acest raspuns?")) return;
    deleteAnswer.mutate({ id: answerId }, {
      onSuccess: invalidate,
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-100 rounded w-24"></div>
          <div className="bg-white rounded-xl border border-border/60 p-6 space-y-3">
            <div className="h-7 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-base font-semibold">Intrebarea nu a fost gasita</p>
        <Link href="/questions"><Button className="mt-4" variant="outline">Inapoi la intrebari</Button></Link>
      </div>
    );
  }

  const isQuestionAuthor = user?.id === question.authorId;
  const subjectStyle = SUBJECT_CONFIG[question.subject] || SUBJECT_CONFIG["Other"];
  const score = question.upvotes - question.downvotes;

  // Sort: awarded answer first, then by score
  const sortedAnswers = [...(question.answers || [])].sort((a, b) => {
    if (a.isAwarded && !b.isAwarded) return -1;
    if (!a.isAwarded && b.isAwarded) return 1;
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/questions">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Intrebari
          </button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground truncate max-w-xs">{question.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main column */}
        <div className="space-y-5">
          {/* Question card */}
          <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs">
            <div className="p-6">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${subjectStyle.bg} ${subjectStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${subjectStyle.dot}`}></span>
                  {question.subject}
                </span>
                {question.isSolved && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3" /> Rezolvata
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight mb-4 tracking-tight">
                {question.title}
              </h1>

              {/* Content */}
              <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {question.content}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/60 border-t border-border/50">
              <div className="flex items-center gap-3">
                {/* Vote buttons */}
                <div className="flex items-center gap-1 bg-white rounded-lg border border-border/60 p-1 shadow-xs">
                  <button
                    onClick={() => handleVoteQuestion("up")}
                    className="p-1.5 rounded-md hover:bg-primary/8 hover:text-primary transition-colors text-muted-foreground"
                    title="Vot pozitiv"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <span className={`px-2 text-sm font-bold ${score > 0 ? "text-primary" : score < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                    {score}
                  </span>
                  <button
                    onClick={() => handleVoteQuestion("down")}
                    className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground"
                    title="Vot negativ"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                <Link href={`/profile/${question.authorId}`}>
                  <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={question.authorAvatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {question.authorDisplayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{question.authorDisplayName}</p>
                      <p className="text-xs text-primary">{question.authorPoints.toLocaleString()} pts</p>
                    </div>
                  </div>
                </Link>

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </span>
              </div>

              {(isQuestionAuthor || user?.role === "admin") && (
                <button
                  onClick={handleDeleteQuestion}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Sterge intrebarea"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Answers header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
              </div>
              {sortedAnswers.length} {sortedAnswers.length === 1 ? "Raspuns" : "Raspunsuri"}
            </h2>
          </div>

          {/* Answers list */}
          {sortedAnswers.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground/70">Nu exista inca raspunsuri</p>
              <p className="text-sm text-muted-foreground mt-1">Fii primul care ajuta!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAnswers.map(answer => {
                const answerScore = answer.upvotes - answer.downvotes;
                return (
                  <div
                    key={answer.id}
                    className={`bg-white rounded-xl border overflow-hidden shadow-xs transition-all ${
                      answer.isAwarded
                        ? "border-amber-300 ring-1 ring-amber-200/50"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    {answer.isAwarded && (
                      <div className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/60">
                        <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Award className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-700">Cel mai bun raspuns · Fundita de aur</span>
                        <div className="ml-auto flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Zap className="h-3 w-3" /> +50 puncte acordate
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Vote column */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => handleVoteAnswer(answer.id, "up")}
                            className="p-1.5 rounded-md hover:bg-primary/8 hover:text-primary transition-colors text-muted-foreground"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <span className={`text-sm font-bold ${answerScore > 0 ? "text-primary" : answerScore < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                            {answerScore}
                          </span>
                          <button
                            onClick={() => handleVoteAnswer(answer.id, "down")}
                            className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {answer.content}
                          </p>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                            <Link href={`/profile/${answer.authorId}`}>
                              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={answer.authorAvatarUrl || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {answer.authorDisplayName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-semibold">{answer.authorDisplayName}</p>
                                  <p className="text-xs text-primary">{answer.authorPoints.toLocaleString()} pts</p>
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
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors text-xs font-semibold shadow-xs"
                                >
                                  <Award className="h-3 w-3" /> Acorda fundita
                                </button>
                              )}
                              {(user?.id === answer.authorId || user?.role === "admin") && (
                                <button
                                  onClick={() => handleDeleteAnswer(answer.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Answer form */}
          {user ? (
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-border/50 bg-gray-50/50">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Scrie raspunsul tau
                  <span className="ml-auto text-xs text-muted-foreground font-normal">+10 puncte la postare</span>
                </h3>
              </div>
              <form onSubmit={handleSubmitAnswer} className="p-5">
                <Textarea
                  value={answerContent}
                  onChange={e => setAnswerContent(e.target.value)}
                  placeholder="Explica pas cu pas... Cu cat mai clar si mai detaliat, cu atat mai bune sansele de a primi fundita de aur!"
                  rows={5}
                  className="resize-none rounded-xl border-border/70 bg-gray-50/50 focus-visible:bg-white text-sm"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">
                    Sfat: un raspuns complet si detaliat are mai multe sanse sa primeasca fundita de aur (+50 pts)
                  </p>
                  <Button
                    type="submit"
                    className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                    disabled={!answerContent.trim() || createAnswer.isPending}
                  >
                    {createAnswer.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Se trimite...
                      </div>
                    ) : "Trimite raspuns"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border/60 p-6 text-center">
              <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground mb-1">Autentifica-te pentru a raspunde</p>
              <p className="text-sm text-muted-foreground mb-4">Ajuta alti studenti si castiga puncte!</p>
              <div className="flex justify-center gap-3">
                <Link href="/login"><Button variant="outline" className="h-9 px-5 rounded-xl">Autentificare</Button></Link>
                <Link href="/register"><Button className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold">Inregistrare gratuita</Button></Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Question stats */}
          <div className="bg-white rounded-xl border border-border/60 p-4 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Statistici intrebare</h3>
            <div className="space-y-2.5">
              {[
                { label: "Voturi pozitive", value: question.upvotes, color: "text-emerald-600" },
                { label: "Raspunsuri", value: question.answers.length, color: "text-blue-600" },
                { label: "Scor total", value: score, color: score >= 0 ? "text-primary" : "text-red-500" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Author card */}
          <div className="bg-white rounded-xl border border-border/60 p-4 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Intrebare pusa de</h3>
            <Link href={`/profile/${question.authorId}`}>
              <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={question.authorAvatarUrl || undefined} />
                  <AvatarFallback className="gradient-primary text-white font-bold">{question.authorDisplayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{question.authorDisplayName}</p>
                  <p className="text-xs text-primary font-medium">{question.authorPoints.toLocaleString()} puncte</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-800">Fundita de aur</p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              {isQuestionAuthor
                ? "Ca autor al intrebarii, poti acorda fundita de aur celui mai bun raspuns. Acesta primeste 50 puncte bonus!"
                : "Autorul intrebarii poate acorda fundita de aur celui mai bun raspuns, oferind 50 de puncte bonus."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
