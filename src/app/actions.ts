"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MASTERY_THRESHOLD } from "@/lib/types";

// ──────────────── Auth ────────────────

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email vacío" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/confirm`,
    },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ──────────────── Progress ────────────────

export async function markCard(cardId: string, correct: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No auth" };

  // Read current progress (if any)
  const { data: prev } = await supabase
    .from("user_progress")
    .select("streak, mastered_at")
    .eq("user_id", user.id)
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

  await supabase.from("user_progress").upsert({
    user_id: user.id,
    card_id: cardId,
    streak: newStreak,
    last_seen_at: new Date().toISOString(),
    mastered_at,
  });

  // Daily session counter
  const today = new Date().toISOString().slice(0, 10);
  const { data: sess } = await supabase
    .from("sessions")
    .select("correct, wrong")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  await supabase.from("sessions").upsert({
    user_id: user.id,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No auth" };
  const id = String(formData.get("id"));
  await supabase.from("user_progress").delete().eq("user_id", user.id).eq("card_id", id);
  revalidatePath("/");
  revalidatePath("/tracker");
  return { ok: true };
}
