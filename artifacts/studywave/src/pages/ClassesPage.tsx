import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { BookOpen, Brain, FileText, ChevronRight, CheckCircle2, Circle, Printer, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "invatat" | "quiz" | "fise";

interface StudyItem {
  title: string;
  description: string;
  topics: string[];
}

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

interface Worksheet {
  title: string;
  description: string;
  content: string[];
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
        topics: ["Litera A (Albină, Ars)", "Litera B (Balon, Băiat)", "Litera C (Cal, Casă)", "Litera D (Dor, Drum)", "Litera E (Elefant, Eu)", "Literele F-Z"],
      },
      {
        title: "Sunete și silabe",
        description: "Cum descompunem cuvintele în silabe și sunete",
        topics: ["Vocale: a, e, i, o, u", "Consoane", "Silabe: ma-mă, pa-pă", "Câte silabe are cuvântul?"],
      },
      {
        title: "Numerele 0-20",
        description: "Numărăm, scriem și comparăm numere",
        topics: ["Numărăm de la 0 la 10", "Numărăm de la 10 la 20", "Mai mult / mai puțin", "Adunări simple (1+1=2)"],
      },
      {
        title: "Forme geometrice",
        description: "Recunoaștem formele din jurul nostru",
        topics: ["Cerc", "Pătrat", "Triunghi", "Dreptunghi"],
      },
    ],
    quiz: [
      { q: "Cum arată litera 'A' mică?", options: ["a", "A", "â", "ă"], answer: 0 },
      { q: "Câte silabe are cuvântul 'ma-mă'?", options: ["1", "2", "3", "4"], answer: 1 },
      { q: "Care număr vine după 5?", options: ["4", "7", "6", "8"], answer: 2 },
      { q: "Ce formă are roata unei biciclete?", options: ["Pătrat", "Triunghi", "Cerc", "Dreptunghi"], answer: 2 },
      { q: "Câte vocale are cuvântul 'casă'?", options: ["1", "2", "3", "4"], answer: 1 },
      { q: "Care este litera care urmează după A?", options: ["C", "B", "D", "E"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Literele A, B, C",
        description: "Exersăm scrierea literelor A, B și C",
        content: [
          "Scrie litera A de 5 ori: __ __ __ __ __",
          "Scrie litera a de 5 ori: __ __ __ __ __",
          "Colorează obiectele care încep cu A: Albină, Cal, Avion, Pisică",
          "Completează: ___lbină, ___vion, ___rici",
          "Unește imaginea cu litera corespunzătoare: Balon → B, Cal → C",
        ],
      },
      {
        title: "Fișă – Numere 1-10",
        description: "Numărăm și scriem numerele de la 1 la 10",
        content: [
          "Scrie numărul care lipsește: 1, 2, __, 4, __, 6, __, 8, 9, __",
          "Numără obiectele și scrie cifra: 🍎🍎🍎 = __",
          "Unește numărul cu grupul de obiecte corespunzător",
          "Colorează 5 stele din 8: ★★★★★★★★",
          "Care este mai mare? Încercuiește: 3 sau 7",
        ],
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
        topics: ["Propoziția: Ce este?", "Subiectul propoziției", "Predicatul propoziției", "Semnele de punctuație: . ! ?"],
      },
      {
        title: "Adunarea și scăderea 0-100",
        description: "Calculăm cu numere mai mari",
        topics: ["Adunarea cu trecere peste zece", "Scăderea cu trecere peste zece", "Verificarea rezultatului", "Probleme cu adunare și scădere"],
      },
      {
        title: "Lumea vie",
        description: "Plante, animale și mediul înconjurător",
        topics: ["Plante: rădăcină, tulpină, frunze, floare", "Animale domestice", "Animale sălbatice", "Anotimpurile"],
      },
    ],
    quiz: [
      { q: "Ce este propoziția?", options: ["Un cuvânt izolat", "O înșiruire de cuvinte care exprimă o idee", "Doar un substantiv", "O silabă"], answer: 1 },
      { q: "Cât face 35 + 27?", options: ["52", "62", "63", "61"], answer: 1 },
      { q: "Ce parte a plantei absoarbe apa din pământ?", options: ["Frunza", "Floarea", "Rădăcina", "Tulpina"], answer: 2 },
      { q: "Câte anotimpuri are un an?", options: ["2", "3", "4", "12"], answer: 2 },
      { q: "Cât face 80 - 35?", options: ["55", "45", "35", "40"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Propoziții",
        description: "Construim și completăm propoziții",
        content: [
          "Scrie câte o propoziție cu fiecare cuvânt: casă, copil, soare",
          "Pune semnul de punctuație corect: Vino aici__  Ce frumos__  Stai__",
          "Completează propozițiile: Mama ___ la piață. Câinele ___ în curte.",
          "Ordonează cuvintele: merge / școala / la / Andrei",
          "Scrie 3 propoziții despre anotimpul tău preferat.",
        ],
      },
      {
        title: "Fișă – Adunare și scădere",
        description: "Exerciții practice de calcul",
        content: [
          "Calculează: 45 + 23 = __   37 + 46 = __   29 + 51 = __",
          "Calculează: 75 - 32 = __   88 - 45 = __   60 - 27 = __",
          "Problema: Maria are 34 de mere. Dă 16 colegilor. Câte mere rămân?",
          "Completează: 45 + __ = 70   __ - 23 = 40",
          "Verifică rezultatele prin proba adunării/scăderii.",
        ],
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
        title: "Părțile de vorbire",
        description: "Substantiv, adjectiv, verb și pronume",
        topics: ["Substantivul: ce este, feluri", "Adjectivul: cum se acordă", "Verbul: acțiuni și stări", "Pronumele personal"],
      },
      {
        title: "Înmulțirea și împărțirea",
        description: "Tabla înmulțirii și împărțirea exactă",
        topics: ["Tabla înmulțirii 1-10", "Împărțirea ca operație inversă", "Probleme cu înmulțire", "Ordinea operațiilor"],
      },
      {
        title: "Geografia României",
        description: "Regiunile, munții și apele României",
        topics: ["Carpații: Orientali, Meridionali, Occidentali", "Dunărea și Marea Neagră", "Câmpia, Dealurile, Munții", "Orașe importante"],
      },
    ],
    quiz: [
      { q: "Care cuvânt este un substantiv?", options: ["frumos", "a merge", "casă", "el"], answer: 2 },
      { q: "Cât face 7 × 8?", options: ["54", "56", "63", "48"], answer: 1 },
      { q: "Care sunt Carpații din sudul României?", options: ["Orientali", "Occidentali", "Meridionali", "Apuseni"], answer: 2 },
      { q: "Ce este adjectivul?", options: ["Exprimă o acțiune", "Denumește o ființă", "Arată însușirea unui substantiv", "Înlocuiește un substantiv"], answer: 2 },
      { q: "Cât face 72 ÷ 9?", options: ["7", "9", "8", "6"], answer: 2 },
    ],
    worksheets: [
      {
        title: "Fișă – Substantiv și adjectiv",
        description: "Identificăm și folosim corect",
        content: [
          "Subliniază substantivele: Băiatul frumos aleargă în parc.",
          "Încercuiește adjectivele: casa mare, câine negru, floare roșie",
          "Potrivește adjectivul cu substantivul: mic/mică, mare/mare",
          "Scrie câte 3 adjective pentru: casă, copil, cer",
          "Formează propoziții cu: băiat + înalt, carte + interesantă",
        ],
      },
      {
        title: "Fișă – Tabla înmulțirii",
        description: "Exersăm tabla înmulțirii",
        content: [
          "Completează: 6 × __ = 42   __ × 7 = 63   8 × 9 = __",
          "Calculează: 5 × 6 + 3 =    4 × 7 - 8 =    9 × 3 + 5 =",
          "Problema: Un coș are 8 mere. Câte mere au 6 coșuri?",
          "Împărțiri: 56 ÷ 7 = __   72 ÷ 8 = __   45 ÷ 9 = __",
          "Completează tabla înmulțirii cu 7: 7×1=  7×2=  7×3= ... 7×10=",
        ],
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
        title: "Textul literar",
        description: "Analizăm texte literare și identificăm personaje",
        topics: ["Personaje principale și secundare", "Momentele subiectului", "Mijloace de expresivitate", "Poezie vs. proză"],
      },
      {
        title: "Fracții și zecimale",
        description: "Numere raționale și operații cu ele",
        topics: ["Ce este o fracție?", "Fracții subunitare și supraunitare", "Adunarea fracțiilor", "Numere zecimale"],
      },
      {
        title: "Istoria României – Origini",
        description: "Dacii, romanii și formarea poporului român",
        topics: ["Dacii: cine erau", "Burebista și Decebal", "Cucerirea romană (106 d.Hr.)", "Formarea limbii române"],
      },
    ],
    quiz: [
      { q: "Ce este momentul culminant al subiectului?", options: ["Introducerea personajelor", "Punctul de maxima tensiune", "Finalul poveștii", "Prezentarea locului"], answer: 1 },
      { q: "Cât este 3/4 + 1/4?", options: ["4/8", "4/4 (=1)", "2/4", "3/8"], answer: 1 },
      { q: "Cine a fost regele dacilor care a unit triburile?", options: ["Decebal", "Traian", "Burebista", "Dromihete"], answer: 2 },
      { q: "În ce an a cucerit Traian Dacia?", options: ["101 d.Hr.", "106 d.Hr.", "100 î.Hr.", "200 d.Hr."], answer: 1 },
      { q: "Care este numărul zecimal pentru 1/2?", options: ["0.25", "0.75", "0.5", "1.2"], answer: 2 },
    ],
    worksheets: [
      {
        title: "Fișă – Fracții",
        description: "Exerciții cu fracții",
        content: [
          "Colorează 3/8 dintr-un dreptunghi împărțit în 8 părți egale.",
          "Calculează: 2/5 + 1/5 = __   4/6 - 2/6 = __   3/8 + 3/8 = __",
          "Scrie ca fracție: o jumătate, un sfert, trei sferturi",
          "Problema: Ana a mâncat 2/6 dintr-o pizza. Ion a mâncat 3/6. Cât au mâncat împreună?",
          "Ordonează crescător: 3/4, 1/4, 2/4, 4/4",
        ],
      },
      {
        title: "Fișă – Dacii și Romanii",
        description: "Consolidarea cunoștințelor istorice",
        content: [
          "Completează: Dacii trăiau pe teritoriul numit ___.",
          "Cine a fost cel mai mare rege al dacilor? ___",
          "Romanii au cucerit Dacia în anul ___.",
          "Scrie 3 lucruri pe care le-au adus romanii în Dacia:",
          "De ce se numesc români locuitorii țării noastre?",
        ],
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
        title: "Gramatica limbii române",
        description: "Morfologie și sintaxă",
        topics: ["Substantivul: cazuri (N, Ac, G, D, V)", "Verbul: moduri și timpuri", "Atributul și complementul", "Propoziția simplă și dezvoltată"],
      },
      {
        title: "Matematică – Mulțimi și numere",
        description: "Teoria mulțimilor și numere întregi",
        topics: ["Mulțimi și elemente", "Operații cu mulțimi: reuniune, intersecție", "Numere întregi (negative)", "Modulul unui număr"],
      },
      {
        title: "Biologie – Celula",
        description: "Unitatea fundamentală a vieții",
        topics: ["Structura celulei", "Celula animală vs. vegetală", "Membrana, citoplasma, nucleul", "Funcțiile celulei"],
      },
    ],
    quiz: [
      { q: "În ce caz este substantivul în: 'Cartea Mariei'?", options: ["Nominativ", "Acuzativ", "Genitiv", "Dativ"], answer: 2 },
      { q: "Ce este intersecția mulțimilor A și B?", options: ["Elementele din A sau B", "Elementele comune", "Elementele doar din A", "Toate elementele"], answer: 1 },
      { q: "Care este modulul numărului -7?", options: ["-7", "7", "0", "1/7"], answer: 1 },
      { q: "Ce organit produce energie în celulă?", options: ["Nucleul", "Membrana", "Mitocondria", "Ribozomul"], answer: 2 },
      { q: "Care este predicatul în: 'Copilul aleargă'?", options: ["Copilul", "aleargă", "nu există", "ambele"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Cazurile substantivului",
        description: "Identificăm cazurile",
        content: [
          "Identifică cazul: 'Mama (___) gătește. Îi dau mamei (___) o floare.'",
          "Pune la Genitiv: casa → casa ___,  băiatul → băiatul ___",
          "Construiește propoziții cu substantivul 'carte' la toate cele 5 cazuri.",
          "Subliniază substantivele și specifică cazul: Elena citește cartea fetei.",
          "Completează: Vocativul exprimă ___ și se folosește când ___.",
        ],
      },
      {
        title: "Fișă – Numere întregi",
        description: "Operații cu numere întregi",
        content: [
          "Calculează: (-5) + 3 = __   7 + (-9) = __   (-4) + (-6) = __",
          "Calculează: (-8) - (-3) = __   5 - 9 = __   (-2) - 4 = __",
          "Ordonează crescător: -3, 5, -7, 0, 2, -1",
          "Calculează modulul: |-8| = __   |5| = __   |-0| = __",
          "Problema: La munte, temperatura e -3°C. Scade cu 5 grade. Ce temperatură e acum?",
        ],
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
        description: "Figuri geometrice și proprietățile lor",
        topics: ["Triunghiuri: clasificare, perimetru, arie", "Patrulater: pătrat, dreptunghi, romb", "Cercul: raza, diametrul, circumferința", "Teorema lui Pitagora (introducere)"],
      },
      {
        title: "Fizică – Mișcare și forțe",
        description: "Principiile mecanicii clasice",
        topics: ["Mișcarea și repausul", "Viteza medie", "Forța și unitatea de măsură (N)", "Greutatea vs. masa"],
      },
      {
        title: "Geografie – Europa",
        description: "Relieful, clima și țările Europei",
        topics: ["Relieful Europei", "Marile fluvii europene", "Clima în Europa", "Țări și capitale"],
      },
    ],
    quiz: [
      { q: "Care este formula ariei triunghiului?", options: ["a × b", "(b × h) / 2", "b × h", "a + b + c"], answer: 1 },
      { q: "Câți metri are un km?", options: ["10", "100", "1000", "10000"], answer: 2 },
      { q: "Care este capitala Franței?", options: ["Berlin", "Madrid", "Paris", "Roma"], answer: 2 },
      { q: "Unitatea de măsură pentru forță este:", options: ["kg", "m/s", "N (Newton)", "J"], answer: 2 },
      { q: "Ce teoremă leagă cele 3 laturi ale unui triunghi dreptunghic?", options: ["Tales", "Pitagora", "Euler", "Arhimede"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Arii și perimetre",
        description: "Calculăm arii și perimetre",
        content: [
          "Calculează perimetrul unui pătrat cu latura 6cm: P = __",
          "Calculează aria unui dreptunghi cu l=8cm și L=12cm: A = __",
          "Un triunghi are baza=10cm și înălțimea=6cm. Aria = __",
          "Calculează circumferința unui cerc cu r=7cm (π≈3,14): C = __",
          "Problema: Un teren dreptunghiular are l=15m, L=25m. Cât costă gardarea lui dacă 1m de gard costă 50 lei?",
        ],
      },
      {
        title: "Fișă – Viteza",
        description: "Calculăm viteza, distanța și timpul",
        content: [
          "Formula vitezei: v = ___ / ___",
          "Un tren parcurge 360 km în 3 ore. Viteza medie = __",
          "O mașină merge cu 90 km/h timp de 2h. Distanța = __",
          "Cât timp îi trebuie unui ciclst care merge 15 km/h să parcurgă 45 km? t = __",
          "Convertește: 72 km/h = __ m/s",
        ],
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
        title: "Algebră – Ecuații",
        description: "Ecuații de gradul I și sisteme",
        topics: ["Ecuații de gradul I cu o necunoscută", "Inecuații de gradul I", "Sisteme de două ecuații", "Probleme cu ecuații"],
      },
      {
        title: "Chimie – Substanțe și reacții",
        description: "Principiile chimiei generale",
        topics: ["Atomi și molecule", "Elementele chimice și Tabelul periodic", "Reacții chimice", "Acizi, baze și săruri"],
      },
      {
        title: "Istoria Medievală",
        description: "Evul Mediu în Europa și România",
        topics: ["Feudalismul", "Cruciadele", "Statele medievale române", "Ștefan cel Mare"],
      },
    ],
    quiz: [
      { q: "Soluția ecuației 2x + 6 = 14 este:", options: ["x=3", "x=4", "x=5", "x=2"], answer: 1 },
      { q: "Simbolul chimic al aurului este:", options: ["Ag", "Au", "Al", "Fe"], answer: 1 },
      { q: "Cine a luptat la Podul Înalt (1475)?", options: ["Mihai Viteazul", "Vlad Țepeș", "Ștefan cel Mare", "Alexandru cel Bun"], answer: 2 },
      { q: "Ce tip de reacție chimică este arderea?", options: ["Sinteză", "Descompunere", "Oxidare (combustie)", "Neutralizare"], answer: 2 },
      { q: "Inecuația x + 3 > 7 are soluția:", options: ["x < 4", "x > 4", "x = 4", "x > 10"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Ecuații de gradul I",
        description: "Rezolvăm ecuații pas cu pas",
        content: [
          "Rezolvă: 3x - 5 = 10   →   3x = __   →   x = __",
          "Rezolvă: 2(x + 4) = 16   →   2x + 8 = 16   →   x = __",
          "Rezolvă sistemul: x + y = 10 și x - y = 2",
          "Problema: Un număr înmulțit cu 3 și adunat cu 7 dă 22. Găsește numărul.",
          "Rezolvă și verifică: 5x + 3 = 3x + 11",
        ],
      },
      {
        title: "Fișă – Reacții chimice",
        description: "Tipuri de reacții și ecuații chimice",
        content: [
          "Completează: H₂ + O₂ → ___ (reacție de sinteză)",
          "Identifică tipul de reacție: CaCO₃ → CaO + CO₂",
          "Echilibrează: _H₂ + _O₂ → _H₂O",
          "Scrie formulele: acid clorhidric ___, hidroxid de sodiu ___",
          "Ce se formează când un acid reacționează cu o bază? ___",
        ],
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
        title: "Matematică – Funcții",
        description: "Funcții liniare și cuadratice",
        topics: ["Funcția liniară f(x) = ax + b", "Graficul funcției liniare", "Funcția de gradul II", "Ecuații de gradul II"],
      },
      {
        title: "Fizică – Electricitate",
        description: "Curentul electric și circuitele",
        topics: ["Curentul electric: intensitate, tensiune", "Legea lui Ohm: U = R × I", "Circuite serie și paralel", "Puterea electrică"],
      },
      {
        title: "Română – Bacalaureatul",
        description: "Pregătire pentru Evaluarea Națională",
        topics: ["Texte literare și non-literare", "Redactarea unui eseu", "Figuri de stil", "Morfologie și sintaxă avansată"],
      },
    ],
    quiz: [
      { q: "Care este panta funcției f(x) = 3x - 5?", options: ["-5", "3", "3x", "0"], answer: 1 },
      { q: "Legea lui Ohm este:", options: ["P = U × I", "U = R × I", "I = P / U", "R = U + I"], answer: 1 },
      { q: "Soluțiile ecuației x² - 5x + 6 = 0 sunt:", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], answer: 1 },
      { q: "Ce figură de stil este: 'Luna, ca o felie de portocală'?", options: ["Metaforă", "Personificare", "Comparație", "Hiperbolă"], answer: 2 },
      { q: "Dacă R=5Ω și I=2A, atunci U=?", options: ["2.5V", "10V", "7V", "3V"], answer: 1 },
    ],
    worksheets: [
      {
        title: "Fișă – Funcții liniare",
        description: "Reprezintă și analizează funcții",
        content: [
          "Calculează f(0), f(1), f(-1) pentru f(x) = 2x + 3",
          "Trasează graficul funcției f(x) = -x + 4 (pe hârtie de grafic)",
          "Determină a și b dacă graficul trece prin (0,2) și (1,5)",
          "Găsește zero funcției: 3x - 9 = 0 → x = __",
          "Problema: Un taxi costă 5 lei + 3 lei/km. Scrie funcția costului și calculează pentru 10 km.",
        ],
      },
      {
        title: "Fișă – Legea lui Ohm",
        description: "Calcule cu curent electric",
        content: [
          "Dacă U=12V și R=4Ω, calculează I = ___",
          "Dacă I=3A și R=6Ω, calculează U = ___",
          "Dacă U=220V și I=2A, calculează R = ___",
          "Calculează puterea: P = U × I dacă U=12V și I=5A → P = ___",
          "Problema: Un bec de 60W funcționează la 220V. Ce curent consumă?",
        ],
      },
    ],
  },
];

function QuizSection({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => (
        <div key={qi} className="bg-white rounded-2xl border border-border/60 p-5 shadow-xs">
          <p className="font-semibold text-foreground mb-3 text-sm">
            {qi + 1}. {q.q}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.answer;
              const isWrong = submitted && selected && oi !== q.answer;
              return (
                <button
                  key={oi}
                  onClick={() => !submitted && setAnswers(prev => ({ ...prev, [qi]: oi }))}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : isWrong
                      ? "bg-red-50 border-red-300 text-red-700"
                      : selected
                      ? "bg-primary/8 border-primary text-primary"
                      : "border-border/60 hover:border-border hover:bg-gray-50 text-muted-foreground"
                  }`}
                >
                  <span className="mr-2 font-bold">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
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
        <Button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full gradient-primary text-white border-0 rounded-xl font-bold shadow-sm hover:opacity-90"
        >
          Verifică răspunsurile ({Object.keys(answers).length}/{questions.length} răspunse)
        </Button>
      ) : (
        <div className="bg-white rounded-2xl border border-border/60 p-5 text-center shadow-xs">
          <p className="text-3xl font-black text-foreground">{score}/{questions.length}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {score === questions.length ? "Excelent! 🎉 Ai răspuns corect la toate!" : score >= questions.length / 2 ? "Bine! Mai exersează puțin." : "Mai trebuie să înveți. Nu te descuraja!"}
          </p>
          <Button
            onClick={() => { setAnswers({}); setSubmitted(false); }}
            variant="outline"
            className="mt-3 rounded-xl text-sm"
          >
            Încearcă din nou
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  usePageTitle("Materiale pe clase");
  const [selectedGrade, setSelectedGrade] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("invatat");

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
            <p className="text-sm text-muted-foreground">Alege clasa ta și accesează materiale de studiu, quizuri și fișe</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grade selector sidebar */}
        <div className="lg:w-48 flex-shrink-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Alege clasa</p>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {CLASSES.map((c, i) => (
              <button
                key={c.grade}
                onClick={() => { setSelectedGrade(i); setActiveTab("invatat"); }}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  selectedGrade === i
                    ? `${c.bg} ${c.ring} ring-1 ${c.color} border-transparent`
                    : "border-border/60 text-muted-foreground hover:border-border hover:bg-gray-50"
                }`}
              >
                <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black ${selectedGrade === i ? c.bg : "bg-gray-100"} ${selectedGrade === i ? c.color : "text-muted-foreground"}`}>
                  {c.grade}
                </span>
                <span className="hidden lg:block">{c.label}</span>
                <span className="lg:hidden">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className={`rounded-2xl ${cls.bg} ${cls.ring} ring-1 p-5 mb-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-black ${cls.color}`}>{cls.label}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{cls.studyItems.length} capitole · {cls.quiz.length} întrebări quiz · {cls.worksheets.length} fișe</p>
              </div>
              <ChevronRight className={`h-5 w-5 ${cls.color} opacity-50`} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "invatat" && (
            <div className="space-y-4">
              {cls.studyItems.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border/60 p-5 shadow-xs">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${cls.bg} flex items-center justify-center flex-shrink-0`}>
                      <BookOpen className={`h-4 w-4 ${cls.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 ml-11">
                    {item.topics.map((topic, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Circle className={`h-3 w-3 mt-0.5 flex-shrink-0 ${cls.color} opacity-60`} fill="currentColor" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === "quiz" && (
            <QuizSection questions={cls.quiz} />
          )}

          {activeTab === "fise" && (
            <div className="space-y-5">
              {cls.worksheets.map((ws, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                  <div className={`${cls.bg} px-5 py-4 flex items-center justify-between`}>
                    <div>
                      <h3 className={`font-bold ${cls.color}`}>{ws.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{ws.description}</p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className={`flex items-center gap-1.5 text-xs font-semibold ${cls.color} hover:opacity-70 transition-opacity`}
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Printează</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    {ws.content.map((line, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className={`h-6 w-6 rounded-full ${cls.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className={`text-xs font-bold ${cls.color}`}>{j + 1}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{line}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-5">
                    <div className="border border-dashed border-border/60 rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground">Spațiu pentru răspunsuri / notițe</p>
                      <div className="mt-2 space-y-2">
                        {Array.from({ length: 4 }).map((_, k) => (
                          <div key={k} className="h-px bg-border/40 w-full" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  <strong>Sfat pentru profesori:</strong> Fișele pot fi printate direct din browser (Ctrl+P / ⌘P). 
                  Conținutul este optimizat pentru formatul A4.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
