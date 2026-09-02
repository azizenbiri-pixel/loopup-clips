CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  username text NOT NULL,
  avatar_url text,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_video_id_created_at_idx ON public.comments(video_id, created_at);

GRANT SELECT, INSERT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can post a comment" ON public.comments FOR INSERT WITH CHECK (char_length(text) BETWEEN 1 AND 500 AND char_length(username) BETWEEN 1 AND 40);

CREATE OR REPLACE FUNCTION public.sync_video_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER comments_count_sync
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_video_comments_count();