import { setMuted } from "@/lib/mute-store";

let pending = false;

/**
 * Le navigateur a bloqué la lecture avec le son : on repasse en muet et on
 * réactive automatiquement l'audio au premier geste de l'utilisateur.
 */
export function requestAudioUnlock(onUnlock?: () => void) {
  setMuted(true);
  if (typeof document === "undefined" || pending) return;
  pending = true;

  const handler = () => {
    pending = false;
    document.removeEventListener("pointerdown", handler);
    document.removeEventListener("touchstart", handler);
    document.removeEventListener("keydown", handler);
    setMuted(false);
    onUnlock?.();
  };

  document.addEventListener("pointerdown", handler, { once: true });
  document.addEventListener("touchstart", handler, { once: true });
  document.addEventListener("keydown", handler, { once: true });
}
