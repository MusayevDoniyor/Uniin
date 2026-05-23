
-- 1. Cover image column on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2. Covers bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies — drop+recreate to be idempotent
DO $$ BEGIN
  -- Avatars: public read, authenticated write own folder
  DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_user_write" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
  DROP POLICY IF EXISTS "covers_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "covers_user_write" ON storage.objects;
  DROP POLICY IF EXISTS "covers_user_update" ON storage.objects;
  DROP POLICY IF EXISTS "covers_user_delete" ON storage.objects;
  DROP POLICY IF EXISTS "certs_user_read" ON storage.objects;
  DROP POLICY IF EXISTS "certs_user_write" ON storage.objects;
END $$;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "covers_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_user_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "covers_user_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "covers_user_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "certs_user_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "certs_user_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Auto-add group creator as admin member (avoids needing two separate inserts from client)
CREATE OR REPLACE FUNCTION public.add_creator_as_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_add_creator_as_admin ON public.groups;
CREATE TRIGGER trg_add_creator_as_admin AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_admin();

-- 5. Wire existing count triggers if missing
DROP TRIGGER IF EXISTS trg_group_member_count ON public.group_members;
CREATE TRIGGER trg_group_member_count AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 6. Enable realtime for notifications/posts/messages (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
