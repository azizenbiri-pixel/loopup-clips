ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;
UPDATE public.videos SET views_count = GREATEST(likes_count * 7 + 120, 100) WHERE views_count = 0;