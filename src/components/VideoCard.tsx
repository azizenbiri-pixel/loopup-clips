import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, MessageCircle, Music2, Play, Plus, Share2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { formatCount } from "@/lib/feed-data";
import type { FeedVideo } from "@/lib/videos.functions";
import { toggleVideoLike } from "@/lib/videos.functions";
import { ShareSheet } from "@/components/ShareSheet";
import { CommentsSheet } from "@/components/CommentsSheet";
import { setMuted, useMuted } from "@/lib/mute-store";
import { requestAudioUnlock } from "@/lib/audio-unlock";
import { playPop } from "@/lib/pop-sound";
import { toggleFollow, useLocalProfile } from "@/lib/local-profile";

export function VideoCard({ video }: { video: FeedVideo }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes_count);
  const [paused, setPaused] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const muted = useMuted();
  const profile = useLocalProfile();
  const like = useServerFn(toggleVideoLike);

  const isMine = profile.username === video.username;
  const following = profile.following.includes(video.username);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) v.volume = 1;
  }, [muted]);

  useEffect(() => {
    setLikeCount(video.likes_count);
  }, [video.likes_count]);

  useEffect(() => {
    const el = containerRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && entry.intersectionRatio > 0.6) {
          v.muted = false;
          v.play().catch(() => {
            // Autoplay avec son bloqué : muet le temps du premier geste
            v.muted = true;
            requestAudioUnlock(() => {
              v.muted = false;
              v.play().catch(() => undefined);
            });
            v.play().catch(() => undefined);
          });
          setPaused(false);
        } else {
          v.pause();
          v.currentTime = 0;
        }
      },
      { threshold: [0, 0.6, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pause + coupe le son dès que l'app passe en arrière-plan
  useEffect(() => {
    const onVisibility = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.visibilityState === "hidden") {
        v.muted = true;
        v.pause();
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setMuted(false);
      v.muted = false;
      v.play().catch(() => {
        v.muted = true;
        setMuted(true);
        v.play().catch(() => undefined);
      });
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const onLike = async () => {
    playPop();
    const delta = liked ? -1 : 1;
    const previous = likeCount;
    setLiked(!liked);
    setLikeCount(Math.max(previous + delta, 0));
    try {
      const next = await like({ data: { videoId: video.id, delta } });
      setLikeCount(next);
    } catch {
      setLiked(liked);
      setLikeCount(previous);
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/?v=${video.id}` : "";
  const shareText = video.description
    ? `${video.description} — @${video.username} sur ClipClap`
    : `Regarde cette vidéo de @${video.username} sur ClipClap`;
  const onShare = () => {
    playPop();
    setShareOpen(true);
  };

  return (
    <section
      ref={containerRef}
      className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        src={video.video_url}
        loop
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      {paused && (
        <button
          onClick={togglePlay}
          aria-label="Lecture"
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <Play className="size-16 text-foreground/80 drop-shadow-lg" fill="currentColor" />
        </button>
      )}

      {/* Right rail */}
      <div className="absolute bottom-28 right-3 z-20 flex flex-col items-center gap-6">
        <div className="relative">
          <Link
            to="/creator/$username"
            params={{ username: video.username }}
            aria-label={`Voir le profil de ${video.username}`}
          >
            <img
              src={
                video.profile_pic ??
                `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(video.username)}`
              }
              alt={`Photo de profil de ${video.username}`}
              className="size-12 rounded-full border-2 border-foreground/90 bg-card object-cover"
              loading="lazy"
            />
          </Link>
          {!isMine && !following && (
            <button
              onClick={() => {
                playPop();
                toggleFollow(video.username);
              }}
              aria-label="S'abonner"
              className="absolute -bottom-2 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-brand-gradient transition-all duration-300 animate-in fade-in zoom-in active:scale-90"
            >
              <Plus className="size-4 text-primary-foreground" strokeWidth={3} />
            </button>
          )}
        </div>

        <button
          onClick={onLike}
          aria-pressed={liked}
          aria-label="Like"
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <Heart
            className={liked ? "size-9 text-primary" : "size-9 text-foreground"}
            fill={liked ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
          <span className="text-xs font-semibold text-foreground text-shadow-soft">
            {formatCount(likeCount)}
          </span>
        </button>

        <button
          onClick={() => {
            playPop();
            setCommentsOpen(true);
          }}
          aria-label="Commentaires"
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <MessageCircle className="size-9 text-foreground" strokeWidth={1.8} />
          <span className="text-xs font-semibold text-foreground text-shadow-soft">
            {formatCount(video.comments_count)}
          </span>
        </button>

        <button
          onClick={() => {
            playPop();
            setSaved((s) => !s);
          }}
          aria-pressed={saved}
          aria-label="Enregistrer"
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <Bookmark
            className={saved ? "size-9 text-accent" : "size-9 text-foreground"}
            fill={saved ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
          <span className="text-xs font-semibold text-foreground text-shadow-soft">
            {saved ? "Enregistré" : "Enregistrer"}
          </span>
        </button>

        <div className="relative flex flex-col items-center">
          <button
            onClick={onShare}
            aria-label="Partager"
            className="flex flex-col items-center gap-1 transition-transform active:scale-90"
          >
            <Share2 className="size-9 text-foreground" strokeWidth={1.8} />
            <span className="text-xs font-semibold text-foreground text-shadow-soft">
              Partager
            </span>
          </button>
        </div>
      </div>

      {/* Caption */}
      <div className="absolute bottom-44 left-4 z-10 max-w-[70%] space-y-2">
        <p className="text-base font-bold text-foreground text-shadow-soft">@{video.username}</p>
        <p className="text-sm text-foreground/90 text-shadow-soft">{video.description}</p>
        <p className="flex items-center gap-2 text-xs text-foreground/80 text-shadow-soft">
          <Music2 className="size-3.5" /> Son original — {video.username}
        </p>
      </div>

      <CommentsSheet videoId={video.id} open={commentsOpen} onOpenChange={setCommentsOpen} />
      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} url={shareUrl} text={shareText} />
    </section>
  );
}
