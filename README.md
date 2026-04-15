# 🧠 SAR Prep — GRE Vocabulary Mastery

> **SAR Prep** (*Simon Amar-Roisenberg Prep*) is a high-performance, modern GRE vocabulary learning app built to help you master all 995 essential GRE words through adaptive flashcards and interactive games — with your progress securely synced to the cloud across all your devices.

🌐 **Live app:** [sar-prep.vercel.app](https://sar-prep.vercel.app)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **995 GRE Words** | Complete curated dataset with definitions, synonyms, and French translations |
| **Adaptive Queue** | Words you miss come back sooner, mastered words are deprioritized |
| **3 Game Modes** | QCM (multiple choice), Typing, and Mix (randomized) |
| **Flashcards** | Classic flip cards with blur-to-reveal for synonyms and translations |
| **Progress Dashboard** | Real-time stats: Mastered, To Review, Seen, Score, Global Progress % |
| **Google Authentication** | One-click sign-in with your Google account via Supabase Auth |
| **Cloud Sync** | Progress saved to Supabase instantly on every answer |
| **Offline-first** | Works without internet — localStorage saves locally, cloud syncs when available |
| **Smart Merge** | When you log in, local + cloud data are merged intelligently (never loses data) |
| **Mobile Responsive** | Fully adapted layout for phones and tablets |

---

## 🏗️ Architecture

```
sar-prep.vercel.app (Vercel Edge Network)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js 15 App Router                 │
│                                                         │
│  /                    → Dashboard (stats, nav cards)    │
│  /games               → Training game (QCM / Typing)   │
│  /flashcards          → Flip card review mode           │
│  /auth/callback       → OAuth redirect handler          │
│                                                         │
│  middleware.ts        → Session refresh (SSR cookies)   │
└─────────────────────────────────────────────────────────┘
        │                            │
        ▼                            ▼
┌──────────────┐           ┌──────────────────────┐
│  localStorage │           │   Supabase (Cloud)   │
│  (instant,    │◄─ merge ─►│   PostgreSQL DB      │
│   offline)    │           │   Google OAuth       │
└──────────────┘           └──────────────────────┘
```

---

## 📁 Project Structure

```
gre-prep/
├── public/
│   └── words.json                  # 995 GRE words dataset
│
├── src/
│   ├── app/
│   │   ├── page.tsx                # Dashboard (home page)
│   │   ├── layout.tsx              # Root layout + fonts
│   │   ├── globals.css             # Design system + mobile CSS
│   │   ├── games/
│   │   │   └── page.tsx            # Training game page
│   │   ├── flashcards/
│   │   │   └── page.tsx            # Flashcard review page
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts        # OAuth callback handler
│   │
│   ├── components/
│   │   └── GameCard.tsx            # Universal game card (QCM / Typing / Flashcard)
│   │
│   ├── hooks/
│   │   └── useGameLoop.ts          # Game state machine + answer logic
│   │
│   ├── lib/
│   │   ├── storage.ts              # localStorage read/write
│   │   └── cloudStorage.ts         # Supabase read/write + merge logic
│   │
│   ├── utils/
│   │   └── supabase/
│   │       ├── client.ts           # Browser Supabase client
│   │       └── server.ts           # Server-side Supabase client (SSR)
│   │
│   └── types/
│       └── index.ts                # TypeScript interfaces (Word, UserProgress, etc.)
│
├── middleware.ts                   # Session refresh middleware (Supabase SSR)
├── vercel.json                     # Vercel deployment config
└── package.json
```

---

## 🗃️ Database Schema (Supabase)

### Table: `users_progress`

```sql
create table public.users_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  mastered_ids integer[]  default '{}',
  review_ids   integer[]  default '{}',
  session_score integer   default 0,
  lives        integer    default 5,
  total_seen   integer    default 0,
  updated_at   timestamptz default now()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
alter table public.users_progress enable row level security;

-- Each user can only read/write their own row
create policy "Users can view own progress"
  on public.users_progress for select using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.users_progress for insert with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.users_progress for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Auto-create row on sign-up (Trigger)

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_progress (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS + Tailwind CSS utilities |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Auth** | [Supabase Auth](https://supabase.com/auth) (Google OAuth) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/SARx613/SAR-Prep.git
cd SAR-Prep/gre-prep
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in `gre-prep/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

> Get these from your [Supabase project settings](https://supabase.com/dashboard) → **Project Settings → API**

### 4. Configure Supabase

In the Supabase dashboard:
1. **Authentication → Providers** → Enable **Google** OAuth (add your Google client ID & secret)
2. **Authentication → URL Configuration** → Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback`
3. Run the SQL scripts from the [Database Schema](#️-database-schema-supabase) section above

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔄 How Progress Sync Works

```
User answers a question
        │
        ├─► localStorage.setItem(...)   ← Instant, always works offline
        │
        └─► supabase.upsert(...)        ← Immediate, fire-and-forget
                │
                └── If not logged in → silently skipped
                └── If logged in → row updated in Supabase

On Dashboard load:
        │
        ├─► Show localStorage immediately (instant, no network wait)
        │
        └─► If logged in → fetch Supabase row
                │
                └── Merge: max(local, cloud) for all values
                         union(local.ids, cloud.ids) for arrays
                └── Update display + save merged result to both
```

---

## 📱 Responsive Design

SAR Prep is fully responsive:

| Screen | Layout |
|--------|--------|
| **Desktop** (>640px) | 4-column stats, 2-column nav cards, horizontal header |
| **Mobile** (<640px) | 2×2 stats grid, 1-column nav cards, stacked header |

---

## 🔐 Authentication Flow

```
User clicks "Continuer avec Google"
        │
        ▼
Supabase redirects to Google OAuth
        │
        ▼
Google authenticates user
        │
        ▼
Redirect to /auth/callback?code=...
        │
        ▼
Server exchanges code for session (cookies set)
        │
        ▼
Redirect to / (Dashboard)
        │
        ▼
onAuthStateChange fires SIGNED_IN event
        │
        ▼
mergeProgressOnSignIn() → show best of local + cloud
```

---

## 📊 UserProgress Data Model

```typescript
interface UserProgress {
  masteredIds:  number[];  // IDs of words answered correctly
  reviewIds:    number[];  // IDs of words answered incorrectly (queue priority)
  sessionScore: number;    // Points earned (10 per correct answer)
  lives:        number;    // Lives remaining (starts at 5)
  totalSeen:    number;    // Total questions answered
}
```

---

## 📄 License

MIT — Built by **Simon Amar-Roisenberg** for personal GRE preparation.