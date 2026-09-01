import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const publicClient = () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
};

export type FeedVideo = {
  id: string;
  video_url: string;
  description: string | null;
  profile_pic: string | null;
  likes_count: number;
  comments_count: number;
  username: string;
};

export const getVideos = createServerFn({ method: "GET" }).handler(async (): Promise<FeedVideo[]> => {
  const { data, error } = await publicClient()
    .from("videos")
    .select("id, video_url, description, profile_pic, likes_count, comments_count, profiles(username)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((v) => ({
    id: v.id,
    video_url: v.video_url,
    description: v.description,
    profile_pic: v.profile_pic,
    likes_count: v.likes_count,
    comments_count: v.comments_count,
    username: (v.profiles as { username: string } | null)?.username ?? "loopup",
  }));
});

export const toggleVideoLike = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ videoId: z.string().uuid(), delta: z.union([z.literal(1), z.literal(-1)]) }).parse(input),
  )
  .handler(async ({ data }): Promise<number> => {
    const { data: count, error } = await publicClient().rpc("increment_video_likes", {
      _video_id: data.videoId,
      _delta: data.delta,
    });

    if (error) throw new Error(error.message);
    return count ?? 0;
  });
