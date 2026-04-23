export type Metrics = {
  totalUsers: number;
  totalBooks: number;
  totalReviews: number;
  totalFavorites: number;
  totalCollections: number;
  totalTags: number;
};

export type Category = { id: string; name: string; description?: string | null };
export type Tag = { id: string; name: string };
export type CategoryRef = { id: string; name: string };

export type Book = {
  id: string;
  title: string;
  author?: string | null;
  isbn?: string;
  numberOfPages?: number;
  publicationDate?: string;
  coverUrl?: string | null;
  categories?: CategoryRef[];
  hasPdf?: boolean;
};

export type Collection = {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  books?: Book[];
};

export type BadgeCode =
  | "FIRST_BOOK_FINISHED"
  | "STREAK_7_DAYS"
  | "STREAK_30_DAYS"
  | "TOTAL_BOOKS_10"
  | "TOTAL_PAGES_1000";

export type BadgeCriteria = "FIRST_BOOK" | "STREAK_DAYS" | "TOTAL_BOOKS" | "TOTAL_PAGES";

export type Badge = {
  id: string;
  code: BadgeCode;
  name: string;
  description?: string | null;
  criteriaType: BadgeCriteria;
  criteriaValue?: string | null;
  active: boolean;
};

export type UserAdmin = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  leaderboardOptIn: boolean;
  alertsOptIn: boolean;
  badges?: { id: string; name: string }[];
};

export type UserForm = {
  id: string | null;
  name: string;
  email: string;
  leaderboardOptIn: boolean;
  alertsOptIn: boolean;
};

export type FavoriteAdmin = {
  bookId: string;
  bookTitle: string;
  bookIsbn?: string | null;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
  createdAt?: string | null;
};

export type AlertDeliveryAdmin = {
  id: string;
  userId: string;
  email: string;
  alertType: string;
  channel: string;
  status: string;
  message: string;
  createdAt?: string | null;
};

export type Page<T> = { content: T[] };
export type ImportResult = { fetched: number; imported: number; skipped: number; failed: number };

export type CategoryForm = { id: string | null; name: string; description: string };
export type TagForm = { id: string | null; name: string };
export type CollectionForm = { id: string | null; title: string; description: string; coverUrl: string; bookIds: string[] };

export type BookForm = {
  id: string | null;
  title: string;
  author: string;
  isbn: string;
  numberOfPages: number;
  publicationDate: string;
  coverUrl: string;
  categoryIds: string[];
};

export type BadgeForm = {
  id: string | null;
  code: BadgeCode;
  name: string;
  description: string;
  criteriaType: BadgeCriteria;
  criteriaValue: string;
  active: boolean;
};

export const BADGE_CODES: BadgeCode[] = [
  "FIRST_BOOK_FINISHED",
  "STREAK_7_DAYS",
  "STREAK_30_DAYS",
  "TOTAL_BOOKS_10",
  "TOTAL_PAGES_1000",
];

export const BADGE_CRITERIA: BadgeCriteria[] = ["FIRST_BOOK", "STREAK_DAYS", "TOTAL_BOOKS", "TOTAL_PAGES"];

export const EMPTY_CATEGORY: CategoryForm = { id: null, name: "", description: "" };
export const EMPTY_TAG: TagForm = { id: null, name: "" };
export const EMPTY_COLLECTION: CollectionForm = { id: null, title: "", description: "", coverUrl: "", bookIds: [] };
export const EMPTY_USER: UserForm = { id: null, name: "", email: "", leaderboardOptIn: false, alertsOptIn: true };
export const EMPTY_BOOK: BookForm = {
  id: null,
  title: "",
  author: "",
  isbn: "",
  numberOfPages: 150,
  publicationDate: "2020-01-01",
  coverUrl: "",
  categoryIds: [],
};
export const EMPTY_BADGE: BadgeForm = {
  id: null,
  code: "TOTAL_BOOKS_10",
  name: "Meta de 10 livros",
  description: "Badge criada no painel admin",
  criteriaType: "TOTAL_BOOKS",
  criteriaValue: "10",
  active: true,
};
