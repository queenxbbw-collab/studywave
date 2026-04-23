import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import {
  Plus, Pencil, Trash2, Loader2, BookOpen, Brain, FileText, GraduationCap, X,
} from "lucide-react";

type Tab = "lessons" | "quiz" | "worksheets";

interface StudyPage {
  title: string;
  explanation: string;
  keyPoints: string[];
  examples: { label: string; value: string }[];
  exercise?: string;
}
interface Lesson {
  id: number;
  grade: number;
  title: string;
  description: string;
  topics: string[];
  pages: StudyPage[];
  position: number;
}
interface QuizQ {
  id: number;
  grade: number;
  question: string;
  options: string[];
  answer: number;
  position: number;
}
interface Exercise {
  instruction: string;
  items: string[];
  hint?: string;
}
interface Worksheet {
  id: number;
  grade: number;
  title: string;
  description: string;
  intro: string;
  exercises: Exercise[];
  tip: string | null;
  position: number;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ClassContentTab() {
  const { toast } = useToast();
  const [grade, setGrade] = useState(1);
  const [tab, setTab] = useState<Tab>("lessons");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ lessons: Lesson[]; quiz: QuizQ[]; worksheets: Worksheet[] }>({
    lessons: [], quiz: [], worksheets: [],
  });
  const [editing, setEditing] = useState<
    | { kind: "lesson"; row: Partial<Lesson> | null }
    | { kind: "quiz"; row: Partial<QuizQ> | null }
    | { kind: "worksheet"; row: Partial<Worksheet> | null }
    | null
  >(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/classes/${grade}`, { headers: getAuthHeaders() });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setData(d);
    } catch {
      toast({ title: "Nu am putut încărca conținutul clasei.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [grade]);

  const remove = async (kind: "lessons" | "quiz" | "worksheets", id: number) => {
    if (!confirm("Sigur ștergi?")) return;
    const r = await fetch(`/api/admin/classes/${kind}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (r.ok) { toast({ title: "Șters." }); load(); }
    else toast({ title: "Eroare la ștergere", variant: "destructive" });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <GraduationCap className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-bold">Clasa:</span>
        <div className="flex flex-wrap gap-1.5">
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`h-8 w-8 text-xs font-bold rounded-lg border ${grade === g ? "bg-indigo-600 border-indigo-600 text-white" : "border-border/60 text-muted-foreground hover:bg-gray-50"}`}
            >{g}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { id: "lessons" as Tab, label: "De învățat", icon: BookOpen, count: data.lessons.length },
          { id: "quiz" as Tab, label: "Quiz", icon: Brain, count: data.quiz.length },
          { id: "worksheets" as Tab, label: "Fișe", icon: FileText, count: data.worksheets.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
            <span className="text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        Aici adaugi conținut <b>suplimentar</b> peste programa de bază. Tot ce creezi apare la sfârșitul listei pentru clasa selectată, alături de capitolele/quizul/fișele existente.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Se încarcă...</div>
      ) : tab === "lessons" ? (
        <LessonsList
          rows={data.lessons}
          onAdd={() => setEditing({ kind: "lesson", row: { grade, topics: [], pages: [] } })}
          onEdit={r => setEditing({ kind: "lesson", row: r })}
          onDelete={id => remove("lessons", id)}
        />
      ) : tab === "quiz" ? (
        <QuizList
          rows={data.quiz}
          onAdd={() => setEditing({ kind: "quiz", row: { grade, options: ["", "", ""], answer: 0 } })}
          onEdit={r => setEditing({ kind: "quiz", row: r })}
          onDelete={id => remove("quiz", id)}
        />
      ) : (
        <WorksheetsList
          rows={data.worksheets}
          onAdd={() => setEditing({ kind: "worksheet", row: { grade, exercises: [] } })}
          onEdit={r => setEditing({ kind: "worksheet", row: r })}
          onDelete={id => remove("worksheets", id)}
        />
      )}

      {editing?.kind === "lesson" && (
        <LessonEditor
          row={editing.row}
          grade={grade}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {editing?.kind === "quiz" && (
        <QuizEditor
          row={editing.row}
          grade={grade}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {editing?.kind === "worksheet" && (
        <WorksheetEditor
          row={editing.row}
          grade={grade}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ─── Lists ────────────────────────────────────────────── */

function ListShell({ title, onAdd, children, empty }: { title: string; onAdd: () => void; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">{title}</h3>
        <Button onClick={onAdd} size="sm" className="gradient-primary text-white border-0 rounded-xl"><Plus className="h-3.5 w-3.5 mr-1" /> Adaugă</Button>
      </div>
      {empty ? <p className="text-sm text-muted-foreground bg-white rounded-xl border border-border/60 p-6 text-center">Niciun element încă.</p> : children}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button onClick={onEdit} className="h-8 w-8 rounded-lg border border-border/60 hover:bg-gray-50 flex items-center justify-center text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} className="h-8 w-8 rounded-lg border border-red-200 hover:bg-red-50 flex items-center justify-center text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function LessonsList({ rows, onAdd, onEdit, onDelete }: { rows: Lesson[]; onAdd: () => void; onEdit: (r: Lesson) => void; onDelete: (id: number) => void }) {
  return (
    <ListShell title="Capitole de învățat" onAdd={onAdd} empty={rows.length === 0}>
      <div className="space-y-2">
        {rows.map(l => (
          <div key={l.id} className="bg-white rounded-xl border border-border/60 p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><BookOpen className="h-4 w-4 text-blue-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{l.pages.length} pagini · {l.topics.length} topicuri</p>
            </div>
            <RowActions onEdit={() => onEdit(l)} onDelete={() => onDelete(l.id)} />
          </div>
        ))}
      </div>
    </ListShell>
  );
}

function QuizList({ rows, onAdd, onEdit, onDelete }: { rows: QuizQ[]; onAdd: () => void; onEdit: (r: QuizQ) => void; onDelete: (id: number) => void }) {
  return (
    <ListShell title="Întrebări de quiz" onAdd={onAdd} empty={rows.length === 0}>
      <div className="space-y-2">
        {rows.map(q => (
          <div key={q.id} className="bg-white rounded-xl border border-border/60 p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0"><Brain className="h-4 w-4 text-violet-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{q.question}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {q.options.length} variante · răspuns corect: <b>{String.fromCharCode(65 + q.answer)}.</b> {q.options[q.answer]}
              </p>
            </div>
            <RowActions onEdit={() => onEdit(q)} onDelete={() => onDelete(q.id)} />
          </div>
        ))}
      </div>
    </ListShell>
  );
}

function WorksheetsList({ rows, onAdd, onEdit, onDelete }: { rows: Worksheet[]; onAdd: () => void; onEdit: (r: Worksheet) => void; onDelete: (id: number) => void }) {
  return (
    <ListShell title="Fișe de lucru" onAdd={onAdd} empty={rows.length === 0}>
      <div className="space-y-2">
        {rows.map(w => (
          <div key={w.id} className="bg-white rounded-xl border border-border/60 p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0"><FileText className="h-4 w-4 text-emerald-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{w.title}</p>
              <p className="text-xs text-muted-foreground">{w.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{w.exercises.length} exerciții</p>
            </div>
            <RowActions onEdit={() => onEdit(w)} onDelete={() => onDelete(w.id)} />
          </div>
        ))}
      </div>
    </ListShell>
  );
}

/* ─── Editors ──────────────────────────────────────────── */

function EditorShell({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Anulează</Button>
          <Button onClick={onSave} disabled={saving} className="gradient-primary text-white border-0">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Se salvează...</> : "Salvează"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useSave(path: (id?: number) => string, id: number | undefined, body: any, onSaved: () => void) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(path(id), {
        method: id ? "PATCH" : "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast({ title: d.error || "Eroare la salvare", variant: "destructive" });
        return;
      }
      toast({ title: "Salvat." });
      onSaved();
    } finally { setSaving(false); }
  };
  return { saving, save };
}

function StringListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <p className="text-xs font-bold mb-1.5">{label}</p>
      <div className="space-y-1.5">
        {items.map((s, i) => (
          <div key={i} className="flex gap-1.5">
            <Input value={s} placeholder={placeholder} onChange={e => onChange(items.map((x, j) => j === i ? e.target.value : x))} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="h-9 w-9 rounded-lg border border-border/60 hover:bg-gray-50 flex items-center justify-center text-muted-foreground flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}><Plus className="h-3.5 w-3.5 mr-1" /> Adaugă</Button>
      </div>
    </div>
  );
}

function LessonEditor({ row, grade, onClose, onSaved }: { row: Partial<Lesson> | null; grade: number; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(row?.title ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [topics, setTopics] = useState<string[]>(row?.topics ?? []);
  const [pages, setPages] = useState<StudyPage[]>(row?.pages ?? []);
  const [position, setPosition] = useState(row?.position ?? 0);

  const body = useMemo(() => ({
    grade, title, description, topics: topics.filter(s => s.trim()), pages, position,
  }), [grade, title, description, topics, pages, position]);
  const { saving, save } = useSave(id => id ? `/api/admin/classes/lessons/${id}` : "/api/admin/classes/lessons", row?.id, body, onSaved);

  const updatePage = (i: number, patch: Partial<StudyPage>) =>
    setPages(pages.map((p, j) => j === i ? { ...p, ...patch } : p));

  return (
    <EditorShell title={row?.id ? "Editează capitol" : "Adaugă capitol"} onClose={onClose} onSave={save} saving={saving}>
      <div><p className="text-xs font-bold mb-1">Titlu</p><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div><p className="text-xs font-bold mb-1">Descriere scurtă</p><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
      <StringListEditor label="Topicuri (etichete)" items={topics} onChange={setTopics} placeholder="ex: Fracții" />
      <div><p className="text-xs font-bold mb-1">Poziție (ordine sortare)</p><Input type="number" value={position} onChange={e => setPosition(Number(e.target.value) || 0)} /></div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold">Pagini ({pages.length})</p>
          <Button size="sm" variant="outline" onClick={() => setPages([...pages, { title: "", explanation: "", keyPoints: [], examples: [] }])}><Plus className="h-3 w-3 mr-1" /> Pagină</Button>
        </div>
        <div className="space-y-3">
          {pages.map((p, i) => (
            <div key={i} className="border border-border/60 rounded-xl p-3 space-y-2 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Pagina {i + 1}</span>
                <button onClick={() => setPages(pages.filter((_, j) => j !== i))} className="text-red-600 hover:bg-red-50 h-7 w-7 rounded-lg flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <Input placeholder="Titlu pagină" value={p.title} onChange={e => updatePage(i, { title: e.target.value })} />
              <Textarea placeholder="Explicație" value={p.explanation} onChange={e => updatePage(i, { explanation: e.target.value })} rows={3} />
              <StringListEditor label="Puncte cheie" items={p.keyPoints} onChange={v => updatePage(i, { keyPoints: v })} />
              <div>
                <p className="text-xs font-bold mb-1.5">Exemple</p>
                <div className="space-y-1.5">
                  {p.examples.map((ex, k) => (
                    <div key={k} className="grid grid-cols-[1fr_2fr_auto] gap-1.5">
                      <Input placeholder="Etichetă" value={ex.label} onChange={e => updatePage(i, { examples: p.examples.map((x, m) => m === k ? { ...x, label: e.target.value } : x) })} />
                      <Input placeholder="Valoare" value={ex.value} onChange={e => updatePage(i, { examples: p.examples.map((x, m) => m === k ? { ...x, value: e.target.value } : x) })} />
                      <button onClick={() => updatePage(i, { examples: p.examples.filter((_, m) => m !== k) })} className="h-9 w-9 rounded-lg border border-border/60 hover:bg-gray-50 flex items-center justify-center text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updatePage(i, { examples: [...p.examples, { label: "", value: "" }] })}><Plus className="h-3 w-3 mr-1" /> Exemplu</Button>
                </div>
              </div>
              <Textarea placeholder="Exercițiu (opțional)" value={p.exercise ?? ""} onChange={e => updatePage(i, { exercise: e.target.value })} rows={2} />
            </div>
          ))}
        </div>
      </div>
    </EditorShell>
  );
}

function QuizEditor({ row, grade, onClose, onSaved }: { row: Partial<QuizQ> | null; grade: number; onClose: () => void; onSaved: () => void }) {
  const [question, setQuestion] = useState(row?.question ?? "");
  const [options, setOptions] = useState<string[]>(row?.options ?? ["", "", ""]);
  const [answer, setAnswer] = useState(row?.answer ?? 0);
  const [position, setPosition] = useState(row?.position ?? 0);

  const body = useMemo(() => ({
    grade, question, options: options.map(s => s.trim()).filter(Boolean), answer, position,
  }), [grade, question, options, answer, position]);
  const { saving, save } = useSave(id => id ? `/api/admin/classes/quiz/${id}` : "/api/admin/classes/quiz", row?.id, body, onSaved);

  return (
    <EditorShell title={row?.id ? "Editează întrebare" : "Adaugă întrebare"} onClose={onClose} onSave={save} saving={saving}>
      <div><p className="text-xs font-bold mb-1">Întrebare</p><Textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} /></div>
      <div>
        <p className="text-xs font-bold mb-1.5">Variante (selectează cea corectă)</p>
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <button
                onClick={() => setAnswer(i)}
                className={`h-9 w-9 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${answer === i ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/60 text-muted-foreground"}`}
              >{String.fromCharCode(65 + i)}</button>
              <Input value={opt} placeholder={`Variantă ${String.fromCharCode(65 + i)}`} onChange={e => setOptions(options.map((x, j) => j === i ? e.target.value : x))} />
              <button onClick={() => {
                const next = options.filter((_, j) => j !== i);
                setOptions(next);
                if (answer >= next.length) setAnswer(0);
              }} className="h-9 w-9 rounded-lg border border-border/60 hover:bg-gray-50 flex items-center justify-center text-muted-foreground flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}><Plus className="h-3.5 w-3.5 mr-1" /> Variantă</Button>
        </div>
      </div>
      <div><p className="text-xs font-bold mb-1">Poziție</p><Input type="number" value={position} onChange={e => setPosition(Number(e.target.value) || 0)} /></div>
    </EditorShell>
  );
}

function WorksheetEditor({ row, grade, onClose, onSaved }: { row: Partial<Worksheet> | null; grade: number; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(row?.title ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [intro, setIntro] = useState(row?.intro ?? "");
  const [tip, setTip] = useState(row?.tip ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(row?.exercises ?? []);
  const [position, setPosition] = useState(row?.position ?? 0);

  const body = useMemo(() => ({
    grade, title, description, intro, tip: tip || null, exercises, position,
  }), [grade, title, description, intro, tip, exercises, position]);
  const { saving, save } = useSave(id => id ? `/api/admin/classes/worksheets/${id}` : "/api/admin/classes/worksheets", row?.id, body, onSaved);

  const updateEx = (i: number, patch: Partial<Exercise>) =>
    setExercises(exercises.map((e, j) => j === i ? { ...e, ...patch } : e));

  return (
    <EditorShell title={row?.id ? "Editează fișă" : "Adaugă fișă"} onClose={onClose} onSave={save} saving={saving}>
      <div><p className="text-xs font-bold mb-1">Titlu</p><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div><p className="text-xs font-bold mb-1">Descriere scurtă</p><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div><p className="text-xs font-bold mb-1">Introducere</p><Textarea value={intro} onChange={e => setIntro(e.target.value)} rows={2} /></div>
      <div><p className="text-xs font-bold mb-1">Sfat / tip (opțional)</p><Input value={tip ?? ""} onChange={e => setTip(e.target.value)} /></div>
      <div><p className="text-xs font-bold mb-1">Poziție</p><Input type="number" value={position} onChange={e => setPosition(Number(e.target.value) || 0)} /></div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold">Exerciții ({exercises.length})</p>
          <Button size="sm" variant="outline" onClick={() => setExercises([...exercises, { instruction: "", items: [] }])}><Plus className="h-3 w-3 mr-1" /> Exercițiu</Button>
        </div>
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="border border-border/60 rounded-xl p-3 space-y-2 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Exercițiul {i + 1}</span>
                <button onClick={() => setExercises(exercises.filter((_, j) => j !== i))} className="text-red-600 hover:bg-red-50 h-7 w-7 rounded-lg flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <Textarea placeholder="Instrucțiune" value={ex.instruction} onChange={e => updateEx(i, { instruction: e.target.value })} rows={2} />
              <StringListEditor label="Itemi (linii numerotate)" items={ex.items} onChange={v => updateEx(i, { items: v })} />
              <Input placeholder="Hint (opțional)" value={ex.hint ?? ""} onChange={e => updateEx(i, { hint: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
    </EditorShell>
  );
}
