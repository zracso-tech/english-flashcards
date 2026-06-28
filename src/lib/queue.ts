import type { CardWithProgress, CardStatus } from "./types";
import { MASTERY_THRESHOLD, RECALL_DAYS } from "./types";

export function getStatus(c: { streak: number; mastered_at: string | null }): CardStatus {
  if (c.streak >= MASTERY_THRESHOLD) {
    if (!c.mastered_at) return "mastered";
    const daysSince = (Date.now() - new Date(c.mastered_at).getTime()) / 86400000;
    return daysSince >= RECALL_DAYS ? "recall" : "mastered";
  }
  return c.streak === 0 ? "active" : "in_progress";
}

// Cards eligible for this session: active + in_progress + recall (mastered hidden).
export function buildQueue(cards: CardWithProgress[]): CardWithProgress[] {
  const eligible = cards.filter((c) => {
    const s = getStatus(c);
    return s === "active" || s === "in_progress" || s === "recall";
  });
  // Shuffle (Fisher-Yates) so order isn't predictable.
  const arr = [...eligible];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function statusLabel(s: CardStatus): string {
  switch (s) {
    case "mastered": return "Dominada";
    case "recall": return "Repasar";
    case "in_progress": return "En progreso";
    case "active": return "Activa";
  }
}

export function statusBadgeClasses(s: CardStatus): string {
  switch (s) {
    case "mastered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "recall":   return "bg-amber-50 text-amber-700 border-amber-200";
    case "in_progress": return "bg-sky-50 text-sky-700 border-sky-200";
    case "active":   return "bg-stone-100 text-stone-600 border-stone-200";
  }
}
