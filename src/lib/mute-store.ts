import { useSyncExternalStore } from "react";

let muted = true;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setMuted(next: boolean) {
  if (muted === next) return;
  muted = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMuted() {
  return useSyncExternalStore(
    subscribe,
    () => muted,
    () => true,
  );
}
