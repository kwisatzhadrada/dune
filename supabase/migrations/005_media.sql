-- ============================================================
-- DreamLink Media Support
-- ============================================================

-- 1. Extend posts table with media columns
--    All columns are nullable with safe defaults so existing rows
--    are completely unaffected.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_urls    text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url     text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS embed_url     text,
  ADD COLUMN IF NOT EXISTS embed_type    text
    CHECK (embed_type IN ('youtube', 'tiktok', 'x'));

CREATE INDEX IF NOT EXISTS posts_has_media_idx
  ON public.posts ((array_length(image_urls, 1)))
  WHERE array_length(image_urls, 1) > 0;

CREATE INDEX IF NOT EXISTS posts_embed_type_idx
  ON public.posts (embed_type)
  WHERE embed_type IS NOT NULL;

-- 2. post-media bucket (images: jpg, png, webp, gif)
--    Public read, owner-scoped write (same pattern as avatars).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. post-videos bucket (mp4, mov, webm)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-videos',
  'post-videos',
  true,
  104857600,  -- 100 MB
  ARRAY['video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS on post-media

DROP POLICY IF EXISTS "post_media_read"   ON storage.objects;
DROP POLICY IF EXISTS "post_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_media_update" ON storage.objects;
DROP POLICY IF EXISTS "post_media_delete" ON storage.objects;

CREATE POLICY "post_media_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "post_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post_media_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post_media_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. RLS on post-videos

DROP POLICY IF EXISTS "post_videos_read"   ON storage.objects;
DROP POLICY IF EXISTS "post_videos_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_videos_update" ON storage.objects;
DROP POLICY IF EXISTS "post_videos_delete" ON storage.objects;

CREATE POLICY "post_videos_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-videos');

CREATE POLICY "post_videos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-videos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post_videos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post_videos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
