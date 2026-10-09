import { useSyncExternalStore } from "react";

export type LocalProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  following: string[];
  saved: string[];
  myVideos: string[];
};

const KEY = "clipclap.profile";

const DEFAULT_PROFILE: LocalProfile = {
  id: "00000000-0000-4000-8000-000000000000",
  username: "toi",
  displayName: "Toi",
  bio: "Créateur de boucles infinies ♾️",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=moi&backgroundColor=ffd5dc",
  following: [],
  saved: [],
  myVideos: [],
};

let profile: LocalProfile = DEFAULT_PROFILE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) profile = { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<LocalProfile>) };
    if (!profile.id || profile.id === DEFAULT_PROFILE.id) {
      profile = { ...profile, id: crypto.randomUUID() };
      window.localStorage.setItem(KEY, JSON.stringify(profile));
    }
  } catch {
    /* stockage indisponible */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* stockage indisponible */
  }
  emit();
}

export function updateProfile(patch: Partial<LocalProfile>) {
  load();
  profile = { ...profile, ...patch };
  persist();
}

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function toggleFollow(username: string) {
  load();
  profile = { ...profile, following: toggleIn(profile.following, username) };
  persist();
}

export function toggleSaved(videoId: string) {
  load();
  profile = { ...profile, saved: toggleIn(profile.saved, videoId) };
  persist();
}

export function addMyVideo(videoId: string) {
  load();
  if (profile.myVideos.includes(videoId)) return;
  profile = { ...profile, myVideos: [videoId, ...profile.myVideos] };
  persist();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLocalProfile() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return profile;
    },
    () => DEFAULT_PROFILE,
  );
}
