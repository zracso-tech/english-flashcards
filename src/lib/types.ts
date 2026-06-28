export type Card = {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  module: string;
  created_at: string;
  updated_at: string;
};

export type Progress = {
  user_id: string;
  card_id: string;
  streak: number;
  last_seen_at: string | null;
  mastered_at: string | null;
};

export type Session = {
  user_id: string;
  date: string;
  correct: number;
  wrong: number;
};

export type CardWithProgress = Card & {
  streak: number;
  last_seen_at: string | null;
  mastered_at: string | null;
};

export type CardStatus = "active" | "in_progress" | "mastered" | "recall";

export const MASTERY_THRESHOLD = 3;
export const RECALL_DAYS = 7;
