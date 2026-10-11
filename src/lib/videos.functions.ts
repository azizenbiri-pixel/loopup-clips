import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const publicClient = () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
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
  views_count: number;
  username: string;
  user_id: string | null;
};

const SELECT =
  "id, video_url, description, profile_pic, likes_count, comments_count, views_count, user_id, profiles(username, avatar_url)";

type Row = {
  id: string;
  video_url: string;
  description: string | null;
  profile_pic: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
};

const toFeedVideo = (v: Row): FeedVideo => ({
  id: v.id,
  video_url: v.video_url,
  description: v.description,
  profile_pic: v.profiles?.avatar_url ?? v.profile_pic,
  likes_count: v.likes_count,
  comments_count: v.comments_count,
  views_count: v.views_count ?? 0,
  username: v.profiles?.username ?? "clipclap",
  user_id: v.user_id,
});

// The backend can be briefly unreachable (cold start, wake-up after idle):
// retry a few times before giving up so the feed doesn't fail on a blip.
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError;
}

export const getVideos = createServerFn({ method: "GET" }).handler(async (): Promise<FeedVideo[]> => {
  return withRetry(async () => {
    const { data, error } = await publicClient()
      .from("videos")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });

    if (error) throw new Error(error.message);

    return ((data ?? []) as unknown as Row[]).map(toFeedVideo);
  });
});

export type CreatorProfile = {
  id: string | null;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  videos: FeedVideo[];
  followers: number;
  following: number;
  total_likes: number;
  total_views: number;
};

export const getCreator = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ username: z.string().trim().min(1).max(40) }).parse(input))
  .handler(async ({ data }): Promise<CreatorProfile> => {
    const client = publicClient();
    const { data: profile } = await client
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url")
      .eq("username", data.username)
      .maybeSingle();

    let videos: FeedVideo[] = [];
    let followers = 0;
    let following = 0;
    if (profile) {
      const [rows, fr, fg] = await Promise.all([
        client.from("videos").select(SELECT).eq("user_id", profile.id).order("created_at", { ascending: false }),
        client.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
        client.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
      ]);
      if (rows.error) throw new Error(rows.error.message);
      videos = ((rows.data ?? []) as unknown as Row[]).map(toFeedVideo);
      followers = fr.count ?? 0;
      following = fg.count ?? 0;
    }

    return {
      id: profile?.id ?? null,
      username: data.username,
      display_name: profile?.display_name ?? null,
      bio: profile?.bio ?? null,
      avatar_url: profile?.avatar_url ?? videos[0]?.profile_pic ?? null,
      videos,
      followers,
      following,
      total_likes: videos.reduce((s, v) => s + v.likes_count, 0),
      total_views: videos.reduce((s, v) => s + v.views_count, 0),
    };
  });

export type CreatorSummary = { id: string; username: string; avatar_url: string | null; followers: number };

export const getCreators = createServerFn({ method: "GET" }).handler(async (): Promise<CreatorSummary[]> => {
  const client = publicClient();
  const [{ data: profiles, error }, { data: follows }, { data: vids }] = await Promise.all([
    client.from("profiles").select("id, username, avatar_url").eq("is_local", false).limit(200),
    client.from("follows").select("following_id"),
    client.from("videos").select("user_id"),
  ]);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const f of follows ?? []) counts.set(f.following_id, (counts.get(f.following_id) ?? 0) + 1);
  const withVideos = new Set((vids ?? []).map((v) => v.user_id));
  return (profiles ?? [])
    .map((p) => ({ ...p, followers: counts.get(p.id) ?? 0 }))
    .sort((x, y) => Number(withVideos.has(y.id)) - Number(withVideos.has(x.id)) || y.followers - x.followers);
});

export type VideoComment = {
  id: string;
  username: string;
  avatar_url: string | null;
  text: string;
  created_at: string;
};

export const getComments = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ videoId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<VideoComment[]> => {
    const { data: rows, error } = await publicClient()
      .from("comments")
      .select("id, username, avatar_url, text, created_at")
      .eq("video_id", data.videoId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addComment = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        videoId: z.string().uuid(),
        username: z.string().trim().min(1).max(40).default("toi"),
        avatarUrl: z.string().url().nullable().optional(),
        text: z.string().trim().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<VideoComment> => {
    const { data: row, error } = await publicClient()
      .from("comments")
      .insert({
        video_id: data.videoId,
        username: data.username,
        avatar_url: data.avatarUrl ?? null,
        text: data.text,
      })
      .select("id, username, avatar_url, text, created_at")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

