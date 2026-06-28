"use client";

import { useState, useTransition } from "react";
import { signInWithEmail } from "@/app/actions";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-medium tracking-tight">English flashcards</h1>
        <p className="text-[14px] text-[--color-muted] mt-1.5">
          Inicia sesión con tu email. Te enviaremos un enlace para entrar.
        </p>

        {sent ? (
          <div className="mt-8 p-5 rounded-2xl border border-[--color-line] bg-[--color-surface]">
            <p className="text-[14px] text-[--color-foreground]">
              Revisa tu correo. El enlace caduca en 1 hora.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setError(null); }}
              className="mt-3 text-[13px] text-[--color-accent] hover:underline"
            >
              Enviar a otro email
            </button>
          </div>
        ) : (
          <form
            className="mt-8 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await signInWithEmail(fd);
                if (res?.error) setError(res.error);
                else setSent(true);
              });
            }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              autoComplete="email"
              autoFocus
              className="w-full rounded-xl border border-[--color-line-strong] bg-[--color-surface] px-4 py-3 text-[15px] outline-none focus:border-[--color-foreground] transition"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-[--color-foreground] text-white text-[14px] font-medium py-3 hover:opacity-90 disabled:opacity-50 transition"
            >
              {pending ? "Enviando…" : "Enviar enlace"}
            </button>
            {error && <p className="text-[13px] text-[--color-wrong]">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
