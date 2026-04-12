import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, MessageCircle, Award, ArrowUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Question {
  id: number;
  title: string;
  content: string;
  subject: string;
  authorId: number;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
  upvotes: number;
  downvotes: number;
  answerCount: number;
  hasAwardedAnswer: boolean;
  isSolved: boolean;
  createdAt: string;
}

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

export default function QuestionCard({ question }: { question: Question }) {
  const score = question.upvotes - question.downvotes;
  const subjectStyle = SUBJECT_CONFIG[question.subject] || SUBJECT_CONFIG["Other"];

  return (
    <Link href={`/questions/${question.id}`}>
      <article className="group bg-white rounded-xl border border-border/60 p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Vote score */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
              score > 0
                ? "bg-primary/6 border-primary/20 text-primary"
                : "bg-gray-50 border-gray-200 text-muted-foreground"
            }`}>
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="text-xs font-bold leading-none">{score}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${subjectStyle.bg} ${subjectStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${subjectStyle.dot}`}></span>
                {question.subject}
              </span>
              {question.isSolved && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Solved
                </span>
              )}
              {question.hasAwardedAnswer && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                  <Award className="h-3 w-3" /> Best Answer Awarded
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-2 leading-snug break-words">
              {question.title}
            </h3>

            {/* Excerpt */}
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 break-words">
              {question.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={question.authorAvatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {question.authorDisplayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground/70">{question.authorDisplayName}</span>
                <span className="text-xs text-muted-foreground/60">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {question.answerCount} {question.answerCount === 1 ? "answer" : "answers"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
