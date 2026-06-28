import Header from "@/components/Header";
import CardsManager from "@/components/CardsManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .order("module")
    .order("word");

  const modules = Array.from(new Set((cards ?? []).map((c) => c.module)));

  return (
    <>
      <Header />
      <CardsManager cards={cards ?? []} modules={modules} />
    </>
  );
}
