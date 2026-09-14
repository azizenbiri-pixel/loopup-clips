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
};

const SELECT =
  "id, video_url, description, profile_pic, likes_count, comments_count, views_count, profiles(username)";

type Row = {
  id: string;
  video_url: string;
  description: string | null;
  profile_pic: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  profiles: { username: string } | null;
};

const toFeedVideo = (v: Row): FeedVideo => ({
  id: v.id,
  video_url: v.video_url,
  description: v.description,
  profile_pic: v.profile_pic,
  likes_count: v.likes_count,
  comments_count: v.comments_count,
  views_count: v.views_count ?? 0,
  username: v.profiles?.username ?? "clipclap",
});

export const getVideos = createServerFn({ method: "GET" }).handler(async (): Promise<FeedVideo[]> => {
  const { data, error } = await publicClient()
    .from("videos")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Row[]).map(toFeedVideo);
});

export type CreatorProfile = {
  username: string;
  avatar_url: string | null;
  videos: FeedVideo[];
  followers: number;
  following: number;
  total_likes: number;
};

export const getCreator = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ username: z.string().trim().min(1).max(40) }).parse(input))
  .handler(async ({ data }): Promise<CreatorProfile> => {
    const client = publicClient();

    const { data: profile } = await client
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("username", data.username)
      .maybeSingle();

    let videos: FeedVideo[] = [];
    if (profile) {
      const { data: rows, error } = await client
        .from("videos")
        .select(SELECT)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      videos = ((rows ?? []) as unknown as Row[]).map(toFeedVideo);
    }

    const total_likes = videos.reduce((s, v) => s + v.likes_count, 0);
    const seed = [...data.username].reduce((s, c) => s + c.charCodeAt(0), 0);

    return {
      username: data.username,
      avatar_url: profile?.avatar_url ?? videos[0]?.profile_pic ?? null,
      videos,
      followers: Math.round(total_likes / 4) + (seed % 500) + 120,
      following: 40 + (seed % 260),
      total_likes,
    };
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

export type SavedProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export const saveMyProfile = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        username: z.string().trim().min(1).max(40),
        displayName: z.string().trim().max(60).nullable().optional(),
        bio: z.string().trim().max(200).nullable().optional(),
        avatarUrl: z.string().url().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<SavedProfile> => {
    const client = publicClient();
    const payload = {
      id: data.id,
      username: data.username,
      display_name: data.displayName || null,
      bio: data.bio || null,
      avatar_url: data.avatarUrl || null,
      is_local: true,
    };

    const { data: row, error } = await client
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, username, display_name, bio, avatar_url")
      .single();

    if (error) throw new Error(error.message);
    return row as SavedProfile;
  });
