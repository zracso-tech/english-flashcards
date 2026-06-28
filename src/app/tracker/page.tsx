import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import type { CardWithProgress } from "@/lib/types";
import { getStatus, statusLabel, statusBadgeClasses } from "@/lib/queue";
import TrackerClient from "@/components/TrackerClient";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: cards }, { data: progress }] = await Promise.all([
    supabase.from("cards").select("*").order("module").order("word"),
    supabase.from("user_progress").select("*").eq("user_id", user.id),
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

  // Pre-compute status for each row (avoid sending Date logic to client beyond what queue.ts does)
  const rows = merged.map((c) => {
    const status = getStatus(c);
    return {
      id: c.id,
      word: c.word,
      module: c.module,
      streak: c.streak,
      status,
      statusLabel: statusLabel(status),
      statusClass: statusBadgeClasses(status),
    };
  });

  return (
    <>
      <Header />
      <TrackerClient rows={rows} modules={modules} />
    </>
  );
}
