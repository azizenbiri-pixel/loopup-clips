ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS is_local boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Anyone can create a local profile" ON public.profiles;
CREATE POLICY "Anyone can create a local profile"
ON public.profiles FOR INSERT TO anon, authenticated
WITH CHECK (
  is_local = true
  AND char_length(username) BETWEEN 1 AND 40
  AND (display_name IS NULL OR char_length(display_name) <= 60)
  AND (bio IS NULL OR char_length(bio) <= 200)
);

DROP POLICY IF EXISTS "Anyone can update a local profile" ON public.profiles;
CREATE POLICY "Anyone can update a local profile"
ON public.profiles FOR UPDATE TO anon, authenticated
USING (is_local = true)
WITH CHECK (
  is_local = true
  AND char_length(username) BETWEEN 1 AND 40
  AND (display_name IS NULL OR char_length(display_name) <= 60)
  AND (bio IS NULL OR char_length(bio) <= 200)
);