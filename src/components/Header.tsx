"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

const tabs = [
  { href: "/", label: "Practicar" },
  { href: "/tracker", label: "Tracker" },
  { href: "/cards", label: "Mis tarjetas" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[--color-line] bg-[--color-surface]/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-[15px] font-medium tracking-tight text-[--color-foreground]">
          English<span className="text-[--color-accent]">·</span>flashcards
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "px-3 py-1.5 rounded-full text-[13px] transition " +
                  (active
                    ? "bg-[--color-foreground] text-white"
                    : "text-[--color-muted] hover:text-[--color-foreground] hover:bg-[--color-line]/50")
                }
              >
                {t.label}
              </Link>
            );
          })}
          <form action={signOut} className="ml-1">
            <button
              type="submit"
              className="px-2 py-1.5 rounded-full text-[12px] text-[--color-faint] hover:text-[--color-foreground] transition"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
