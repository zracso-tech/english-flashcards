"use client";

import { useMemo, useState, useTransition } from "react";
import type { CardWithProgress } from "@/lib/types";
import { buildQueue } from "@/lib/queue";
import { markCard } from "@/app/actions";

type Props = {
  cards: CardWithProgress[];
  modules: string[];
  correctToday: number;
};

const ALL = "Todos los módulos";

export default function Practice({ cards, modules, correctToday }: Props) {
  const [activeModule, setActiveModule] = useState<string>(ALL);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const [order, setOrder] = useState(0); // bump to rebuild the queue

  const filtered = useMemo(
    () => (activeModule === ALL ? cards : cards.filter((c) => c.module === activeModule)),
    [cards, activeModule],
  );

  const queue = useMemo(() => buildQueue(filtered), [filtered, order]);
  const current = queue[0];

  const filteredStats = useMemo(() => {
    const total = filtered.length;
    const mastered = filtered.filter((c) => c.streak >= 3).length;
    return { total, mastered, active: total - mastered, remaining: queue.length };
  }, [filtered, queue.length]);

  function next(correct: boolean) {
    if (!current) return;
    setFlipped(false);
    startTransition(async () => {
      await markCard(current.id, correct);
      // Optimistic: update local streak so the next queue rebuild excludes it.
      current.streak = correct ? current.streak + 1 : 0;
      setOrder((n) => n + 1);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-7 w-full">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat label="Total" value={filteredStats.total} />
        <Stat label="Activas" value={filteredStats.active} tone="accent" />
        <Stat label="Dominadas" value={filteredStats.mastered} tone="correct" />
        <Stat label="Racha hoy" value={correctToday} />
      </div>

      {/* Module filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {[ALL, ...modules].map((m) => {
          const active = m === activeModule;
          return (
            <button
              key={m}
              onClick={() => { setActiveModule(m); setFlipped(false); setOrder((n) => n + 1); }}
              className={
                "px-3 py-1.5 rounded-full text-[12px] border transition " +
                (active
                  ? "bg-[--color-foreground] text-white border-[--color-foreground]"
                  : "border-[--color-line-strong] text-[--color-muted] hover:text-[--color-foreground]")
              }
            >
              {shortLabel(m)}
            </button>
          );
        })}
      </div>

      {/* Progress dots */}
      {current && (
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {Array.from({ length: Math.min(queue.length, 40) }).map((_, i) => (
            <span
              key={i}
              className={
                "rounded-full " +
                (i === 0
                  ? "w-2.5 h-2.5 bg-[--color-accent]"
                  : "w-1.5 h-1.5 bg-[--color-line-strong]")
              }
            />
          ))}
        </div>
      )}

      {/* Card */}
      {current ? (
        <>
          <div className="flip-area mb-4 cursor-pointer" onClick={() => setFlipped((f) => !f)}>
            <div className={"flip-inner min-h-[260px] " + (flipped ? "is-flipped" : "")}>
              <CardFace card={current} side="front" />
              <CardFace card={current} side="back" />
            </div>
          </div>

          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="w-full rounded-xl bg-[--color-surface] border border-[--color-line-strong] text-[14px] font-medium py-3 hover:bg-[--color-line]/30 transition"
            >
              Ver significado
            </button>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={() => next(false)}
                disabled={pending}
                className="flex-1 rounded-xl border border-[--color-wrong] text-[--color-wrong] py-3 text-[14px] font-medium hover:bg-[--color-wrong-soft] disabled:opacity-50 transition"
              >
                No lo sabía
              </button>
              <button
                onClick={() => next(true)}
                disabled={pending}
                className="flex-1 rounded-xl border border-[--color-correct] text-[--color-correct] py-3 text-[14px] font-medium hover:bg-[--color-correct-soft] disabled:opacity-50 transition"
              >
                Lo sabía
              </button>
            </div>
          )}

          <p className="text-center text-[12px] text-[--color-faint] mt-4">
            Toca la tarjeta para girarla · {filteredStats.remaining} {filteredStats.remaining === 1 ? "tarjeta" : "tarjetas"} por repasar
          </p>
        </>
      ) : (
        <EmptyState
          mastered={filteredStats.mastered}
          total={filteredStats.total}
          correctToday={correctToday}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "accent" | "correct" }) {
  const color =
    tone === "accent"
      ? "text-[--color-accent]"
      : tone === "correct"
        ? "text-[--color-correct]"
        : "text-[--color-foreground]";
  return (
    <div className="rounded-xl bg-[--color-surface] border border-[--color-line] px-3 py-2.5 text-center">
      <div className={"text-[20px] font-medium leading-tight " + color}>{value}</div>
      <div className="text-[11px] text-[--color-muted] mt-0.5">{label}</div>
    </div>
  );
}

function CardFace({ card, side }: { card: CardWithProgress; side: "front" | "back" }) {
  const isBack = side === "back";
  return (
    <div
      className={
        "flip-face absolute inset-0 rounded-2xl border border-[--color-line] p-7 flex flex-col items-center justify-center text-center " +
        (isBack ? "flip-face--back bg-[--color-surface]" : "bg-[--color-surface]")
      }
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[--color-faint] mb-3">
        {card.module}
      </div>
      {!isBack ? (
        <>
          <div className="text-[26px] sm:text-[30px] font-medium leading-tight text-[--color-foreground] max-w-md">
            {card.word}
          </div>
          <div className="text-[12px] text-[--color-faint] mt-3">Toca para ver el significado</div>
        </>
      ) : (
        <>
          <div className="text-[18px] sm:text-[20px] font-medium leading-snug text-[--color-foreground] max-w-md">
            {card.meaning}
          </div>
          {card.example && (
            <div className="text-[13px] italic text-[--color-muted] leading-relaxed mt-3 max-w-md">
              &ldquo;{card.example}&rdquo;
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ mastered, total, correctToday }: { mastered: number; total: number; correctToday: number }) {
  return (
    <div className="rounded-2xl border border-[--color-line] bg-[--color-surface] p-10 text-center">
      <h2 className="text-[20px] font-medium tracking-tight">Sesión completada</h2>
      <p className="text-[14px] text-[--color-muted] mt-1.5">
        {total === 0
          ? "No hay tarjetas en este módulo."
          : mastered === total
            ? "Has dominado todas. Vuelve cuando aparezcan tarjetas para repasar."
            : `${correctToday} correctas hoy. Vuelve mañana para mantener la racha.`}
      </p>
    </div>
  );
}

function shortLabel(m: string): string {
  if (m === ALL) return "Todos";
  return m
    .replace("· ", "")
    .replace("Mastering Sounds", "MS")
    .replace("Sounding Native", "SN")
    .replace("Connecting Words", "CW")
    .replace("Beautifying", "BS");
}
