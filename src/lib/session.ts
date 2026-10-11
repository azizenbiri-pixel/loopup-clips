import { useEffect, useSyncExternalStore } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Session (compte connecté) ---------- */

let user: User | null = null;
let ready = false;
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.getUser().then(({ data }) => {
    user = data.user ?? null;
    ready = true;
    listeners.forEach((l) => l());
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user ?? null;
    ready = true;
    listeners.forEach((l) => l());
  });
}

export function useSession() {
  const u = useSyncExternalStore(
    (l) => {
      start();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => user,
    () => null,
  );
  const r = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ready,
    () => false,
  );
  return { user: u, ready: r };
}

/* ---------- Mon profil ---------- */

export type MyProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export const DEFAULT_AVATAR = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export const myProfileQuery = (uid: string | undefined) =>
  queryOptions({
    queryKey: ["me", uid],
    enabled: !!uid,
    queryFn: async (): Promise<MyProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url")
        .eq("id", uid!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export function useMyProfile() {
  const { user, ready } = useSession();
  const q = useQuery(myProfileQuery(user?.id));
  return { user, ready, profile: q.data ?? null, loading: !!user && q.isLoading };
}

/* ---------- Abonnements & likes ---------- */

export const myFollowsQuery = (uid: string | undefined) =>
  queryOptions({
    queryKey: ["myFollows", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", uid!);
      if (error) throw error;
      return (data ?? []).map((r) => r.following_id);
    },
  });

export const myLikesQuery = (uid: string | undefined) =>
  queryOptions({
    queryKey: ["myLikes", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("video_likes").select("video_id").eq("user_id", uid!);
      if (error) throw error;
      return (data ?? []).map((r) => r.video_id);
    },
  });

export function useMyFollows() {
  const { user } = useSession();
  return useQuery(myFollowsQuery(user?.id)).data ?? [];
}

export function useMyLikes() {
  const { user } = useSession();
  return useQuery(myLikesQuery(user?.id)).data ?? [];
}

export async function setFollow(me: string, target: string, follow: boolean) {
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: me, following_id: target })
    : await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", target);
  if (error) throw error;
}

export async function setLike(me: string, videoId: string, like: boolean) {
  const { error } = like
    ? await supabase.from("video_likes").insert({ user_id: me, video_id: videoId })
    : await supabase.from("video_likes").delete().eq("user_id", me).eq("video_id", videoId);
  if (error) throw error;
}

/** Hook utilitaire : invalide tout ce qui dépend des abonnements. */
export function useFollowToggle() {
  const qc = useQueryClient();
  const { user } = useSession();
  return async (target: string, follow: boolean) => {
    if (!user) return false;
    await setFollow(user.id, target, follow);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["myFollows"] }),
      qc.invalidateQueries({ queryKey: ["creator"] }),
      qc.invalidateQueries({ queryKey: ["creators"] }),
    ]);
    return true;
  };
}

/* ---------- Vues réelles ---------- */
const viewed = new Set<string>();
export function countView(videoId: string) {
  if (viewed.has(videoId)) return;
  viewed.add(videoId);
  void supabase.rpc("increment_video_views", { _video_id: videoId });
}

/** Redémarre les listeners si la page revient (rien à faire côté SSR). */
export function useSessionBoot() {
  useEffect(() => start(), []);
}
