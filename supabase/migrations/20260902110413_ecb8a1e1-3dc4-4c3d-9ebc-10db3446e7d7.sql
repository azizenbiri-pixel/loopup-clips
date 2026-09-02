CREATE POLICY "Anyone can upload a video file"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Video files are readable"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can publish a video"
ON public.videos FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL AND char_length(video_url) > 0 AND (description IS NULL OR char_length(description) <= 300));

GRANT INSERT ON public.videos TO anon;