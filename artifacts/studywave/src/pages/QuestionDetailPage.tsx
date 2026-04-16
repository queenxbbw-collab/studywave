import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetQuestion, useVoteQuestion, useCreateAnswer, useVoteAnswer,
  useAwardAnswer, useDeleteQuestion, useDeleteAnswer, getGetQuestionQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Award, CheckCircle2, Trash2, ChevronLeft,
  MessageCircle, ArrowUp, ArrowDown, Sparkles, BookOpen, Clock, Zap, ImageIcon, AlertCircle, Flag,
  Bookmark, BookmarkCheck, Eye, Send, ChevronRight, Share2, Pencil, X, Check, EyeOff, Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import ReportModal from "@/components/ReportModal";
import MarkdownToolbar from "@/components/MarkdownToolbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";

const MIN_ANSWER = 30;
const MIN_COMMENT = 5;

const SUBJECT_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Mathematics:        { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  Physics:            { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400" },
  Chemistry:          { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  Biology:            { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400" },
  History:            { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  Geography:          { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400" },
  Literature:         { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400" },
  "Computer Science": { bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-400" },
  Economics:          { bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-400" },
  Languages:          { bg: "bg-pink-50",    text: "text-pink-700",    dot: "bg-pink-400" },
  Philosophy:         { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-400" },
  Psychology:         { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400" },
  Music:              { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
  Art:                { bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-400" },
  Engineering:        { bg: "bg-slate-50",   text: "text-slate-700",   dot: "bg-slate-400" },
  Medicine:           { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400" },
  Environment:        { bg: "bg-lime-50",    text: "text-lime-700",    dot: "bg-lime-400" },
  Law:                { bg: "bg-stone-50",   text: "text-stone-700",   dot: "bg-stone-400" },
  Sports:             { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400" },
  Other:              { bg: "bg-gray-50",    text: "text-gray-600",    dot: "bg-gray-400" },
};

interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
}

interface SimilarQuestion {
  id: number;
  title: string;
  subject: string;
  upvotes: number;
  isSolved: boolean;
  createdAt: string;
  authorDisplayName: string;
}

function injectMentionLinks(text: string): string {
  return text.replace(/@([a-zA-Z0-9_]+)/g, (_, username) =>
    `[@${username}](/profile/${username})`
  );
}

function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^@([a-zA-Z0-9_]+)$/);
        if (match) {
          return (
            <a
              key={i}
              href={`/profile/${match[1]}`}
              className="text-primary font-semibold hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed
      prose-headings:font-bold prose-headings:text-foreground
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-[#282c34] prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-0 prose-pre:overflow-hidden
      prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground prose-ul:list-disc prose-ol:list-decimal
      [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {injectMentionLinks(content)}
      </ReactMarkdown>
    </div>
  );
}

function CommentsSection({ answerId }: { answerId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const res = await fetch(`/api/comments/answer/${answerId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? []);
    }
    setLoading(false);
  };

  const handleToggle = () => {
    if (!showComments) fetchComments();
    setShowComments(s => !s);
  };

  const postComment = async () => {
    if (!user) { toast({ title: "Autentificare necesară", variant: "destructive" }); return; }
    if (newComment.trim().length < MIN_COMMENT) return;
    setPosting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ answerId, content: newComment.trim() }),
    });
    setPosting(false);
    if (res.ok) {
      const data = await res.json();
      setComments(c => [...c, data.comment]);
      setNewComment("");
    } else {
      const data = await res.json();
      toast({ title: data.error || "Eroare la postarea comentariului", variant: "destructive" });
    }
  };

  const deleteComment = async (id: number) => {
    await fetch(`/api/comments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setComments(c => c.filter(x => x.id !== id));
  };

  return (
    <div className="border-t border-border/40 pt-3 mt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {comments.length > 0 ? `${comments.length} comentari${comments.length !== 1 ? "i" : "u"}` : "Adaugă comentariu"}
      </button>

      {showComments && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground animate-pulse">Se încarcă comentariile...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nu există comentarii.</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2 items-start group">
                <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
                  <AvatarImage src={c.authorAvatarUrl || undefined} />
                  <AvatarFallback className="text-[9px] gradient-primary text-white">{c.authorDisplayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground mr-1.5">{c.authorDisplayName}</span>
                  <span className="text-xs text-foreground/80"><MentionText text={c.content} /></span>
                  <span className="text-[11px] text-muted-foreground/60 ml-2">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ro })}
                  </span>
                </div>
                {(user?.id === c.authorId || user?.role === "admin") && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}

          {user && (
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                placeholder="Adaugă un comentariu..."
                className="flex-1 text-xs border border-border/60 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-primary/60 focus:bg-white transition-colors"
                maxLength={500}
              />
              <button
                onClick={postComment}
                disabled={posting || newComment.trim().length < MIN_COMMENT}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionDetailPage() {
  const [, params] = useRoute("/questions/:id");
  const questionId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [answerContent, setAnswerContent] = useState("");
  const [answerPreview, setAnswerPreview] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [reportTarget, setReportTarget] = useState<{ type: "question" | "answer" | "user"; id: number; label: string } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQTitle, setEditQTitle] = useState("");
  const [editQContent, setEditQContent] = useState("");
  const [editQSubject, setEditQSubject] = useState("");
  const [editQLoading, setEditQLoading] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editAContent, setEditAContent] = useState("");
  const [editALoading, setEditALoading] = useState(false);
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editATextareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!questionId) return;
    fetch(`/api/questions/${questionId}/similar`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setSimilarQuestions(Array.isArray(data) ? data : []))
      .catch(() => {});
    if (user) {
      fetch(`/api/bookmarks/${questionId}`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setIsBookmarked(data.isBookmarked ?? false); })
        .catch(() => {});
    }
  }, [questionId, user]);

  const toggleBookmark = async () => {
    if (!user) { toast({ title: "Autentifică-te pentru a salva", variant: "destructive" }); return; }
    setBookmarkLoading(true);
    if (isBookmarked) {
      await fetch(`/api/bookmarks/${questionId}`, { method: "DELETE", headers: getAuthHeaders() });
      setIsBookmarked(false);
      toast({ title: "Marcaj eliminat" });
    } else {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ questionId }),
      });
      setIsBookmarked(true);
      toast({ title: "Salvat! Adăugat la marcajele tale." });
    }
    setBookmarkLoading(false);
  };

  const handleVoteQuestion = (type: string) => {
    if (!user) { toast({ title: "Autentificare necesară", variant: "destructive" }); return; }
    voteQuestion.mutate({ id: questionId, data: { type } }, { onSuccess: invalidate, onError: (e: Error) => toast({ title: e.message, variant: "destructive" }) });
  };

  const handleVoteAnswer = (answerId: number, type: string) => {
    if (!user) { toast({ title: "Autentificare necesară", variant: "destructive" }); return; }
    voteAnswer.mutate({ id: answerId, data: { type } }, { onSuccess: invalidate, onError: (e: Error) => toast({ title: e.message, variant: "destructive" }) });
  };

  const handleAwardAnswer = (answerId: number) => {
    awardAnswer.mutate({ id: answerId }, {
      onSuccess: () => { invalidate(); toast({ title: "Panglică de Aur acordată! Cel care a răspuns a câștigat +50 puncte." }); },
      onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim() || answerContent.trim().length < MIN_ANSWER) return;
    if (!user) { toast({ title: "Autentificare necesară", variant: "destructive" }); return; }
    createAnswer.mutate({ data: { questionId, content: answerContent } }, {
      onSuccess: () => { setAnswerContent(""); invalidate(); toast({ title: "Răspuns postat! +10 puncte" }); },
      onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteQuestion = () => {
    if (!confirm("Ștergi această întrebare?")) return;
    deleteQuestion.mutate({ id: questionId }, { onSuccess: () => navigate("/questions"), onError: (e: Error) => toast({ title: e.message, variant: "destructive" }) });
  };

  const handleDeleteAnswer = (answerId: number) => {
    if (!confirm("Ștergi acest răspuns?")) return;
    deleteAnswer.mutate({ id: answerId }, { onSuccess: invalidate, onError: (e: Error) => toast({ title: e.message, variant: "destructive" }) });
  };

  const startEditQuestion = () => {
    if (!question) return;
    setEditQTitle(question.title);
    setEditQContent(question.content);
    setEditQSubject(question.subject);
    setEditingQuestion(true);
  };

  const saveEditQuestion = async () => {
    if (!editQTitle.trim() || editQTitle.trim().length < 15) {
      toast({ title: "Titlul trebuie să aibă cel puțin 15 caractere", variant: "destructive" }); return;
    }
    if (!editQContent.trim() || editQContent.trim().length < 50) {
      toast({ title: "Conținutul trebuie să aibă cel puțin 50 de caractere", variant: "destructive" }); return;
    }
    setEditQLoading(true);
    try {
      const r = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ title: editQTitle.trim(), content: editQContent.trim(), subject: editQSubject }),
      });
      if (!r.ok) { const d = await r.json(); toast({ title: d.error || "Actualizare eșuată", variant: "destructive" }); return; }
      setEditingQuestion(false);
      invalidate();
      toast({ title: "Întrebarea a fost actualizată" });
    } catch { toast({ title: "Eroare de rețea", variant: "destructive" }); }
    finally { setEditQLoading(false); }
  };

  const startEditAnswer = (answerId: number, content: string) => {
    setEditingAnswerId(answerId);
    setEditAContent(content);
  };

  const saveEditAnswer = async () => {
    if (!editingAnswerId) return;
    if (!editAContent.trim() || editAContent.trim().length < 30) {
      toast({ title: "Răspunsul trebuie să aibă cel puțin 30 de caractere", variant: "destructive" }); return;
    }
    setEditALoading(true);
    try {
      const r = await fetch(`/api/answers/${editingAnswerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ content: editAContent.trim() }),
      });
      if (!r.ok) { const d = await r.json(); toast({ title: d.error || "Actualizare eșuată", variant: "destructive" }); return; }
      setEditingAnswerId(null);
      setEditAContent("");
      invalidate();
      toast({ title: "Răspunsul a fost actualizat" });
    } catch { toast({ title: "Eroare de rețea", variant: "destructive" }); }
    finally { setEditALoading(false); }
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
        <p className="text-base font-semibold">Întrebarea nu a fost găsită</p>
        <Link href="/questions"><Button className="mt-4" variant="outline">Înapoi la Întrebări</Button></Link>
      </div>
    );
  }

  const isQuestionAuthor = user?.id === question.authorId;
  const subjectStyle = SUBJECT_CONFIG[question.subject] || SUBJECT_CONFIG["Other"];
  const score = question.upvotes - question.downvotes;
  const imageUrls: string[] = Array.isArray((question as any).imageUrls) ? (question as any).imageUrls : [];
  const views: number = (question as any).views ?? 0;

  const sortedAnswers = [...(question.answers || [])].sort((a, b) => {
    if (a.isAwarded && !b.isAwarded) return -1;
    if (!a.isAwarded && b.isAwarded) return 1;
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
  });

  const answerTrimmed = answerContent.trim();
  const answerOk = answerTrimmed.length >= MIN_ANSWER;
  const alreadyAnswered = user ? sortedAnswers.some(a => a.authorId === user.id) : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/questions">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Întrebări
          </button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground truncate max-w-xs">{question.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-5">
          {/* Question card */}
          <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${subjectStyle.bg} ${subjectStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${subjectStyle.dot}`}></span>
                  {question.subject}
                </span>
                {question.isSolved && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3" /> Rezolvată
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Eye className="h-3 w-3" /> {views.toLocaleString()} vizualizăr{views !== 1 ? "i" : "e"}
                </span>
              </div>

              {editingQuestion ? (
                <div className="space-y-3 mb-4">
                  <Input
                    value={editQTitle}
                    onChange={e => setEditQTitle(e.target.value)}
                    placeholder="Titlul întrebării (min 15 caractere)"
                    className="h-11 rounded-xl border-border/70 font-semibold text-base"
                  />
                  <select
                    value={editQSubject}
                    onChange={e => setEditQSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/70 text-sm bg-white focus:outline-none focus:border-primary"
                  >
                    {Object.keys(SUBJECT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Textarea
                    value={editQContent}
                    onChange={e => setEditQContent(e.target.value)}
                    placeholder="Conținutul întrebării (min 50 caractere)"
                    rows={6}
                    className="resize-none rounded-xl border-border/70 font-mono text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={saveEditQuestion}
                      disabled={editQLoading}
                      size="sm"
                      className="gradient-primary text-white border-0 rounded-xl h-8 px-4 text-xs font-semibold gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {editQLoading ? "Se salvează..." : "Salvează modificările"}
                    </Button>
                    <Button
                      onClick={() => setEditingQuestion(false)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-8 px-4 text-xs"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Anulează
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">{editQContent.length}/10000</span>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight mb-4 tracking-tight break-words">
                    {question.title}
                  </h1>
                  <MarkdownContent content={question.content} />
                </>
              )}

              {/* Images */}
              {imageUrls.filter((_, idx) => !imageErrors.has(idx)).length > 0 && (
                <div className="mt-5 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Imagini atașate ({imageUrls.filter((_, idx) => !imageErrors.has(idx)).length})
                  </div>
                  <div className={`grid gap-2 ${imageUrls.length === 1 ? "grid-cols-1" : imageUrls.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                    {imageUrls.map((url, idx) =>
                      imageErrors.has(idx) ? null : (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border border-border/60 hover:border-primary/40 transition-colors shadow-xs group bg-gray-50">
                          <img
                            src={url}
                            alt={`Imagine ${idx + 1}`}
                            className="w-full h-48 object-contain group-hover:opacity-90 transition-opacity"
                            onError={() => setImageErrors(prev => new Set([...prev, idx]))}
                          />
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/60 border-t border-border/50">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-white rounded-lg border border-border/60 p-1 shadow-xs">
                  <button
                    onClick={() => handleVoteQuestion("up")}
                    disabled={isQuestionAuthor}
                    title={isQuestionAuthor ? "Nu poți vota propria întrebare" : "Vot pozitiv"}
                    className="p-1.5 rounded-md hover:bg-primary/8 hover:text-primary transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <span className={`px-2 text-sm font-bold ${score > 0 ? "text-primary" : score < 0 ? "text-red-500" : "text-muted-foreground"}`}>{score}</span>
                  <button
                    onClick={() => handleVoteQuestion("down")}
                    disabled={isQuestionAuthor}
                    title={isQuestionAuthor ? "Nu poți vota propria întrebare" : "Vot negativ"}
                    className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Bookmark button */}
                <button
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  title={isBookmarked ? "Elimină marcajul" : "Salvează la marcaje"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isBookmarked
                      ? "bg-primary/8 border-primary/30 text-primary hover:bg-primary/12"
                      : "bg-white border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                  {isBookmarked ? "Salvată" : "Salvează"}
                </button>

                {/* Share button */}
                <button
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(url).then(() => {
                        toast({ title: "Link copiat!", description: "URL-ul întrebării a fost copiat." });
                      });
                    } else {
                      toast({ title: "Distribuie", description: url });
                    }
                  }}
                  title="Distribuie această întrebare"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-muted-foreground hover:text-foreground hover:border-border text-xs font-medium transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Distribuie
                </button>

                <Link href={`/profile/${question.authorId}`}>
                  <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={question.authorAvatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{question.authorDisplayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-foreground">{question.authorDisplayName}</p>
                        {(question as any).authorIsPremium && <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-primary">{question.authorPoints.toLocaleString()} pts</p>
                    </div>
                  </div>
                </Link>

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: ro })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {user && !isQuestionAuthor && (
                  <button
                    onClick={() => setReportTarget({ type: "question", id: questionId, label: `Întrebare: "${question.title.slice(0, 40)}..."` })}
                    title="Raportează această întrebare"
                    className="p-2 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                )}
                {(isQuestionAuthor || user?.role === "admin") && !editingQuestion && (
                  <button onClick={startEditQuestion} title="Editează întrebarea" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {(isQuestionAuthor || user?.role === "admin") && (
                  <button onClick={handleDeleteQuestion} className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Answers header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
              </div>
              {sortedAnswers.length} {sortedAnswers.length === 1 ? "Răspuns" : "Răspunsuri"}
            </h2>
          </div>

          {sortedAnswers.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground/70">Niciun răspuns încă</p>
              <p className="text-sm text-muted-foreground mt-1">Fii primul care ajută!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAnswers.map(answer => {
                const answerScore = answer.upvotes - answer.downvotes;
                const isOwnAnswer = user?.id === answer.authorId;
                return (
                  <div key={answer.id} className={`bg-white rounded-xl border overflow-hidden shadow-xs transition-all ${answer.isAwarded ? "border-amber-300 ring-1 ring-amber-200/50" : "border-border/60 hover:border-border"}`}>
                    {answer.isAwarded && (
                      <div className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/60">
                        <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Award className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-700">Cel Mai Bun Răspuns · Panglică de Aur</span>
                        <div className="ml-auto flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Zap className="h-3 w-3" /> +50 puncte acordate
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => handleVoteAnswer(answer.id, "up")}
                            disabled={isOwnAnswer}
                            title={isOwnAnswer ? "Nu poți vota propriul răspuns" : "Vot pozitiv"}
                            className="p-1.5 rounded-md hover:bg-primary/8 hover:text-primary transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <span className={`text-sm font-bold ${answerScore > 0 ? "text-primary" : answerScore < 0 ? "text-red-500" : "text-muted-foreground"}`}>{answerScore}</span>
                          <button
                            onClick={() => handleVoteAnswer(answer.id, "down")}
                            disabled={isOwnAnswer}
                            title={isOwnAnswer ? "Nu poți vota propriul răspuns" : "Vot negativ"}
                            className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          {editingAnswerId === answer.id ? (
                            <div className="space-y-2">
                              <div>
                                <MarkdownToolbar
                                  textareaRef={editATextareaRef}
                                  value={editAContent}
                                  onChange={setEditAContent}
                                />
                                <Textarea
                                  ref={editATextareaRef}
                                  value={editAContent}
                                  onChange={e => setEditAContent(e.target.value)}
                                  rows={5}
                                  className="resize-none rounded-t-none rounded-b-xl border-border/70 font-mono text-sm"
                                  placeholder="Editează răspunsul (min 30 caractere)"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={saveEditAnswer}
                                  disabled={editALoading}
                                  size="sm"
                                  className="gradient-primary text-white border-0 rounded-xl h-7 px-3 text-xs font-semibold gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  {editALoading ? "Se salvează..." : "Salvează"}
                                </Button>
                                <Button
                                  onClick={() => { setEditingAnswerId(null); setEditAContent(""); }}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl h-7 px-3 text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" /> Anulează
                                </Button>
                                <span className="text-xs text-muted-foreground ml-auto">{editAContent.length}/10000</span>
                              </div>
                            </div>
                          ) : (
                            <MarkdownContent content={answer.content} />
                          )}

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                            <Link href={`/profile/${answer.authorId}`}>
                              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={answer.authorAvatarUrl || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{answer.authorDisplayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs font-semibold">{answer.authorDisplayName}</p>
                                    {(answer as any).authorIsPremium && <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-primary">{answer.authorPoints.toLocaleString()} pts</p>
                                </div>
                              </div>
                            </Link>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true, locale: ro })}</span>
                              {isQuestionAuthor && !question.hasAwardedAnswer && !answer.isAwarded && answer.authorId !== user?.id && (
                                <button onClick={() => handleAwardAnswer(answer.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors text-xs font-semibold shadow-xs">
                                  <Award className="h-3 w-3" /> Acordă Panglică de Aur
                                </button>
                              )}
                              {user && user.id !== answer.authorId && (
                                <button
                                  onClick={() => setReportTarget({ type: "answer", id: answer.id, label: `Răspuns de ${answer.authorDisplayName}` })}
                                  title="Raportează acest răspuns"
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 transition-colors"
                                >
                                  <Flag className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {(user?.id === answer.authorId || user?.role === "admin") && editingAnswerId !== answer.id && (
                                <button onClick={() => startEditAnswer(answer.id, answer.content)} title="Editează răspunsul" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {(user?.id === answer.authorId || user?.role === "admin") && (
                                <button onClick={() => handleDeleteAnswer(answer.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Comments */}
                          <CommentsSection answerId={answer.id} />
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
            isQuestionAuthor ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Ai pus această întrebare</p>
                  <p className="text-xs text-amber-700 mt-0.5">Nu poți răspunde propriei tale întrebări. Așteaptă ca alții să te ajute — apoi acordă Panglica de Aur celui mai bun răspuns!</p>
                </div>
              </div>
            ) : alreadyAnswered ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Ai răspuns deja la această întrebare</p>
                  <p className="text-xs text-blue-700 mt-0.5">Un singur răspuns per întrebare. Poți edita sau șterge răspunsul tău existent de mai sus.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-border/50 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Scrie răspunsul tău
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">+10 pts · Markdown acceptat</span>
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setAnswerPreview(false)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${!answerPreview ? "bg-white shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Scriere
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerPreview(true)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${answerPreview ? "bg-white shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Eye className="h-3 w-3" /> Previzualizare
                      </button>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSubmitAnswer} className="p-5">
                  {answerPreview ? (
                    <div className="min-h-[144px] rounded-xl border border-border/70 bg-gray-50/50 p-4">
                      {answerContent.trim() ? (
                        <MarkdownContent content={answerContent} />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nimic de previzualizat. Treci la tab-ul Scriere și începe să scrii...</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <MarkdownToolbar
                        textareaRef={answerTextareaRef}
                        value={answerContent}
                        onChange={setAnswerContent}
                      />
                      <Textarea
                        ref={answerTextareaRef}
                        value={answerContent}
                        onChange={e => setAnswerContent(e.target.value)}
                        placeholder="Explică pas cu pas... Folosește bara de instrumente sau scrie direct în Markdown"
                        rows={6}
                        className={`resize-none rounded-t-none rounded-b-xl border-border/70 bg-gray-50/50 focus-visible:bg-white text-sm font-mono ${answerContent.length > 0 && !answerOk ? "border-amber-400" : ""}`}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      {answerContent.length > 0 && !answerOk
                        ? <span className="text-amber-600 font-medium">Mai ai nevoie de {MIN_ANSWER - answerContent.trim().length} caractere</span>
                        : <span>Sfat: răspunsurile detaliate câștigă Panglica de Aur (+50 pts)</span>
                      }
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${answerContent.length > 9800 ? "text-red-500" : "text-muted-foreground"}`}>{answerContent.length}/10000</span>
                      <Button type="submit" className="gradient-primary text-white border-0 h-9 px-5 rounded-xl font-semibold shadow-sm hover:opacity-90"
                        disabled={!answerOk || createAnswer.isPending}>
                        {createAnswer.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Se postează...
                          </div>
                        ) : "Postează Răspunsul"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl border border-border/60 p-6 text-center">
              <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground mb-1">Autentifică-te pentru a răspunde</p>
              <p className="text-sm text-muted-foreground mb-4">Ajută alți elevi și câștigă puncte!</p>
              <div className="flex justify-center gap-3">
                <Link href="/login">
                  <Button className="gradient-primary text-white border-0 rounded-xl font-semibold">Autentificare</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="rounded-xl font-semibold">Înregistrare</Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {similarQuestions.length > 0 && (
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs sticky top-6">
              <div className="px-4 py-3 border-b border-border/50 bg-gray-50/50">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Întrebări similare
                </h3>
              </div>
              <div className="divide-y divide-border/40">
                {similarQuestions.map(q => (
                  <Link href={`/questions/${q.id}`} key={q.id}>
                    <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed mb-1.5">{q.title}</p>
                      <div className="flex items-center gap-2">
                        {q.isSolved && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Rezolvată
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">{q.upvotes} voturi</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
