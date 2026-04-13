import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  BookOpen, Brain, FileText, ChevronRight, CheckCircle2, Circle,
  Printer, GraduationCap, X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Lightbulb, PenLine, FlaskConical, Star, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";

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
        topics: ["Vocale: A, E, I, O, U", "Consoane: B, C, D, F, G...", "Litere cu semne: Ă, Â, Î, Ș, Ț", "Ordinea în alfabet"],
        pages: [
          {
            title: "Ce sunt literele?",
            explanation: "Alfabetul limbii române are 31 de litere. Fiecare literă are o formă mare (majusculă) și o formă mică (minusculă). Literele se folosesc pentru a scrie cuvinte.",
            keyPoints: ["31 de litere în alfabet", "Fiecare literă are formă mare și mică", "Literele formează silabe, silabele formează cuvinte"],
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
            keyPoints: ["Vocale: A, E, I, O, U, Ă, Â, Î (8 vocale)", "Consoanele sunt celelalte 23 de litere", "Fiecare silabă conține cel puțin o vocală"],
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
            keyPoints: ["Ă (a cu căciulă) – sunet scurt", "Â și Î – același sunet, reguli diferite de scriere", "Ș (s cu virgulă dedesubt)", "Ț (t cu virgulă dedesubt)"],
            examples: [
              { label: "Ă", value: "măr, pâră, băiat" },
              { label: "Î/Â", value: "în, înaltă / câmp, pâine" },
              { label: "Ș/Ț", value: "școală, șase / țară, țap" },
            ],
            exercise: "Completează cu litera potrivită: _coală, ma_ină, câ_ig, țara mea se numește Româ_ia.",
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
            keyPoints: ["Sunetul se aude, litera se vede/scrie", "Fiecare literă are (de obicei) un sunet", "Unele litere au sunete diferite în context (ex: ce, ci)"],
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
            keyPoints: ["Fiecare silabă are cel puțin o vocală", "Consoana între două vocale merge cu a doua vocală", "Doi consoane alăturate se despart: prima merge cu silaba anterioară"],
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
        title: "Numerele 0-20",
        description: "Numărăm, scriem și comparăm numere de la 0 la 20",
        topics: ["Numerele 0-10", "Numerele 11-20", "Compararea numerelor", "Adunări și scăderi simple"],
        pages: [
          {
            title: "Numerele de la 0 la 10",
            explanation: "Primele numere pe care le învățăm sunt de la 0 la 10. Fiecare număr are un nume, o cifră și corespunde unui număr de obiecte.",
            keyPoints: ["0 = zero (nimic)", "Numerele cresc cu 1 la fiecare pas", "Șirul numerelor: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10"],
            examples: [
              { label: "1", value: "unu → 🍎 (un măr)" },
              { label: "5", value: "cinci → 🌟🌟🌟🌟🌟 (cinci stele)" },
              { label: "10", value: "zece → 10 degete la mâini" },
            ],
            exercise: "Scrie numerele lipsă: 0, 1, __, 3, __, 5, __, 7, __, __, 10.",
          },
          {
            title: "Numerele de la 11 la 20",
            explanation: "Numerele de la 11 la 20 se formează din zece plus un număr. Ele se numesc 'numerele de la 10 la 20'.",
            keyPoints: ["11 = zece + unu = unsprezece", "12 = zece + doi = doisprezece", "20 = douăzeci"],
            examples: [
              { label: "11", value: "unsprezece = 10 + 1" },
              { label: "15", value: "cincisprezece = 10 + 5" },
              { label: "20", value: "douăzeci = 2 × 10" },
            ],
            exercise: "Completează: 10 + 3 = __, 10 + 7 = __, 10 + 0 = __, 10 + 10 = __.",
          },
          {
            title: "Compararea numerelor",
            explanation: "Putem compara numerele folosind semnele: > (mai mare), < (mai mic), = (egal). Numărul mai mare este cel care are mai multe obiecte.",
            keyPoints: ["< înseamnă 'mai mic decât'", "> înseamnă 'mai mare decât'", "= înseamnă 'egal cu'", "Crocodilul mănâncă numărul mai mare!"],
            examples: [
              { label: "3 < 7", value: "Trei este mai mic decât șapte" },
              { label: "15 > 9", value: "Cincisprezece este mai mare decât nouă" },
              { label: "5 = 5", value: "Cinci este egal cu cinci" },
            ],
            exercise: "Pune semnul potrivit (< , > sau =): 4 __ 9 | 12 __ 8 | 6 __ 6 | 18 __ 11.",
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
            instruction: "Unește cuvântul cu imaginea potrivită (desenează o linie):",
            items: ["Cal → imaginea unui cal", "Casă → imaginea unei case", "Creion → imaginea unui creion"],
          },
          {
            instruction: "Scrie câte un cuvânt care începe cu fiecare literă:",
            items: ["A → ___________", "B → ___________", "C → ___________"],
          },
        ],
        tip: "Profesori: Această fișă poate fi folosită și pentru activitate orală. Cereți elevilor să spună alte cuvinte care încep cu literele respective.",
      },
      {
        title: "Fișă – Numerele 1-10",
        description: "Numărăm, scriem și comparăm numere",
        intro: "Astăzi lucrăm cu numerele de la 1 la 10. Fii atent la fiecare exercițiu!",
        exercises: [
          {
            instruction: "Scrie numărul care lipsește din șir:",
            items: ["1, 2, __, 4, __, 6, __, 8, 9, __", "2, 4, __, 8, __, 12"],
            hint: "Numerele cresc în ordine, cu câte 1 (sau 2 la al doilea șir).",
          },
          {
            instruction: "Numără obiectele și scrie cifra corespunzătoare:",
            items: ["🍎🍎🍎 = __", "⭐⭐⭐⭐⭐ = __", "🌸🌸 = __", "🚗🚗🚗🚗🚗🚗🚗 = __"],
          },
          {
            instruction: "Pune semnul potrivit (< , > sau =):",
            items: ["3 __ 7", "9 __ 9", "5 __ 2", "1 __ 8", "6 __ 4"],
            hint: "Crocodilul deschide gura spre numărul mai mare!",
          },
          {
            instruction: "Calculează:",
            items: ["2 + 3 = __", "5 + 1 = __", "7 - 2 = __", "4 + 4 = __", "10 - 5 = __"],
          },
          {
            instruction: "Problema: Ana are 4 mere și primește încă 3. Câte mere are Ana acum?",
            items: ["Rezolvare: 4 + 3 = __", "Răspuns: Ana are __ mere."],
            hint: "Citim problema, identificăm datele și operația.",
          },
        ],
        tip: "Profesori: Puteți folosi bețișoare sau jetoane pentru numerele concrete înainte de această fișă.",
      },
    ],
  },
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
            keyPoints: ["Propoziția exprimă un gând complet", "Începe cu literă mare", "Se termină cu punct (.), semnul exclamării (!) sau întrebării (?)"],
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
            keyPoints: ["Subiectul răspunde la întrebarea: Cine? Ce?", "Predicatul răspunde la întrebarea: Ce face? Ce este?", "Orice propoziție are cel puțin subiect și predicat"],
            examples: [
              { label: "Maria citește.", value: "Maria = subiect | citește = predicat" },
              { label: "Câinele latră.", value: "Câinele = subiect | latră = predicat" },
              { label: "Soarele strălucește.", value: "Soarele = subiect | strălucește = predicat" },
            ],
            exercise: "Subliniați subiectul și încercuiți predicatul: Copiii aleargă în parc. / Florile înfloresc primăvara.",
          },
        ],
      },
      {
        title: "Adunarea și scăderea 0-100",
        description: "Calculăm cu numere până la 100",
        topics: ["Adunarea fără trecere peste zece", "Adunarea cu trecere", "Scăderea", "Verificarea prin probă"],
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
            keyPoints: ["Scăderea este opusul adunării", "Verificăm prin adunare: rezultat + scăzut = descăzut", "Dacă nu putem scădea unitățile, împrumutăm 1 zece (10 unități)"],
            examples: [
              { label: "75 - 32 =", value: "U: 5-2=3, Z: 7-3=4 → Rezultat: 43" },
              { label: "83 - 47 =", value: "U: 13-7=6 (împrumutăm), Z: 7-4=3 → 36" },
              { label: "Verificare:", value: "36 + 47 = 83 ✓" },
            ],
            exercise: "Calculează și verifică: 90 - 45 = __ | 62 - 38 = __ | 74 - 26 = __",
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
            instruction: "Scrie câte o propoziție despre fiecare imagine (descrie ceea ce fac personajele):",
            items: ["Un băiat citește o carte: _______________", "O fată aleargă pe câmp: _______________", "Un câine se joacă cu o minge: _______________"],
          },
          {
            instruction: "Transformă propoziția enunțiativă în interogativă:",
            items: ["Ion merge la piață. → _______________?", "Maria cântă frumos. → _______________?", "Ploaia cade des. → _______________?"],
          },
        ],
        tip: "Profesori: Cereți elevilor să citească propozițiile cu voce tare, punând intonația corespunzătoare semnului de punctuație.",
      },
    ],
  },
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
            keyPoints: ["a × b înseamnă a adunat de b ori", "Rezultatul înmulțirii se numește produs", "Ordinea factorilor nu schimbă produsul: 3×4 = 4×3"],
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
        ],
      },
    ],
    quiz: [
      { q: "Cât face 7 × 8?", options: ["54", "56", "63", "48"], answer: 1 },
      { q: "Care cuvânt este un substantiv?", options: ["frumos", "a merge", "casă", "el"], answer: 2 },
      { q: "Cât face 72 ÷ 9?", options: ["7", "9", "8", "6"], answer: 2 },
      { q: "Substantivul 'masă' este de gen:", options: ["Masculin", "Feminin", "Neutru", "Nu are gen"], answer: 1 },
      { q: "Care este pluralul lui 'copil'?", options: ["copile", "copii", "copilii", "copiii"], answer: 1 },
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
            instruction: "Calculează (foloseşte tabla învăţată):",
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
    ],
  },
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
            explanation: "O fracție reprezintă o parte dintr-un întreg. Fracția a/b se citește 'a din b' sau 'a împărțit la b'. Numărătorul (a) arată câte părți luăm, numitorul (b) arată în câte părți egale e împărțit întregul.",
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
            explanation: "Fracțiile cu același numitor (numitor comun) se adună/scad simplu: operăm doar numărătorii, numitorul rămâne același. Dacă numitorii sunt diferiți, trebuie să găsim numitorul comun.",
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
            keyPoints: ["106 d.Hr. – Dacia devine provincie romană", "Dacii și romanii s-au amestecat → dacо-romani", "Limba latină + influențe dacice = limba română", "Columna lui Traian din Roma păstrează memoria acestor evenimente"],
            examples: [
              { label: "Traian", value: "Împăratul roman care a cucerit Dacia" },
              { label: "Dacia Felix", value: "Provincia romană: bogată în aur și argint" },
              { label: "Romanizarea", value: "Adoptarea limbii și culturii romane de către daci" },
            ],
            exercise: "Completează: Dacia a fost cucerită în __ d.Hr. de împăratul __. Poporul român s-a format prin amestecul __ cu __.",
          },
        ],
      },
    ],
    quiz: [
      { q: "Cât este 3/4 + 1/4?", options: ["4/8", "4/4 (=1)", "2/4", "3/8"], answer: 1 },
      { q: "Cine a fost primul mare rege al dacilor?", options: ["Decebal", "Traian", "Burebista", "Dromihete"], answer: 2 },
      { q: "În ce an a cucerit Traian Dacia?", options: ["101 d.Hr.", "106 d.Hr.", "100 î.Hr.", "200 d.Hr."], answer: 1 },
      { q: "Care este numărul zecimal pentru 1/2?", options: ["0.25", "0.75", "0.5", "1.2"], answer: 2 },
      { q: "Fracția 3/5 este:", options: ["Supraunitară", "Subunitară", "Egală cu 1", "Egală cu 0"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Fracții",
        description: "Exerciții variate cu fracții",
        intro: "Astăzi lucrăm cu fracțiile! Rețineti: numărătorul este deasupra liniei, numitorul dedesubt.",
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
            instruction: "Ordonează crescător fracțiile:",
            items: ["3/4, 1/4, 2/4, 4/4 → __ < __ < __ < __", "1/6, 4/6, 2/6, 5/6 → __ < __ < __ < __"],
            hint: "Când numitorii sunt egali, compari numărătorii.",
          },
          {
            instruction: "Problema: Ana a mâncat 2/8 dintr-o pizza. Ion a mâncat 3/8. Câtă pizza au mâncat împreună? Cât a rămas din pizza?",
            items: ["Mâncat împreună: 2/8 + 3/8 = __", "Ramas din pizza: 8/8 - __ = __"],
            hint: "Pizza întreagă = 8/8.",
          },
        ],
        tip: "Profesori: Folosiți pizza, torturi sau alte obiecte reale pentru demonstrarea conceptului de fracție înainte de fișă.",
      },
    ],
  },
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
            keyPoints: ["Mulțimea se notează: A = {1, 2, 3}", "Apartenența: 2 ∈ A (2 aparține lui A)", "Non-apartenența: 5 ∉ A (5 nu aparține)", "Mulțimea vidă: ∅ sau {} – fără elemente"],
            examples: [
              { label: "A = {1, 2, 3, 4}", value: "Mulțimea cifrelor de la 1 la 4" },
              { label: "B = {mere, pere, prune}", value: "Mulțimea fructelor" },
              { label: "C = {x | x < 5}", value: "Mulțimea numerelor mai mici decât 5" },
            ],
            exercise: "Fie A = {2, 4, 6, 8, 10}. Spune: 4 ∈ A? 7 ∈ A? Care e numărul de elemente al lui A?",
          },
          {
            title: "Reuniunea și intersecția",
            explanation: "Reuniunea (A ∪ B) conține TOATE elementele din A și B. Intersecția (A ∩ B) conține DOAR elementele comune celor două mulțimi.",
            keyPoints: ["A ∪ B = elementele din A SAU B (sau ambele)", "A ∩ B = elementele din A ȘI B", "Dacă A ∩ B = ∅, mulțimile sunt disjuncte", "Diagrama Venn vizualizează relațiile"],
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
        topics: ["Numerele negative", "Modulul unui număr", "Adunarea numerelor întregi", "Scăderea numerelor întregi"],
        pages: [
          {
            title: "Numere întregi – introducere",
            explanation: "Numerele întregi includ numerele naturale (pozitive), negativele lor și zero. Ele se reprezintă pe o axă: numerele pozitive sunt la dreapta lui 0, cele negative la stânga.",
            keyPoints: ["Z = {..., -3, -2, -1, 0, 1, 2, 3, ...}", "Numere pozitive: +1, +2, ... sau 1, 2, ...", "Numere negative: -1, -2, -3, ...", "0 nu este nici pozitiv, nici negativ"],
            examples: [
              { label: "Temperatură", value: "-5°C = 5 grade sub zero" },
              { label: "Etaj", value: "-1 = subsolul (sub parter)" },
              { label: "Finanțe", value: "-100 lei = datorie de 100 lei" },
            ],
            exercise: "Plasați pe axă: -4, -1, 0, 2, 5. Care este cel mai mic? Care este cel mai mare?",
          },
          {
            title: "Modulul și operații",
            explanation: "Modulul unui număr întreg este distanța față de 0 pe axă (întotdeauna pozitiv sau zero). Adunarea și scăderea numerelor întregi urmează reguli speciale.",
            keyPoints: ["|a| = a dacă a ≥ 0, sau -a dacă a < 0", "(-5)+(-3) = -(5+3) = -8", "(+7)+(-3) = +(7-3) = +4", "a-b = a+(-b) (scăderea devine adunare)"],
            examples: [
              { label: "|-7| = 7", value: "Distanța de la -7 la 0 este 7" },
              { label: "(-5)+3 = -2", value: "5-3=2, semnul: minus câștigă" },
              { label: "7-(-4) = 11", value: "7+4=11 (minus cu minus = plus)" },
            ],
            exercise: "Calculează: (-8)+3=__ | (-4)+(-6)=__ | 7-(-3)=__ | (-5)-(-2)=__",
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
            instruction: "Ordonează crescător:",
            items: ["-3, 5, -7, 0, 2, -1 → __ __ __ __ __ __", "-10, -5, 0, 3, -2, 8 → __ __ __ __ __ __"],
            hint: "Pe axă, numerele cresc de la stânga la dreapta.",
          },
          {
            instruction: "Problema: La munte, temperatura dimineața este -3°C. Peste zi crește cu 8 grade. Seara scade cu 12 grade față de temperatura de prânz. Care este temperatura seara?",
            items: ["Temperatura la prânz: -3 + 8 = __", "Temperatura seara: __ - 12 = __"],
          },
        ],
        tip: "Profesori: Folosiți axa numerelor pe tablă pentru a vizualiza adunările și scăderile cu numere negative.",
      },
    ],
  },
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
            title: "Triunghiuri",
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
            title: "Teorema lui Pitagora",
            explanation: "Într-un triunghi dreptunghic, catetele (a și b) și ipotenuza (c) respectă relația: a² + b² = c². Ipotenuza este latura opusă unghiului drept și este cea mai lungă.",
            keyPoints: ["a² + b² = c² (a, b = catete, c = ipotenuza)", "Ipotenuza este cea mai lungă latură", "Triunghiul 3-4-5: 9+16=25 ✓", "Se folosește pentru a calcula latura lipsă"],
            examples: [
              { label: "Catete 3, 4", value: "c² = 3²+4² = 9+16 = 25 → c = 5" },
              { label: "Catete 5, 12", value: "c² = 25+144 = 169 → c = 13" },
              { label: "Cateta lipsă", value: "a²= c²-b² = 100-36 = 64 → a=8" },
            ],
            exercise: "Calculează: catete 6 și 8 → ipotenuza = __ | ipotenuza 10, cateta 8 → cealaltă cateta = __",
          },
        ],
      },
    ],
    quiz: [
      { q: "Care este formula ariei triunghiului?", options: ["a × b", "(b × h) / 2", "b × h", "a + b + c"], answer: 1 },
      { q: "Suma unghiurilor unui triunghi este:", options: ["90°", "180°", "270°", "360°"], answer: 1 },
      { q: "Catete 3 și 4 → ipotenuza =?", options: ["5", "7", "6", "12"], answer: 0 },
      { q: "Ce teoremă leagă laturile unui triunghi dreptunghic?", options: ["Tales", "Pitagora", "Euler", "Arhimede"], answer: 1 },
      { q: "Perimetrul unui triunghi cu laturile 5, 7, 9 cm este:", options: ["19 cm", "21 cm", "63 cm", "18 cm"], answer: 1 },
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
    ],
  },
  {
    grade: 7,
    label: "Clasa VII",
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    studyItems: [
      {
        title: "Ecuații de gradul I",
        description: "Rezolvăm ecuații și probleme cu ecuații",
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
            title: "Sisteme de ecuații",
            explanation: "Un sistem de două ecuații cu două necunoscute (x, y) se rezolvă prin metoda substituției sau adunării/eliminării. Soluția este perechea (x, y) care satisface ambele ecuații.",
            keyPoints: ["Metoda substituției: exprimăm x în funcție de y (sau invers)", "Metoda adunării: adunăm ecuațiile pentru a elimina o necunoscută", "Verificăm soluția în ambele ecuații"],
            examples: [
              { label: "x+y=10 și x-y=2", value: "Adunăm: 2x=12 → x=6, y=4 | Verif: 6+4=10✓, 6-4=2✓" },
              { label: "Substituție: y=2x", value: "Înlocuim y=2x în a doua ecuație și rezolvăm x" },
            ],
            exercise: "Rezolvă sistemul: x+y=15 și x-y=3. Verifică soluția.",
          },
        ],
      },
    ],
    quiz: [
      { q: "Soluția ecuației 2x + 6 = 14 este:", options: ["x=3", "x=4", "x=5", "x=2"], answer: 1 },
      { q: "Dacă x + y = 10 și x - y = 2, atunci x =", options: ["4", "6", "8", "5"], answer: 1 },
      { q: "Rezolvând 5x = 35, x este:", options: ["5", "6", "7", "8"], answer: 2 },
      { q: "Proprietatea ecuațiilor: putem aduna același număr:", options: ["Doar în membrul stâng", "Doar în membrul drept", "În ambii membri", "Nu putem aduna"], answer: 2 },
      { q: "Ecuația 3(x+4) = 21 are soluția:", options: ["x=3", "x=5", "x=7", "x=9"], answer: 0 },
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
            items: ["Un număr înmulțit cu 3 și adunat cu 7 dă 22. Aflați numărul: 3x+7=22 → x=__", "Suma a două numere consecutive este 37. Aflați numerele: x+(x+1)=37 → x=__"],
          },
        ],
        tip: "Profesori: Insistați pe pasul de verificare – el dezvoltă gândirea critică și previne erorile.",
      },
    ],
  },
  {
    grade: 8,
    label: "Clasa VIII",
    color: "text-violet-600",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    studyItems: [
      {
        title: "Funcții liniare",
        description: "Funcția de gradul I și reprezentarea grafică",
        topics: ["Funcția f(x)=ax+b", "Panta și ordonata la origine", "Graficul funcției liniare", "Zeroul funcției"],
        pages: [
          {
            title: "Funcția liniară f(x) = ax + b",
            explanation: "O funcție liniară asociază fiecărui număr real x un alt număr real f(x). 'a' este panta (cât de abruptă e dreapta) și 'b' este ordonata la origine (unde intersectează axa Oy).",
            keyPoints: ["a = panta (rate of change)", "b = valoarea f(0) = intersecția cu Oy", "a > 0 → funcția este crescătoare", "a < 0 → funcția este descrescătoare", "Zeroul: f(x)=0 → x = -b/a"],
            examples: [
              { label: "f(x) = 2x + 3", value: "Pantă=2 (crescătoare), Oy=3 | f(0)=3, f(1)=5, f(-1)=1" },
              { label: "f(x) = -x + 4", value: "Pantă=-1 (descrescătoare), Oy=4 | Zero: x=4" },
              { label: "f(x) = 3x - 9", value: "Zero: 3x=9 → x=3 | Puncte: (0,-9), (3,0)" },
            ],
            exercise: "Calculează f(0), f(1), f(-2) pentru f(x)=3x-5. Găsești zeroul funcției.",
          },
          {
            title: "Graficul funcției liniare",
            explanation: "Graficul funcției liniare este o dreaptă. Se trasează găsind 2 puncte (de obicei A(0,b) și B(-b/a, 0)) și unim cu o linie dreaptă.",
            keyPoints: ["Două puncte determină o dreaptă", "Punctul A(0,b) = intersecția cu Oy", "Punctul B(-b/a, 0) = intersecția cu Ox (zero)", "Panta: la fiecare unitate pe Ox, f(x) crește cu 'a'"],
            examples: [
              { label: "f(x)=2x+1", value: "A(0,1), B(-0.5, 0) → dreapta crescătoare" },
              { label: "f(x)=-x+3", value: "A(0,3), B(3,0) → dreapta descrescătoare" },
            ],
            exercise: "Trasează graficul lui f(x)=2x-4. Găsește intersecțiile cu axele.",
          },
        ],
      },
      {
        title: "Legea lui Ohm",
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
    ],
    quiz: [
      { q: "Care este panta funcției f(x) = 3x - 5?", options: ["-5", "3", "3x", "0"], answer: 1 },
      { q: "Legea lui Ohm este:", options: ["P = U × I", "U = R × I", "I = P / U", "R = U + I"], answer: 1 },
      { q: "Dacă R=5Ω și I=2A, atunci U=?", options: ["2.5V", "10V", "7V", "3V"], answer: 1 },
      { q: "Zeroul funcției f(x) = 2x - 6 este:", options: ["x=2", "x=3", "x=6", "x=-3"], answer: 1 },
      { q: "Dacă U=220V și I=2A, atunci R=?", options: ["110Ω", "218Ω", "222Ω", "44Ω"], answer: 0 },
    ],
    worksheets: [
      {
        title: "Fișă – Funcții liniare și Legea lui Ohm",
        description: "Aplicăm cunoștințele din matematică și fizică",
        intro: "Fișă combinată: funcții liniare (matematică) + Legea lui Ohm (fizică).",
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

function QuizSection({ questions, cls }: { questions: QuizQuestion[]; cls: ClassData }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter((q, i) => answers[i] === q.answer).length : 0;

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="bg-white rounded-2xl border border-border/60 p-5 shadow-xs">
          <p className="font-semibold text-foreground mb-3 text-sm">{qi + 1}. {q.q}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.answer;
              const isWrong = submitted && selected && oi !== q.answer;
              return (
                <button
                  key={oi}
                  onClick={() => !submitted && setAnswers(prev => ({ ...prev, [qi]: oi }))}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-700" : isWrong ? "bg-red-50 border-red-300 text-red-700" : selected ? "bg-primary/8 border-primary text-primary" : "border-border/60 hover:border-border hover:bg-gray-50 text-muted-foreground"}`}
                >
                  <span className="mr-2 font-bold">{String.fromCharCode(65 + oi)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className={`text-xs mt-2 font-medium ${answers[qi] === q.answer ? "text-emerald-600" : "text-red-600"}`}>
              {answers[qi] === q.answer ? "✓ Corect!" : `✗ Răspuns corect: ${q.options[q.answer]}`}
            </p>
          )}
        </div>
      ))}
      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length} className="w-full gradient-primary text-white border-0 rounded-xl font-bold shadow-sm hover:opacity-90">
          Verifică răspunsurile ({Object.keys(answers).length}/{questions.length} răspunse)
        </Button>
      ) : (
        <div className="bg-white rounded-2xl border border-border/60 p-5 text-center shadow-xs">
          <p className="text-3xl font-black text-foreground">{score}/{questions.length}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {score === questions.length ? "Excelent! 🎉 Ai răspuns corect la toate!" : score >= Math.ceil(questions.length / 2) ? "Bine! Mai exersează puțin." : "Mai trebuie să înveți. Nu te descuraja!"}
          </p>
          <Button onClick={() => { setAnswers({}); setSubmitted(false); }} variant="outline" className="mt-3 rounded-xl text-sm">Încearcă din nou</Button>
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  usePageTitle("Materiale pe clase");
  const [selectedGrade, setSelectedGrade] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("invatat");
  const [openStudyItem, setOpenStudyItem] = useState<StudyItem | null>(null);
  const [openWorksheet, setOpenWorksheet] = useState<Worksheet | null>(null);

  const cls = CLASSES[selectedGrade];

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
            <h1 className="text-2xl font-black text-foreground">Materiale pe clase</h1>
            <p className="text-sm text-muted-foreground">Alege clasa ta și accesează materiale, quizuri și fișe de lucru</p>
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
