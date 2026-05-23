
-- ENUMS
CREATE TYPE user_type AS ENUM ('gu', 'prep');
CREATE TYPE post_type AS ENUM ('update', 'question', 'resource', 'win', 'essay_tip');
CREATE TYPE listing_type AS ENUM ('full_package', 'essay', 'portfolio', 'chat_call');
CREATE TYPE listing_status AS ENUM ('active', 'paused', 'sold');
CREATE TYPE purchase_status AS ENUM ('pending', 'completed');
CREATE TYPE session_type AS ENUM ('video', 'audio', 'chat');
CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE ai_mode AS ENUM ('university_match', 'profile_analyzer', 'essay_coach');
CREATE TYPE group_role AS ENUM ('admin', 'member');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  phone TEXT,
  user_type user_type,
  grade TEXT,
  target_year INT,
  school_name TEXT,
  gpa NUMERIC,
  gpa_scale NUMERIC DEFAULT 4.0,
  sat INT,
  ielts NUMERIC,
  toefl INT,
  extracurriculars TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  bio TEXT,
  certificates TEXT[] DEFAULT '{}',
  target_countries TEXT[] DEFAULT '{}',
  dream_universities TEXT[] DEFAULT '{}',
  intended_major TEXT,
  is_verified_gu BOOLEAN DEFAULT FALSE,
  rank_score NUMERIC DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.gu_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  country TEXT,
  qs_rank INT,
  year_admitted INT,
  degree_type TEXT,
  major TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  post_type post_type DEFAULT 'update',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INT DEFAULT 1,
  cover_image_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  listing_type listing_type NOT NULL,
  price_usd NUMERIC,
  is_free BOOLEAN DEFAULT FALSE,
  preview_content TEXT,
  full_content_url TEXT,
  preview_percentage INT DEFAULT 10,
  screenshot_protected BOOLEAN DEFAULT TRUE,
  status listing_status DEFAULT 'active',
  purchases_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.listing_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd NUMERIC,
  status purchase_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  session_type session_type DEFAULT 'video',
  status session_status DEFAULT 'scheduled',
  room_url TEXT,
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode ai_mode NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.gu_status_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- RLS ENABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_status_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES policies: anyone can read, only self can update
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- gu_universities: viewable by all, modifiable by profile owner
CREATE POLICY "Gu universities viewable by all" ON public.gu_universities FOR SELECT USING (true);
CREATE POLICY "Profile owner can manage gu universities" ON public.gu_universities FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

-- posts: viewable by all, only author writes
CREATE POLICY "Posts viewable by all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = author_id AND p.user_id = auth.uid()));
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = author_id AND p.user_id = auth.uid()));
CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = author_id AND p.user_id = auth.uid()));

-- likes
CREATE POLICY "Likes viewable by all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- comments
CREATE POLICY "Comments viewable by all" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.post_comments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = author_id AND p.user_id = auth.uid()));
CREATE POLICY "Users delete own comments" ON public.post_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = author_id AND p.user_id = auth.uid()));

-- follows
CREATE POLICY "Follows viewable by all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- conversations: only participants
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- messages: only participants of conversation can view/insert
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)));
CREATE POLICY "Senders can update read status" ON public.messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)));

-- groups
CREATE POLICY "Groups viewable by all" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Authenticated can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update group" ON public.groups FOR UPDATE USING (auth.uid() = creator_id);

-- group members
CREATE POLICY "Group members viewable by all" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- marketplace
CREATE POLICY "Listings viewable by all" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Sellers create listings" ON public.marketplace_listings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = seller_id AND p.user_id = auth.uid()));
CREATE POLICY "Sellers update own listings" ON public.marketplace_listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = seller_id AND p.user_id = auth.uid()));

-- listing_purchases: buyer/seller can view
CREATE POLICY "Buyers and sellers view purchases" ON public.listing_purchases FOR SELECT
  USING (auth.uid() = buyer_id OR EXISTS (
    SELECT 1 FROM public.marketplace_listings l JOIN public.profiles p ON p.id = l.seller_id
    WHERE l.id = listing_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "Buyers create purchases" ON public.listing_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- sessions
CREATE POLICY "Session participants view" ON public.sessions FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "Users create sessions" ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "Participants update sessions" ON public.sessions FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- ai_conversations
CREATE POLICY "Users own ai conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- gu_status_requests
CREATE POLICY "Users view own requests" ON public.gu_status_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create requests" ON public.gu_status_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TRIGGERS / FUNCTIONS

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Counters for posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Group member counter
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER group_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('post-media', 'post-media', true),
  ('certificates', 'certificates', false),
  ('listing-previews', 'listing-previews', true),
  ('listing-content', 'listing-content', false),
  ('group-covers', 'group-covers', true);

-- Storage policies: public buckets read
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Public read listing previews" ON storage.objects FOR SELECT USING (bucket_id = 'listing-previews');
CREATE POLICY "Public read group covers" ON storage.objects FOR SELECT USING (bucket_id = 'group-covers');

CREATE POLICY "Authed upload avatars" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Owner update avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authed upload post media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Authed upload listing previews" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-previews' AND auth.role() = 'authenticated');
CREATE POLICY "Authed upload listing content" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-content' AND auth.role() = 'authenticated');
CREATE POLICY "Authed upload group covers" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'group-covers' AND auth.role() = 'authenticated');

-- Certificates: owner-scoped (folder = user id)
CREATE POLICY "Owner read certificates" ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner upload certificates" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Listing content: only buyers can read
CREATE POLICY "Buyers read listing content" ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-content' AND EXISTS (
    SELECT 1 FROM public.listing_purchases lp
    WHERE lp.buyer_id = auth.uid()
      AND lp.status = 'completed'
      AND lp.listing_id::text = (storage.foldername(name))[1]
  ));
