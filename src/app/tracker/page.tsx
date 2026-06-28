import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import type { CardWithProgress } from "@/lib/types";
import { getStatus, statusLabel, statusBadgeClasses } from "@/lib/queue";
import TrackerClient from "@/components/TrackerClient";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const supabase = await createClient();

  const [{ data: cards }, { data: progress }] = await Promise.all([
    supabase.from("cards").select("*").order("module").order("word"),
    supabase.from("card_progress").select("*"),
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
