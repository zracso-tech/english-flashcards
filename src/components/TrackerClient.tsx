"use client";

import { useMemo, useState, useTransition } from "react";
import { resetCardProgress } from "@/app/actions";
import type { CardStatus } from "@/lib/types";

type Row = {
  id: string;
  word: string;
  module: string;
  streak: number;
  status: CardStatus;
  statusLabel: string;
  statusClass: string;
};

const ALL = "Todos los módulos";

export default function TrackerClient({ rows, modules }: { rows: Row[]; modules: string[] }) {
  const [activeModule, setActiveModule] = useState<string>(ALL);
  const [activeStatus, setActiveStatus] = useState<CardStatus | "all">("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return rows
      .filter((r) => activeModule === ALL || r.module === activeModule)
      .filter((r) => activeStatus === "all" || r.status === activeStatus)
      .sort((a, b) => b.streak - a.streak || a.word.localeCompare(b.word));
  }, [rows, activeModule, activeStatus]);

  function pips(streak: number) {
    return Array.from({ length: 3 })
      .map((_, i) => (i < Math.min(streak, 3) ? "●" : "○"))
      .join(" ");
  }

  function reset(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => { await resetCardProgress(fd); });
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-7 w-full">
      <h1 className="text-[20px] font-medium tracking-tight">Tracker</h1>
      <p className="text-[13px] text-muted mt-1">
        Progreso por tarjeta. Tres aciertos seguidos = dominada. A los 7 días vuelve para confirmar.
      </p>

      <div className="mt-5 flex gap-1.5 flex-wrap">
        {[ALL, ...modules].map((m) => (
          <FilterChip key={m} active={activeModule === m} onClick={() => setActiveModule(m)}>
            {m === ALL ? "Todos" : m}
          </FilterChip>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5 flex-wrap">
        {(["all", "active", "in_progress", "mastered", "recall"] as const).map((s) => (
          <FilterChip key={s} active={activeStatus === s} onClick={() => setActiveStatus(s)}>
            {s === "all" ? "Todas" :
             s === "active" ? "Activas" :
             s === "in_progress" ? "En progreso" :
             s === "mastered" ? "Dominadas" : "Repasar"}
          </FilterChip>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              <th className="font-medium px-4 py-2.5">Palabra</th>
              <th className="font-medium px-4 py-2.5">Módulo</th>
              <th className="font-medium px-4 py-2.5 text-center">Racha</th>
              <th className="font-medium px-4 py-2.5">Estado</th>
              <th className="font-medium px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-background/50">
                <td className="px-4 py-2.5 font-medium">{r.word}</td>
                <td className="px-4 py-2.5 text-muted">{r.module}</td>
                <td className="px-4 py-2.5 text-center text-muted tracking-[0.2em] text-[12px]">
                  {pips(r.streak)}
                </td>
                <td className="px-4 py-2.5">
                  <span className={"inline-block px-2.5 py-0.5 rounded-full text-[11px] border " + r.statusClass}>
                    {r.statusLabel}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  {r.streak > 0 && (
                    <button
                      onClick={() => reset(r.id)}
                      disabled={pending}
                      title="Reiniciar progreso de esta tarjeta"
                      className="text-[11px] text-faint hover:text-foreground transition"
                    >
                      Reset
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No hay tarjetas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-[12px] border transition " +
        (active
          ? "bg-foreground text-white border-foreground"
          : "border-line-strong text-muted hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
