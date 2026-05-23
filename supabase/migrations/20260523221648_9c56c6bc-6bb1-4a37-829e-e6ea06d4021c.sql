UPDATE storage.buckets SET public = true WHERE id = 'listing-content';

CREATE POLICY "Public read listing-content"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-content');