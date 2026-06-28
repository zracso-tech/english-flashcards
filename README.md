# English flashcards

App de flashcards de inglés (vocabulario, pronunciación, conectores). Next.js + Supabase + Vercel.

- **Practicar** (`/`): tarjeta volteable, filtros por módulo, botones "Lo sabía / No lo sabía".
- **Tracker** (`/tracker`): tabla con todas las tarjetas, su racha y estado.
- **Mis tarjetas** (`/cards`): añadir, editar y borrar tarjetas. Crear módulos nuevos (W3, W4…) sobre la marcha.

Lógica de repaso: 3 aciertos seguidos = **Dominada**. A los **7 días** vuelve para confirmar. Si fallas, la racha se reinicia y la tarjeta vuelve al circuito activo.

## Setup local

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com). Anotar **Project URL** y **anon public key** (Settings → API).
2. Abrir el **SQL editor** y pegar/ejecutar en orden:
   - `supabase/migrations/0001_init.sql` (schema + RLS).
   - `supabase/seed.sql` (75 tarjetas iniciales).
3. **Auth → URL configuration**:
   - Site URL: `http://localhost:3000` (mientras desarrollas).
   - Redirect URLs (whitelist): añadir `http://localhost:3000/auth/confirm` y, cuando despliegues, `https://<tu-app>.vercel.app/auth/confirm`.
4. **Auth → Providers → Email**:
   - Activado.
   - **Confirm email** → ON.
   - (Opcional, recomendado tras tu primer login) **Auth → Settings → User signups** → OFF. Así nadie más puede crearse cuenta aunque conozca la URL.

### 2. Variables de entorno

Copiar `.env.local.example` a `.env.local` y rellenar la `anon key`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fswajxniyrwzwfjdvqjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Correr en local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` → te redirige a `/login`. Introducir tu email → llega el magic link → entras.

## Despliegue (Vercel)

1. Push del repo a GitHub (`zracso-tech/english-flashcards`).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. En **Environment Variables** añadir:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Apuntar la URL final (`https://english-flashcards-xxx.vercel.app`).
5. Volver a Supabase → **Auth → URL configuration**:
   - Site URL → cambiar a la URL de Vercel.
   - Redirect URLs → añadir `https://<tu-app>.vercel.app/auth/confirm`.

## Stack

- Next.js 16 (App Router, Server Actions)
- React 19
- Tailwind 4
- Supabase (Postgres + Auth + RLS) — `@supabase/ssr`
- TypeScript

## Estructura

```
src/
├── app/
│   ├── actions.ts          # Server actions (mark, signIn, CRUD)
│   ├── auth/confirm/       # Magic link callback
│   ├── cards/              # Mis tarjetas (CRUD)
│   ├── login/              # Magic link form
│   ├── tracker/            # Tabla de progreso
│   └── page.tsx            # Practicar (home)
├── components/             # Header, Practice, TrackerClient, CardsManager
├── lib/
│   ├── queue.ts            # Lógica del circuito de repaso
│   ├── supabase/           # Clientes (browser / server / middleware)
│   └── types.ts
└── middleware.ts           # Protege rutas excepto /login y /auth
```
