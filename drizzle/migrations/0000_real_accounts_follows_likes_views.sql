-- Auto-create a profile for every new account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  base := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_]', '', 'g'));
  IF base = '' THEN base := 'user'; END IF;
  INSERT INTO public.profiles (id, username, display_name, avatar_url, is_local)
  VALUES (
    NEW.id,
    left(base, 30) || substr(replace(NEW.id::text, '-', ''), 1, 4),
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', base),
    coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for accounts that already exist
INSERT INTO public.profiles (id, username, display_name, is_local)
SELECT u.id,
       left(coalesce(nullif(lower(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')), ''), 'user'), 30)
         || substr(replace(u.id::text, '-', ''), 1, 4),
       split_part(u.email, '@', 1),
       false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Follows
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users follow as themselves" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow as themselves" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX follows_following_idx ON public.follows (following_id);

-- Likes (one per account per video)
CREATE TABLE public.video_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
GRANT SELECT ON public.video_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are public" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Users like as themselves" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike as themselves" ON public.video_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_video_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER video_likes_count_sync
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_video_likes_count();

-- Anonymous like counter is retired: likes now require an account
REVOKE EXECUTE ON FUNCTION public.increment_video_likes(uuid, integer) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.increment_video_likes(uuid, integer) IS 'DEPRECATED: replaced by video_likes table';

-- Real view counter
CREATE OR REPLACE FUNCTION public.increment_video_views(_video_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.videos SET views_count = views_count + 1 WHERE id = _video_id RETURNING views_count INTO n;
  RETURN n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_video_views(uuid) TO anon, authenticated;
