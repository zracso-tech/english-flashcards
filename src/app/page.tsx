import Header from "@/components/Header";
import Practice from "@/components/Practice";
import { createClient } from "@/lib/supabase/server";
import type { CardWithProgress } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: cards }, { data: progress }, { data: today }] = await Promise.all([
    supabase.from("cards").select("*").order("module").order("word"),
    supabase.from("card_progress").select("*"),
    supabase
      .from("daily_sessions")
      .select("correct")
      .eq("date", new Date().toISOString().slice(0, 10))
      .maybeSingle(),
  ]);

  const progressMap = new Map((progress ?? []).map((p) => [p.card_id, p]));
  const merged: CardWithProgress[] = (cards ?? []).map((c) => {
    const p = progressMap.get(c.id);
    return {
      ...c,
      streak: p?.streak ?? 0,
      last_seen_at: p?.last_seen_at ?? null,
      mastered_at: p?.mastered_at ?? null,
    };
  });

  const modules = Array.from(new Set(merged.map((c) => c.module)));

  return (
    <>
      <Header />
      <Practice
        cards={merged}
        modules={modules}
        correctToday={today?.correct ?? 0}
      />
    </>
  );
}
