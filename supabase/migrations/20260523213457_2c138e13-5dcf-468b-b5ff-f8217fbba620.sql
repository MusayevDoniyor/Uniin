
-- 1. Profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Notifications: restrict INSERT to self-targeted (prevents spoofing others)
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Group members: prevent self-assigning admin/moderator role on join
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups as member"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'member');

-- 4. Storage: post-media path ownership + update/delete
DROP POLICY IF EXISTS "Authed upload post media" ON storage.objects;
CREATE POLICY "Owner upload post media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update post media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete post media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5. Storage: listing-previews path ownership + update/delete
DROP POLICY IF EXISTS "Authed upload listing previews" ON storage.objects;
CREATE POLICY "Owner upload listing previews"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-previews' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update listing previews"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-previews' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete listing previews"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-previews' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 6. Storage: listing-content uploads also need ownership (seller folder)
DROP POLICY IF EXISTS "Authed upload listing content" ON storage.objects;
CREATE POLICY "Seller upload listing content"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-content' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Seller update listing content"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-content' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Seller delete listing content"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-content' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 7. Storage: tighten buyer read of listing-content to specific purchased listing's file
DROP POLICY IF EXISTS "Buyers read listing content" ON storage.objects;
CREATE POLICY "Buyers read purchased listing content"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'listing-content' AND (
    -- seller can always read own files
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.listing_purchases lp
      JOIN public.marketplace_listings ml ON ml.id = lp.listing_id
      JOIN public.profiles p ON p.id = ml.seller_id
      WHERE lp.buyer_id = auth.uid()
        AND lp.status = 'completed'
        AND (p.user_id)::text = (storage.foldername(objects.name))[1]
        AND (ml.full_content_url LIKE '%' || objects.name
             OR ml.cover_image_url LIKE '%' || objects.name)
    )
  )
);

-- 8. Trigger functions: pin search_path + revoke direct execute
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_group_member_count() SET search_path = public;
ALTER FUNCTION public.update_post_comments_count() SET search_path = public;
ALTER FUNCTION public.update_post_likes_count() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.add_creator_as_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM anon, authenticated, public;

-- 9. Realtime: require authentication to subscribe (table-level RLS still filters payloads)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated realtime access" ON realtime.messages;
CREATE POLICY "Authenticated realtime access"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);
