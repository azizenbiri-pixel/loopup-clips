CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  profile_pic TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are viewable by everyone" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Users can create their own videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" ON public.videos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_video_likes(_video_id UUID, _delta INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  IF _delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Invalid delta';
  END IF;

  UPDATE public.videos
  SET likes_count = GREATEST(likes_count + _delta, 0)
  WHERE id = _video_id
  RETURNING likes_count INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_video_likes(UUID, INTEGER) TO anon, authenticated;

INSERT INTO public.videos (video_url, description, profile_pic, likes_count, comments_count) VALUES
('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'Petite session du soir 🌙 #loopup #vibes', 'https://api.dicebear.com/9.x/avataaars/svg?seed=lea&backgroundColor=b6e3f4,ffd5dc,c0aede', 12400, 2),
('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'On repart pour un tour 🚗💨', 'https://api.dicebear.com/9.x/avataaars/svg?seed=theo&backgroundColor=b6e3f4,ffd5dc,c0aede', 8321, 1),
('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'POV : tu découvres LoopUp ✨', 'https://api.dicebear.com/9.x/avataaars/svg?seed=mia&backgroundColor=b6e3f4,ffd5dc,c0aede', 45120, 2),
('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'Escapade rapide 🌿 #travel', 'https://api.dicebear.com/9.x/avataaars/svg?seed=sami&backgroundColor=b6e3f4,ffd5dc,c0aede', 2760, 1);