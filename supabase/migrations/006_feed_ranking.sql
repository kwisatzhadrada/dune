-- ============================================================
-- DreamLink Feed Ranking & New Post Types
-- ============================================================

-- 1. Expand post_type to include builder-specific types
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_post_type_check
  CHECK (post_type IN (
    'question', 'win', 'obstacle', 'lesson', 'milestone', 'reflection',
    'dream_update', 'build_log', 'intro'
  ));

-- 2. Add shares_count (idempotent)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS shares_count INTEGER NOT NULL DEFAULT 0;

-- 3. Feed score function
--    Dream updates and milestones get 2× weight — this is what makes
--    DreamLink different from a generic social feed.
--    Formula: Hacker News gravity (engagement / (age_hours + 2)^1.5)
CREATE OR REPLACE FUNCTION public.get_feed_score(
  p_post_type  TEXT,
  p_likes      INTEGER,
  p_saves      INTEGER,
  p_replies    INTEGER,
  p_shares     INTEGER,
  p_created_at TIMESTAMPTZ
) RETURNS FLOAT
LANGUAGE SQL STABLE AS $$
  SELECT (
    (p_likes + p_saves * 3 + p_replies * 2 + p_shares * 4)::float *
    CASE WHEN p_post_type IN ('dream_update', 'milestone') THEN 2.0 ELSE 1.0 END
  ) / POWER(EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600.0 + 2, 1.5)
$$;

-- 4. Increment shares (called optimistically from client)
CREATE OR REPLACE FUNCTION public.increment_shares(post_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = post_id;
$$;

-- 5. Performance indexes for feed queries
CREATE INDEX IF NOT EXISTS posts_post_type_idx    ON public.posts (post_type);
CREATE INDEX IF NOT EXISTS posts_created_desc_idx ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_saves_desc_idx   ON public.posts (saves_count DESC);
CREATE INDEX IF NOT EXISTS posts_shares_desc_idx  ON public.posts (shares_count DESC);
CREATE INDEX IF NOT EXISTS posts_likes_desc_idx   ON public.posts (likes_count DESC);

-- 6. Composite index for Trending tab (recent + engagement)
CREATE INDEX IF NOT EXISTS posts_trending_idx
  ON public.posts (created_at DESC, likes_count DESC, saves_count DESC)
  WHERE created_at > NOW() - INTERVAL '72 hours';
