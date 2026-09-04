import { useSyncExternalStore } from "react";

export type LocalProfile = {
  username: string;
  avatar: string;
  following: string[];
};

const KEY = "clipclap.profile";

const DEFAULT_PROFILE: LocalProfile = {
  username: "toi",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=moi&backgroundColor=ffd5dc",
  following: [],
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

export function toggleFollow(username: string) {
  load();
  const following = profile.following.includes(username)
    ? profile.following.filter((u) => u !== username)
    : [...profile.following, username];
  profile = { ...profile, following };
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
