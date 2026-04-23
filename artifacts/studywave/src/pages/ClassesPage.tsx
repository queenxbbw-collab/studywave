import { useState, useEffect, useRef, useCallback } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  BookOpen, Brain, FileText, ChevronRight, CheckCircle2, Circle,
  Printer, GraduationCap, X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Lightbulb, PenLine, FlaskConical, Star, ArrowRight, Timer, Lock, Trophy, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { useAuth, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Tab = "invatat" | "quiz" | "fise";

interface StudyPage {
  title: string;
  explanation: string;
  keyPoints: string[];
  examples: { label: string; value: string }[];
  exercise?: string;
}

interface StudyItem {
  title: string;
  description: string;
  topics: string[];
  pages: StudyPage[];
}

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  // Set when this question came from the admin-managed DB store. The frontend
  // doesn't know the correct answer for these — `answer` is left as -1 and the
  // server scores them using the stored answer key.
  extraId?: number;
}

interface Exercise {
  instruction: string;
  items: string[];
  hint?: string;
}

interface Worksheet {
  title: string;
  description: string;
  intro: string;
  exercises: Exercise[];
  tip?: string;
}

interface ClassData {
  grade: number;
  label: string;
  color: string;
  bg: string;
  ring: string;
  studyItems: StudyItem[];
  quiz: QuizQuestion[];
  worksheets: Worksheet[];
}

const CLASSES: ClassData[] = [
  /* ═══════════════════════════ CLASA I ═══════════════════════════ */
  {
    grade: 1,
    label: "Clasa I",
    color: "text-rose-600",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    studyItems: [
      {
        title: "Literele alfabetului",
        description: "Literele mari și mici ale alfabetului limbii române",
        topics: ["Vocale: A, E, I, O, U, Ă, Â, Î", "Consoane: B, C, D, F, G...", "Litere speciale: Ș, Ț", "Ordinea în alfabet"],
        pages: [
          {
            title: "Ce sunt literele?",
            explanation: "Alfabetul limbii române are 31 de litere. Fiecare literă are o formă mare (majusculă) și o formă mică (minusculă). Literele se folosesc pentru a scrie cuvinte.",
            keyPoints: ["31 de litere în alfabet", "Fiecare literă are formă mare și mică", "Literele formează silabe, silabele formează cuvinte", "Ordinea: A, B, C, D, E, F, G, H, I, Î, J, K, L, M, N, O, P, Q, R, S, Ș, T, Ț, U, V, W, X, Y, Z"],
            examples: [
              { label: "Litera A", value: "A mare – a mică → Avion, albină" },
              { label: "Litera B", value: "B mare – b mică → Balon, băiat" },
              { label: "Litera C", value: "C mare – c mică → Cal, casă" },
            ],
            exercise: "Scrie pe caiet primele 5 litere ale alfabetului, atât mari cât și mici.",
          },
          {
            title: "Vocale și Consoane",
            explanation: "Literele se împart în vocale și consoane. Vocalele se pot rosti singure și formează nucleul silabei. Consoanele au nevoie de vocale pentru a fi pronunțate clar.",
            keyPoints: ["Vocale: A, E, I, O, U, Ă, Â, Î (8 vocale)", "Consoanele sunt celelalte 23 de litere", "Fiecare silabă conține cel puțin o vocală", "Vocalele se pot cânta (prelungi)"],
            examples: [
              { label: "Vocală", value: "A – se poate rosti singur: Aaa!" },
              { label: "Consoană", value: "B – se rostește cu vocală: Ba, Be, Bi, Bo, Bu" },
              { label: "Silabă", value: "MA = M (consoană) + A (vocală)" },
            ],
            exercise: "Subliniază vocalele din cuvintele: MAMA, TATA, CASA, MERE.",
          },
          {
            title: "Litere speciale românești",
            explanation: "Limba română are 5 litere speciale care nu se găsesc în alte alfabete: Ă, Â, Î, Ș, Ț. Acestea au sunete unice și este important să le scriem corect.",
            keyPoints: ["Ă (a cu căciulă) – sunet scurt, specific românesc", "Â și Î – același sunet, reguli diferite de scriere", "Ș (s cu virgulă dedesubt) – ca în 'școală'", "Ț (t cu virgulă dedesubt) – ca în 'țară'"],
            examples: [
              { label: "Ă", value: "măr, pâră, băiat, mână" },
              { label: "Î/Â", value: "în, înaltă / câmp, pâine, România" },
              { label: "Ș/Ț", value: "școală, șase / țară, țap, pițigoi" },
            ],
            exercise: "Completează cu litera potrivită: _coală, ma_ină, câ_ig, Româ_ia, _ară.",
          },
        ],
      },
      {
        title: "Sunete și silabe",
        description: "Cum descompunem cuvintele în silabe și sunete",
        topics: ["Sunetul – unitatea de bază", "Silaba – grupuri de sunete", "Despărțirea în silabe", "Numărăm silabele"],
        pages: [
          {
            title: "Ce este un sunet?",
            explanation: "Sunetul este cea mai mică unitate a limbii vorbite. Atunci când vorbim, scoatem sunete pe care le auzim. Literele reprezintă sunetele în scris.",
            keyPoints: ["Sunetul se aude, litera se vede/scrie", "Fiecare literă are (de obicei) un sunet", "Unele litere au sunete diferite în context (ce, ci, ge, gi)", "Diftongul = două vocale în aceeași silabă (oa, ea, ia)"],
            examples: [
              { label: "Cuvântul CASĂ", value: "Are 4 sunete: C-A-S-Ă" },
              { label: "Cuvântul ȘCOALĂ", value: "Are 6 sunete: Ș-C-O-A-L-Ă" },
              { label: "Cuvântul OU", value: "Are 2 sunete: O-U" },
            ],
            exercise: "Numără câte sunete are fiecare cuvânt: FOC, IARNĂ, PLOAIE, STRUGURE.",
          },
          {
            title: "Despărțirea în silabe",
            explanation: "O silabă este un grup de sunete care se pronunță dintr-o singură emisie de aer. Regula principală: între două vocale alăturate se poate face despărțire. O consoană între vocale merge cu vocala a doua.",
            keyPoints: ["Fiecare silabă are cel puțin o vocală", "Consoana între două vocale merge cu a doua vocală", "Doi consoane alăturate se despart: prima merge cu silaba anterioară", "Numărăm silabele bătând din palme"],
            examples: [
              { label: "MA-MĂ", value: "2 silabe (M+A / M+Ă)" },
              { label: "CA-SA", value: "2 silabe (C+A / S+A)" },
              { label: "ȘCO-A-LĂ", value: "3 silabe" },
              { label: "FLU-TU-RE", value: "3 silabe" },
            ],
            exercise: "Desparte în silabe: ALBINĂ, ELEFANT, STRUGUREL, OMIDĂ.",
          },
        ],
      },
      {
        title: "Citire și înțelegerea textului",
        description: "Citim cu voce tare și înțelegem ce citim",
        topics: ["Literele și sunetele în cuvinte", "Cuvântul și propoziția simplă", "Texte scurte și imagini", "Răspundem la întrebări"],
        pages: [
          {
            title: "Cuvântul și propoziția",
            explanation: "Cuvântul este o îmbinare de sunete cu înțeles. Propoziția este formată din mai multe cuvinte care exprimă un gând complet. Propoziția începe cu literă mare și se termină cu punct.",
            keyPoints: ["Cuvântul are înțeles de sine stătător", "Propoziția = mai multe cuvinte + gând complet", "Propoziția începe cu majusculă", "Se termină cu punct (.), ! sau ?"],
            examples: [
              { label: "Cuvânt", value: "mama, tata, casă, școală, carte" },
              { label: "Propoziție", value: "Mama merge la piață. / Câinele latră." },
              { label: "Texte", value: "Mai multe propoziții = un text (poveste)" },
            ],
            exercise: "Alcătuiește o propoziție cu cuvintele: copil / parc / aleargă.",
          },
          {
            title: "Cum citim corect",
            explanation: "Citim rar și clar la început, apoi din ce în ce mai repede. Citim fiecare cuvânt pe silabe, le unim, și citim cuvântul întreg. Citim cu voce tare și ascultăm ce citim.",
            keyPoints: ["Citim silabă cu silabă: MA-MĂ, CA-SA", "Unim silabele: MA-MĂ → mamă", "Citim cu intonație (cu punct = coborâm vocea)", "Cu semnul întrebării = ridicăm vocea la final"],
            examples: [
              { label: "Citire lentă", value: "E – LE – FAN – TUL → elefantul" },
              { label: "Citire cu punct", value: "Mama gătește. (ton neutru)" },
              { label: "Citire cu ?", value: "Unde ești? (ton urcuș)" },
            ],
            exercise: "Citește textul: 'Ana are o carte. Ea citește în fiecare zi.' Răspunde: Ce are Ana? Ce face ea?",
          },
        ],
      },
      {
        title: "Numerele 0-100",
        description: "Numărăm, scriem și comparăm numere până la 100",
        topics: ["Numerele 0-20", "Zecile: 10, 20, 30...100", "Compararea numerelor", "Adunări și scăderi simple"],
        pages: [
          {
            title: "Numerele de la 0 la 20",
            explanation: "Primele numere pe care le învățăm sunt de la 0 la 20. Fiecare număr are un nume și corespunde unui număr de obiecte. Numerele de la 11 la 20 se formează din zece + un număr.",
            keyPoints: ["0 = zero (nimic)", "Numerele cresc cu 1 la fiecare pas", "11 = unsprezece (zece + unu)", "20 = douăzeci"],
            examples: [
              { label: "1-10", value: "unu, doi, trei, patru, cinci, șase, șapte, opt, nouă, zece" },
              { label: "11-15", value: "unsprezece, doisprezece, treisprezece, paisprezece, cincisprezece" },
              { label: "16-20", value: "șaisprezece, șaptesprezece, optsprezece, nouăsprezece, douăzeci" },
            ],
            exercise: "Scrie numerele lipsă: 0, 1, __, 3, __, 5, __, 7, __, __, 10.",
          },
          {
            title: "Compararea și ordonarea numerelor",
            explanation: "Putem compara numerele folosind semnele: > (mai mare), < (mai mic), = (egal). Numărul mai mare este cel care are mai multe obiecte.",
            keyPoints: ["< înseamnă 'mai mic decât'", "> înseamnă 'mai mare decât'", "= înseamnă 'egal cu'", "Crocodilul mănâncă numărul mai mare!"],
            examples: [
              { label: "3 < 7", value: "Trei este mai mic decât șapte" },
              { label: "15 > 9", value: "Cincisprezece este mai mare decât nouă" },
              { label: "5 = 5", value: "Cinci este egal cu cinci" },
            ],
            exercise: "Pune semnul potrivit (< , > sau =): 4 __ 9 | 12 __ 8 | 6 __ 6 | 18 __ 11.",
          },
          {
            title: "Adunarea și scăderea până la 20",
            explanation: "Adunarea înseamnă să punem împreună. Scăderea înseamnă să luăm din. Facem adunări și scăderi cu numere până la 20.",
            keyPoints: ["Adunare: 5 + 3 = 8 (punem împreună)", "Scădere: 8 – 3 = 5 (luăm din)", "Verificare: dacă 5+3=8, atunci 8-3=5", "Proprietatea: a+b = b+a (comutativitate)"],
            examples: [
              { label: "7 + 6 = 13", value: "7 obiecte + 6 obiecte = 13 obiecte" },
              { label: "15 – 8 = 7", value: "Din 15 luăm 8 și rămân 7" },
              { label: "9 + 0 = 9", value: "Orice număr + 0 = același număr" },
            ],
            exercise: "Calculează: 6+7=__ | 14-5=__ | 8+9=__ | 20-13=__",
          },
        ],
      },
      {
        title: "Forme geometrice",
        description: "Recunoaștem și descriem forme geometrice de bază",
        topics: ["Cerc, pătrat, dreptunghi, triunghi", "Linie dreaptă și curbă", "Culori și dimensiuni", "Obiecte din jurul nostru"],
        pages: [
          {
            title: "Formele geometrice de bază",
            explanation: "Formele geometrice sunt figuri cu contururi bine definite. Cele mai simple forme sunt: cercul (fără colțuri), pătratul (4 laturi egale), dreptunghiul (4 laturi, laturile opuse egale), triunghiul (3 laturi, 3 colțuri).",
            keyPoints: ["Cerc – rotund, fără colțuri", "Pătrat – 4 laturi egale, 4 colțuri drepte", "Dreptunghi – 4 laturi, laturile opuse egale", "Triunghi – 3 laturi, 3 unghiuri"],
            examples: [
              { label: "Cercul", value: "Roata, soarele, moneda – toate sunt cercuri" },
              { label: "Pătratul", value: "Tabla de șah, un perete de gresie" },
              { label: "Dreptunghiul", value: "Ușa, fereastra, foaia de hârtie" },
              { label: "Triunghiul", value: "Acoperișul casei, felul de pizza" },
            ],
            exercise: "Desenează pe caiet un cerc, un pătrat și un triunghi. Colorează-le diferit.",
          },
        ],
      },
    ],
    quiz: [
      { q: "Câte litere are alfabetul românesc?", options: ["26", "28", "31", "33"], answer: 2 },
      { q: "Care dintre acestea este o vocală?", options: ["B", "M", "S", "O"], answer: 3 },
      { q: "Câte silabe are cuvântul 'ma-mă'?", options: ["1", "2", "3", "4"], answer: 1 },
      { q: "Care număr vine după 9?", options: ["8", "11", "10", "7"], answer: 2 },
      { q: "Ce semn punem între 3 și 7 dacă 3 este mai mic?", options: [">", "=", "<", "+"], answer: 2 },
      { q: "Câte sunete are cuvântul 'FOC'?", options: ["2", "3", "4", "5"], answer: 1 },
      { q: "Câte litere speciale are limba română (Ă, Â, Î, Ș, Ț)?", options: ["3", "4", "5", "6"], answer: 2 },
      { q: "Cât face 7 + 6?", options: ["12", "13", "14", "11"], answer: 1 },
      { q: "Ce formă geometrică are o roată?", options: ["Pătrat", "Triunghi", "Cerc", "Dreptunghi"], answer: 2 },
      { q: "Câte laturi are un triunghi?", options: ["2", "3", "4", "5"], answer: 1 },
      { q: "Cât face 15 – 8?", options: ["6", "7", "8", "9"], answer: 1 },
      { q: "Care cuvânt are 3 silabe? (des-păr-ți-re)", options: ["mama", "elefant", "strugurel", "floare"], answer: 2 },
      { q: "Propoziția 'Mama gătește.' se termină cu:", options: ["!", "?", "...", "."], answer: 3 },
      { q: "Care număr este mai mare: 17 sau 13?", options: ["13", "17", "Sunt egale", "Nu știu"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Alfabetul și literele A, B, C",
        description: "Recunoaștem și scriem primele litere",
        intro: "Dragi elevi! Astăzi exersăm literele A, B și C. Urmăriți cu atenție fiecare exercițiu și scrieți frumos!",
        exercises: [
          {
            instruction: "Scrie litera A de 5 ori mare și de 5 ori mică:",
            items: ["A A A A A", "a a a a a"],
            hint: "Atenție la proporții! Litera mare e mai înaltă decât cea mică.",
          },
          {
            instruction: "Colorează DOAR obiectele care încep cu litera A:",
            items: ["Albină 🐝", "Balon 🎈", "Avion ✈️", "Pisică 🐱", "Arici 🦔", "Carte 📚"],
            hint: "Spune fiecare cuvânt cu voce tare și ascultă primul sunet!",
          },
          {
            instruction: "Completează cuvintele cu litera lipsă (A sau B):",
            items: ["___lbină", "___alon", "___vion", "___ăiat", "___rnă", "___asc"],
          },
          {
            instruction: "Scrie câte un cuvânt care începe cu fiecare literă:",
            items: ["A → ___________", "B → ___________", "C → ___________"],
          },
          {
            instruction: "Desparte în silabe și scrie numărul de silabe:",
            items: ["al-bi-nă → __ silabe", "ba-lon → __ silabe", "a-vi-on → __ silabe", "ca-sa → __ silabe"],
            hint: "Bate din palme pentru fiecare silabă.",
          },
        ],
        tip: "Profesori: Această fișă poate fi folosită și pentru activitate orală. Cereți elevilor să spună alte cuvinte care încep cu literele respective.",
      },
      {
        title: "Fișă – Numerele 1-20",
        description: "Numărăm, scriem și comparăm numere",
        intro: "Astăzi lucrăm cu numerele de la 1 la 20. Fii atent la fiecare exercițiu!",
        exercises: [
          {
            instruction: "Scrie numărul care lipsește din șir:",
            items: ["1, 2, __, 4, __, 6, __, 8, 9, __", "10, __, 12, __, 14, __, 16, 17, __, 19, __"],
            hint: "Numerele cresc în ordine, cu câte 1.",
          },
          {
            instruction: "Numără obiectele și scrie cifra corespunzătoare:",
            items: ["🍎🍎🍎 = __", "⭐⭐⭐⭐⭐ = __", "🌸🌸 = __", "🚗🚗🚗🚗🚗🚗🚗 = __", "🐝🐝🐝🐝🐝🐝🐝🐝🐝🐝🐝🐝 = __"],
          },
          {
            instruction: "Pune semnul potrivit (< , > sau =):",
            items: ["3 __ 7", "15 __ 15", "5 __ 2", "18 __ 11", "9 __ 10", "20 __ 19"],
            hint: "Crocodilul deschide gura spre numărul mai mare!",
          },
          {
            instruction: "Calculează:",
            items: ["2 + 3 = __", "5 + 7 = __", "7 - 2 = __", "14 + 4 = __", "20 - 5 = __", "9 + 9 = __"],
          },
          {
            instruction: "Problema: Ana are 6 mere și primește încă 7. Câte mere are Ana acum?",
            items: ["Rezolvare: 6 + 7 = __", "Răspuns: Ana are __ mere."],
            hint: "Citim problema, identificăm datele și operația.",
          },
        ],
        tip: "Profesori: Puteți folosi bețișoare sau jetoane pentru numerele concrete înainte de această fișă.",
      },
      {
        title: "Fișă – Forme geometrice",
        description: "Recunoaștem, desenăm și colorăm forme",
        intro: "Astăzi descoperim formele geometrice! Fii atent la fiecare formă și proprietățile ei.",
        exercises: [
          {
            instruction: "Desenează și colorează fiecare formă geometrică:",
            items: ["Un cerc mare – colorează cu albastru", "Un pătrat mic – colorează cu roșu", "Un dreptunghi – colorează cu verde", "Un triunghi – colorează cu galben"],
          },
          {
            instruction: "Câte colțuri (vârfuri) are fiecare formă?",
            items: ["Cerc → __ colțuri", "Pătrat → __ colțuri", "Dreptunghi → __ colțuri", "Triunghi → __ colțuri"],
            hint: "Numără vârfurile ascuțite ale fiecărei forme!",
          },
          {
            instruction: "Găsește în clasă/casă obiecte cu forma indicată și scrie-le:",
            items: ["Cerc: roata, __, __", "Pătrat: __, __, __", "Dreptunghi: ușa, __, __"],
          },
          {
            instruction: "Colorează DOAR formele cu 4 laturi:",
            items: ["Cerc", "Pătrat", "Triunghi", "Dreptunghi", "Cerc mic", "Pătrat mare"],
            hint: "Numără laturile (liniile) fiecărei forme!",
          },
        ],
        tip: "Profesori: Pregătiți forme decupate din carton colorat pentru activități practice înainte de fișă.",
      },
      {
        title: "Fișă – Silabe și cuvinte",
        description: "Despărțim în silabe și construim cuvinte",
        intro: "Astăzi ne jucăm cu silabele! Bate din palme pentru fiecare silabă.",
        exercises: [
          {
            instruction: "Desparte în silabe (pune cratimă între silabe):",
            items: ["mama → __", "elefant → __", "albină → __", "strugurel → __", "omidă → __", "fluture → __"],
            hint: "Bate din palme la fiecare silabă: a-ra-gaz = 3 bătăi.",
          },
          {
            instruction: "Scrie câte silabe au cuvintele:",
            items: ["cal → __ silabă/silabe", "pasăre → __ silabe", "casă → __ silabe", "locomotivă → __ silabe", "a → __ silabă"],
          },
          {
            instruction: "Formează cuvinte unind silabele:",
            items: ["MA + SĂ = __", "CA + SA = __", "AL + BI + NĂ = __", "FLU + TU + RE = __"],
          },
          {
            instruction: "Subliniază vocala din fiecare silabă:",
            items: ["MA – ME – MI – MO – MU", "BA – BE – BI – BO – BU", "CA – CE – CI – CO – CU"],
            hint: "Vocalele sunt: A, E, I, O, U, Ă, Â, Î",
          },
        ],
        tip: "Profesori: Activitatea cu bătut din palme este esențială pentru conștientizarea silabelor. Repetați oral înainte de fișă.",
      },
    ],
  },

  /* ═══════════════════════════ CLASA II ═══════════════════════════ */
  {
    grade: 2,
    label: "Clasa II",
    color: "text-orange-600",
    bg: "bg-orange-50",
    ring: "ring-orange-200",
    studyItems: [
      {
        title: "Propoziții și texte",
        description: "Citim și scriem propoziții corecte",
        topics: ["Ce este propoziția?", "Subiectul și predicatul", "Tipuri de propoziții", "Semnele de punctuație"],
        pages: [
          {
            title: "Ce este propoziția?",
            explanation: "Propoziția este o îmbinare de cuvinte care exprimă un gând complet. Propoziția începe cu literă mare și se termină cu un semn de punctuație.",
            keyPoints: ["Propoziția exprimă un gând complet", "Începe cu literă mare", "Se termină cu punct (.), semnul exclamării (!) sau întrebării (?)", "Propoziția are cel puțin un subiect și un predicat"],
            examples: [
              { label: "Propoziție enunțiativă", value: "Mama gătește la bucătărie." },
              { label: "Propoziție exclamativă", value: "Ce frumos este câmpul!" },
              { label: "Propoziție interogativă", value: "Unde te duci, Andrei?" },
            ],
            exercise: "Pune semnul de punctuație corect la sfârșitul fiecărei propoziții: Câinele latră_  Unde este cartea_  Ce zi frumoasă_",
          },
          {
            title: "Subiectul și predicatul",
            explanation: "Subiectul este cuvântul care arată cine face acțiunea sau despre cine se vorbește. Predicatul arată ce face subiectul (acțiunea).",
            keyPoints: ["Subiectul răspunde la întrebarea: Cine? Ce?", "Predicatul răspunde la întrebarea: Ce face? Ce este?", "Orice propoziție are cel puțin subiect și predicat", "Subiectul și predicatul se 'acordă' (sunt legate între ele)"],
            examples: [
              { label: "Maria citește.", value: "Maria = subiect | citește = predicat" },
              { label: "Câinele latră.", value: "Câinele = subiect | latră = predicat" },
              { label: "Soarele strălucește.", value: "Soarele = subiect | strălucește = predicat" },
            ],
            exercise: "Subliniați subiectul și încercuiți predicatul: Copiii aleargă în parc. / Florile înfloresc primăvara.",
          },
          {
            title: "Textul literar – Povestea",
            explanation: "Un text literar este o scriere cu personaje, acțiuni și locuri. O poveste are un început (se prezintă personajele), o desfășurare (ce se întâmplă) și un final.",
            keyPoints: ["Personajele sunt eroii poveștii", "Acțiunea = ce se întâmplă", "Locul acțiunii = unde se petrece", "Povestea are mesaj moral (ce ne învață)"],
            examples: [
              { label: "Personaje", value: "Scufița Roșie, lupul, bunica" },
              { label: "Acțiunea", value: "Scufița merge la bunica și întâlnește lupul" },
              { label: "Mesajul", value: "Nu vorbim cu străinii și ascultăm de părinți" },
            ],
            exercise: "Povestește cu cuvintele tale 'Capra cu trei iezi': Cine sunt personajele? Ce face mama capra? Cum se termină?",
          },
        ],
      },
      {
        title: "Adunarea și scăderea 0-100",
        description: "Calculăm cu numere până la 100",
        topics: ["Adunarea fără trecere peste zece", "Adunarea cu trecere", "Scăderea", "Probleme simple"],
        pages: [
          {
            title: "Adunarea numerelor până la 100",
            explanation: "Când adunăm numere cu două cifre, le scriem pe coloane: unitățile sub unități, zecile sub zeci. Adunăm mai întâi unitățile, apoi zecile.",
            keyPoints: ["Scriem numerele pe coloane (U sub U, Z sub Z)", "Adunăm mai întâi unitățile", "Dacă suma unităților > 9, reportăm la zeci", "Verificăm prin schimbarea ordinii: a+b = b+a"],
            examples: [
              { label: "34 + 25 =", value: "U: 4+5=9, Z: 3+2=5 → Rezultat: 59" },
              { label: "47 + 36 =", value: "U: 7+6=13 (reportăm 1), Z: 4+3+1=8 → 83" },
              { label: "50 + 30 =", value: "5 zeci + 3 zeci = 8 zeci = 80" },
            ],
            exercise: "Calculează pe coloane: 42 + 35 = __ | 56 + 28 = __ | 73 + 19 = __",
          },
          {
            title: "Scăderea numerelor până la 100",
            explanation: "Scăderea este operația inversă adunării. Când scădem, trebuie să avem grijă: dacă numărul de scăzut are mai multe unități, 'împrumutăm' de la zeci.",
            keyPoints: ["Scăderea este opusul adunării", "Verificăm prin adunare: rezultat + scăzut = descăzut", "Dacă nu putem scădea unitățile, împrumutăm 1 zece (10 unități)", "Proba scăderii: 75-32=43 → 43+32=75 ✓"],
            examples: [
              { label: "75 - 32 =", value: "U: 5-2=3, Z: 7-3=4 → Rezultat: 43" },
              { label: "83 - 47 =", value: "U: 13-7=6 (împrumutăm), Z: 7-4=3 → 36" },
              { label: "Verificare:", value: "36 + 47 = 83 ✓" },
            ],
            exercise: "Calculează și verifică: 90 - 45 = __ | 62 - 38 = __ | 74 - 26 = __",
          },
        ],
      },
      {
        title: "Măsurători – Lungime și timp",
        description: "Măsurăm lungimi și citim ceasul",
        topics: ["Metrul și centimetrul", "Ceasul – ore și minute", "Zilele săptămânii", "Lunile anului"],
        pages: [
          {
            title: "Lungimea – metrul și centimetrul",
            explanation: "Lungimea se măsoară cu rigla sau metrul. Unitatea principală este metrul (m). O sută de centimetri fac un metru.",
            keyPoints: ["1 m = 100 cm", "Rigla măsoară în centimetri (cm)", "Metrul (m) – pentru distanțe mai mari", "Kilometrul (km): 1 km = 1000 m"],
            examples: [
              { label: "Creion", value: "≈ 15-20 cm" },
              { label: "Ușa", value: "≈ 200 cm = 2 m" },
              { label: "Distanța la școală", value: "500 m = 0.5 km" },
            ],
            exercise: "Estimează și măsoară: lungimea cărții, lățimea băncii, înălțimea ta.",
          },
          {
            title: "Citim ceasul",
            explanation: "Ceasul are un cadran cu numere de la 1 la 12. Acul mare (minutar) arată minutele, acul mic (orar) arată ora. Ziua are 24 de ore, ora are 60 de minute.",
            keyPoints: ["1 oră = 60 minute", "1 zi = 24 ore", "Acul mic = ore, acul mare = minute", "Jumătate de oră = 30 minute, sfert = 15 minute"],
            examples: [
              { label: "8:00", value: "Ora 8 fix (acul mare la 12, mic la 8)" },
              { label: "8:30", value: "Opt și jumătate (acul mare la 6)" },
              { label: "8:15", value: "Opt și un sfert (acul mare la 3)" },
            ],
            exercise: "Scrie ora pentru: acul mic la 3, acul mare la 12. Ce oră este la 45 de minute după ora 9?",
          },
        ],
      },
      {
        title: "Matematică și mediul înconjurător",
        description: "Aplicăm matematica în viața de zi cu zi",
        topics: ["Probleme cu adunare și scădere", "Bani – lei și bani", "Grafice și tabele simple", "Estimarea și aproximarea"],
        pages: [
          {
            title: "Probleme cu bani",
            explanation: "Banul românesc este LEUL (RON). Monedele și bancnotele sunt: 1 ban, 5 bani, 10 bani, 50 bani, 1 leu, 5 lei, 10 lei, 50 lei, 100 lei, 200 lei, 500 lei.",
            keyPoints: ["1 leu = 100 bani", "Bancnotele: 1, 5, 10, 50, 100, 200, 500 lei", "La cumpărături: rest = plătit – cumpărat", "Estimăm prețul înainte de a cumpăra"],
            examples: [
              { label: "Costă 35 lei", value: "Dacă plătesc cu 50 lei → rest = 50-35 = 15 lei" },
              { label: "2 produse", value: "Pâine 4 lei + lapte 7 lei = 11 lei total" },
            ],
            exercise: "Ana are 25 lei. Cumpără un caiet de 8 lei. Câți lei îi rămân?",
          },
        ],
      },
    ],
    quiz: [
      { q: "Ce este propoziția?", options: ["Un cuvânt izolat", "O îmbinare de cuvinte care exprimă un gând complet", "Doar un substantiv", "O silabă"], answer: 1 },
      { q: "Cât face 45 + 38?", options: ["73", "83", "82", "84"], answer: 1 },
      { q: "Care este predicatul în: 'Copilul aleargă'?", options: ["Copilul", "aleargă", "nu există", "ambele"], answer: 1 },
      { q: "Cât face 80 - 35?", options: ["55", "45", "35", "40"], answer: 1 },
      { q: "Propoziția 'Ce frumos!' este:", options: ["Enunțiativă", "Interogativă", "Exclamativă", "Negativă"], answer: 2 },
      { q: "Câți centimetri are un metru?", options: ["10", "100", "1000", "50"], answer: 1 },
      { q: "Câte minute are o oră?", options: ["24", "30", "60", "100"], answer: 2 },
      { q: "Cât face 67 + 24?", options: ["81", "91", "90", "81"], answer: 1 },
      { q: "Dacă plătesc 50 lei și cumpăr ceva de 33 lei, restul este:", options: ["17 lei", "83 lei", "23 lei", "27 lei"], answer: 0 },
      { q: "Subiectul răspunde la întrebarea:", options: ["Ce face?", "Cine? Ce?", "Unde?", "Când?"], answer: 1 },
      { q: "Cât face 100 - 47?", options: ["53", "63", "43", "57"], answer: 0 },
      { q: "Ce unitate folosim pentru a măsura o distanță mică?", options: ["Metru", "Kilometru", "Centimetru", "Tonă"], answer: 2 },
      { q: "Care este jumătatea orei 6?", options: ["6:15", "6:30", "6:45", "7:00"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Propoziția",
        description: "Construim și analizăm propoziții",
        intro: "În această fișă exersăm construirea și analiza propozițiilor corecte în limba română.",
        exercises: [
          {
            instruction: "Pune semnul de punctuație potrivit la sfârșitul fiecărei propoziții:",
            items: ["Vino repede acasă__", "Unde ești tu__", "Florile sunt frumoase__", "Ce surpriză plăcută__", "Câți ani ai__"],
            hint: "Gândește-te dacă propoziția spune ceva (.), întreabă (?) sau exclamă (!).",
          },
          {
            instruction: "Subliniază subiectul și încercuiește predicatul:",
            items: ["Mama gătește supă.", "Câinele latră la pisică.", "Copiii se joacă în parc.", "Soarele strălucește puternic.", "Florile înfloresc primăvara."],
          },
          {
            instruction: "Ordonează cuvintele pentru a forma o propoziție corectă:",
            items: ["merge / Ana / la / școală →", "joacă / copiii / curtea / în →", "cântă / pasărea / frumos →"],
            hint: "Subiectul vine de obicei la început, predicatul după el.",
          },
          {
            instruction: "Scrie câte o propoziție despre fiecare imagine:",
            items: ["Un băiat citește o carte: _______________", "O fată aleargă pe câmp: _______________", "Un câine se joacă cu o minge: _______________"],
          },
          {
            instruction: "Transformă propoziția enunțiativă în interogativă:",
            items: ["Ion merge la piață. → _______________?", "Maria cântă frumos. → _______________?", "Ploaia cade des. → _______________?"],
          },
        ],
        tip: "Profesori: Cereți elevilor să citească propozițiile cu voce tare, punând intonația corespunzătoare semnului de punctuație.",
      },
      {
        title: "Fișă – Adunare și scădere până la 100",
        description: "Calculăm corect cu numere până la 100",
        intro: "Astăzi exersăm adunarea și scăderea cu numere mai mari. Lucrați pe coloane și verificați!",
        exercises: [
          {
            instruction: "Calculează (adunare fără trecere peste zece):",
            items: ["23 + 45 = __", "41 + 38 = __", "62 + 17 = __", "30 + 50 = __"],
            hint: "U sub U, Z sub Z. Adunăm unitățile, apoi zecile.",
          },
          {
            instruction: "Calculează (adunare cu trecere peste zece):",
            items: ["47 + 36 = __", "58 + 25 = __", "69 + 13 = __", "77 + 14 = __"],
            hint: "Dacă U+U ≥ 10, reportăm 1 la zeci!",
          },
          {
            instruction: "Calculează scăderile și verifică prin adunare:",
            items: ["86 - 43 = __ → Verificare: __ + 43 = 86", "75 - 38 = __ → Verificare: __ + 38 = 75", "100 - 55 = __ → Verificare: __ + 55 = 100"],
          },
          {
            instruction: "Probleme:",
            items: ["La biblioteca școlii sunt 65 cărți de povești și 28 cărți de matematică. Câte cărți sunt în total? R: __", "Dintr-un sac cu 80 kg de cartofi s-au folosit 47 kg. Câți kg au rămas? R: __"],
            hint: "Citim cu atenție și identificăm operația (adunare sau scădere).",
          },
        ],
        tip: "Profesori: Insistați pe probă (verificarea) ca instrument de autocontrol al elevilor.",
      },
      {
        title: "Fișă – Măsurători",
        description: "Lungimi, timp și bani",
        intro: "Măsurătorile ne ajută să înțelegem lumea din jurul nostru. Lucrăm cu metrul, ceasul și leul!",
        exercises: [
          {
            instruction: "Completează cu unitatea potrivită (cm, m, km):",
            items: ["Rigla are 30 __", "Distanța de la București la Brașov este de 180 __", "Înălțimea unui om adult este de 1,75 __", "Un creion are 15 __"],
          },
          {
            instruction: "Scrie ora în cifre:",
            items: ["Ora zece și jumătate: __:__", "Ora trei și un sfert: __:__", "Ora opt fără un sfert: __:__"],
            hint: "Jumătate = 30 minute, sfert = 15 minute, fără sfert = 45 minute.",
          },
          {
            instruction: "Probleme cu bani:",
            items: ["Ana are 50 lei. Cumpără o carte de 23 lei. Câți lei îi rămân? R: __", "Mihai cumpără 3 caiete a 5 lei fiecare. Cât plătește total? R: __", "Dacă o jucărie costă 45 lei și ai 30 lei, câți lei mai ai nevoie? R: __"],
          },
          {
            instruction: "Câte zile are fiecare lună? (ajutor: rimă cu lunile – 'Treizeci de zile are-n an...')",
            items: ["Ianuarie: __ zile", "Februarie: __ zile (în an normal)", "Aprilie: __ zile", "Decembrie: __ zile"],
          },
        ],
        tip: "Profesori: Aduceți un metru de tâmplărie și o riglă pentru demonstrații practice de măsurare.",
      },
    ],
  },

  /* ═══════════════════════════ CLASA III ═══════════════════════════ */
  {
    grade: 3,
    label: "Clasa III",
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    studyItems: [
      {
        title: "Înmulțirea și împărțirea",
        description: "Tabla înmulțirii și împărțirea exactă",
        topics: ["Tabla înmulțirii 1-10", "Proprietățile înmulțirii", "Împărțirea exactă", "Probe și verificări"],
        pages: [
          {
            title: "Ce este înmulțirea?",
            explanation: "Înmulțirea este o adunare repetată. Dacă adunăm același număr de mai multe ori, putem folosi înmulțirea pentru a calcula mai rapid.",
            keyPoints: ["a × b înseamnă a adunat de b ori", "Rezultatul înmulțirii se numește produs", "Ordinea factorilor nu schimbă produsul: 3×4 = 4×3", "Orice număr × 0 = 0"],
            examples: [
              { label: "3 × 4 =", value: "3+3+3+3 = 12 (sau 4+4+4 = 12)" },
              { label: "7 × 5 =", value: "7+7+7+7+7 = 35" },
              { label: "9 × 9 =", value: "81 (important de memorat!)" },
            ],
            exercise: "Calculează folosind adunare repetată, apoi verifică cu tabla: 4 × 6 = __ | 8 × 7 = __",
          },
          {
            title: "Tabla înmulțirii – Trucuri",
            explanation: "Există trucuri pentru a memora mai ușor tabla înmulțirii. De exemplu, înmulțirea cu 5 dă întotdeauna un număr terminat în 0 sau 5, iar cu 10 adăugăm un zero.",
            keyPoints: ["×1 = același număr", "×2 = dublul numărului", "×5 = numere terminate în 0 sau 5", "×10 = adăugăm 0 la dreapta", "×9 = suma cifrelor produsului este 9"],
            examples: [
              { label: "×5", value: "3×5=15, 6×5=30, 7×5=35, 9×5=45" },
              { label: "×10", value: "6×10=60, 8×10=80" },
              { label: "×9 truc", value: "9×7=63 (6+3=9 ✓), 9×8=72 (7+2=9 ✓)" },
            ],
            exercise: "Completează: 6×__ = 42 | __ ×7 = 63 | 8×9 = __ | __ ×5 = 45",
          },
          {
            title: "Împărțirea exactă",
            explanation: "Împărțirea este operația inversă înmulțirii. Dacă știi tabla înmulțirii, poți face împărțiri rapid. 56 ÷ 7 = ? înseamnă: 7 × ? = 56.",
            keyPoints: ["Împărțirea = operația inversă înmulțirii", "Deîmpărțit ÷ împărțitor = cât", "Verificare: cât × împărțitor = deîmpărțit", "Nu putem împărți la 0"],
            examples: [
              { label: "56 ÷ 7 =", value: "7 × 8 = 56, deci 56 ÷ 7 = 8 ✓" },
              { label: "72 ÷ 9 =", value: "9 × 8 = 72, deci 72 ÷ 9 = 8 ✓" },
              { label: "45 ÷ 5 =", value: "5 × 9 = 45, deci 45 ÷ 5 = 9 ✓" },
            ],
            exercise: "Calculează și verifică: 48 ÷ 6 = __ | 63 ÷ 9 = __ | 36 ÷ 4 = __",
          },
        ],
      },
      {
        title: "Substantivul",
        description: "Partea de vorbire care denumește ființe, lucruri, fenomene",
        topics: ["Definiție și exemple", "Genul substantivelor", "Numărul substantivelor", "Substantive proprii și comune"],
        pages: [
          {
            title: "Ce este substantivul?",
            explanation: "Substantivul este partea de vorbire care denumește ființe (oameni, animale), lucruri (obiecte, plante) sau fenomene ale naturii.",
            keyPoints: ["Denumește ființe: om, câine, pasăre", "Denumește lucruri: masă, carte, casă", "Denumește fenomene: vânt, ploaie, tunet", "Răspunde la întrebările: Cine? Ce?"],
            examples: [
              { label: "Ființe", value: "Maria, copil, elev, pisică, vulpe" },
              { label: "Lucruri", value: "masă, caiet, creion, fereastră" },
              { label: "Fenomene", value: "ploaie, furtună, zăpadă, soare" },
            ],
            exercise: "Subliniați substantivele din text: 'Copiii aleargă în curte. Câinele latră. Soarele strălucește.'",
          },
          {
            title: "Genul și numărul",
            explanation: "Substantivele au gen (masculin, feminin, neutru) și număr (singular = unul, plural = mai mulți). Genul se recunoaște prin articol: un/o, cel/cea.",
            keyPoints: ["Masculin: un băiat, un câine (un/cel)", "Feminin: o fată, o pisică (o/cea)", "Neutru: un scaun → două scaune (un → două)", "Singular = 1, Plural = mai mulți/multe"],
            examples: [
              { label: "Masculin sg→pl", value: "copil → copii, băiat → băieți" },
              { label: "Feminin sg→pl", value: "fată → fete, carte → cărți" },
              { label: "Neutru sg→pl", value: "scaun → scaune, caiet → caiete" },
            ],
            exercise: "Transformă la plural: elev→__, floare→__, creion→__, casă→__, tablou→__",
          },
          {
            title: "Substantive proprii și comune",
            explanation: "Substantivele comune denumesc o categorie de ființe sau lucruri (câine, oraș, țară). Substantivele proprii denumesc un anume individ sau loc și se scriu cu majusculă.",
            keyPoints: ["Comune: câine, oraș, fluviu, munte (fără majusculă)", "Proprii: Rex, București, Dunărea, Carpații (cu majusculă)", "Prenumele și numele de familie = proprii", "Denumirile geografice = proprii"],
            examples: [
              { label: "Common vs propriu", value: "copil → Ion / Maria; câine → Azorel" },
              { label: "Geografie", value: "munte → Munții Carpați; fluviu → Dunărea" },
              { label: "Orașe", value: "oraș → București, Cluj-Napoca, Iași" },
            ],
            exercise: "Scrie substantivul propriu corespunzător: elev (coleg de bancă) → __ | țară (unde trăiești) → __ | fluviu principal România → __",
          },
        ],
      },
      {
        title: "Verbul",
        description: "Cuvintele care exprimă acțiunile sau stările",
        topics: ["Ce este verbul?", "Verbul la prezent", "Verbul la trecut și viitor", "Acordul subiect-predicat"],
        pages: [
          {
            title: "Ce este verbul?",
            explanation: "Verbul este partea de vorbire care exprimă o acțiune (a merge, a citi) sau o stare (a fi, a sta, a dormi). Verbul se schimbă după persoană și număr.",
            keyPoints: ["Verbul exprimă acțiuni: a merge, a scrie, a citi", "Sau stări: a fi, a dormi, a sta", "Verbul se conjugă (se schimbă)", "Răspunde la întrebările: Ce face? Ce este?"],
            examples: [
              { label: "Acțiuni", value: "aleargă, cântă, citește, desenează, gătește" },
              { label: "Stări", value: "este, doarme, stă, trăiește, rămâne" },
              { label: "În propoziție", value: "Copilul (subiect) CITEȘTE (predicat-verb)" },
            ],
            exercise: "Identifică verbele: 'Soarele strălucește. Copiii aleargă și râd. Maria citește o carte.'",
          },
          {
            title: "Verbul la prezent, trecut, viitor",
            explanation: "Verbul se poate exprima la trei timpuri principale: prezent (acum), trecut (a fost), viitor (va fi). Forma verbului se schimbă.",
            keyPoints: ["Prezent: eu merg, tu mergi, el merge", "Trecut (perfect compus): am mers, ai mers, a mers", "Viitor: voi merge, vei merge, va merge", "Indicii: ieri (trecut), mâine (viitor)"],
            examples: [
              { label: "Prezent", value: "Copilul CITEȘTE acum" },
              { label: "Trecut", value: "Copilul A CITIT ieri" },
              { label: "Viitor", value: "Copilul VA CITI mâine" },
            ],
            exercise: "Transformă la trecut și viitor: 'Mama gătește.' → 'Mama __ gătit.' → 'Mama __ găti.'",
          },
        ],
      },
      {
        title: "Științe ale naturii – Viețuitoarele",
        description: "Plantele și animalele din mediul înconjurător",
        topics: ["Plante – părțile plantei", "Animale sălbatice și domestice", "Medii de viață", "Lanțul trofic simplu"],
        pages: [
          {
            title: "Plante – structură și funcții",
            explanation: "Plantele sunt ființe vii care produc hrană prin fotosinteză. O plantă are: rădăcina (fixare și absorbție), tulpina (susținere și transport), frunzele (fotosinteză), floarea (reproducere), fructul cu semințe.",
            keyPoints: ["Rădăcina – absoarbe apă și săruri minerale din sol", "Tulpina – susține planta și transportă substanțe", "Frunzele – fac fotosinteza (hrână din lumina soarelui)", "Floarea → polenizare → fruct → sămânță → plantă nouă"],
            examples: [
              { label: "Fotosinteza", value: "Apă + CO₂ + lumina soarelui → zahăr + oxigen" },
              { label: "Tipuri de plante", value: "Ierboase (grâu), arbuști (trandafir), arbori (stejar)" },
              { label: "Plante utile", value: "Grâu (pâine), cartof (aliment), tei (ceai medicinal)" },
            ],
            exercise: "Desenează o plantă și etichetează: rădăcina, tulpina, frunza, floarea, fructul.",
          },
          {
            title: "Animale – clasificare și adaptare",
            explanation: "Animalele se împart în domestice (trăiesc lângă om) și sălbatice (trăiesc în natură). Se mai clasifică după mediu: terestre, acvatice, aeriene.",
            keyPoints: ["Domestice: câine, pisică, vacă, cal, găină", "Sălbatice: lup, urs, vulpe, cerb, corb", "Terestre: trăiesc pe uscat", "Acvatice: pești, delfini, broaște", "Insecte: albina, fluturele, furnica"],
            examples: [
              { label: "Lanț trofic", value: "Iarbă → iepure → vulpe → urs" },
              { label: "Adaptare la frig", value: "Ursul doarme iarna, pasărea migrează" },
              { label: "Adaptare la apă", value: "Peștele are aripioare și branhii" },
            ],
            exercise: "Clasifică animalele: albina, lupul, crap, vulturul, vaca, delfinul – domestice/sălbatice, terestre/acvatice/aeriene.",
          },
        ],
      },
      {
        title: "Numerele 0-1000",
        description: "Cifre, numerele de la 0 la 1000, operații",
        topics: ["Sutele și miile", "Scrierea și citirea numerelor", "Compararea și ordonarea", "Adunare și scădere cu numere mari"],
        pages: [
          {
            title: "Numerele până la 1000",
            explanation: "Un număr de 3 cifre are: unități (U), zeci (Z) și sute (S). De exemplu, 347 = 3 sute + 4 zeci + 7 unități.",
            keyPoints: ["3 cifre: sute, zeci, unități", "347 = 300 + 40 + 7", "Cea mai mică sută: 100 (una sută)", "Cea mai mare cu 3 cifre: 999", "1000 = zece sute = o mie"],
            examples: [
              { label: "Numărul 256", value: "2 sute + 5 zeci + 6 unități" },
              { label: "Numărul 800", value: "8 sute + 0 zeci + 0 unități" },
              { label: "Comparare", value: "456 < 465 (comparăm cifra zecilor: 5 < 6)" },
            ],
            exercise: "Descompune: 735 = __ sute + __ zeci + __ unități | 509 = __ sute + __ zeci + __ unități",
          },
        ],
      },
    ],
    quiz: [
      { q: "Cât face 7 × 8?", options: ["54", "56", "63", "48"], answer: 1 },
      { q: "Care cuvânt este un substantiv?", options: ["frumos", "a merge", "casă", "el"], answer: 2 },
      { q: "Cât face 72 ÷ 9?", options: ["7", "9", "8", "6"], answer: 2 },
      { q: "Substantivul 'masă' este de gen:", options: ["Masculin", "Feminin", "Neutru", "Nu are gen"], answer: 1 },
      { q: "Care este pluralul lui 'copil'?", options: ["copile", "copii", "copilii", "copilei"], answer: 1 },
      { q: "Verbul exprimă:", options: ["Un lucru", "O acțiune sau stare", "O persoană", "O culoare"], answer: 1 },
      { q: "Fotosinteza are loc în:", options: ["Rădăcini", "Tulpini", "Frunze", "Flori"], answer: 2 },
      { q: "Cât face 6 × 9?", options: ["54", "56", "63", "48"], answer: 0 },
      { q: "Substantivul propriu se scrie:", options: ["Cu literă mică", "Cu literă mare", "Cu ghilimele", "Cu linie"], answer: 1 },
      { q: "Numărul 347 are câte sute?", options: ["7", "4", "3", "34"], answer: 2 },
      { q: "Care animal este domestic?", options: ["Lupul", "Vulpea", "Vaca", "Cerbul"], answer: 2 },
      { q: "Cât face 8 × 7?", options: ["48", "56", "63", "54"], answer: 1 },
      { q: "Verbul 'a citi' la trecut (perfect compus): 'el __ cartea'", options: ["va citi", "citise", "a citit", "citind"], answer: 2 },
      { q: "Ce înseamnă 1000?", options: ["10 zeci", "100 sute", "10 sute", "100 zeci"], answer: 2 },
    ],
    worksheets: [
      {
        title: "Fișă – Tabla înmulțirii",
        description: "Exersăm tabla înmulțirii prin exerciții variate",
        intro: "Astăzi exersăm tabla înmulțirii. Lucrați cu atenție și verificați răspunsurile!",
        exercises: [
          {
            instruction: "Completează tabla înmulțirii cu 7:",
            items: ["7×1=__", "7×2=__", "7×3=__", "7×4=__", "7×5=__", "7×6=__", "7×7=__", "7×8=__", "7×9=__", "7×10=__"],
            hint: "Adaugă câte 7 la fiecare rezultat anterior.",
          },
          {
            instruction: "Calculează (folosește tabla învățată):",
            items: ["6 × __ = 42", "__ × 7 = 63", "8 × 9 = __", "__ × 5 = 45", "9 × __ = 81", "4 × 8 = __"],
          },
          {
            instruction: "Împărțiri (gândește-te la tabla înmulțirii):",
            items: ["56 ÷ 7 = __", "72 ÷ 8 = __", "45 ÷ 9 = __", "48 ÷ 6 = __", "36 ÷ 4 = __"],
            hint: "Întreabă-te: cu ce număr trebuie să înmulțesc împărțitorul pentru a obține deîmpărțitul?",
          },
          {
            instruction: "Calculează expresiile:",
            items: ["5 × 6 + 3 = __", "4 × 7 - 8 = __", "9 × 3 + 5 = __", "(8 + 4) × 3 = __"],
            hint: "Respectă ordinea operațiilor: mai întâi înmulțirea, apoi adunarea/scăderea.",
          },
          {
            instruction: "Problema: Un coș are 8 mere. Câte mere au 6 coșuri? Dar dacă dintr-un coș s-au mâncat 3 mere?",
            items: ["Rezolvare (6 coșuri): 8 × 6 = __", "Mere totale: __", "Dacă dintr-un coș s-au mâncat 3: 8 - 3 = __ mere în acel coș"],
            hint: "Citim cu atenție problema și identificăm ce se cere.",
          },
        ],
        tip: "Profesori: Recomandați elevilor să practice tabla zilnic, câte 5 minute. Jocurile de memorie cu flashcard-uri sunt eficiente.",
      },
      {
        title: "Fișă – Substantivul și Verbul",
        description: "Identificăm și analizăm substantive și verbe",
        intro: "Astăzi analizăm substantivele și verbele. Amintiți-vă: substantivul = Cine? Ce?; Verbul = Ce face?",
        exercises: [
          {
            instruction: "Subliniază substantivele din textul următor:",
            items: ["'Copiii aleargă în curtea școlii. Câinele latră la pisică. Soarele strălucește și florile înfloresc.'"],
            hint: "Întrebați: despre CE sau CINE se vorbește?",
          },
          {
            instruction: "Încercuiește verbele din textul de mai sus (exercițiul 1):",
            items: ["Verbele = acțiunile sau stările: aleargă, latră, etc."],
            hint: "Întrebați: CE FACE subiectul?",
          },
          {
            instruction: "Scrie gen (M/F/N) și număr (sg/pl) pentru fiecare substantiv:",
            items: ["copil → gen __, număr __", "floare → gen __, număr __", "scaun → gen __, număr __", "băiat → gen __, număr __"],
          },
          {
            instruction: "Transformă verbele la trecut și viitor:",
            items: ["merge (prezent) → a __ (trecut) → va __ (viitor)", "cântă (prezent) → a __ (trecut) → va __ (viitor)", "doarme (prezent) → a __ (trecut) → va __ (viitor)"],
            hint: "Trecut (perfect compus): a + participiu | Viitor: va + infinitiv",
          },
          {
            instruction: "Scrie câte 3 substantive din fiecare categorie:",
            items: ["Ființe: __, __, __", "Lucruri: __, __, __", "Fenomene ale naturii: __, __, __", "Substantive proprii: __, __, __"],
          },
        ],
        tip: "Profesori: Exercițiile de identificare pe text sunt mai eficiente decât listele izolate. Elevii văd contextul real de utilizare.",
      },
      {
        title: "Fișă – Viețuitoarele",
        description: "Plante și animale – structură, clasificare, adaptare",
        intro: "Natura este minunată! Astăzi explorăm plantele și animalele din jurul nostru.",
        exercises: [
          {
            instruction: "Etichetează părțile plantei (desenează pe caiet și etichetează):",
            items: ["Rădăcina – rol: __", "Tulpina – rol: __", "Frunzele – rol: __", "Floarea – rol: __"],
          },
          {
            instruction: "Clasifică animalele (domestice / sălbatice):",
            items: ["Vacă → __", "Lup → __", "Cal → __", "Urs → __", "Găină → __", "Vulpe → __", "Câine → __", "Cerb → __"],
          },
          {
            instruction: "Clasifică după mediu (terestru / acvatic / aerian):",
            items: ["Pește → __", "Vultur → __", "Broscuță → __", "Rândunică → __", "Delfin → __", "Vaca → __"],
          },
          {
            instruction: "Completează lanțul trofic:",
            items: ["Iarbă → __ → __ → urs", "Frunze → omidă → __ → __"],
            hint: "Un lanț trofic arată cine mănâncă pe cine.",
          },
        ],
        tip: "Profesori: Plimbarea în natură sau în grădina școlii consolidează observațiile. Puteți crea un ierbar simplu.",
      },
    ],
  },

  /* ═══════════════════════════ CLASA IV ═══════════════════════════ */
  {
    grade: 4,
    label: "Clasa IV",
    color: "text-green-600",
    bg: "bg-green-50",
    ring: "ring-green-200",
    studyItems: [
      {
        title: "Fracții",
        description: "Numere raționale și operații cu fracții",
        topics: ["Ce este o fracție?", "Fracții echivalente", "Compararea fracțiilor", "Adunarea și scăderea fracțiilor"],
        pages: [
          {
            title: "Ce este o fracție?",
            explanation: "O fracție reprezintă o parte dintr-un întreg. Fracția a/b se citește 'a din b'. Numărătorul (a) arată câte părți luăm, numitorul (b) arată în câte părți egale e împărțit întregul.",
            keyPoints: ["Fracție = numărător / numitor", "Numărătorul = câte părți am", "Numitorul = câte părți are întregul", "Fracție subunitară: numărător < numitor", "Fracție supraunitară: numărător > numitor"],
            examples: [
              { label: "1/2", value: "Un sfert → pizza tăiată în 2, luăm 1 felie" },
              { label: "3/4", value: "Trei sferturi → turtă dulce tăiată în 4, luăm 3 bucăți" },
              { label: "5/3", value: "Fracție supraunitară → mai mult decât întregul" },
            ],
            exercise: "Desenați pe caiet și colorați: 3/8 dintr-un dreptunghi, 2/5 dintr-un cerc.",
          },
          {
            title: "Adunarea și scăderea fracțiilor",
            explanation: "Fracțiile cu același numitor se adună/scad simplu: operăm doar numărătorii, numitorul rămâne același. Dacă numitorii sunt diferiți, trebuie să găsim numitorul comun.",
            keyPoints: ["Numitori egali: adunăm/scădem numărătorii", "Numitori diferiți: găsim numitor comun", "Simplificăm rezultatul dacă se poate", "Verificăm că rezultatul este corect"],
            examples: [
              { label: "2/5 + 1/5 =", value: "(2+1)/5 = 3/5" },
              { label: "4/6 - 2/6 =", value: "(4-2)/6 = 2/6 = 1/3 (simplificăm)" },
              { label: "1/2 + 1/4 =", value: "2/4 + 1/4 = 3/4 (numitor comun 4)" },
            ],
            exercise: "Calculează: 3/8 + 3/8 = __ | 5/7 - 2/7 = __ | 1/3 + 1/6 = __",
          },
        ],
      },
      {
        title: "Adjectivul",
        description: "Cuvintele care descriu însușirile substantivelor",
        topics: ["Ce este adjectivul?", "Acordul adjectivului", "Gradele de comparație", "Adjectivul în propoziție"],
        pages: [
          {
            title: "Ce este adjectivul?",
            explanation: "Adjectivul este partea de vorbire care exprimă o însușire a unui substantiv. Adjectivul se acordă cu substantivul în gen și număr.",
            keyPoints: ["Adjectivul arată: cum este? ce fel de?", "Se acordă cu substantivul (gen, număr)", "Masculin: un copil frumos / niște copii frumoși", "Feminin: o fată frumoasă / niște fete frumoase"],
            examples: [
              { label: "Masc. sg.", value: "un câine lup fioros, un elev harnic" },
              { label: "Fem. sg.", value: "o floare roșie, o carte groasă" },
              { label: "Plural", value: "copii harnici, fete frumoase" },
            ],
            exercise: "Completează cu forma corectă a adjectivului: fată (frumos)→__, copii (vesel)→__, câine (mare)→__",
          },
          {
            title: "Gradele de comparație",
            explanation: "Adjectivele pot arăta grade diferite ale unei însușiri: pozitiv (simplu), comparativ (comparat cu altceva), superlativ (gradul maxim).",
            keyPoints: ["Pozitiv: frumos, mare, bun", "Comparativ de superioritate: mai frumos (decât)", "Comparativ de inferioritate: mai puțin frumos", "Superlativ relativ: cel mai frumos (din...)", "Superlativ absolut: foarte frumos, extrem de frumos"],
            examples: [
              { label: "Pozitiv", value: "Ion este înalt." },
              { label: "Comparativ", value: "Ion este mai înalt decât Mihai." },
              { label: "Superlativ", value: "Ion este cel mai înalt din clasă. / Ion este foarte înalt." },
            ],
            exercise: "Formează gradele de comparație pentru adjectivul 'bun': pozitiv=__, comparativ=__, superlativ relativ=__, superlativ absolut=__",
          },
        ],
      },
      {
        title: "Istoria României – Origini",
        description: "Dacii, romanii și formarea poporului român",
        topics: ["Dacii și Burebista", "Decebal și Traian", "Cucerirea romană 106 d.Hr.", "Formarea limbii și poporului"],
        pages: [
          {
            title: "Cine erau dacii?",
            explanation: "Dacii erau locuitorii din teritoriul actual al României, în Antichitate. Erau un popor viteaz, organizat în triburi, conduși de regi. Cel mai mare rege al dacilor a fost Burebista, care a unit toate triburile dacice.",
            keyPoints: ["Dacii locuiau în Carpați și câmpiile din jur", "Burebista (82-44 î.Hr.) a unit triburile dacice", "Decebal a fost ultimul rege al dacilor (87-106 d.Hr.)", "Capitala dacică era Sarmizegetusa"],
            examples: [
              { label: "Burebista", value: "Primul mare rege dac, a unit triburile" },
              { label: "Sarmizegetusa", value: "Capitala Daciei, în munții Șureanu" },
              { label: "Decebal", value: "Ultimul rege dac, apărător viteaz al Daciei" },
            ],
            exercise: "Răspunde: Cine a unit triburile dacice? Unde era capitala Daciei?",
          },
          {
            title: "Cucerirea romană și formarea poporului",
            explanation: "Împăratul roman Traian a cucerit Dacia în două războaie (101-102 d.Hr. și 105-106 d.Hr.). Dacia a devenit provincie romană. Romanii au adus limba latină, din care s-a format limba română.",
            keyPoints: ["106 d.Hr. – Dacia devine provincie romană", "Dacii și romanii s-au amestecat → daco-romani", "Limba latină + influențe dacice = limba română", "Columna lui Traian din Roma păstrează memoria evenimentelor"],
            examples: [
              { label: "Traian", value: "Împăratul roman care a cucerit Dacia" },
              { label: "Dacia Felix", value: "Provincia romană: bogată în aur și argint" },
              { label: "Romanizarea", value: "Adoptarea limbii și culturii romane de către daci" },
            ],
            exercise: "Completează: Dacia a fost cucerită în __ d.Hr. de împăratul __. Poporul român s-a format prin amestecul __ cu __.",
          },
        ],
      },
      {
        title: "Geografie – România, țara noastră",
        description: "Poziția, relieful și regiunile României",
        topics: ["Pozița geografică a României", "Relieful României", "Apele, clima și vegetația", "Regiunile istorice"],
        pages: [
          {
            title: "Relieful României",
            explanation: "România are un relief variat: munți (Carpații), dealuri și podișuri, câmpii. Carpații împart țara în trei regiuni principale: Transilvania (interior), Moldova (est), Muntenia și Oltenia (sud).",
            keyPoints: ["Munții Carpați – coloana vertebrală a țării", "Cel mai înalt vârf: Moldoveanu (2544m)", "Dunărea – fluviul principal, se varsă în Marea Neagră", "Delta Dunării – rezervație biosferă UNESCO"],
            examples: [
              { label: "Munți", value: "Carpații Meridionali (Sudici), Orientali, Occidentali" },
              { label: "Câmpii", value: "Câmpia Română, Câmpia de Vest" },
              { label: "Ape", value: "Dunărea, Mureșul, Oltul, Siretul, Prutul" },
            ],
            exercise: "Pe o hartă, identifică: Munții Carpați, Câmpia Română, Dunărea, Delta Dunării, Marea Neagră.",
          },
          {
            title: "Regiunile istorice ale României",
            explanation: "România are mai multe regiuni istorice, fiecare cu tradiții și specificuri proprii: Transilvania, Moldova, Muntenia, Oltenia, Dobrogea, Banat, Crișana, Maramureș.",
            keyPoints: ["Transilvania – centrul țării, orașul Cluj-Napoca", "Moldova – estul, orașul Iași", "Muntenia – sudul, capitala București", "Dobrogea – sud-est, Marea Neagră", "Banat – vest, Timișoara"],
            examples: [
              { label: "Capitala", value: "București – cel mai mare oraș al României" },
              { label: "Orașe mari", value: "Cluj-Napoca, Iași, Timișoara, Constanța, Brașov" },
              { label: "Unirea 1918", value: "Toate regiunile s-au unit în Marea Unire din 1 Decembrie" },
            ],
            exercise: "Identifică pe hartă cele 8 regiuni istorice. Scrie câte un oraș din fiecare regiune.",
          },
        ],
      },
      {
        title: "Numerele mari și operații",
        description: "Numere până la un milion și operații cu ele",
        topics: ["Miile și zecile de mii", "Sutele de mii și milionul", "Împărțirea cu rest", "Ordinea operațiilor"],
        pages: [
          {
            title: "Numere mari",
            explanation: "Numerele mari se formează adăugând clase: unități, mii, milioane. Fiecare clasă are cifre la unități, zeci și sute.",
            keyPoints: ["1000 = o mie", "10 000 = zece mii", "100 000 = o sută de mii", "1 000 000 = un milion", "Separăm grupele de câte 3 cifre cu punct: 1.234.567"],
            examples: [
              { label: "15 234", value: "15 mii și 234 unități" },
              { label: "324 500", value: "324 mii și 500 unități" },
              { label: "1 000 000", value: "Un milion = 1000 × 1000" },
            ],
            exercise: "Scrie în litere: 23 456 = __; Scrie în cifre: douăzeci și cinci de mii trei sute = __",
          },
          {
            title: "Împărțirea cu rest",
            explanation: "Când un număr nu se împarte exact, obținem un cât și un rest. Restul este întotdeauna mai mic decât împărțitorul. Verificăm: cât × împărțitor + rest = deîmpărțit.",
            keyPoints: ["Împărțire cu rest: 17 ÷ 5 = 3 rest 2", "Restul < împărțitorul mereu", "Verificare: 3×5+2 = 17 ✓", "Dacă rest = 0, împărțirea este exactă"],
            examples: [
              { label: "25 ÷ 7 =", value: "3 rest 4 (7×3=21, 25-21=4)" },
              { label: "43 ÷ 6 =", value: "7 rest 1 (6×7=42, 43-42=1)" },
              { label: "50 ÷ 8 =", value: "6 rest 2 (8×6=48, 50-48=2)" },
            ],
            exercise: "Calculează cu rest și verifică: 37÷5=__ rest __ | 49÷7=__ rest __ | 83÷9=__ rest __",
          },
        ],
      },
    ],
    quiz: [
      { q: "Cât este 3/4 + 1/4?", options: ["4/8", "4/4 (=1)", "2/4", "3/8"], answer: 1 },
      { q: "Cine a fost primul mare rege al dacilor?", options: ["Decebal", "Traian", "Burebista", "Dromihete"], answer: 2 },
      { q: "În ce an a cucerit Traian Dacia?", options: ["101 d.Hr.", "106 d.Hr.", "100 î.Hr.", "200 d.Hr."], answer: 1 },
      { q: "Cel mai înalt vârf din România este:", options: ["Parângul", "Negoiul", "Moldoveanu", "Omu"], answer: 2 },
      { q: "Fracția 3/5 este:", options: ["Supraunitară", "Subunitară", "Egală cu 1", "Egală cu 0"], answer: 1 },
      { q: "Adjectivul se acordă cu substantivul în:", options: ["Timp și mod", "Gen și număr", "Persoană și caz", "Grad și gen"], answer: 1 },
      { q: "Care este capitala României?", options: ["Cluj-Napoca", "Timișoara", "București", "Iași"], answer: 2 },
      { q: "Dunărea se varsă în:", options: ["Marea Baltică", "Marea Neagră", "Marea Adriatică", "Marea Mediterană"], answer: 1 },
      { q: "Cât este 25 ÷ 7 (cu rest)?", options: ["3 rest 4", "4 rest 2", "3 rest 3", "2 rest 5"], answer: 0 },
      { q: "Superlativul absolut al lui 'bun' este:", options: ["mai bun", "cel mai bun", "foarte bun", "bunătate"], answer: 2 },
      { q: "Marea Unire a României a avut loc în:", options: ["1916", "1918", "1920", "1922"], answer: 1 },
      { q: "1 milion are câți zerouri?", options: ["4", "5", "6", "7"], answer: 2 },
      { q: "Cât este 2/3 + 1/6 (cu numitor comun)?", options: ["3/9", "5/6", "4/6", "3/6"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Fracții",
        description: "Exerciții variate cu fracții",
        intro: "Astăzi lucrăm cu fracțiile! Rețineți: numărătorul este deasupra liniei, numitorul dedesubt.",
        exercises: [
          {
            instruction: "Colorează fracția indicată în figurile geometrice (desenați pe caiet):",
            items: ["Un dreptunghi împărțit în 8 → colorează 3/8", "Un cerc împărțit în 6 → colorează 4/6", "Un pătrat împărțit în 4 → colorează 1/4"],
            hint: "Mai întâi împărțiți figura în părți egale, apoi colorați numărul de părți cerut.",
          },
          {
            instruction: "Calculează (numitori egali):",
            items: ["2/5 + 1/5 = __", "4/6 - 2/6 = __", "3/8 + 3/8 = __", "5/9 - 2/9 = __", "1/4 + 2/4 = __"],
          },
          {
            instruction: "Calculează (numitori diferiți – găsește numitor comun):",
            items: ["1/2 + 1/4 = __/4 + 1/4 = __", "2/3 + 1/6 = __/6 + 1/6 = __", "3/4 - 1/8 = __/8 - 1/8 = __"],
            hint: "Transformă fracțiile astfel încât să aibă același numitor.",
          },
          {
            instruction: "Problema: Ana a mâncat 2/8 dintr-o pizza. Ion a mâncat 3/8. Câtă pizza au mâncat împreună? Cât a rămas?",
            items: ["Mâncat împreună: 2/8 + 3/8 = __", "Rămas din pizza: 8/8 - __ = __"],
            hint: "Pizza întreagă = 8/8.",
          },
        ],
        tip: "Profesori: Folosiți pizza, torturi sau alte obiecte reale pentru demonstrarea conceptului de fracție înainte de fișă.",
      },
      {
        title: "Fișă – Adjectivul",
        description: "Identificăm și analizăm adjective",
        intro: "Adjectivele fac limbajul mai colorat! Astăzi le identificăm și le acordăm corect.",
        exercises: [
          {
            instruction: "Subliniază adjectivele din textul următor:",
            items: ["'Soarele strălucitor luminează câmpul verde. Copiii veseli aleargă pe părâul cristalin. Florile roșii și albe parfumează aerul curat.'"],
            hint: "Adjectivele arată CUM ESTE substantivul.",
          },
          {
            instruction: "Acordă adjectivul cu substantivul (completează forma corectă):",
            items: ["un copil (harnic) → __", "o fată (harnic) → __", "niște copii (harnic) → __", "un munte (înalt) → __", "o floare (roșu) → __", "niște case (mare) → __"],
          },
          {
            instruction: "Completează gradele de comparație:",
            items: ["frumos → mai __ (decât) → cel mai __ (din) → foarte __", "bun → mai __ (decât) → cel mai __ (din) → foarte __", "mare → mai __ (decât) → cel mai __ (din) → foarte __"],
          },
          {
            instruction: "Scrie câte 2 adjective pentru fiecare substantiv:",
            items: ["soarele: __, __", "cartea: __, __", "câinele: __, __", "strada: __, __"],
          },
        ],
        tip: "Profesori: Adjectivele sunt uneori confundate cu substantivele. Insistați pe întrebările de identificare: CUM ESTE? CE FEL DE?",
      },
      {
        title: "Fișă – Istoria și Geografia României",
        description: "Dacii, romanii, relieful și regiunile României",
        intro: "România are o istorie bogată și o natură splendidă! Astăzi ne reamintim cele mai importante aspecte.",
        exercises: [
          {
            instruction: "Completează cronologia evenimentelor istorice:",
            items: ["__ î.Hr. – Burebista unește triburile dacice", "__ d.Hr. – Prima campanie romană a lui Traian", "__ d.Hr. – Dacia devine provincie romană", "__ – Marea Unire a tuturor românilor"],
          },
          {
            instruction: "Completează informațiile despre relieful României:",
            items: ["Cel mai înalt munte: __ (__ m)", "Fluviul principal: __", "Mare: __", "Delta __"],
          },
          {
            instruction: "Scrie câte un oraș din fiecare regiune istorică:",
            items: ["Transilvania: __", "Moldova: __", "Muntenia: __", "Dobrogea: __", "Banat: __", "Oltenia: __"],
          },
          {
            instruction: "Explică cu cuvintele tale:",
            items: ["Ce înseamnă romanizarea? → _______________", "De ce se numim 'popor latin'? → _______________", "Ce este Delta Dunării? → _______________"],
          },
        ],
        tip: "Profesori: Folosiți harta României pentru exercițiile geografice. Cereți elevilor să marcheze pe hartă elementele solicitate.",
      },
    ],
  },

  /* ═══════════════════════════ CLASA V ═══════════════════════════ */
  {
    grade: 5,
    label: "Clasa V",
    color: "text-teal-600",
    bg: "bg-teal-50",
    ring: "ring-teal-200",
    studyItems: [
      {
        title: "Mulțimi și operații",
        description: "Teoria mulțimilor și operații cu mulțimi",
        topics: ["Ce este o mulțime?", "Elemente și apartenența", "Reuniunea și intersecția", "Diagrama Venn"],
        pages: [
          {
            title: "Mulțimi – concepte de bază",
            explanation: "O mulțime este o colecție bine definită de obiecte numite elemente. Mulțimea se notează cu litere mari (A, B, M) iar elementele se scriu între acolade.",
            keyPoints: ["Mulțimea se notează: A = {1, 2, 3}", "Apartenența: 2 ∈ A (2 aparține lui A)", "Non-apartenența: 5 ∉ A (5 nu aparține)", "Mulțimea vidă: ∅ sau {} – fără elemente", "Cardinalul = numărul elementelor: card(A)"],
            examples: [
              { label: "A = {1, 2, 3, 4}", value: "Mulțimea cifrelor de la 1 la 4; card(A)=4" },
              { label: "B = {mere, pere, prune}", value: "Mulțimea fructelor" },
              { label: "N = {0,1,2,3,...}", value: "Mulțimea numerelor naturale" },
            ],
            exercise: "Fie A = {2, 4, 6, 8, 10}. Spune: 4 ∈ A? 7 ∈ A? Care e cardinalul lui A?",
          },
          {
            title: "Reuniunea și intersecția",
            explanation: "Reuniunea (A ∪ B) conține TOATE elementele din A și B. Intersecția (A ∩ B) conține DOAR elementele comune celor două mulțimi.",
            keyPoints: ["A ∪ B = elementele din A SAU B (sau ambele)", "A ∩ B = elementele din A ȘI B (comune)", "Dacă A ∩ B = ∅, mulțimile sunt disjuncte", "Diagrama Venn vizualizează relațiile"],
            examples: [
              { label: "A={1,2,3}, B={2,3,4}", value: "A∪B={1,2,3,4} | A∩B={2,3}" },
              { label: "A={a,b,c}, B={d,e}", value: "A∪B={a,b,c,d,e} | A∩B=∅ (disjuncte)" },
            ],
            exercise: "Fie A={1,3,5,7,9} și B={3,6,9,12}. Calculează: A∪B = __ | A∩B = __",
          },
        ],
      },
      {
        title: "Numere întregi",
        description: "Numere pozitive, negative și operații",
        topics: ["Numerele negative", "Modulul unui număr", "Adunarea numerelor întregi", "Scăderea și înmulțirea"],
        pages: [
          {
            title: "Numere întregi – introducere",
            explanation: "Numerele întregi includ numerele naturale (pozitive), negativele lor și zero. Se notează cu Z. Pe axa numerelor, pozitivele sunt la dreapta lui 0, negativele la stânga.",
            keyPoints: ["Z = {..., -3, -2, -1, 0, 1, 2, 3, ...}", "Numere pozitive: +1, +2, ... sau 1, 2, ...", "Numere negative: -1, -2, -3, ...", "0 nu este nici pozitiv, nici negativ"],
            examples: [
              { label: "Temperatură", value: "-5°C = 5 grade sub zero" },
              { label: "Etaj", value: "-1 = subsolul (sub parter)" },
              { label: "Altitudine", value: "Marea Moartă: -430m față de nivelul mării" },
            ],
            exercise: "Plasați pe axă: -4, -1, 0, 2, 5. Care este cel mai mic? Care este cel mai mare?",
          },
          {
            title: "Modulul și operații",
            explanation: "Modulul unui număr întreg este distanța față de 0 pe axă (întotdeauna pozitiv sau zero). Adunarea și scăderea numerelor întregi urmează reguli speciale.",
            keyPoints: ["|a| = a dacă a ≥ 0, sau -a dacă a < 0", "(-5)+(-3) = -(5+3) = -8", "(+7)+(-3) = +(7-3) = +4", "a-b = a+(-b) (scăderea devine adunare)", "(-a)×(-b) = a×b (minus × minus = plus)"],
            examples: [
              { label: "|-7| = 7", value: "Distanța de la -7 la 0 este 7" },
              { label: "(-5)+3 = -2", value: "5-3=2, semnul: minus câștigă (5>3)" },
              { label: "7-(-4) = 11", value: "7+4=11 (minus cu minus = plus)" },
            ],
            exercise: "Calculează: (-8)+3=__ | (-4)+(-6)=__ | 7-(-3)=__ | (-5)×(-2)=__",
          },
        ],
      },
      {
        title: "Biologie – Celula și organismul",
        description: "Celula – unitatea de bază a vieții",
        topics: ["Ce este celula?", "Celula vegetală vs animală", "Țesuturi, organe, sisteme", "Funcțiile vitale"],
        pages: [
          {
            title: "Celula – unitatea de bază a vieții",
            explanation: "Celula este cea mai mică unitate vie. Toate ființele vii sunt alcătuite din celule. Unele organisme sunt unicelulare (o singură celulă), altele pluricelulare (milioane de celule).",
            keyPoints: ["Celula are: membrană, citoplasmă, nucleu", "Nucleul conține informația genetică (ADN)", "Celula vegetală are și perete celular + cloroplaste", "Celulele se înmulțesc prin diviziune"],
            examples: [
              { label: "Unicelulare", value: "Amiba, parameciul, bacteriile" },
              { label: "Pluricelulare", value: "Plantele, animalele, omul" },
              { label: "Cloroplaste", value: "Organite care fac fotosinteza (la plante)" },
            ],
            exercise: "Desenează o celulă animală și una vegetală. Care sunt diferențele principale?",
          },
          {
            title: "Organizarea corpului uman",
            explanation: "Celulele se grupează în țesuturi → organe → sisteme. Corpul uman are sisteme specializate care lucrează împreună.",
            keyPoints: ["Celule → Țesuturi (musculare, osoase, nervoase)", "Țesuturi → Organe (inimă, plămân, stomac)", "Organe → Sisteme (digestiv, respirator, circulator)", "Sisteme → Organism (corpul uman în totalitate)"],
            examples: [
              { label: "Sistemul digestiv", value: "Gură → Esofag → Stomac → Intestine" },
              { label: "Sistemul respirator", value: "Nas → Trahee → Bronhii → Plămâni" },
              { label: "Sistemul circulator", value: "Inimă → Artere → Vene → Capilare" },
            ],
            exercise: "Listează 3 organe pentru fiecare sistem: digestiv / respirator / circulator.",
          },
        ],
      },
      {
        title: "Geografie – Europa și România",
        description: "Continentul european, poziția și caracteristicile României",
        topics: ["Europa – caracteristici generale", "Statele Europei", "România în Europa", "Relieful și clima Europei"],
        pages: [
          {
            title: "Continentul Europa",
            explanation: "Europa este un continent relativ mic (al treilea cel mai dens populat), cu o geografie variată: munți (Alpi, Pirineei, Carpați), câmpii (Câmpia Europei), peninsule și insule.",
            keyPoints: ["Europa – 44 de state independente", "Cel mai mare stat: Rusia (parțial în Asia)", "Cel mai mic stat: Vatican (0.44 km²)", "Cel mai înalt vârf: Mont Blanc (4808m) – Alpii", "Cel mai lung fluviu: Volga (3690km)"],
            examples: [
              { label: "Peninsula Iberică", value: "Spania, Portugalia" },
              { label: "Peninsula Scandinavă", value: "Norvegia, Suedia" },
              { label: "Marea Mediterană", value: "Marea interioară – Italia, Grecia" },
            ],
            exercise: "Pe harta Europei, identifică: Alpii, Rinul, Dunărea, Mediterana, Marea Nordului.",
          },
          {
            title: "România în Europa",
            explanation: "România este situată în centrul Europei, la răscrucea dintre Europa Centrală și de Sud-Est. Este membră a Uniunii Europene din 2007 și a NATO din 2004.",
            keyPoints: ["Suprafață: 238.397 km² (al 12-lea în Europa)", "Populație: ~19 milioane locuitori", "Capitala: București (~2 milioane loc.)", "Vecini: Bulgaria, Serbia, Ungaria, Ucraina, Moldova", "UE din 2007, NATO din 2004"],
            examples: [
              { label: "Moneda", value: "Leul românesc (RON)" },
              { label: "Limita de vest", value: "Ungaria și Serbia" },
              { label: "Ieșire la mare", value: "Marea Neagră (246 km coastă)" },
            ],
            exercise: "Numește toate țările vecine cu România și capitalele lor.",
          },
        ],
      },
      {
        title: "Numere raționale",
        description: "Fracții ordinare și zecimale",
        topics: ["Fracții ordinare și zecimale", "Conversia fracție-zecimal", "Operații cu zecimale", "Procente"],
        pages: [
          {
            title: "Fracții zecimale",
            explanation: "O fracție zecimală are numitorul o putere a lui 10 (10, 100, 1000...). Se scrie cu virgulă: 1/10 = 0,1; 1/100 = 0,01; 1/4 = 25/100 = 0,25.",
            keyPoints: ["1/10 = 0,1 (zecimi)", "1/100 = 0,01 (sutimi)", "1/1000 = 0,001 (miimi)", "Conversia: 3/4 = 75/100 = 0,75", "Adunare: aliniem virgulele"],
            examples: [
              { label: "0,5 = 5/10 = 1/2", value: "Jumătate" },
              { label: "0,25 = 25/100 = 1/4", value: "Un sfert" },
              { label: "3,14", value: "Numărul π (aprox.)" },
            ],
            exercise: "Convertește: 3/4 = 0,__ | 7/10 = 0,__ | 1/5 = 0,__",
          },
        ],
      },
    ],
    quiz: [
      { q: "Ce este intersecția A∩B?", options: ["Elementele din A sau B", "Elementele comune", "Elementele doar din A", "Toate elementele"], answer: 1 },
      { q: "Care este modulul numărului -7?", options: ["-7", "7", "0", "1/7"], answer: 1 },
      { q: "Cât face (-5)+3?", options: ["-8", "-2", "2", "8"], answer: 1 },
      { q: "Fie A={1,2,3} și B={2,3,4}. Ce este A∪B?", options: ["{2,3}", "{1,2,3,4}", "{1,4}", "{1,2,3,4,5}"], answer: 1 },
      { q: "Cât face 7-(-4)?", options: ["3", "11", "-11", "-3"], answer: 1 },
      { q: "Celula vegetală se deosebește de cea animală prin:", options: ["Nucleu", "Citoplasma", "Perete celular și cloroplaste", "Membrana"], answer: 2 },
      { q: "România este membră UE din:", options: ["2000", "2004", "2007", "2010"], answer: 2 },
      { q: "1/4 ca zecimal este:", options: ["0,14", "0,4", "0,25", "0,50"], answer: 2 },
      { q: "Cel mai înalt vârf din Europa (Alpi) este:", options: ["Vârful Moldoveanu", "Mont Blanc", "Elbrus", "Zugspitze"], answer: 1 },
      { q: "Ce este cardinalul unei mulțimi?", options: ["Suma elementelor", "Numărul elementelor", "Produsul elementelor", "Cel mai mare element"], answer: 1 },
      { q: "Sistemul digestiv cuprinde:", options: ["Plămânii", "Inima și arterele", "Gura, esofagul, stomacul", "Creierul și nervii"], answer: 2 },
      { q: "(-3) × (-4) = ?", options: ["-12", "12", "7", "-7"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Numere întregi",
        description: "Operații cu numere întregi",
        intro: "În această fișă exersăm operațiile cu numere întregi: adunare, scădere și modul.",
        exercises: [
          {
            instruction: "Calculează modulul:",
            items: ["|-8| = __", "|5| = __", "|0| = __", "|-15| = __", "|+3| = __"],
            hint: "Modulul este întotdeauna pozitiv sau zero.",
          },
          {
            instruction: "Adunare cu numere întregi:",
            items: ["(-5) + 3 = __", "7 + (-9) = __", "(-4) + (-6) = __", "(-3) + 3 = __", "(-12) + 5 = __"],
            hint: "Numere de același semn: adunăm valorile, păstrăm semnul. Semne diferite: scădem valorile, păstrăm semnul celui mai mare.",
          },
          {
            instruction: "Scădere cu numere întregi (transformă în adunare):",
            items: ["(-8) - (-3) = (-8) + 3 = __", "5 - 9 = __", "(-2) - 4 = __", "6 - (-7) = __"],
          },
          {
            instruction: "Înmulțire și împărțire cu întregi:",
            items: ["(-3) × 4 = __", "(-5) × (-6) = __", "(-20) ÷ 4 = __", "(-36) ÷ (-9) = __"],
            hint: "Semne identice → rezultat pozitiv. Semne diferite → rezultat negativ.",
          },
          {
            instruction: "Problema: La munte, temperatura dimineața este -3°C. Crește cu 8 grade ziua, scade cu 12 grade seara față de temperatua de prânz.",
            items: ["Temperatura la prânz: -3 + 8 = __", "Temperatura seara: __ - 12 = __"],
          },
        ],
        tip: "Profesori: Folosiți axa numerelor pe tablă pentru a vizualiza adunările și scăderile cu numere negative.",
      },
      {
        title: "Fișă – Mulțimi",
        description: "Operații cu mulțimi și diagrame Venn",
        intro: "Mulțimile ne ajută să organizăm informațiile. Astăzi lucrăm cu reuniunea, intersecția și diagrame Venn.",
        exercises: [
          {
            instruction: "Fie A = {1, 2, 3, 4, 5} și B = {3, 4, 5, 6, 7}. Calculează:",
            items: ["A ∪ B = {__}", "A ∩ B = {__}", "card(A) = __", "card(B) = __", "Sunt A și B disjuncte? __"],
          },
          {
            instruction: "Determină dacă elementele aparțin mulțimii A = {x | x este număr par, 0 ≤ x ≤ 20}:",
            items: ["4 ∈ A? __", "7 ∈ A? __", "18 ∈ A? __", "21 ∈ A? __"],
            hint: "Numerele pare: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20",
          },
          {
            instruction: "Problema de viață reală: 30 de elevi – 18 fac sport, 15 fac muzică, 8 fac și sport și muzică. Câți fac DOAR sport? Câți fac DOAR muzică? Câți nu fac nici una?",
            items: ["Doar sport: 18 - 8 = __ elevi", "Doar muzică: 15 - 8 = __ elevi", "Sport SAU muzică (reuniune): 18+15-8 = __", "Nici una: 30 - __ = __"],
            hint: "Diagrama Venn ajută vizual la aceste probleme.",
          },
        ],
        tip: "Profesori: Diagramele Venn pot fi ilustrate cu cercuri mari pe tablă sau pe podea cu sfori.",
      },
      {
        title: "Fișă – Biologie: Celula și Corpul Uman",
        description: "Celula, sistemele corpului uman",
        intro: "Corpul nostru este o mașinărie minunată! Să descoperim cum funcționează.",
        exercises: [
          {
            instruction: "Completează tabelul comparativ celulă animală vs vegetală:",
            items: ["Membrană celulară: prezentă la __", "Perete celular: prezent la __", "Nucleu: prezent la __", "Cloroplaste: prezente la __", "Vacuolă mare: la __"],
          },
          {
            instruction: "Organizează în ordine crescătoare (de la mic la mare):",
            items: ["Organism, Organ, Celulă, Sistem, Țesut → __ → __ → __ → __ → __"],
            hint: "De la cel mai mic: Celulă → Țesut → Organ → Sistem → Organism",
          },
          {
            instruction: "Asociază organul cu sistemul din care face parte:",
            items: ["Stomacul → sistemul __", "Plămânul → sistemul __", "Inima → sistemul __", "Creierul → sistemul __", "Rinichiul → sistemul __"],
          },
          {
            instruction: "Explică cu cuvintele tale:",
            items: ["Ce este fotosinteza? → _______________", "De ce avem nevoie de oxigen? → _______________", "Ce face inima? → _______________"],
          },
        ],
        tip: "Profesori: Modelele anatomice și imaginile colorate ajută elevii să înțeleagă structura corpului. Activitățile interactive online pot fi foarte utile.",
      },
    ],
  },

  /* ═══════════════════════════ CLASA VI ═══════════════════════════ */
  {
    grade: 6,
    label: "Clasa VI",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    ring: "ring-cyan-200",
    studyItems: [
      {
        title: "Geometrie plană",
        description: "Figuri geometrice, arii și perimetre",
        topics: ["Triunghi – tipuri și proprietăți", "Patrulater – tipuri", "Aria și perimetrul", "Teorema lui Pitagora"],
        pages: [
          {
            title: "Triunghiuri – tipuri și proprietăți",
            explanation: "Triunghiul este o figură geometrică cu 3 laturi și 3 unghiuri. Suma unghiurilor unui triunghi este întotdeauna 180°.",
            keyPoints: ["3 laturi, 3 vârfuri, 3 unghiuri", "Suma unghiurilor = 180°", "Triunghi echilateral: 3 laturi egale, unghi 60°", "Triunghi dreptunghic: un unghi = 90°", "Triunghi isoscel: 2 laturi egale"],
            examples: [
              { label: "Perimetru", value: "P = a + b + c (suma laturilor)" },
              { label: "Arie", value: "A = (b × h) / 2 (baza × înălțimea / 2)" },
              { label: "Exemplu", value: "b=8cm, h=6cm → A = (8×6)/2 = 24 cm²" },
            ],
            exercise: "Calculează perimetrul și aria unui triunghi cu laturile 5, 12, 13 cm și înălțimea pe latura de 12 cm egală cu 5 cm.",
          },
          {
            title: "Patrulaterul – tipuri și formule",
            explanation: "Patrulaterul este o figură cu 4 laturi. Tipuri principale: dreptunghiul, pătratul, rombul, paralelogramul, trapezul.",
            keyPoints: ["Pătrat: 4 laturi egale, 4 unghiuri drepte – A=l²", "Dreptunghi: laturi opuse egale, 4 unghiuri drepte – A=L×l", "Romb: 4 laturi egale, diagonalele perpendiculare – A=d1×d2/2", "Paralelogram: laturi opuse paralele și egale – A=b×h"],
            examples: [
              { label: "Pătrat l=5cm", value: "P=4×5=20cm, A=5²=25cm²" },
              { label: "Dreptunghi 8×6", value: "P=2(8+6)=28cm, A=8×6=48cm²" },
              { label: "Romb d1=10, d2=6", value: "A=10×6/2=30cm²" },
            ],
            exercise: "Calculează aria și perimetrul: dreptunghi 7×4cm, pătrat cu latura 9cm.",
          },
          {
            title: "Teorema lui Pitagora",
            explanation: "Într-un triunghi dreptunghic, catetele (a și b) și ipotenuza (c) respectă relația: a² + b² = c². Ipotenuza este latura opusă unghiului drept și este cea mai lungă.",
            keyPoints: ["a² + b² = c² (a, b = catete, c = ipotenuza)", "Ipotenuza este cea mai lungă latură", "Tripleta pitagoreică 3-4-5: 9+16=25 ✓", "Se folosește pentru a calcula latura lipsă"],
            examples: [
              { label: "Catete 3, 4", value: "c² = 3²+4² = 9+16 = 25 → c = 5" },
              { label: "Catete 5, 12", value: "c² = 25+144 = 169 → c = 13" },
              { label: "Cateta lipsă", value: "a²= c²-b² = 100-36 = 64 → a=8" },
            ],
            exercise: "Calculează: catete 6 și 8 → ipotenuza = __ | ipotenuza 10, cateta 8 → cealaltă cateta = __",
          },
        ],
      },
      {
        title: "Biologie – Sisteme ale corpului",
        description: "Sistemul osos, muscular și digestiv",
        topics: ["Sistemul osos", "Sistemul muscular", "Sistemul digestiv", "Igiena și sănătatea"],
        pages: [
          {
            title: "Sistemul osos și muscular",
            explanation: "Scheletul este structura osoasă care susține corpul. Mușchii, prinși de oase prin tendoane, permit mișcarea. Împreună formează sistemul locomotor.",
            keyPoints: ["Scheletul adult: 206 oase", "Articulațiile unesc oasele și permit mișcarea", "Mușchii se contractă și se relaxează", "Tendoanele leagă mușchii de oase", "Ligamentele leagă oasele între ele"],
            examples: [
              { label: "Oase lungi", value: "Femurul (cel mai lung), humerusul, tibia" },
              { label: "Articulații", value: "Genunchiul (balama), șoldul (bilă+soclu)" },
              { label: "Cel mai mic os", value: "Scărița (urechea internă – 3mm)" },
            ],
            exercise: "Identifică: cel mai lung os al corpului, cel mai mic os, articulația de la genunchi.",
          },
          {
            title: "Sistemul digestiv",
            explanation: "Digestia transformă alimentele în substanțe nutritive care trec în sânge. Traseul: Gură → Esofag → Stomac → Intestin subțire → Intestin gros → Rect → Anus.",
            keyPoints: ["Gura: mestecăm și amestecăm cu salivă", "Esofagul: transportă alimentele la stomac", "Stomacul: sucul gastric descompune alimentele", "Intestinul subțire: absorbția nutrienților în sânge", "Intestinul gros: absorbția apei, eliminarea resturilor"],
            examples: [
              { label: "Digestia durează", value: "~24-72 ore de la ingestie la eliminare" },
              { label: "Intestinul subțire", value: "~6-7 m lungime – cel mai lung organ tubular" },
              { label: "Ficatul", value: "Produce bilă, detoxifică sângele, metabolizează nutrienții" },
            ],
            exercise: "Descrie traseul unui sandviș prin sistemul digestiv, pas cu pas.",
          },
        ],
      },
      {
        title: "Geografie – Continentele lumii",
        description: "Cele 7 continente – caracteristici esențiale",
        topics: ["Africa – cel mai cald continent", "Asia – cel mai mare continent", "America de Nord și Sud", "Oceania și Antarctica"],
        pages: [
          {
            title: "Continentele – privire generală",
            explanation: "Pământul are 7 continente: Asia, Africa, America de Nord, America de Sud, Antarctica, Europa, Oceania/Australia. Asia este cel mai mare, Australia/Oceania cel mai mic (ca suprafață locuit).",
            keyPoints: ["Asia – 44 milioane km², 60% din populația lumii", "Africa – al 2-lea ca suprafață, cel mai mult în zona tropicală", "America de Nord și Sud – despărțite de Canalul Panama", "Antarctica – cea mai rece, acoperită de gheață", "Oceania – Australia + insule din Pacific"],
            examples: [
              { label: "Cel mai înalt munte", value: "Everest, Asia (8849m)" },
              { label: "Cel mai mare deșert", value: "Sahara, Africa (9 mil km²)" },
              { label: "Cel mai lung fluviu", value: "Nil, Africa (6650km) / Amazon, S. America" },
            ],
            exercise: "Completează tabelul: fiecare continent – capitala țării celei mai mari, un fluviu important, cel mai înalt munte.",
          },
          {
            title: "Clima și vegetația lumii",
            explanation: "Clima variază de la ecuator (tropical/cald) la poli (polar/rece). Zonele climatice determină vegetația și fauna caracteristică.",
            keyPoints: ["Zona ecuatorială: pădure tropicală densă (Amazon, Congo)", "Zona temperată: păduri de foioase, stepă (Europa, America de N)", "Zona aridă: deșerturi (Sahara, Atacama, Gobi)", "Zona polară: gheață, tundră (Antarctica, Arctica)"],
            examples: [
              { label: "Tropical", value: "Cald tot anul, ploi abundente → junglă (papagali, jaguari)" },
              { label: "Temperat", value: "Sezoane distincte → păduri de stejar, fag, ursul brun" },
              { label: "Polar", value: "Frig extrem → tundra, ursul polar, focile" },
            ],
            exercise: "Explică de ce în România avem 4 anotimpuri. Ce zonă climatică este România?",
          },
        ],
      },
      {
        title: "Istorie – Evul Mediu",
        description: "Europa medievală, Bizanțul și cruciadele",
        topics: ["Feudalismul", "Imperiul Bizantin", "Cruciadele", "Cultura medievală"],
        pages: [
          {
            title: "Feudalismul european",
            explanation: "Feudalismul a fost sistemul social și economic dominant în Europa medievală (sec. V-XV). Societatea era organizată ierarhic: regele → seniori → vasali → iobagi.",
            keyPoints: ["Regele deținea toată puterea", "Seniorii – nobili cu domenii proprii", "Vasalii – nobili mai mici, supuși seniorilor", "Iobagii/Șerbii – țărani legați de pământ", "Castele – reședințele seniorilor, centru de putere"],
            examples: [
              { label: "Piramida feudală", value: "Rege → Nobili → Cavaleri → Iobagi" },
              { label: "Sistemul feudal", value: "Seniorul proteja vasalul, vasalul îi era fidel" },
              { label: "Marea Cartă (1215)", value: "Anglia – primele drepturi pentru nobili față de rege" },
            ],
            exercise: "Descrie piramida feudală: cine se afla la vârf, cine la bază? Care erau drepturile și obligațiile fiecărei clase?",
          },
          {
            title: "Imperiul Bizantin și Cruciadele",
            explanation: "Imperiul Bizantin (330-1453) era continuatorul Imperiului Roman de Răsărit, cu capitala la Constantinopol. Cruciadele (1096-1291) au fost expediții militare ale Europei Occidentale pentru a recupera Locurile Sfinte.",
            keyPoints: ["Constantinopol = Istanbul de azi", "1453 – căderea Constantinopolului (cucerirea otomană)", "8 cruciade principale (1096-1291)", "Cruciadele au conectat Europa cu Orientul", "Au accelerat schimburile comerciale și culturale"],
            examples: [
              { label: "Iustinian I", value: "Mare împărat bizantin, a reformat legile, a construit Sf. Sofia" },
              { label: "Prima Cruciadă", value: "1096-1099 – cucerirea Ierusalimului de cavalerii creștini" },
              { label: "Efecte cruciade", value: "Comerț cu mirodenii, mătase; răspândirea ciumei" },
            ],
            exercise: "Prezintă succint: ce a fost Imperiul Bizantin și de ce au pornit cruciadele?",
          },
        ],
      },
      {
        title: "Rapoarte și proporții",
        description: "Rapoarte, proporții și regulile de trei simple",
        topics: ["Rapoarte și fracții", "Proporția – definiție", "Regula de trei simplă", "Procentele"],
        pages: [
          {
            title: "Rapoarte și proporții",
            explanation: "Raportul a:b (sau a/b) arată de câte ori a este mai mare decât b. Proporția este egalitatea a două rapoarte: a/b = c/d. Dacă a/b = c/d, atunci a×d = b×c.",
            keyPoints: ["Raport: a:b sau a/b", "Proporție: a/b = c/d ↔ a×d = b×c (produsele diagonale sunt egale)", "Termenul lipsă: x/4 = 6/8 → x×8=4×6 → x=3", "Procent: 25% = 25/100 = 0,25"],
            examples: [
              { label: "Raport", value: "2:3 citit 'doi la trei' sau '2 din 3'" },
              { label: "Proporție", value: "2/3 = 4/6 (2×6 = 3×4 = 12 ✓)" },
              { label: "25% din 80", value: "25/100 × 80 = 0,25 × 80 = 20" },
            ],
            exercise: "Rezolvă: x/5 = 4/10 → x=__ | 15% din 200 = __ | 3:4 = 12:__",
          },
        ],
      },
    ],
    quiz: [
      { q: "Care este formula ariei triunghiului?", options: ["a × b", "(b × h) / 2", "b × h", "a + b + c"], answer: 1 },
      { q: "Suma unghiurilor unui triunghi este:", options: ["90°", "180°", "270°", "360°"], answer: 1 },
      { q: "Catete 3 și 4 → ipotenuza =?", options: ["5", "7", "6", "12"], answer: 0 },
      { q: "Câte oase are scheletul unui adult?", options: ["106", "206", "306", "406"], answer: 1 },
      { q: "Perimetrul unui triunghi cu laturile 5, 7, 9 cm este:", options: ["19 cm", "21 cm", "63 cm", "18 cm"], answer: 1 },
      { q: "Cel mai lung organ din sistemul digestiv este:", options: ["Stomacul", "Esofagul", "Intestinul subțire", "Colonul"], answer: 2 },
      { q: "Cel mai înalt munte din lume este:", options: ["Mont Blanc", "Kilimanjaro", "Everest", "Aconcagua"], answer: 2 },
      { q: "Feudalismul era un sistem:", options: ["Economic și politic", "Social și economic și politic", "Religios", "Agricol"], answer: 1 },
      { q: "25% din 120 este:", options: ["25", "30", "40", "60"], answer: 1 },
      { q: "Perimetrul unui pătrat cu latura 6 cm:", options: ["12 cm", "24 cm", "36 cm", "18 cm"], answer: 1 },
      { q: "Căderea Constantinopolului a avut loc în:", options: ["1348", "1453", "1492", "1588"], answer: 1 },
      { q: "Proporția a/b = c/d este corectă dacă:", options: ["a+b = c+d", "a-b = c-d", "a×d = b×c", "a×b = c×d"], answer: 2 },
    ],
    worksheets: [
      {
        title: "Fișă – Arii și perimetre",
        description: "Calculăm arii și perimetre pentru figuri geometrice",
        intro: "Astăzi calculăm arii și perimetre. Rețineți formulele și aplicați-le cu atenție!",
        exercises: [
          {
            instruction: "Calculează perimetrul fiecărei figuri:",
            items: ["Pătrat cu latura 6 cm: P = 4 × __ = __ cm", "Dreptunghi cu l=8cm, L=12cm: P = 2×(__ + __) = __ cm", "Triunghi cu laturile 5, 7, 9 cm: P = __ cm"],
          },
          {
            instruction: "Calculează aria fiecărei figuri:",
            items: ["Pătrat cu latura 7 cm: A = __ × __ = __ cm²", "Dreptunghi cu l=5cm, L=10cm: A = __ × __ = __ cm²", "Triunghi cu b=8cm, h=6cm: A = (__ × __)/2 = __ cm²"],
            hint: "Formulele: Pătrat: l², Dreptunghi: l×L, Triunghi: (b×h)/2",
          },
          {
            instruction: "Aplică Teorema lui Pitagora:",
            items: ["Catete 6, 8 → ipotenuza c = √(36+64) = √__ = __", "Catete 5, 12 → ipotenuza = __", "Ipotenuza 13, cateta 5 → cealaltă cateta = √(169-25) = __"],
          },
          {
            instruction: "Problema: Un teren dreptunghiular are lungimea 25m și lățimea 15m. Calculați: perimetrul, aria și costul gardului dacă 1m costă 80 lei.",
            items: ["P = 2×(25+15) = __ m", "A = 25 × 15 = __ m²", "Cost gard = __ × 80 = __ lei"],
          },
        ],
        tip: "Profesori: Cereți elevilor să deseneze figurile și să noteze dimensiunile înainte de calcul.",
      },
      {
        title: "Fișă – Biologie: Sistemele corpului",
        description: "Sistemul osos, muscular și digestiv",
        intro: "Corpul nostru funcționează perfect datorită sistemelor care lucrează împreună. Să le cunoaștem!",
        exercises: [
          {
            instruction: "Completează informațiile despre schelet:",
            items: ["Numărul oaselor adultului: __", "Cel mai lung os: __, localizat: __", "Cel mai mic os: __, localizat: __", "Articulația de la genunchi se numește: __"],
          },
          {
            instruction: "Ordonează etapele digestiei (de la 1 la 7):",
            items: ["__ Stomac (sucul gastric descompune alimentele)", "__ Gura (mestecăm, salivă)", "__ Intestin gros (absorbția apei)", "__ Esofag (transportul bolului alimentar)", "__ Intestin subțire (absorbția nutrienților)", "__ Rect și anus (eliminare)", "__ Ficat/Pancreas (produc enzime digestive)"],
          },
          {
            instruction: "Explică rolul fiecărui organ digestiv:",
            items: ["Gura: _______________", "Stomacul: _______________", "Intestinul subțire: _______________", "Ficatul: _______________"],
          },
          {
            instruction: "Igiena sistemelor: completează cu sfaturi de sănătate:",
            items: ["Pentru oase sănătoase: consum de __ și __ + exerciții fizice", "Pentru sistemul digestiv: mânâncă __, bea __, evită __"],
          },
        ],
        tip: "Profesori: Modelele anatomice sau imaginile detaliate ajută la înțelegerea poziției și aspectului organelor.",
      },
      {
        title: "Fișă – Rapoarte, proporții și procente",
        description: "Calcule matematice cu rapoarte și procente",
        intro: "Rapoartele și procentele sunt esențiale în viața de zi cu zi: reduceri, statistici, rețete!",
        exercises: [
          {
            instruction: "Calculează rapoartele (simplifică):",
            items: ["12:8 = __ : __ (simplificat)", "15:25 = __ : __", "24:36 = __ : __"],
            hint: "Simplificăm împărțind ambii termeni prin CMMD.",
          },
          {
            instruction: "Rezolvă proporțiile (găsește termenul lipsă x):",
            items: ["x/5 = 4/10 → x = __", "3/x = 9/15 → x = __", "6/8 = x/20 → x = __"],
            hint: "Produsele diagonale sunt egale: a×d = b×c.",
          },
          {
            instruction: "Calculează procentele:",
            items: ["20% din 150 = __", "35% din 80 = __", "15% din 200 = __", "75% din 40 = __"],
            hint: "x% din N = (x/100) × N",
          },
          {
            instruction: "Probleme practice:",
            items: ["Un magazin oferă 30% reducere la un produs de 250 lei. Prețul nou: __", "Dintr-o clasă de 28 elevi, 75% sunt prezenți. Câți elevi sunt prezenți? __", "Maria câștigă 3500 lei. Cheltuie 40% pe chirie. Cât cheltuie? __"],
          },
        ],
        tip: "Profesori: Procentele și proporțiile au numeroase aplicații practice. Folosiți exemple din viața reală (reduceri, statistici).",
      },
    ],
  },

  /* ═══════════════════════════ CLASA VII ═══════════════════════════ */
  {
    grade: 7,
    label: "Clasa VII",
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    studyItems: [
      {
        title: "Ecuații de gradul I",
        description: "Rezolvăm ecuații și sisteme de ecuații",
        topics: ["Ce este o ecuație?", "Proprietățile egalității", "Rezolvarea ecuațiilor", "Sisteme de ecuații"],
        pages: [
          {
            title: "Ce este o ecuație de gradul I?",
            explanation: "O ecuație de gradul I cu o necunoscută (x) este o relație de forma ax + b = c, unde a ≠ 0. Scopul este să aflăm valoarea necunoscutei x care satisface egalitatea.",
            keyPoints: ["Forma generală: ax + b = c", "Soluția este valoarea x care face egalitatea adevărată", "Proprietăți: putem aduna/scădea același număr din ambii membri", "Putem înmulți/împărți ambii membri cu același număr ≠ 0"],
            examples: [
              { label: "2x + 6 = 14", value: "2x = 14-6 = 8 → x = 8/2 = 4 | Verificare: 2×4+6 = 14 ✓" },
              { label: "3x - 5 = 10", value: "3x = 10+5 = 15 → x = 15/3 = 5 ✓" },
              { label: "5x + 3 = 3x + 11", value: "5x-3x = 11-3 → 2x=8 → x=4 ✓" },
            ],
            exercise: "Rezolvă și verifică: 4x - 8 = 12 | 3(x+2) = 18 | 7x + 5 = 5x + 15",
          },
          {
            title: "Sisteme de ecuații de gradul I",
            explanation: "Un sistem de două ecuații cu două necunoscute (x, y) se rezolvă prin metoda substituției sau adunării/eliminării.",
            keyPoints: ["Metoda substituției: exprimăm x în funcție de y (sau invers)", "Metoda adunării: adunăm ecuațiile pentru a elimina o necunoscută", "Verificăm soluția în AMBELE ecuații", "Sistemul poate avea o soluție, niciuna sau infinit de soluții"],
            examples: [
              { label: "x+y=10 și x-y=2", value: "Adunăm: 2x=12 → x=6, y=4 | Verif: 6+4=10✓, 6-4=2✓" },
              { label: "y=2x și x+y=9", value: "Substituim: x+2x=9 → 3x=9 → x=3, y=6" },
            ],
            exercise: "Rezolvă sistemul: x+y=15 și x-y=3. Verifică soluția.",
          },
        ],
      },
      {
        title: "Fizică – Mișcarea și Forțele",
        description: "Mișcarea uniformă, forțe și legile lui Newton",
        topics: ["Mișcarea uniformă", "Viteza medie", "Forța și masa", "Legile lui Newton"],
        pages: [
          {
            title: "Mișcarea uniformă",
            explanation: "Un corp este în mișcare dacă își schimbă poziția față de un reper. Mișcarea uniformă = viteza constantă pe tot parcursul. Formula: d = v × t.",
            keyPoints: ["d = v × t (distanță = viteză × timp)", "v = d/t (viteză = distanță/timp)", "t = d/v (timp = distanță/viteză)", "Unități: d [m], v [m/s sau km/h], t [s sau h]", "1 m/s = 3,6 km/h"],
            examples: [
              { label: "v=10m/s, t=5s", value: "d = 10 × 5 = 50 m" },
              { label: "d=100m, t=10s", value: "v = 100/10 = 10 m/s = 36 km/h" },
              { label: "d=300km, v=60km/h", value: "t = 300/60 = 5 ore" },
            ],
            exercise: "Un tren parcurge 240 km în 3 ore. Calculează viteza. La această viteză, în cât timp parcurge 400 km?",
          },
          {
            title: "Forța și Legile lui Newton",
            explanation: "Forța este acțiunea care poate schimba starea de mișcare a unui corp. Se măsoară în Newtoni [N]. Legile lui Newton descriu relația dintre forță, masă și accelerație.",
            keyPoints: ["Legea I: Un corp rămâne în repaus/mișcare uniformă dacă nu e acționat de o forță", "Legea II: F = m × a (forța = masa × accelerația)", "Legea III: Acțiunea = Reacțiunea (egale, opuse)", "Greutatea: G = m × g, g ≈ 10 m/s²"],
            examples: [
              { label: "F = m × a", value: "m=5kg, a=3m/s² → F=15N" },
              { label: "Greutatea", value: "m=70kg → G=70×10=700N" },
              { label: "Legea III", value: "Dacă lovești o masă cu 10N, ea te 'lovește' cu 10N înapoi" },
            ],
            exercise: "Calculează: forța necesară să accelereze un corp de 8 kg cu a=5m/s² | Greutatea unui copil de 50 kg.",
          },
        ],
      },
      {
        title: "Chimie – Substanțele și materia",
        description: "Substanțe pure, amestecuri și reacții chimice simple",
        topics: ["Materie și substanță", "Substanțe pure și amestecuri", "Atomul și molecula", "Reacții chimice simple"],
        pages: [
          {
            title: "Materie, substanță, corp",
            explanation: "Materia este tot ce are masă și ocupă spațiu. Substanța este tipul de materie (apă, fier, sare). Corpul este un obiect concret format dintr-o substanță.",
            keyPoints: ["Corp = obiect concret (o sticlă cu apă)", "Substanță = tipul de materie (apa, sticla)", "Materie = tot ce are masă și volum", "Stări de agregare: solidă, lichidă, gazoasă", "Plasma = a 4-a stare (stelele)"],
            examples: [
              { label: "Solidă", value: "Gheata (apă solidă) – formă proprie, volum fix" },
              { label: "Lichidă", value: "Apa – formă variabilă, volum fix" },
              { label: "Gazoasă", value: "Aburul (apă gazeoasă) – formă și volum variabile" },
            ],
            exercise: "Clasifică: o lingură de fier, zahărul cristal, apa de mare, aerul, mercurul lichid.",
          },
          {
            title: "Atomul, elementul chimic, molecula",
            explanation: "Atomul este cea mai mică particulă a unui element chimic. Un element chimic = toți atomii de același tip. Molecula = unire de atomi. Compusul chimic = moleculă formată din atomi diferiți.",
            keyPoints: ["Atom = protoni + neutroni (nucleu) + electroni (înveliș)", "Element: H, C, O, N, Fe, Cu, Au... (118 elemente)", "Moleculă: H₂, O₂, H₂O, CO₂", "Substanță pură: un singur tip de moleculă", "Amestec: mai multe substanțe (aer, sare+apă)"],
            examples: [
              { label: "H₂O", value: "Molecula de apă: 2 atomi H + 1 atom O" },
              { label: "CO₂", value: "Dioxid de carbon: 1 C + 2 O – gazul respirat" },
              { label: "NaCl", value: "Clorura de sodiu = sarea de bucătărie" },
            ],
            exercise: "Identifică elementele și numărul de atomi: H₂SO₄, Ca(OH)₂, C₆H₁₂O₆ (glucoza).",
          },
        ],
      },
      {
        title: "Geografie – România – Resurse și economie",
        description: "Resursele naturale, agricultura și industria României",
        topics: ["Resursele solului și subsolului", "Agricultura română", "Industria", "Transporturi și turism"],
        pages: [
          {
            title: "Resursele naturale ale României",
            explanation: "România este bogată în resurse naturale: petrol și gaze (primul producător din Europa, sec. XX), cărbune, sare (zăcăminte mari), metale neferoase (aur, argint – Munții Apuseni).",
            keyPoints: ["Petrol: câmpii subcarpatice (Ploiești – 'Orașul aurului negru')", "Gaze naturale: Transilvania", "Sare: Praid (Harghita), Slănic Prahova", "Aur și argint: Munții Apuseni (Roșia Montană)", "Păduri: 30% din suprafața României"],
            examples: [
              { label: "Petrol", value: "România – prima rafinărie din lume (1856, Ploiești)" },
              { label: "Sare", value: "Minele de sare – turism subteran (Turda, Praid)" },
              { label: "Lemn", value: "Pădurile carpatice – exporturi și produse din lemn" },
            ],
            exercise: "Pe o hartă, marchează principalele zone cu resurse: petrol (Subcarpați), gaze (Transilvania), sare (Harghita, Prahova).",
          },
        ],
      },
      {
        title: "Limba română – Textul narativ",
        description: "Structura și analiza textelor narative literare",
        topics: ["Textul narativ – definiție", "Naratorul și perspectiva", "Personajele și caracterizarea", "Figuri de stil"],
        pages: [
          {
            title: "Textul narativ și naratorul",
            explanation: "Textul narativ prezintă o succesiune de fapte/acțiuni. Naratorul este 'vocea' care povestește. Poate fi la persoana I (participant) sau persoana a III-a (omniscient).",
            keyPoints: ["Narațiunea = povestire cu fapte, personaje, timp, loc", "Narator la persoana I: 'eu' (personaj în acțiune)", "Narator la persoana a III-a: privitor exterior (omniscient)", "Momentele subiectului: expozițiune, intrigă, desfășurare, punct culminant, deznodământ"],
            examples: [
              { label: "Pers. I", value: "Ion Creangă – 'Amintiri din copilărie': 'Era o zi frumoasă de vară când eu...'"},
              { label: "Pers. III", value: "Mihail Sadoveanu – 'Baltagul': 'Vitoria Lipan era o femeie...'"},
              { label: "Momentele", value: "Expozițiune: cadru + personaje → Intrigă: conflictul → ... → Deznodământ" },
            ],
            exercise: "Citește un fragment din 'Amintiri din copilărie'. Identifică: naratorul, personajele, locul, momentele subiectului.",
          },
          {
            title: "Figuri de stil",
            explanation: "Figurile de stil (literare) sunt modalități de exprimare artistică care înfrumusețează textul. Cele mai importante: comparația, metafora, personificarea, hiperbola, epitetul.",
            keyPoints: ["Epitet: 'frunze galbene' – adjectiv expresiv", "Comparație: 'ochi ca cerul' – cu 'ca, precum, ca și'", "Metaforă: 'luna – lampă de argint' – identificare imaginativă", "Personificare: 'vântul șoptea' – atribuim calități umane naturii", "Hiperbolă: exagerare: 'Am așteptat o veșnicie'"],
            examples: [
              { label: "Comparație", value: "Obrazul ei era roșu ca flacăra." },
              { label: "Metaforă", value: "Viața este un vis lung." },
              { label: "Personificare", value: "Toamna a venit să culce florile." },
            ],
            exercise: "Identifică figurile de stil: 'Codrul îl chema cu brațe verzi, soarele – un bulgăre de aur – apunea încet.'",
          },
        ],
      },
    ],
    quiz: [
      { q: "Soluția ecuației 2x + 6 = 14 este:", options: ["x=3", "x=4", "x=5", "x=2"], answer: 1 },
      { q: "Dacă x + y = 10 și x - y = 2, atunci x =", options: ["4", "6", "8", "5"], answer: 1 },
      { q: "Formula mișcării uniforme este:", options: ["d = v + t", "d = v × t", "v = d + t", "t = d × v"], answer: 1 },
      { q: "Legea a doua a lui Newton: F = ?", options: ["m + a", "m / a", "m × a", "a / m"], answer: 2 },
      { q: "Molecula de apă are formula:", options: ["H₂O₂", "HO", "H₂O", "H₃O"], answer: 2 },
      { q: "Ecuația 3(x+4) = 21 are soluția:", options: ["x=3", "x=5", "x=7", "x=9"], answer: 0 },
      { q: "Un corp de 10 kg greutatea sa este:", options: ["10 N", "100 N", "1 N", "1000 N"], answer: 1 },
      { q: "Sarea de bucătărie are formula chimică:", options: ["KCl", "NaOH", "NaCl", "Na₂O"], answer: 2 },
      { q: "Figura de stil 'vântul șoptea' este:", options: ["Epitet", "Comparație", "Metaforă", "Personificare"], answer: 3 },
      { q: "Un tren merge cu v=80km/h timp de 3h. Distanța parcursă:", options: ["160km", "240km", "320km", "83km"], answer: 1 },
      { q: "Rezolvând 5x = 35, x este:", options: ["5", "6", "7", "8"], answer: 2 },
      { q: "Prima rafinărie de petrol din lume a fost la:", options: ["Baku", "Texas", "Ploiești", "Moscova"], answer: 2 },
    ],
    worksheets: [
      {
        title: "Fișă – Ecuații de gradul I",
        description: "Rezolvăm ecuații pas cu pas",
        intro: "Rezolvați ecuațiile urmând pașii: izolați x, efectuați operațiile, verificați soluția!",
        exercises: [
          {
            instruction: "Rezolvă ecuațiile simple (pas cu pas):",
            items: ["3x - 5 = 10 → 3x = __ → x = __", "2(x + 4) = 16 → 2x + 8 = 16 → x = __", "4x + 7 = 27 → 4x = __ → x = __"],
            hint: "Izolați termenul cu x în membrul stâng.",
          },
          {
            instruction: "Rezolvă și verifică (înlocuiește x în ecuația inițială):",
            items: ["5x + 3 = 3x + 11 | Verificare: __", "6x - 4 = 2x + 12 | Verificare: __", "7(x - 2) = 3x + 6 | Verificare: __"],
            hint: "Aducem termenii cu x în stânga și constantele în dreapta.",
          },
          {
            instruction: "Rezolvă sistemele prin metoda adunării:",
            items: ["x + y = 10 și x - y = 2 → x=__, y=__", "2x + y = 11 și x - y = 4 → x=__, y=__"],
          },
          {
            instruction: "Probleme cu ecuații:",
            items: ["Un număr înmulțit cu 3 și adunat cu 7 dă 22. 3x+7=22 → x=__", "Suma a două numere consecutive este 37. x+(x+1)=37 → x=__", "O carte costă dublu față de un caiet. Împreună costă 54 lei. x+2x=54 → x=__"],
          },
        ],
        tip: "Profesori: Insistați pe pasul de verificare – el dezvoltă gândirea critică și previne erorile.",
      },
      {
        title: "Fișă – Fizică: Mișcarea și Forțele",
        description: "Calculăm viteze, distanțe, forțe și greutăți",
        intro: "Fizica ne ajută să înțelegem lumea! Astăzi calculăm mișcarea și forțele.",
        exercises: [
          {
            instruction: "Calculează distanța (d = v × t):",
            items: ["v=15m/s, t=10s → d=__m", "v=90km/h, t=2h → d=__km", "v=5m/s, t=1min(=60s) → d=__m"],
          },
          {
            instruction: "Calculează viteza (v = d/t):",
            items: ["d=200m, t=20s → v=__m/s", "d=150km, t=2,5h → v=__km/h", "d=1500m, t=5min(=300s) → v=__m/s"],
          },
          {
            instruction: "Legile lui Newton – calculează:",
            items: ["m=6kg, a=4m/s² → F=__N", "F=80N, m=8kg → a=__m/s²", "m=75kg → G=__N (g=10m/s²)", "G=500N → m=__kg"],
            hint: "F=m×a; G=m×g (g≈10m/s²)",
          },
          {
            instruction: "Probleme complexe:",
            items: ["O mașină parcurge 360km în 4h. Viteza medie: __km/h. La aceeași viteză, parcurge 180km în __h.", "Un elev de 60kg. Greutatea lui: __N. Dacă urcă pe un munte cu a=2m/s², ce forță produce? __N"],
          },
        ],
        tip: "Profesori: Experimentele simple (mișcarea bilelor, cântarul) ajută elevii să înțeleagă forțele concret.",
      },
      {
        title: "Fișă – Chimie: Substanțele",
        description: "Substanțe pure, amestecuri, formule chimice",
        intro: "Chimia este pretutindeni în viața noastră! Astăzi clasificăm substanțele și citim formule chimice.",
        exercises: [
          {
            instruction: "Clasifică substanțele (pură / amestec):",
            items: ["Apa distilată: __", "Aerul: __", "Zahărul: __", "Sarea de mare (cu impurități): __", "Aurul 24K: __", "Laptele: __"],
          },
          {
            instruction: "Identifică elementele și numărul atomilor din formulele chimice:",
            items: ["H₂O → __ atomi H și __ atomi O", "CO₂ → __ atomi C și __ atomi O", "H₂SO₄ → __ H, __ S, __ O", "Ca(OH)₂ → __ Ca, __ O, __ H"],
          },
          {
            instruction: "Completează informațiile despre stările de agregare:",
            items: ["Solidă: formă __ și volum __", "Lichidă: formă __ și volum __", "Gazoasă: formă __ și volum __"],
            hint: "Formă proprie sau variabilă; volum fix sau variabil.",
          },
          {
            instruction: "Asociază substanța cu formula sa:",
            items: ["Sarea de bucătărie → __", "Apa → __", "Dioxidul de carbon → __", "Glucoza → __"],
          },
        ],
        tip: "Profesori: Demonstrațiile cu substanțe accesibile (apă, sare, zahăr, oțet) fac chimia mai concretă și mai atractivă.",
      },
    ],
  },

  /* ═══════════════════════════ CLASA VIII ═══════════════════════════ */
  {
    grade: 8,
    label: "Clasa VIII",
    color: "text-violet-600",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    studyItems: [
      {
        title: "Funcții liniare și grafice",
        description: "Funcția de gradul I și reprezentarea grafică",
        topics: ["Funcția f(x)=ax+b", "Panta și ordonata la origine", "Graficul funcției liniare", "Zeroul funcției"],
        pages: [
          {
            title: "Funcția liniară f(x) = ax + b",
            explanation: "O funcție liniară asociază fiecărui număr real x un alt număr real f(x). 'a' este panta (cât de abruptă e dreapta) și 'b' este ordonata la origine (unde intersectează axa Oy).",
            keyPoints: ["a = panta (rate of change)", "b = valoarea f(0) = intersecția cu Oy", "a > 0 → funcția este crescătoare", "a < 0 → funcția este descrescătoare", "Zeroul: f(x)=0 → x = -b/a"],
            examples: [
              { label: "f(x) = 2x + 3", value: "Pantă=2 (crescătoare), Oy=3 | f(0)=3, f(1)=5" },
              { label: "f(x) = -x + 4", value: "Pantă=-1 (descrescătoare), Oy=4 | Zero: x=4" },
              { label: "f(x) = 3x - 9", value: "Zero: 3x=9 → x=3 | Puncte: (0,-9), (3,0)" },
            ],
            exercise: "Calculează f(0), f(1), f(-2) pentru f(x)=3x-5. Găsește zeroul funcției.",
          },
          {
            title: "Graficul funcției liniare",
            explanation: "Graficul funcției liniare este o dreaptă. Se trasează găsind 2 puncte (A(0,b) și B(-b/a, 0)) și unim cu o linie dreaptă.",
            keyPoints: ["Două puncte determină o dreaptă", "Punctul A(0,b) = intersecția cu Oy", "Punctul B(-b/a, 0) = intersecția cu Ox (zero)", "Panta = tangenta unghiului dreptei cu Ox"],
            examples: [
              { label: "f(x)=2x+1", value: "A(0,1), B(-0.5, 0) → dreapta crescătoare" },
              { label: "f(x)=-x+3", value: "A(0,3), B(3,0) → dreapta descrescătoare" },
            ],
            exercise: "Trasează graficul lui f(x)=2x-4. Găsește intersecțiile cu axele.",
          },
        ],
      },
      {
        title: "Fizică – Legea lui Ohm și Electricitatea",
        description: "Electricitate și circuite electrice",
        topics: ["Curentul electric", "Tensiunea electrică", "Rezistența electrică", "Legea lui Ohm: U=R×I"],
        pages: [
          {
            title: "Mărimi electrice fundamentale",
            explanation: "Curentul electric (I) este mișcarea dirijată a electronilor. Tensiunea (U) este forța care pune electronii în mișcare. Rezistența (R) se opune circulației curentului.",
            keyPoints: ["I = intensitatea curentului, [I] = A (Amperi)", "U = tensiunea (voltajul), [U] = V (Volți)", "R = rezistența, [R] = Ω (Ohmi)", "P = puterea electrică, [P] = W (Wați)"],
            examples: [
              { label: "Curent", value: "Un bec de 60W la 220V consumă I=60/220≈0.27A" },
              { label: "Tensiune", value: "Baterie = 1.5V, Priză = 220V, Mașini = 12V" },
              { label: "Rezistență", value: "Rezistorul limitează curentul în circuit" },
            ],
            exercise: "Convertiri: 2000 mA = __ A | 0.5 kV = __ V | 5000 Ω = __ kΩ",
          },
          {
            title: "Legea lui Ohm",
            explanation: "Legea lui Ohm: tensiunea (U) este egală cu produsul dintre rezistență (R) și intensitate (I): U = R × I. Din aceasta derivăm: I = U/R și R = U/I.",
            keyPoints: ["U = R × I (formula de bază)", "I = U / R (calculăm intensitatea)", "R = U / I (calculăm rezistența)", "P = U × I = I²×R = U²/R"],
            examples: [
              { label: "R=5Ω, I=2A", value: "U = 5×2 = 10V | P = 10×2 = 20W" },
              { label: "U=12V, R=4Ω", value: "I = 12/4 = 3A | P = 12×3 = 36W" },
              { label: "U=220V, I=2A", value: "R = 220/2 = 110Ω | P = 220×2 = 440W" },
            ],
            exercise: "Calculează: R=8Ω, I=5A → U=__ și P=__ | U=230V, R=46Ω → I=__ și P=__",
          },
        ],
      },
      {
        title: "Chimie – Reacții chimice",
        description: "Tipuri de reacții chimice și ecuații",
        topics: ["Ce este o reacție chimică?", "Legea conservării masei", "Tipuri de reacții", "Acizi, baze și săruri"],
        pages: [
          {
            title: "Reacțiile chimice – definiție și caracteristici",
            explanation: "O reacție chimică este procesul prin care substanțele inițiale (reactanți) se transformă în substanțe noi (produși). Legea conservării masei: masa reactanților = masa produșilor.",
            keyPoints: ["Reactanți → Produși", "Legea conservării masei (Lavoisier, 1774)", "Ecuație chimică = 'rețetă' a reacției", "Semne ale reacției: căldură, lumină, gaz, precipitat, schimbare culoare"],
            examples: [
              { label: "Arderea fierului", value: "3Fe + 2O₂ → Fe₃O₄ (rugina la temperaturi ridicate)" },
              { label: "Combustia hidrogenului", value: "2H₂ + O₂ → 2H₂O (apă)" },
              { label: "Neutralizare", value: "HCl + NaOH → NaCl + H₂O (acid + bază → sare + apă)" },
            ],
            exercise: "Egalizează ecuația: H₂ + O₂ → H₂O. Câte molecule din fiecare?",
          },
          {
            title: "Acizi, baze și săruri",
            explanation: "Acizii conțin hidrogen și au gust acru (HCl, H₂SO₄). Bazele/alcalii conțin gruparea OH⁻ (NaOH, Ca(OH)₂). Sărurile sunt compuși ionici obținuți din reacția acid-bază.",
            keyPoints: ["Acizi: pH < 7, gust acru, înroșesc turnesolul", "Baze: pH > 7, gust amărui, albăstresc turnesolul", "pH = 7 → neutru (apa pură)", "Acid + bază → sare + apă (reacție de neutralizare)", "Săruri: NaCl, KNO₃, CaCO₃ (calcarul)"],
            examples: [
              { label: "Acizi uzuali", value: "HCl (acid clorhidric), H₂SO₄ (acid sulfuric), CH₃COOH (oțet)" },
              { label: "Baze uzuale", value: "NaOH (sodă caustică), Ca(OH)₂ (var stins)" },
              { label: "Neutralizare", value: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O" },
            ],
            exercise: "Clasifică: HNO₃, KOH, NaCl, H₂SO₄, Mg(OH)₂ – acizi / baze / săruri. Scrie reacția dintre HCl și NaOH.",
          },
        ],
      },
      {
        title: "Biologie – Genetică și ereditate",
        description: "ADN, gene, cromozomi și legile lui Mendel",
        topics: ["ADN și gene", "Cromozomii", "Legile lui Mendel", "Mutații și variabilitate"],
        pages: [
          {
            title: "ADN, gene și cromozomi",
            explanation: "ADN (acid dezoxiribonucleic) conține informația genetică a oricărei ființe vii. Genele sunt segmente de ADN care codifică proteine. Cromozomii sunt structuri din ADN răsucit, localizați în nucleu.",
            keyPoints: ["ADN = 'manualul' de instrucțiuni al celulei", "Gena = un 'capitol' din manual (codifică o proteină)", "Celula umană: 46 cromozomi (23 perechi)", "22 perechi autosomali + 1 pereche sexuală (XX/XY)", "Femeia XX, bărbatul XY"],
            examples: [
              { label: "ADN desfășurat", value: "Dacă am desface ADN dintr-o celulă umană: ~2 metri!" },
              { label: "Cromozomul X vs Y", value: "Femeile au XX, bărbații XY – tatăl determină sexul copilului" },
              { label: "Genomul uman", value: "~20.000-25.000 gene active" },
            ],
            exercise: "Explică: de ce copilul moștenește trăsături de la ambii părinți?",
          },
          {
            title: "Legile lui Mendel",
            explanation: "Gregor Mendel (1822-1884) a descoperit regulile eredității experimentând cu mazărea. Legile lui descriu cum se transmit trăsăturile de la părinți la copii.",
            keyPoints: ["Trăsăturile se transmit prin gene (alele)", "Alela dominantă (A) 'maschează' alela recesivă (a)", "Genotip: combinația de alele (AA, Aa, aa)", "Fenotip: trăsătura observabilă (culoarea ochilor, înălțimea)", "Legea 1 (segregare): fiecare individ are 2 alele, transmite câte una"],
            examples: [
              { label: "AA × aa", value: "Toți descendenții: Aa (toți cu trăsătura dominantă)" },
              { label: "Aa × Aa", value: "Descendenți: 1AA:2Aa:1aa → 75% dominantă, 25% recesivă" },
              { label: "Ochii", value: "Ochi căprui (B) dominant față de ochi albaștri (b)" },
            ],
            exercise: "Doi părinți cu genotip Aa se încrucișează. Scrie genotipurile și fenotipurile posibile ale descendenților.",
          },
        ],
      },
      {
        title: "Română – Pregătire Evaluare Națională",
        description: "Texte literare și non-literare, redactare, gramatică",
        topics: ["Textul literar – analiză", "Textul non-literar", "Rezumatul și planul de idei", "Redactare și ortografie"],
        pages: [
          {
            title: "Analiza textului literar",
            explanation: "La Evaluarea Națională se cere analiza unui text literar: identificarea temei, titlului, a naratorului, a personajelor și a figurilor de stil. Trebuie să argumentați răspunsurile cu citate din text.",
            keyPoints: ["Tema = subiectul principal al textului", "Titlul poate fi simbolic sau descriptiv", "Personaje principale (eroi) și secundare", "Figuri de stil: epitet, comparație, metaforă, personificare", "Perspectiva narativă: persoana I sau III"],
            examples: [
              { label: "Structura analizei", value: "Titlu, autor, genul literar, tema, personaje, mesajul/morala" },
              { label: "Argumentare", value: "Răspund + citez din text: 'Personajul este curajos deoarece...'"},
              { label: "Opera epică", value: "Cuprinde: narațiune, descriere, dialog" },
            ],
            exercise: "Analizați textul dat: ce personaje apar? Care este tema? Găsiti 2 figuri de stil și comentați-le.",
          },
          {
            title: "Redactarea – Compunerea",
            explanation: "Compunerea școlară (eseu liber, relatare, descriere) are trei părți: introducere (prezentarea subiectului), cuprins (dezvoltarea ideilor), încheiere (concluzia). Respectăm normele de ortografie și punctuație.",
            keyPoints: ["Introducere: prezentați subiectul, captați atenția", "Cuprins: idei principale, 2-3 paragrafe", "Încheiere: concluzie, opinie personală", "Respectați: ortografia, punctuația, coerența textului", "Vocabular variat, nu repetați aceleași cuvinte"],
            examples: [
              { label: "Compunere narativă", value: "Povestire cu personaje, acțiune, timp, loc" },
              { label: "Compunere descriptivă", value: "Descrierea unui peisaj, a unui personaj" },
              { label: "Eseu argumentativ", value: "Teză → Argumente (cel puțin 2) → Concluzie" },
            ],
            exercise: "Scrieți o compunere narativă de 10-15 rânduri intitulată 'O zi de neuitat'. Respectați structura: introducere-cuprins-încheiere.",
          },
        ],
      },
      {
        title: "Istorie – România modernă și contemporană",
        description: "De la Unirea Principatelor la România de azi",
        topics: ["Unirea Principatelor (1859)", "Independența (1877)", "Marea Unire (1918)", "România comunistă și post-comunistă"],
        pages: [
          {
            title: "Unirea Principatelor și Independența",
            explanation: "În 1859, Alexandru Ioan Cuza a realizat Unirea Principatelor Române (Moldova și Muntenia), creând statul România. În 1877-1878, România și-a câștigat independența în urma Războiului Ruso-Turc.",
            keyPoints: ["1859 – Dubla alegere a lui Cuza: Unirea Principatelor", "1862 – Denumirea oficială: România, capitala București", "1877 – Proclamarea Independenței față de Imperiul Otoman", "1878 – Recunoașterea Independenței prin Tratatul de la Berlin", "1881 – România proclamată Regat"],
            examples: [
              { label: "Alexandru Ioan Cuza", value: "Ales domn în ambele principate (24 ian./5 feb. 1859)" },
              { label: "Reformele lui Cuza", value: "Secularizarea averilor mănăstirești, împroprietărirea țăranilor" },
              { label: "Plevna (1877)", value: "Victoria decisivă a oștilor române și ruse împotriva otomanilor" },
            ],
            exercise: "Plasați pe axa timpului: 1859 (Unirea), 1862 (denumirea Romania), 1877 (Independența), 1881 (Regatul).",
          },
          {
            title: "Marea Unire și România modernă",
            explanation: "La 1 Decembrie 1918, toate provinciile locuite de români (Transilvania, Bucovina, Basarabia) s-au unit cu Regatul Român, formând România Mare. Ulterior, România a trecut prin comunism (1947-1989) și a revenit la democrație.",
            keyPoints: ["1 Decembrie 1918 – Marea Unire (Adunarea de la Alba Iulia)", "1947 – Instaurarea regimului comunist (Republica Populară Română)", "1965-1989 – Regimul Nicolae Ceaușescu", "22 Decembrie 1989 – Revoluția Română, prăbușirea comunismului", "2004 – Aderarea la NATO; 2007 – Aderarea la Uniunea Europeană"],
            examples: [
              { label: "1 Decembrie", value: "Ziua Națională a României – sărbătorită anual" },
              { label: "Comunismul", value: "Economie planificată, control politic total, deportări" },
              { label: "Revoluția 1989", value: "Singura revoluție sângeroasă din Estul Europei în 1989" },
            ],
            exercise: "Explicați de ce 1 Decembrie 1918 este Ziua Națională a României. Ce s-a hotărât la Alba Iulia?",
          },
        ],
      },
    ],
    quiz: [
      { q: "Care este panta funcției f(x) = 3x - 5?", options: ["-5", "3", "3x", "0"], answer: 1 },
      { q: "Legea lui Ohm este:", options: ["P = U × I", "U = R × I", "I = P / U", "R = U + I"], answer: 1 },
      { q: "Dacă R=5Ω și I=2A, atunci U=?", options: ["2.5V", "10V", "7V", "3V"], answer: 1 },
      { q: "Zeroul funcției f(x) = 2x - 6 este:", options: ["x=2", "x=3", "x=6", "x=-3"], answer: 1 },
      { q: "Dacă U=220V și I=2A, atunci R=?", options: ["110Ω", "218Ω", "222Ω", "44Ω"], answer: 0 },
      { q: "Câți cromozomi are celula umană?", options: ["23", "44", "46", "48"], answer: 2 },
      { q: "ADN se găsește în:", options: ["Membrană", "Nucleu", "Citoplasma", "Mitocondrie"], answer: 1 },
      { q: "Reacția acid + bază produce:", options: ["Acid nou + bază nouă", "Sare + apă", "Apă + gaz", "Sare + gaz"], answer: 1 },
      { q: "Marea Unire a României a avut loc la:", options: ["24 Ianuarie 1859", "10 Mai 1877", "1 Decembrie 1918", "22 Decembrie 1989"], answer: 2 },
      { q: "pH-ul apei pure este:", options: ["0", "7", "14", "3"], answer: 1 },
      { q: "Revoluția Română (căderea comunismului) a avut loc în:", options: ["1956", "1980", "1989", "1991"], answer: 2 },
      { q: "La traversarea genotipului Aa × Aa, probabilitatea genotipului aa este:", options: ["0%", "25%", "50%", "75%"], answer: 1 },
      { q: "România a aderat la Uniunea Europeană în:", options: ["2004", "2007", "2010", "2000"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Funcții liniare și Legea lui Ohm",
        description: "Aplicăm cunoștințele din matematică și fizică",
        intro: "Fișă combinată: funcții liniare (matematică) + Legea lui Ohm (fizică). Conexiunea dintre ele este fascinantă!",
        exercises: [
          {
            instruction: "Funcții liniare – calculează valorile:",
            items: ["f(x)=2x+3: f(0)=__, f(1)=__, f(-1)=__, f(2)=__", "g(x)=-x+4: g(0)=__, g(2)=__, g(4)=__, g(-1)=__"],
            hint: "Înlocuiți x cu valoarea dată și calculați.",
          },
          {
            instruction: "Găsești zeroul funcțiilor (f(x)=0):",
            items: ["f(x)=3x-9 → 3x=9 → x=__", "f(x)=-2x+8 → x=__", "f(x)=5x+15 → x=__"],
          },
          {
            instruction: "Legea lui Ohm – completați tabelul:",
            items: ["U=12V, R=4Ω → I=__ A, P=__ W", "U=__, R=10Ω, I=3A → U=__ V, P=__ W", "U=220V, I=4A → R=__ Ω, P=__ W"],
            hint: "Formulele: U=R×I, I=U/R, R=U/I, P=U×I",
          },
          {
            instruction: "Problema mixtă:",
            items: ["Un taxi: cost=5 lei + 3 lei/km. Scrie f(km)=__. Costul pentru 10 km: __", "Un bec la 220V consumă 0.5A. R=__ Ω, P=__ W. Costul pentru 10h dacă 1kWh=1 leu: __ lei"],
          },
        ],
        tip: "Profesori: Conectați funcțiile liniare cu graficele fizice (ex: graficul curent-tensiune = dreaptă cu panta 1/R).",
      },
      {
        title: "Fișă – Chimie: Acizi, baze, săruri",
        description: "Clasificăm substanțele chimice și scriem reacții",
        intro: "Chimia acizilor și bazelor este esențială! Astăzi clasificăm substanțe și scriem reacții de neutralizare.",
        exercises: [
          {
            instruction: "Clasifică substanțele (acid / bază / sare) și scrie dacă pH>7, <7 sau =7:",
            items: ["HCl → __, pH __7", "NaOH → __, pH __7", "NaCl → __, pH __7", "H₂SO₄ → __, pH __7", "Ca(OH)₂ → __, pH __7"],
          },
          {
            instruction: "Completează reacțiile de neutralizare (acid + bază → sare + apă):",
            items: ["HCl + NaOH → __ + __", "H₂SO₄ + 2KOH → __ + __", "2HCl + Ca(OH)₂ → __ + __"],
          },
          {
            instruction: "Egalizează ecuațiile chimice (verifică conservarea masei):",
            items: ["H₂ + O₂ → H₂O (adaugă coeficienți: __H₂ + __O₂ → __H₂O)", "Fe + O₂ → Fe₂O₃ (adaugă coeficienți)"],
          },
          {
            instruction: "Aplicații practice – completează:",
            items: ["Oțetul de bucătărie conține __ (un acid)", "Bicarbonatul de sodiu este __ (acid/bază)", "Sucul de lămâie are pH__ 7 (mai mare/mai mic)", "Apa de mare are pH__ 7 (slab bazică)"],
          },
        ],
        tip: "Profesori: Indicatoarele de pH (turnesol, varza roșie) fac lecția mult mai interactivă. Testați cu suc de lămâie și apă cu bicarbonat!",
      },
      {
        title: "Fișă – Genetică și Istorie modernă",
        description: "Genetică (Mendel) și istoria României moderne",
        intro: "Fișă duală: genetică (biologie) și momente cheie din istoria modernă a României.",
        exercises: [
          {
            instruction: "Genetică – Legile lui Mendel:",
            items: ["Dacă ambii părinți au genotip Aa, desenați pătratul lui Punnett: AM × Am, Am × aM, am × am. Genotipuri: __, __, __, __. Raport fenotipic: __:__"],
            hint: "Pătratul lui Punnett: scrieți alelele pe margini și completați.",
          },
          {
            instruction: "Completează informațiile genetice:",
            items: ["ADN este localizat în __ celulei", "Celula umană normală are __ cromozomi", "Genotip dominant AA sau Aa → fenotip __", "Genotip recesiv aa → fenotip __"],
          },
          {
            instruction: "Completează axa cronologică a istoriei României moderne:",
            items: ["1859: __", "1877: __", "1881: __", "1918: __", "1989: __", "2007: __"],
          },
          {
            instruction: "Redactează scurt (3-5 rânduri) despre:",
            items: ["De ce a fost importantă Marea Unire din 1918? → _______________", "Ce a schimbat Revoluția din 1989 în România? → _______________"],
          },
        ],
        tip: "Profesori: Integrarea biologiei cu istoria în aceeași fișă ajută elevii să gândească interdisciplinar – abilitate cerută la EN.",
      },
      {
        title: "Fișă – Pregătire Evaluare Națională",
        description: "Exerciții tip Evaluare Națională (Română și Matematică)",
        intro: "Pregătire pentru Evaluarea Națională! Lucrați metodic, citiți cu atenție cerințele și argumentați răspunsurile.",
        exercises: [
          {
            instruction: "Limba Română – Înțelegerea textului (citește textul și răspunde):",
            items: ["Text: 'Toamna venise în sat cu aceleași vechi datinuri. Frunzele, roșii și galbene, cădeau domol pe pămantul umed.' — Care sunt cele două figuri de stil identificate? Argumentați.", "Scrie sinonimul cuvântului 'domol' din text.", "Rescrie propoziția 'Frunzele cădeau' la timpul viitor."],
          },
          {
            instruction: "Limba Română – Redactare:",
            items: ["Scrie o compunere de 10-15 rânduri cu titlul 'Toamna în parcul școlii'. Respectă: introducere, cuprins (descriere+acțiune), încheiere. Folosește cel puțin 2 figuri de stil."],
          },
          {
            instruction: "Matematică – Probleme tip EN:",
            items: ["Dacă f(x) = 2x - 4, calculează: a) f(0); b) f(3); c) zeroul funcției; d) Este f crescătoare sau descrescătoare?", "Rezolvă sistemul: {x+2y=10 și 2x-y=5}. Verifică soluția.", "Un comerciant vinde un produs cu 20% profit față de prețul de achiziție de 150 lei. Care este prețul de vânzare? Dacă oferă o reducere de 10% din prețul de vânzare, cât plătește cumpărătorul?"],
          },
          {
            instruction: "Matematică – Geometrie:",
            items: ["Un triunghi dreptunghic are catetele 9cm și 40cm. Calculați: ipotenuza, perimetrul, aria.", "O funcție liniară trece prin punctele A(0,3) și B(2,7). Determinați panta și scrieți formula funcției."],
            hint: "Ipotenuza: a²+b²=c². Panta: Δy/Δx = (7-3)/(2-0) = 2. Funcția: f(x) = 2x + 3.",
          },
        ],
        tip: "Profesori: Simulările de EN (în condiții de examen – timp limitat, fără ajutor) sunt esențiale în lunile premergătoare evaluării. Faceți cel puțin 3-4 simulări complete.",
      },
    ],
  },
];

function StudyItemModal({ item, cls, open, onClose }: {
  item: StudyItem;
  cls: ClassData;
  open: boolean;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const p = item.pages[page];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className={`${cls.bg} px-6 pt-6 pb-4 border-b border-border/40`}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${cls.color} mb-1`}>{item.title}</p>
                <DialogTitle className="text-xl font-black text-foreground">{p.title}</DialogTitle>
              </div>
              <DialogClose className="rounded-lg p-1.5 hover:bg-black/10 transition-colors flex-shrink-0 mt-1">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {item.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-1.5 rounded-full transition-all ${i === page ? `w-6 ${cls.color.replace("text-", "bg-")}` : "w-1.5 bg-gray-300"}`}
                />
              ))}
              <span className={`ml-2 text-xs font-medium ${cls.color}`}>{page + 1}/{item.pages.length}</span>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.explanation}</p>
          </div>

          <div className={`${cls.bg} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className={`h-4 w-4 ${cls.color}`} />
              <p className={`text-xs font-bold uppercase tracking-wider ${cls.color}`}>Puncte cheie</p>
            </div>
            <ul className="space-y-1.5">
              {p.keyPoints.map((kp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Star className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${cls.color}`} />
                  {kp}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exemple</p>
            </div>
            <div className="space-y-2">
              {p.examples.map((ex, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-border/40">
                  <span className={`text-xs font-bold ${cls.color} min-w-[80px] flex-shrink-0`}>{ex.label}</span>
                  <span className="text-sm text-foreground">{ex.value}</span>
                </div>
              ))}
            </div>
          </div>

          {p.exercise && (
            <div className="border border-dashed border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exercițiu de înțelegere</p>
              </div>
              <p className="text-sm text-foreground">{p.exercise}</p>
              <div className="mt-3 space-y-1.5">
                {[0, 1, 2].map(i => <div key={i} className="h-px bg-border/50" />)}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="gap-1 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" /> Pagina anterioară
          </Button>
          {page < item.pages.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setPage(p => p + 1)}
              className={`gap-1 rounded-xl gradient-primary text-white border-0`}
            >
              Pagina următoare <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={onClose} className="rounded-xl gradient-primary text-white border-0 gap-1">
              <CheckCircle2 className="h-4 w-4" /> Finalizat!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorksheetModal({ ws, cls, open, onClose }: {
  ws: Worksheet;
  cls: ClassData;
  open: boolean;
  onClose: () => void;
}) {
  const handlePrint = () => {
    const content = document.getElementById("print-worksheet");
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>${ws.title}</title><style>
        body { font-family: Arial, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; font-size: 14px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 16px; font-weight: normal; }
        .intro { background: #f8f9fa; border-left: 3px solid #666; padding: 10px 14px; margin-bottom: 20px; font-style: italic; }
        .exercise { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .exercise-header { background: #f0f0f0; padding: 8px 14px; font-weight: bold; font-size: 13px; }
        .exercise-body { padding: 12px 14px; }
        .item { padding: 6px 0; border-bottom: 1px dotted #ccc; }
        .item:last-child { border-bottom: none; }
        .hint { font-size: 12px; color: #888; font-style: italic; margin-top: 8px; }
        .answer-space { margin-top: 12px; }
        .line { border-bottom: 1px solid #999; margin: 8px 0; height: 20px; }
        .tip { background: #fffbeb; border: 1px solid #fcd34d; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-top: 16px; }
        @media print { .no-print { display: none; } }
      </style></head><body>
        <h1>${ws.title}</h1>
        <h2>${ws.description}</h2>
        <div class="intro">${ws.intro}</div>
        ${ws.exercises.map((ex, i) => `
          <div class="exercise">
            <div class="exercise-header">Exercițiul ${i + 1}: ${ex.instruction}</div>
            <div class="exercise-body">
              ${ex.items.map(it => `<div class="item">${it}</div>`).join("")}
              ${ex.hint ? `<div class="hint">💡 Indiciu: ${ex.hint}</div>` : ""}
              <div class="answer-space">
                <div class="line"></div>
                <div class="line"></div>
              </div>
            </div>
          </div>
        `).join("")}
        ${ws.tip ? `<div class="tip"><strong>Notă profesor:</strong> ${ws.tip}</div>` : ""}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className={`${cls.bg} px-6 pt-6 pb-4 border-b border-border/40`}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${cls.color} mb-1`}>Fișă de lucru · {cls.label}</p>
                <DialogTitle className="text-xl font-black text-foreground">{ws.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{ws.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 mt-1">
                <button
                  onClick={handlePrint}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${cls.bg} ${cls.color} border border-current/20 hover:opacity-80 transition-opacity`}
                >
                  <Printer className="h-3.5 w-3.5" /> Printează
                </button>
                <DialogClose className="rounded-lg p-1.5 hover:bg-black/10 transition-colors">
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div id="print-worksheet" className="px-6 py-5 space-y-5">
          <div className={`${cls.bg} border border-current/10 rounded-xl px-4 py-3`}>
            <p className={`text-sm italic ${cls.color} font-medium`}>{ws.intro}</p>
          </div>

          {ws.exercises.map((ex, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-xs">
              <div className="bg-gray-50 px-4 py-3 border-b border-border/40">
                <p className="text-sm font-bold text-foreground">
                  <span className={`${cls.color} font-black mr-2`}>{i + 1}.</span>
                  {ex.instruction}
                </p>
              </div>
              <div className="p-4 space-y-2">
                {ex.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2.5 pb-2 border-b border-dashed border-border/40 last:border-0">
                    <span className={`h-5 w-5 rounded-full ${cls.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`text-[10px] font-black ${cls.color}`}>{String.fromCharCode(97 + j)}</span>
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
                {ex.hint && (
                  <div className="flex items-start gap-2 mt-2 pt-2">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 italic">{ex.hint}</p>
                  </div>
                )}
                <div className="mt-3 space-y-1.5">
                  <div className="h-px bg-border/40 w-full" />
                  <div className="h-px bg-border/40 w-full" />
                  <div className="h-px bg-border/40 w-3/4" />
                </div>
              </div>
            </div>
          ))}

          {ws.tip && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700"><strong>Notă pentru profesori:</strong> {ws.tip}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-between gap-3 border-t border-border/40 pt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Închide</Button>
          <Button onClick={handlePrint} className="rounded-xl gradient-primary text-white border-0 gap-2">
            <Printer className="h-4 w-4" /> Printează fișa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const QUESTION_TIME = 30;

function QuizSection({ questions, cls }: { questions: QuizQuestion[]; cls: ClassData }) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pastResult, setPastResult] = useState<{ score: number; total: number; timeTaken?: number } | null>(null);
  const [loadingResult, setLoadingResult] = useState(true);
  const [animating, setAnimating] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gradeKey = String(cls.grade);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoadingResult(false); return; }
    setLoadingResult(true);
    fetch("/api/quiz/my-results", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const found = (data.results ?? []).find((r: any) => r.classGrade === gradeKey);
        if (found) setPastResult({ score: found.score, total: found.total, timeTaken: found.timeTaken });
        else setPastResult(null);
      })
      .catch(() => {})
      .finally(() => setLoadingResult(false));
  }, [user, gradeKey, authLoading]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          goNext(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!submitted && !pastResult && !loadingResult && !authLoading) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, submitted, pastResult, loadingResult, authLoading]);

  const goNext = useCallback((forced = false) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(prev => {
        if (prev < questions.length - 1) {
          startTimer();
          return prev + 1;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setSubmitted(true);
        return prev;
      });
      setAnimating(false);
    }, 300);
  }, [animating, questions.length, startTimer]);

  useEffect(() => {
    if (submitted && user) {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      // Split answers between hardcoded (positional, in `answers`) and admin-added
      // (identified by id, in `extraAnswers`) so the server can score each set
      // against its own answer key.
      const baseAnswers: number[] = [];
      const extraAnswers: { id: number; answer: number }[] = [];
      questions.forEach((q, i) => {
        const a = answers[i] ?? -1;
        if (q.extraId) extraAnswers.push({ id: q.extraId, answer: a });
        else baseAnswers.push(a);
      });
      setSaving(true);
      fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ classGrade: gradeKey, answers: baseAnswers, extraAnswers, timeTaken }),
      })
        .then(async r => {
          const data = await r.json();
          if (r.ok && data.result) {
            setPastResult({ score: data.result.score, total: data.result.total, timeTaken });
          } else if (r.status === 409 && data.result) {
            setPastResult({ score: data.result.score, total: data.result.total, timeTaken: data.result.timeTaken });
          }
        })
        .catch(() => {})
        .finally(() => setSaving(false));
    }
  }, [submitted]);

  if (loadingResult || authLoading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Se încarcă...</div>;
  }

  if (pastResult && !submitted) {
    const pct = Math.round((pastResult.score / pastResult.total) * 100);
    return (
      <div className="bg-white rounded-2xl border border-border/60 p-8 text-center shadow-xs space-y-3">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium mb-1">
          <Lock className="h-4 w-4" /> Quiz completat
        </div>
        <div className="text-5xl font-black text-foreground">{pastResult.score}<span className="text-2xl text-muted-foreground font-semibold">/{pastResult.total}</span></div>
        <div className="text-sm text-muted-foreground">{pct}% corect{pastResult.timeTaken ? ` · ${pastResult.timeTaken}s` : ""}</div>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${pct === 100 ? "bg-emerald-100 text-emerald-700" : pct >= 70 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
          {pct === 100 ? "🏆 Perfect!" : pct >= 70 ? "👍 Bine!" : "📚 Mai studiază"}
        </div>
        <p className="text-xs text-muted-foreground">Quizul poate fi dat o singură dată per clasă.</p>
      </div>
    );
  }

  if (submitted) {
    // For admin-added (extra) questions we don't have the answer client-side,
    // so trust the server-computed score from `pastResult` once it lands.
    const localScore = questions.filter((q, i) => q.extraId === undefined && answers[i] === q.answer).length;
    const finalScore = pastResult ? pastResult.score : localScore;
    const finalTotal = pastResult ? pastResult.total : questions.length;
    const pct = Math.round((finalScore / finalTotal) * 100);
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-border/60 p-8 text-center shadow-xs space-y-3">
          <Trophy className="h-10 w-10 text-amber-500 mx-auto" />
          <div className="text-5xl font-black text-foreground">{finalScore}<span className="text-2xl text-muted-foreground font-semibold">/{questions.length}</span></div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${pct === 100 ? "bg-emerald-100 text-emerald-700" : pct >= 70 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
            {pct === 100 ? "🏆 Excelent! Ai răspuns corect la toate!" : pct >= 70 ? "👍 Bine! Mai exersează puțin." : "📚 Mai trebuie să înveți. Nu te descuraja!"}
          </div>
          {saving && <p className="text-xs text-muted-foreground">Se salvează rezultatul...</p>}
          {!saving && <p className="text-xs text-muted-foreground">Rezultatul a fost salvat. Quizul nu mai poate fi refăcut.</p>}
        </div>
        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div key={qi} className="bg-white rounded-2xl border border-border/60 p-4 shadow-xs">
              <p className="font-semibold text-foreground mb-2 text-sm">{qi + 1}. {q.q}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isChosen = answers[qi] === oi;
                  return (
                    <div key={oi} className={`px-4 py-2.5 rounded-xl border text-sm font-medium ${isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-700" : isChosen ? "bg-red-50 border-red-300 text-red-700" : "border-border/40 text-muted-foreground/60"}`}>
                      <span className="mr-2 font-bold">{String.fromCharCode(65 + oi)}.</span>{opt}
                      {isCorrect && <span className="ml-1 text-emerald-600 font-bold">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = questions[current];
  const selected = answers[current];
  const timerPct = (timeLeft / QUESTION_TIME) * 100;
  const timerColor = timeLeft > 15 ? "bg-emerald-500" : timeLeft > 7 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{current + 1} / {questions.length}</span>
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={`text-xs font-bold tabular-nums ${timeLeft <= 7 ? "text-red-600" : "text-muted-foreground"}`}>{timeLeft}s</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
        <div className="h-1 rounded-full bg-primary transition-all duration-300" style={{ width: `${((current) / questions.length) * 100}%` }} />
      </div>

      <div className={`bg-white rounded-2xl border border-border/60 p-5 shadow-xs transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}>
        <p className="font-bold text-foreground mb-4 text-base leading-snug">{q.q}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => setAnswers(prev => ({ ...prev, [current]: oi }))}
              className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selected === oi ? "bg-primary/8 border-primary text-primary ring-1 ring-primary/30 scale-[1.01]" : "border-border/60 hover:border-border hover:bg-gray-50 text-muted-foreground"}`}
            >
              <span className="mr-2 font-black text-xs">{String.fromCharCode(65 + oi)}.</span>{opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {current > 0 && (
          <Button variant="outline" size="sm" onClick={() => { setAnimating(true); setTimeout(() => { setCurrent(c => c - 1); startTimer(); setAnimating(false); }, 300); }} className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Înapoi
          </Button>
        )}
        <Button
          onClick={() => {
            if (current === questions.length - 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setSubmitted(true);
            } else {
              goNext();
            }
          }}
          disabled={selected === undefined || animating}
          className="flex-1 gradient-primary text-white border-0 rounded-xl font-bold shadow-sm hover:opacity-90"
        >
          {current === questions.length - 1 ? (
            <><Zap className="h-4 w-4 mr-1.5" />Finalizează quiz-ul</>
          ) : (
            <>Următoarea <ChevronRightIcon className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
      {!user && (
        <p className="text-xs text-center text-muted-foreground">Autentifică-te pentru a-ți salva rezultatele.</p>
      )}
    </div>
  );
}

interface Extras {
  lessons: Array<{ id: number; title: string; description: string; topics: string[]; pages: StudyPage[] }>;
  quiz: Array<{ id: number; question: string; options: string[] }>;
  worksheets: Array<{ id: number; title: string; description: string; intro: string; exercises: Exercise[]; tip: string | null }>;
}

export default function ClassesPage() {
  usePageTitle("Materiale pe clase");
  const [selectedGrade, setSelectedGrade] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("invatat");
  const [openStudyItem, setOpenStudyItem] = useState<StudyItem | null>(null);
  const [openWorksheet, setOpenWorksheet] = useState<Worksheet | null>(null);
  const [extrasByGrade, setExtrasByGrade] = useState<Record<number, Extras>>({});

  const baseCls = CLASSES[selectedGrade];
  const extras = extrasByGrade[baseCls.grade];

  useEffect(() => {
    const grade = baseCls.grade;
    if (extrasByGrade[grade]) return;
    fetch(`/api/classes/${grade}/extras`)
      .then(r => r.ok ? r.json() : { lessons: [], quiz: [], worksheets: [] })
      .then((data: Extras) => setExtrasByGrade(prev => ({ ...prev, [grade]: data })))
      .catch(() => setExtrasByGrade(prev => ({ ...prev, [grade]: { lessons: [], quiz: [], worksheets: [] } })));
  }, [baseCls.grade]);

  // Merge admin-added extras into the hardcoded class so the rest of the page is unchanged.
  const cls: ClassData = {
    ...baseCls,
    studyItems: [
      ...baseCls.studyItems,
      ...((extras?.lessons ?? []).map(l => ({
        title: l.title,
        description: l.description,
        topics: l.topics ?? [],
        pages: l.pages ?? [],
      }))),
    ],
    quiz: [
      ...baseCls.quiz,
      ...((extras?.quiz ?? []).map(q => ({
        q: q.question,
        options: q.options,
        answer: -1,
        extraId: q.id,
      } as QuizQuestion))),
    ],
    worksheets: [
      ...baseCls.worksheets,
      ...((extras?.worksheets ?? []).map(w => ({
        title: w.title,
        description: w.description,
        intro: w.intro,
        exercises: w.exercises ?? [],
        tip: w.tip ?? undefined,
      }))),
    ],
  };

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "invatat", label: "De învățat", icon: BookOpen },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "fise", label: "Fișe", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Programa școlară – Clasele I–VIII</h1>
            <p className="text-sm text-muted-foreground">Alege clasa ta și accesează materiale, quizuri și fișe de lucru conform programei MEN</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-48 flex-shrink-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Alege clasa</p>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {CLASSES.map((c, i) => (
              <button
                key={c.grade}
                onClick={() => { setSelectedGrade(i); setActiveTab("invatat"); }}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${selectedGrade === i ? `${c.bg} ${c.ring} ring-1 ${c.color} border-transparent` : "border-border/60 text-muted-foreground hover:border-border hover:bg-gray-50"}`}
              >
                <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black ${selectedGrade === i ? c.bg : "bg-gray-100"} ${selectedGrade === i ? c.color : "text-muted-foreground"}`}>{c.grade}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl ${cls.bg} ${cls.ring} ring-1 p-5 mb-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-black ${cls.color}`}>{cls.label}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{cls.studyItems.length} capitole · {cls.quiz.length} întrebări · {cls.worksheets.length} fișe</p>
              </div>
              <ChevronRight className={`h-5 w-5 ${cls.color} opacity-50`} />
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === "invatat" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground px-1">Apasă pe orice capitol pentru a vedea conținut detaliat cu exemple și exerciții.</p>
              {cls.studyItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setOpenStudyItem(item)}
                  className="w-full text-left bg-white rounded-2xl border border-border/60 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-xl ${cls.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <BookOpen className={`h-4.5 w-4.5 ${cls.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls.bg} ${cls.color}`}>{item.pages.length} pag.</span>
                          <ArrowRight className={`h-4 w-4 ${cls.color} opacity-60 group-hover:translate-x-0.5 transition-transform`} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.topics.map((t, j) => (
                          <span key={j} className="text-xs bg-gray-100 text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === "quiz" && <QuizSection questions={cls.quiz} cls={cls} />}

          {activeTab === "fise" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground px-1">Apasă pe o fișă pentru a o vedea complet și a o printa.</p>
              {cls.worksheets.map((ws, i) => (
                <button
                  key={i}
                  onClick={() => setOpenWorksheet(ws)}
                  className="w-full text-left bg-white rounded-2xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className={`${cls.bg} px-5 py-4 flex items-center justify-between`}>
                    <div>
                      <h3 className={`font-bold ${cls.color} group-hover:underline`}>{ws.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{ws.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 ${cls.color}`}>{ws.exercises.length} exerciții</span>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${cls.color}`}>
                        <Printer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Deschide</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-xs text-muted-foreground italic line-clamp-2">{ws.intro}</p>
                    <div className="flex gap-2 mt-2">
                      {ws.exercises.slice(0, 3).map((ex, j) => (
                        <span key={j} className="text-xs bg-gray-100 text-muted-foreground px-2 py-0.5 rounded-full truncate max-w-[120px]">Ex. {j + 1}</span>
                      ))}
                      {ws.exercises.length > 3 && <span className="text-xs text-muted-foreground">+{ws.exercises.length - 3} mai multe</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {openStudyItem && (
        <StudyItemModal
          item={openStudyItem}
          cls={cls}
          open={!!openStudyItem}
          onClose={() => setOpenStudyItem(null)}
        />
      )}
      {openWorksheet && (
        <WorksheetModal
          ws={openWorksheet}
          cls={cls}
          open={!!openWorksheet}
          onClose={() => setOpenWorksheet(null)}
        />
      )}
    </div>
  );
}
