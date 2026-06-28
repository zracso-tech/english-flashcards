"use client";

import { useMemo, useState, useTransition } from "react";
import type { Card } from "@/lib/types";
import { createCard, updateCard, deleteCard } from "@/app/actions";

const ALL = "Todos los módulos";

export default function CardsManager({ cards, modules }: { cards: Card[]; modules: string[] }) {
  const [activeModule, setActiveModule] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Card | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return cards
      .filter((c) => activeModule === ALL || c.module === activeModule)
      .filter((c) =>
        !q ||
        c.word.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.example ?? "").toLowerCase().includes(q),
      );
  }, [cards, activeModule, query]);

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = editing
        ? await updateCard(formData)
        : await createCard(formData);
      if (res?.error) setError(res.error);
      else {
        setEditing(null);
        setCreating(false);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Borrar esta tarjeta? Se pierde el progreso asociado.")) return;
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => { await deleteCard(fd); });
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-7 w-full">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">Mis tarjetas</h1>
          <p className="text-[13px] text-[--color-muted] mt-1">
            {cards.length} tarjetas. Añade tantas como quieras y crea módulos nuevos (W3, W4…).
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="rounded-xl bg-[--color-foreground] text-white text-[13px] font-medium px-4 py-2.5 hover:opacity-90 transition"
        >
          + Nueva tarjeta
        </button>
      </div>

      <div className="mt-5 flex gap-1.5 flex-wrap">
        {[ALL, ...modules].map((m) => (
          <button
            key={m}
            onClick={() => setActiveModule(m)}
            className={
              "px-3 py-1.5 rounded-full text-[12px] border transition " +
              (activeModule === m
                ? "bg-[--color-foreground] text-white border-[--color-foreground]"
                : "border-[--color-line-strong] text-[--color-muted] hover:text-[--color-foreground]")
            }
          >
            {m === ALL ? "Todos" : m}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Buscar…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-3 w-full rounded-xl border border-[--color-line-strong] bg-[--color-surface] px-4 py-2.5 text-[14px] outline-none focus:border-[--color-foreground] transition"
      />

      <div className="mt-4 rounded-2xl border border-[--color-line] bg-[--color-surface] divide-y divide-[--color-line]">
        {filtered.map((c) => (
          <div key={c.id} className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-medium">{c.word}</div>
              <div className="text-[12.5px] text-[--color-muted] mt-0.5 truncate">{c.meaning}</div>
              <div className="text-[10.5px] uppercase tracking-[0.06em] text-[--color-faint] mt-1">{c.module}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => { setEditing(c); setCreating(false); }}
                className="text-[12px] text-[--color-muted] hover:text-[--color-foreground] px-2 py-1 transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={pending}
                className="text-[12px] text-[--color-wrong] hover:underline px-2 py-1 transition disabled:opacity-50"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-[--color-muted] text-[13px]">
            Sin resultados.
          </div>
        )}
      </div>

      {(editing || creating) && (
        <CardForm
          card={editing}
          modules={modules}
          onCancel={() => { setEditing(null); setCreating(false); setError(null); }}
          onSubmit={handleSave}
          pending={pending}
          error={error}
        />
      )}
    </div>
  );
}

function CardForm({
  card, modules, onCancel, onSubmit, pending, error,
}: {
  card: Card | null;
  modules: string[];
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
  error: string | null;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 grid place-items-center px-4 py-8 z-20"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}
        className="w-full max-w-md bg-[--color-surface] rounded-2xl border border-[--color-line] p-5 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-[16px] font-medium">{card ? "Editar tarjeta" : "Nueva tarjeta"}</h2>

        {card && <input type="hidden" name="id" value={card.id} />}

        <Field label="Palabra (inglés)">
          <input
            name="word"
            required
            defaultValue={card?.word ?? ""}
            className="form-input"
            autoFocus
          />
        </Field>

        <Field label="Significado">
          <textarea
            name="meaning"
            required
            defaultValue={card?.meaning ?? ""}
            rows={2}
            className="form-input"
          />
        </Field>

        <Field label="Ejemplo (opcional)">
          <textarea
            name="example"
            defaultValue={card?.example ?? ""}
            rows={2}
            className="form-input"
          />
        </Field>

        <Field label="Módulo">
          <input
            name="module"
            required
            list="modules"
            defaultValue={card?.module ?? ""}
            placeholder="p. ej. W3 · Sounding Native"
            className="form-input"
          />
          <datalist id="modules">
            {modules.map((m) => <option key={m} value={m} />)}
          </datalist>
          <p className="text-[11px] text-[--color-faint] mt-1">
            Escribe uno nuevo para crear un módulo (W3, W4…) o elige uno existente.
          </p>
        </Field>

        {error && <p className="text-[12px] text-[--color-wrong] mt-2">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[--color-line-strong] text-[13px] py-2.5 hover:bg-[--color-background] transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-[--color-foreground] text-white text-[13px] font-medium py-2.5 hover:opacity-90 disabled:opacity-50 transition"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>

      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-3">
      <span className="block text-[12px] text-[--color-muted] mb-1">{label}</span>
      {children}
    </label>
  );
}
