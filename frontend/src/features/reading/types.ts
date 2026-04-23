export type BookDetail = {
  id: string;
  title: string;
  isbn?: string;
  pdfUrl?: string | null;
  coverUrl?: string | null;
  numberOfPages: number;
  hasPdf: boolean;
  source?: "LOCAL" | "OPEN";
};

export type NarrativeCharacter = {
  name: string;
  role: string;
  note: string;
};

export type NarrativeQuiz = {
  id: string;
  question: string;
  options: string[];
  correctOption: string;
  explanation: string;
};

export type NarrativeAchievement = {
  code: string;
  title: string;
  description: string;
  flashcardSymbol: string;
  unlockPage: number;
  unlocked: boolean;
};

export type NarrativeInsight = {
  bookId: string;
  currentPage: number;
  phase: "BEGINNING" | "MIDDLE" | "CLIMAX" | null;
  beatTitle: string | null;
  plotState: string;
  knownCharacters: NarrativeCharacter[];
  quizzes: NarrativeQuiz[];
  achievements: NarrativeAchievement[];
};

export type HomeReading = {
  id: string;
  status: string;
  currentPage: number;
  progress: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  lastReadedAt?: string | null;
  book: {
    id: string;
    title: string;
  };
};

export type HomeResumeResponse = {
  readings: HomeReading[];
};

export type Favorite = {
  bookId: string;
};

export type ReadingSyncResponse = {
  id: string;
  status: string;
  currentPage: number;
  progress: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  lastReadedAt?: string | null;
};

export type CachedReaderLookup = {
  embedUrl: string | null;
  fallbackUrl: string | null;
  cachedAt: number;
};
