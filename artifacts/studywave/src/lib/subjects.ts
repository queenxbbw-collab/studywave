export const SUBJECT_LABELS: Record<string, string> = {
  all: "Toate",
  Mathematics: "Matematică",
  Physics: "Fizică",
  Chemistry: "Chimie",
  Biology: "Biologie",
  History: "Istorie",
  Geography: "Geografie",
  Literature: "Literatură",
  "Computer Science": "Informatică",
  Economics: "Economie",
  Languages: "Limbi Străine",
  Philosophy: "Filosofie",
  Psychology: "Psihologie",
  Music: "Muzică",
  Art: "Artă",
  Engineering: "Inginerie",
  Medicine: "Medicină",
  Environment: "Mediu",
  Law: "Drept",
  Sports: "Sport",
  Other: "Altele",
};

export const SUBJECTS_LIST = [
  "Mathematics","Physics","Chemistry","Biology","History","Geography",
  "Literature","Computer Science","Economics","Languages",
  "Philosophy","Psychology","Music","Art","Engineering","Medicine","Environment","Law","Sports",
  "Other"
];

export function subjectLabel(subject: string): string {
  return SUBJECT_LABELS[subject] ?? subject;
}
