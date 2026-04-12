import { useRef } from "react";
import { Bold, Italic, Code, Heading2, List, ListOrdered, Link2, Minus, Superscript } from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
}

interface FormatAction {
  icon: React.ReactNode;
  title: string;
  prefix: string;
  suffix: string;
  placeholder: string;
  block?: boolean;
}

const ACTIONS: FormatAction[] = [
  { icon: <Bold className="h-3.5 w-3.5" />, title: "Bold", prefix: "**", suffix: "**", placeholder: "bold text" },
  { icon: <Italic className="h-3.5 w-3.5" />, title: "Italic", prefix: "_", suffix: "_", placeholder: "italic text" },
  { icon: <Code className="h-3.5 w-3.5" />, title: "Inline code", prefix: "`", suffix: "`", placeholder: "code" },
  { icon: <span className="text-[11px] font-black leading-none font-mono">```</span>, title: "Code block", prefix: "```\n", suffix: "\n```", placeholder: "code block", block: true },
  { icon: <Heading2 className="h-3.5 w-3.5" />, title: "Heading", prefix: "## ", suffix: "", placeholder: "Heading" },
  { icon: <List className="h-3.5 w-3.5" />, title: "Bullet list", prefix: "- ", suffix: "", placeholder: "list item" },
  { icon: <ListOrdered className="h-3.5 w-3.5" />, title: "Numbered list", prefix: "1. ", suffix: "", placeholder: "list item" },
  { icon: <Minus className="h-3.5 w-3.5" />, title: "Divider", prefix: "\n---\n", suffix: "", placeholder: "" },
  { icon: <Link2 className="h-3.5 w-3.5" />, title: "Link", prefix: "[", suffix: "](https://)", placeholder: "link text" },
  { icon: <span className="text-[11px] font-bold leading-none">∑</span>, title: "Math (LaTeX)", prefix: "$", suffix: "$", placeholder: "x^2 + y^2" },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const applyFormat = (action: FormatAction) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const insert = selected || action.placeholder;

    let newText: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (action.block && !selected) {
      newText = value.slice(0, start) + action.prefix + insert + action.suffix + value.slice(end);
      newCursorStart = start + action.prefix.length;
      newCursorEnd = newCursorStart + insert.length;
    } else if (action.suffix === "" && !selected) {
      newText = value.slice(0, start) + action.prefix + insert + value.slice(end);
      newCursorStart = start + action.prefix.length;
      newCursorEnd = newCursorStart + insert.length;
    } else {
      newText = value.slice(0, start) + action.prefix + insert + action.suffix + value.slice(end);
      newCursorStart = start + action.prefix.length;
      newCursorEnd = newCursorStart + insert.length;
    }

    onChange(newText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border border-b-0 border-border/70 rounded-t-xl">
      {ACTIONS.map((action, i) => (
        <button
          key={i}
          type="button"
          title={action.title}
          onMouseDown={e => { e.preventDefault(); applyFormat(action); }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-200 transition-colors"
        >
          {action.icon}
        </button>
      ))}
      <span className="ml-auto text-[10px] text-muted-foreground/60 select-none">Markdown</span>
    </div>
  );
}
