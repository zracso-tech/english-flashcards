"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Practicar" },
  { href: "/tracker", label: "Tracker" },
  { href: "/cards", label: "Mis tarjetas" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-[15px] font-medium tracking-tight text-foreground">
          English<span className="text-accent">·</span>flashcards
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
                    ? "bg-foreground text-white"
                    : "text-muted hover:text-foreground hover:bg-line/50")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
