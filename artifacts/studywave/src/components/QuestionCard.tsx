import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageCircle, ThumbsUp, Award } from "lucide-react";
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

export default function QuestionCard({ question }: { question: Question }) {
  return (
    <Link href={`/questions/${question.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SUBJECT_COLORS[question.subject] || SUBJECT_COLORS["Other"]}`}>
                {question.subject}
              </span>
              {question.isSolved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Rezolvata
                </span>
              )}
              {question.hasAwardedAnswer && (
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Award className="h-3 w-3" />
                  Fundita acordata
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {question.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {question.content}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={question.authorAvatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {question.authorDisplayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {question.authorDisplayName}
            </span>
            <span className="text-xs text-muted-foreground">
              · {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {question.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {question.answerCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
