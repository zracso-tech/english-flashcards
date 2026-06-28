"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MASTERY_THRESHOLD } from "@/lib/types";

// ──────────────── Progress ────────────────

export async function markCard(cardId: string, correct: boolean) {
  const supabase = await createClient();

  const { data: prev } = await supabase
    .from("card_progress")
    .select("streak, mastered_at")
    .eq("card_id", cardId)
    .maybeSingle();

  const prevStreak = prev?.streak ?? 0;
  const newStreak = correct ? prevStreak + 1 : 0;
  const justMastered = correct && prevStreak < MASTERY_THRESHOLD && newStreak >= MASTERY_THRESHOLD;
  const lostMastery = !correct && prevStreak >= MASTERY_THRESHOLD;

  const mastered_at = justMastered
    ? new Date().toISOString()
    : lostMastery
      ? null
      : (prev?.mastered_at ?? null);

  await supabase.from("card_progress").upsert({
    card_id: cardId,
    streak: newStreak,
    last_seen_at: new Date().toISOString(),
    mastered_at,
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: sess } = await supabase
    .from("daily_sessions")
    .select("correct, wrong")
    .eq("date", today)
    .maybeSingle();

  await supabase.from("daily_sessions").upsert({
    date: today,
    correct: (sess?.correct ?? 0) + (correct ? 1 : 0),
    wrong: (sess?.wrong ?? 0) + (correct ? 0 : 1),
  });

  revalidatePath("/");
  revalidatePath("/tracker");
  return { ok: true };
}

// ──────────────── Card CRUD ────────────────

export async function createCard(formData: FormData) {
  const supabase = await createClient();
  const word = String(formData.get("word") || "").trim();
  const meaning = String(formData.get("meaning") || "").trim();
  const example = String(formData.get("example") || "").trim() || null;
  const module = String(formData.get("module") || "").trim();
  if (!word || !meaning || !module) return { error: "Faltan campos" };
  const { error } = await supabase.from("cards").insert({ word, meaning, example, module });
  if (error) return { error: error.message };
  revalidatePath("/cards");
  revalidatePath("/");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function updateCard(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const word = String(formData.get("word") || "").trim();
  const meaning = String(formData.get("meaning") || "").trim();
  const example = String(formData.get("example") || "").trim() || null;
  const module = String(formData.get("module") || "").trim();
  const { error } = await supabase.from("cards").update({ word, meaning, example, module }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cards");
  revalidatePath("/");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function deleteCard(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cards");
  revalidatePath("/");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function resetCardProgress(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("card_progress").delete().eq("card_id", id);
  revalidatePath("/");
  revalidatePath("/tracker");
  return { ok: true };
}
