# UniIn — Pathways to Global Universities

> The all-in-one platform where Uzbek students preparing for global universities meet verified G.U. (Globally-admitted University) students for mentorship, resources, and community.

**Built at:** Build with AI Ideathon 2026 · SQB × New Uzbekistan University
**Team:** Bitrix
**Live:** https://uniin-pathways.lovable.app

---

## 🌍 Overview

Every year thousands of talented Uzbek students dream of studying at top global universities (Harvard, MIT, Oxford, NUS, etc.) — but they face an information gap, a mentorship gap, and a trust gap. Existing solutions are either expensive consultancies, scattered Telegram chats, or generic global platforms that don't understand the Uzbek context.

**UniIn** brings the entire admissions journey into one trusted, monetizable, AI-powered network:

- **PREP students** (high schoolers preparing to apply) get verified mentors, AI guidance, and curated resources.
- **G.U. students** (already admitted abroad) get a platform to share knowledge, build reputation, and monetize their experience.

Think of it as **LinkedIn × Substack × Calendly × Discord**, hyper-focused on the global admissions journey.

---

## 🎯 Problems & Solutions

| Problem                                                                   | Who faces it            | Our solution                                                                                    |
| ------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Unverified "consultants" charge $500+ for outdated advice                 | PREP students & parents | **Verified G.U. badge** — every mentor proves admission with documents before earning the badge |
| Genuine essays, SAT notes & test prep are gate-kept in private chats      | PREP students           | **Marketplace** with screenshot-protected previews + escrow-secured purchases                   |
| Mentors have no way to earn from their expertise                          | G.U. students abroad    | **Built-in monetization** — paid chats, calls, bookings & digital products with auto payout     |
| Generic AI chatbots don't know Uzbek context or university nuances        | All students            | **AI Advisor** with 4 specialized modes (Mentor, Essay, Strategy, Quick Q&A)                    |
| Telegram groups are noisy, unsearchable, and have no reputation system    | All students            | **Community Groups** with structured posts, polls, reactions & moderation                       |
| Booking a 1-on-1 with a senior abroad means juggling timezones in DMs     | PREP & G.U.             | **Sessions** module with scheduled video calls + escrow-protected payments                      |
| Top universities (deadlines, requirements) are scattered across 100 sites | PREP students           | **Universities** directory + **Deadline Reminders** with multi-stage alerts                     |
| Application week stress: nothing reminds you "30 days till MIT EA"        | PREP students           | **Deadline Reminders** push notifications 30 / 7 / 1 day before                                 |
| No way to discover peers applying to the same schools                     | PREP students           | **Explore** with smart filters (school, country, major, scores)                                 |
| Premium content can be screenshot & resold instantly                      | G.U. sellers            | **Screenshot protection** + watermarking on paid listings                                       |

---

## ✨ Full Feature List

### 🔐 Authentication & Onboarding

- Email/password signup with strong-password meter (`PasswordStrength.tsx`)
- Google OAuth sign-in
- Multi-step **onboarding** (`/onboarding`) — user type, profile basics, academic profile, target universities
- Auto-generated unique `@username` (with collision handling via `generate_unique_username` DB function)
- Auto-created wallet on signup (`create_wallet_for_user` trigger)
- Profile completion banner — nudges users to finish their profile for better recommendations

### 🏠 Feed (`/feed`)

- LinkedIn-style global feed with rich post composer
- Post types: **update**, **poll**, **media**, **article**
- Reactions (like / celebrate / insightful / curious / support) via `ReactionBar.tsx`
- Threaded comments with auto-notification to author
- Inline polls (`PollBlock.tsx`) with single-vote enforcement & live results
- Media attachments stored in `post-media` bucket
- Impression counter for post analytics
- Group posts are filtered OUT of the global feed (only visible inside their community)

### 🔎 Explore (`/explore`)

- People discovery feed — search by name, school, major, country
- Filter by user type (PREP / G.U. / Mentors)
- Smart sorting by `rank_score`
- One-click follow / unfollow

### 👥 Community Groups

- `/groups` — directory of all groups with categories & member counts
- `/groups/$slug` — full group page with cover image, members, group-only feed
- Auto-generated unique slugs (`generate_unique_group_slug` DB function)
- Creator auto-promoted to admin (`add_creator_as_admin` trigger)
- Member counts kept in sync via trigger
- Public & private groups

### 💼 Marketplace (`/marketplace`)

- Listing types: **essay**, **notes**, **test_prep**, **template**, **course**, **consultation**
- **Free or paid** listings (USD)
- Free preview percentage (default 10%) — buyer sees teaser before purchasing
- **Screenshot protection** on previews to deter piracy
- Tags, cover image, "what's included", delivery time
- **Self-purchase blocked** — sellers can't buy their own listings
- Purchase flow runs through wallet balance + escrow

### 🛡️ Escrow Payment Flow

1. Buyer clicks **Buy** → wallet balance checked
2. Funds debited and placed in `escrow_transactions` (status: `held`)
3. **10% platform fee** + 90% seller payout calculated
4. 7-day escrow window — buyer can dispute, otherwise auto-releases
5. Seller payout credited to wallet on release
6. Both parties can view their escrow transactions in `/wallet`

### 💬 Messages (`/messages`)

- 1-on-1 conversations powered by Supabase Realtime
- Read receipts (`read_at`)
- Auto-notification on new message
- Mobile-optimized full-screen chat with back navigation
- File attachments support

### 📅 Sessions (`/sessions`)

- Book 1-on-1 video sessions with G.U. mentors
- Session types: video, voice, chat
- **Paid sessions** — mentor's `booking_rate_usd` auto-deducted from buyer wallet into escrow
- Price breakdown shown before booking ("Mentor receives in 7 days")
- Status lifecycle: scheduled → completed / cancelled

### 🎉 Events (`/events`)

- G.U. students host webinars, AMAs, info-sessions
- RSVP system with attendee counts (`update_event_attendee_count` trigger)
- Event cover image, scheduled time, duration, max attendees, room URL

### 🤖 AI Advisor (`/ai`) — 4 specialized modes

Powered by **Lovable AI Gateway** (Google Gemini & OpenAI GPT-5 family — no user API key required).

| Mode          | Purpose                                                                   | Best for                                                |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Mentor**    | Empathetic senior-student tone, general guidance, motivation, decisions   | "Should I apply EA or RD to Stanford?"                  |
| **Essay**     | Common App / Supplement essay coach — structure, hooks, voice, line edits | "Review my Why-X essay for Yale"                        |
| **Strategy**  | Long-term roadmap — school list balancing, EC planning, score targets     | "I'm a 10th grader with 3.9 GPA, design my 2-year plan" |
| **Quick Q&A** | Snappy factual answers — deadlines, requirements, statistics              | "MIT EA deadline 2026?"                                 |

- Conversations persisted per user in `ai_conversations` table
- Multi-turn context preserved
- Server-side key management via `LOVABLE_API_KEY` (never exposed to client)
- Surfaces gateway errors (402 / 429) with specific messages

### 🏛️ Universities (`/universities`)

- Searchable directory of global universities
- **Deadline Reminders** — set custom deadlines per university with `[30, 7, 1]` day notification stages

### 💎 Premium (`/premium`)

- Free tier vs. Premium G.U. tier
- Premium G.U. unlocks **service rate setting** — charge for chats (`chat_rate_usd`), calls (`call_rate_usd`), and bookings (`booking_rate_usd`)
- `PremiumGate.tsx` component gates Premium-only UI

### 💰 Wallet (`/wallet`)

- USD balance, pending, total earned
- **Manual top-up** flow (since automated payments are pending integration) — user submits intent, admin marks `completed`, `apply_manual_wallet_topup` trigger credits balance
- Withdrawals (`withdrawals` table) with provider & status
- Full escrow transaction history

### 🔔 Notifications (`/notifications`)

- Real-time via Supabase Realtime (`NotificationListener.tsx`)
- Auto-generated for: comments, likes, reactions, follows, messages, deadline reminders
- Swipe-to-read on mobile
- Mark all read / per-item

### 👤 Profile (`/profile/$id`)

- Cover image + avatar (curated `AvatarPicker.tsx`)
- Bio, location, school, intended major, dream universities
- Academic stats: GPA, SAT, IELTS, TOEFL (`ScoreInput.tsx`)
- **Custom stats** editor for unique achievements (`CustomStatsEditor.tsx`)
- **Certifications** editor (`CertificateEditor.tsx`) with file uploads to `certificates` bucket
- **Extracurriculars** editor (`ExtracurricularUploader.tsx`)
- **Multiple GU universities** — admitted students list every school they got into (`gu_universities` table) with QS rank
- **Skill endorsements** from other users
- **Badges** earned automatically (`badges` table)
- **Profile views** tracking (`profile_views` table)
- Theme preference (dark/light) saved per profile

### ⚙️ Settings (`/settings`)

- Edit personal & academic profile
- **Service rates** section for Premium G.U. (chat / call / booking USD rates)
- Theme toggle (light / dark)
- Sign out

### 🧰 Cross-cutting

- **Global Search** (`GlobalSearch.tsx`) with `⌘K` shortcut — users, posts, groups, listings
- **Responsive shell** (`AppShell.tsx`) — collapsible sidebar on mobile/tablet, max-width clamp (`1600px`) so it doesn't stretch on TVs
- **Theme system** with semantic OKLCH tokens in `src/styles.css`
- **Toast** notifications (Sonner) — bottom-right, auto-dismiss

---

## 🛠️ Tech Stack

**Frontend**

- React 19 + TypeScript (strict mode)
- **TanStack Start** v1 (full-stack React framework, SSR-ready)
- TanStack Router (file-based, type-safe)
- TanStack Query for data fetching
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- Lucide icons, Sonner toasts, Recharts, Embla Carousel
- React Hook Form + Zod validation
- date-fns

**Backend**

- **Lovable Cloud** (managed Supabase)
- PostgreSQL with Row-Level Security on every table
- Supabase Auth (email/password + Google OAuth)
- Supabase Storage (7 buckets: avatars, certificates, listing-previews, group-covers, covers, listing-content, post-media)
- Supabase Realtime (messages, notifications)
- TanStack `createServerFn` for typed RPC (e.g. AI gateway calls)

**AI**

- **Lovable AI Gateway** — `google/gemini-2.5-flash`, `gemini-2.5-pro`, `openai/gpt-5` family. No user API key required.

**Build & Deploy**

- Vite 7
- Cloudflare Workers runtime (`wrangler.jsonc`) with `nodejs_compat`
- Bun for package management

---

## 🔑 Environment Variables

Auto-provisioned by Lovable Cloud — see `.env`:

| Variable                        | Scope           | Purpose                        |
| ------------------------------- | --------------- | ------------------------------ |
| `VITE_SUPABASE_URL`             | client          | Supabase project URL           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client          | Public anon key                |
| `VITE_SUPABASE_PROJECT_ID`      | client          | Project ref                    |
| `SUPABASE_URL`                  | server          | Same URL, server-side          |
| `SUPABASE_PUBLISHABLE_KEY`      | server          | Server-side anon               |
| `SUPABASE_SERVICE_ROLE_KEY`     | server (secret) | Admin operations, bypasses RLS |
| `SUPABASE_DB_URL`               | server (secret) | Direct Postgres connection     |
| `LOVABLE_API_KEY`               | server (secret) | AI Gateway authorization       |

---

## 🗄️ Database Schema Overview

29 tables across 7 domains, all secured with RLS.

**Identity & Social**
`profiles` · `follows` · `skill_endorsements` · `badges` · `profile_views` · `gu_universities` · `gu_status_requests`

**Content**
`posts` · `post_comments` · `post_likes` · `post_reactions` · `poll_votes`

**Community**
`groups` · `group_members`

**Communication**
`conversations` · `messages` · `notifications`

**Commerce**
`marketplace_listings` · `listing_purchases` · `escrow_transactions` · `wallets` · `wallet_topups` · `withdrawals` · `subscriptions`

**Events & Sessions**
`events` · `event_rsvps` · `sessions` · `deadline_reminders`

**AI**
`ai_conversations`

**Database functions & triggers**
Count syncers (`update_post_likes_count`, `update_post_comments_count`, `update_group_member_count`, `update_event_attendee_count`), notification triggers (`notify_on_comment`, `notify_on_post_like`, `notify_on_post_reaction`, `notify_on_follow`, `notify_on_message`), auto-provisioning (`handle_new_user`, `create_wallet_for_user`, `add_creator_as_admin`), slug helpers (`slugify`, `generate_unique_username`, `generate_unique_group_slug`), wallet credit (`apply_manual_wallet_topup`).

---

## 📁 Project Structure

```
.
├── src/
│   ├── routes/                    # File-based routing (TanStack Router)
│   │   ├── __root.tsx             # Root layout
│   │   ├── index.tsx              # Landing page
│   │   ├── login.tsx              # Auth
│   │   ├── signup.tsx
│   │   ├── onboarding.tsx
│   │   ├── feed.tsx               # Home feed
│   │   ├── explore.tsx            # People discovery
│   │   ├── marketplace.tsx        # Buy/sell resources
│   │   ├── messages.tsx           # 1-on-1 chat
│   │   ├── notifications.tsx
│   │   ├── ai.tsx                 # AI Advisor (4 modes)
│   │   ├── groups.index.tsx       # Group directory
│   │   ├── groups.$slug.tsx       # Individual group
│   │   ├── events.tsx
│   │   ├── sessions.tsx           # Video bookings
│   │   ├── universities.tsx       # University directory
│   │   ├── profile.$id.tsx        # User profile
│   │   ├── settings.tsx
│   │   ├── premium.tsx
│   │   └── wallet.tsx
│   ├── components/
│   │   ├── AppShell.tsx           # Layout w/ collapsible sidebar
│   │   ├── PostCard.tsx           # Feed post
│   │   ├── ReactionBar.tsx        # 5-emoji reactions
│   │   ├── PollBlock.tsx
│   │   ├── GlobalSearch.tsx       # ⌘K
│   │   ├── NotificationListener.tsx  # Realtime
│   │   ├── ProfileCompletionBanner.tsx
│   │   ├── PremiumGate.tsx
│   │   ├── RequireAuth.tsx
│   │   ├── AvatarPicker.tsx
│   │   ├── CertificateEditor.tsx
│   │   ├── CustomStatsEditor.tsx
│   │   ├── ExtracurricularUploader.tsx
│   │   ├── ScoreInput.tsx
│   │   ├── PhoneInput.tsx
│   │   ├── PasswordInput.tsx / PasswordStrength.tsx
│   │   ├── UserBadge.tsx
│   │   ├── WordCountTextarea.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Logo.tsx
│   │   └── ui/                    # shadcn primitives
│   ├── lib/
│   │   ├── ai.functions.ts        # createServerFn → Lovable AI Gateway
│   │   ├── auth-context.tsx       # Auth provider
│   │   ├── theme.tsx
│   │   ├── notifications.ts
│   │   ├── password.ts
│   │   ├── country-flags.ts
│   │   ├── error-capture.ts / error-page.ts
│   │   ├── utils.ts
│   │   └── data/                  # presets, universities, uzbekistan, avatars
│   ├── integrations/supabase/
│   │   ├── client.ts              # Browser client (auto-generated)
│   │   ├── client.server.ts       # Admin client (server-only)
│   │   ├── auth-middleware.ts     # requireSupabaseAuth
│   │   ├── auth-attacher.ts       # Auto-attaches JWT to server fns
│   │   └── types.ts               # Generated DB types
│   ├── hooks/use-mobile.tsx
│   ├── styles.css                 # Tailwind v4 + OKLCH tokens
│   ├── router.tsx
│   ├── start.ts
│   └── server.ts
├── supabase/
│   ├── config.toml
│   └── migrations/                # All schema changes
├── wrangler.jsonc                 # Cloudflare Workers config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚧 Roadmap

**Q3 2026**

- Automated payments (Click, Payme, Stripe) → replace manual top-up
- Mentor video sessions with built-in WebRTC room (Daily.co / LiveKit)
- AI Essay scoring rubric with Common App-style breakdown
- Mobile apps (React Native via Expo)

**Q4 2026**

- Scholarship database with personalized matching
- Mock-interview AI (voice mode)
- Group video study rooms
- Application portfolio export (PDF) for parents/sponsors

**2027**

- Expand to Kazakhstan, Kyrgyzstan, Tajikistan
- B2B offering for Uzbek schools (school admin dashboards)
- Verified counselor program (paid certification)
- Annual UniIn Summit (in-person)

---

## 👥 Team Bitrix

| Member                 | Role                           |
| ---------------------- | ------------------------------ |
| **Otabek Abduvaliyev** | Team Lead · Frontend Developer |
| **Doniyor Musayev**    | Fullstack Developer            |
| **Abdurahmon Ikromov** | Marketing                      |
| **Azamov Azamat**      | Frontend Developer             |
| **Bobojonov Sherzod**  | Designer                       |

Built at **Build with AI Ideathon 2026** — a joint initiative by **SQB (Sanoat Qurilish Bank)** and **New Uzbekistan University**.

---

## 📜 License

© 2026 Team Bitrix. All rights reserved. Built with ❤️ in Tashkent.
