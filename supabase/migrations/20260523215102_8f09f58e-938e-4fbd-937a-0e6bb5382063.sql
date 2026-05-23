
-- =========================================================================
-- 1. WALLETS
-- =========================================================================
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_earned_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wallet" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_create_wallet AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_user();

-- Backfill wallets for existing profiles
INSERT INTO public.wallets (user_id)
SELECT user_id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================================
-- 2. WALLET TOPUPS
-- =========================================================================
CREATE TYPE public.payment_provider AS ENUM ('stripe', 'uzum');
CREATE TYPE public.topup_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE public.wallet_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd > 0),
  provider public.payment_provider NOT NULL,
  status public.topup_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own topups" ON public.wallet_topups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own topups" ON public.wallet_topups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 3. WITHDRAWALS
-- =========================================================================
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd >= 10),
  provider public.payment_provider NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own withdrawals" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 4. ESCROW TRANSACTIONS
-- =========================================================================
CREATE TYPE public.escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');

CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd > 0),
  platform_fee_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  seller_payout_usd NUMERIC(10,2) NOT NULL,
  status public.escrow_status NOT NULL DEFAULT 'held',
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_escrow_buyer ON public.escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller ON public.escrow_transactions(seller_id);
CREATE INDEX idx_escrow_listing ON public.escrow_transactions(listing_id);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer and seller view escrow" ON public.escrow_transactions FOR SELECT TO authenticated
  USING (
    auth.uid() = buyer_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = escrow_transactions.seller_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Buyer creates escrow" ON public.escrow_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyer or seller can update escrow" ON public.escrow_transactions FOR UPDATE TO authenticated
  USING (
    auth.uid() = buyer_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = escrow_transactions.seller_id AND p.user_id = auth.uid())
  );

-- =========================================================================
-- 5. SUBSCRIPTIONS
-- =========================================================================
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'pending');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscription" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 6. PROFILE VIEWS
-- =========================================================================
CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL,
  viewed_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profile_views_viewed ON public.profile_views(viewed_id, created_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
-- Only the viewed user sees their viewers
CREATE POLICY "Viewed user sees their views" ON public.profile_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_views.viewed_id AND p.user_id = auth.uid()));
CREATE POLICY "Authenticated create views" ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- =========================================================================
-- 7. SKILL ENDORSEMENTS
-- =========================================================================
CREATE TABLE public.skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL,
  endorsed_id UUID NOT NULL,
  skill TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (endorser_id, endorsed_id, skill)
);
CREATE INDEX idx_endorsements_endorsed ON public.skill_endorsements(endorsed_id);

ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Endorsements viewable by authenticated" ON public.skill_endorsements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users endorse others" ON public.skill_endorsements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = endorser_id AND endorser_id <> endorsed_id);
CREATE POLICY "Users remove own endorsements" ON public.skill_endorsements FOR DELETE TO authenticated
  USING (auth.uid() = endorser_id);

-- =========================================================================
-- 8. BADGES
-- =========================================================================
CREATE TYPE public.badge_type AS ENUM (
  'first_post', 'early_adopter', 'top_mentor', 'hundred_followers',
  'verified_gu', 'marketplace_star', 'top_contributor'
);

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type public.badge_type NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type)
);
CREATE INDEX idx_badges_user ON public.badges(user_id);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by authenticated" ON public.badges FOR SELECT TO authenticated USING (true);
-- Inserts only happen via security-definer triggers

-- =========================================================================
-- 9. EVENTS
-- =========================================================================
CREATE TYPE public.event_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_attendees INTEGER,
  cover_image_url TEXT,
  room_url TEXT,
  status public.event_status NOT NULL DEFAULT 'upcoming',
  attendee_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_scheduled ON public.events(scheduled_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (true);
-- Only G.U. users can create events
CREATE POLICY "GU users create events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = events.host_id AND p.user_id = auth.uid() AND p.user_type = 'gu'
    )
  );
CREATE POLICY "Host updates own events" ON public.events FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = events.host_id AND p.user_id = auth.uid()));
CREATE POLICY "Host deletes own events" ON public.events FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = events.host_id AND p.user_id = auth.uid()));

-- =========================================================================
-- 10. EVENT RSVPS
-- =========================================================================
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX idx_rsvps_event ON public.event_rsvps(event_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs viewable by all" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users create own RSVPs" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own RSVPs" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Maintain event attendee count
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.update_event_attendee_count() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER event_rsvps_count AFTER INSERT OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_event_attendee_count();

-- =========================================================================
-- 11. DEADLINE REMINDERS
-- =========================================================================
CREATE TABLE public.deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_name TEXT NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  reminder_days INTEGER[] NOT NULL DEFAULT ARRAY[30, 7, 1],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deadlines_user ON public.deadline_reminders(user_id, deadline_at);

ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deadlines" ON public.deadline_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own deadlines" ON public.deadline_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own deadlines" ON public.deadline_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own deadlines" ON public.deadline_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- 12. POST REACTIONS (5 types)
-- =========================================================================
CREATE TYPE public.reaction_type AS ENUM ('like', 'insightful', 'congrats', 'support', 'curious');

CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction public.reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable by all" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users add own reactions" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reactions" ON public.post_reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Backfill existing post_likes into post_reactions as 'like'
INSERT INTO public.post_reactions (post_id, user_id, reaction, created_at)
SELECT post_id, user_id, 'like'::reaction_type, created_at FROM public.post_likes
ON CONFLICT (post_id, user_id) DO NOTHING;

-- =========================================================================
-- 13. POLL VOTES
-- =========================================================================
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  option_index SMALLINT NOT NULL CHECK (option_index >= 0 AND option_index < 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX idx_poll_votes_post ON public.poll_votes(post_id);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll votes viewable by all" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users vote in polls" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users change own vote" ON public.poll_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users remove own vote" ON public.poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- EXTEND EXISTING TABLES
-- =========================================================================

-- Profiles: mentoring toggle, premium flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_open_to_mentoring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Posts: title for articles, poll options, impressions
ALTER TYPE public.post_type ADD VALUE IF NOT EXISTS 'article';
ALTER TYPE public.post_type ADD VALUE IF NOT EXISTS 'poll';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS poll_options JSONB,
  ADD COLUMN IF NOT EXISTS impressions_count INTEGER NOT NULL DEFAULT 0;

-- Marketplace: escrow and delivery
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS escrow_enabled BOOLEAN NOT NULL DEFAULT true;

-- =========================================================================
-- REALTIME SUBSCRIPTIONS
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
