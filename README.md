# English flashcards

App de flashcards de inglés (vocabulario, pronunciación, conectores). Next.js + Supabase + Vercel.

- **Practicar** (`/`): tarjeta volteable, filtros por módulo, botones "Lo sabía / No lo sabía".
- **Tracker** (`/tracker`): tabla con todas las tarjetas, su racha y estado.
- **Mis tarjetas** (`/cards`): añadir, editar y borrar tarjetas. Crear módulos nuevos sobre la marcha.

Lógica de repaso: 3 aciertos seguidos = **Dominada**. A los **7 días** vuelve para confirmar. Si fallas, la racha se reinicia y la tarjeta vuelve al circuito activo.

**Sin login.** App de un solo usuario, la URL pública es el "secreto" — no la compartas. Si en el futuro quieres añadir un passcode, se hace en 30 líneas.

## Setup

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com). Anotar **Project URL** y **anon public key** (Settings → API).
2. Abrir el **SQL editor** → New query → pegar y ejecutar el contenido de `supabase/setup.sql` (idempotente: crea esquema + seed con 75 tarjetas, o lo actualiza si ya existe).

### 2. Variables de entorno

Copiar `.env.local.example` a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Local

```bash
npm install
npm run dev
```

`http://localhost:3000` → entras directo a Practicar.

## Despliegue

1. Push del repo a GitHub.
2. [vercel.com](https://vercel.com) → Add New → Project → importa el repo.
3. En **Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Cada `git push` posterior despliega solo.

## Stack

- Next.js 16 (App Router, Server Actions)
- React 19
- Tailwind 4
- Supabase (Postgres, RLS abierta a `anon`) — `@supabase/ssr`
- TypeScript

## Estructura

```
src/
├── app/
│   ├── actions.ts          # Server actions (mark, CRUD)
│   ├── cards/              # Mis tarjetas (CRUD)
│   ├── tracker/            # Tabla de progreso
│   └── page.tsx            # Practicar (home)
├── components/             # Header, Practice, TrackerClient, CardsManager
└── lib/
    ├── queue.ts            # Lógica del circuito de repaso
    ├── supabase/           # Clientes (browser / server)
    └── types.ts
```
