import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Plus,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { formatCount } from "@/lib/feed-data";
import type { FeedVideo } from "@/lib/videos.functions";
import { toggleVideoLike } from "@/lib/videos.functions";
import { CommentsSheet } from "@/components/CommentsSheet";
import { setMuted, useMuted } from "@/lib/mute-store";
import { playPop } from "@/lib/pop-sound";

export function VideoCard({ video }: { video: FeedVideo }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes_count);
  const [paused, setPaused] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const muted = useMuted();
  const like = useServerFn(toggleVideoLike);

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
          v.play().catch(() => undefined);
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

  const toggleMute = () => {
    const v = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (v) {
      v.muted = next;
      if (!next) v.play().catch(() => undefined);
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

  const onShare = async () => {
    playPop();
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/?v=${video.id}` : "";
    const shareData = {
      title: "ClipClap",
      text: video.description
        ? `${video.description} — @${video.username} sur ClipClap`
        : `Regarde cette vidéo de @${video.username} sur ClipClap`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(`${shareData.text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* partage annulé */
    }
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
        muted={muted}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <button
        onClick={toggleMute}
        aria-pressed={!muted}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        className="absolute bottom-28 left-4 z-30 flex size-11 items-center justify-center rounded-full bg-background/50 backdrop-blur-sm transition-transform active:scale-90"
      >
        {muted ? (
          <VolumeX className="size-5 text-foreground" />
        ) : (
          <Volume2 className="size-5 text-foreground" />
        )}
      </button>


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
        {video.profile_pic && (
          <div className="relative">
            <img
              src={video.profile_pic}
              alt={`Photo de profil de ${video.username}`}
              className="size-12 rounded-full border-2 border-foreground/90 bg-card object-cover"
              loading="lazy"
            />
            <button
              onClick={() => setFollowing((f) => !f)}
              aria-pressed={following}
              aria-label={following ? "Se désabonner" : "S'abonner"}
              className="absolute -bottom-2 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary transition-transform active:scale-90"
            >
              <Plus
                className={`size-4 text-primary-foreground transition-transform ${following ? "rotate-45" : ""}`}
                strokeWidth={3}
              />
            </button>
          </div>
        )}

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
          {copied && (
            <span
              role="status"
              className="absolute right-full top-1 mr-2 whitespace-nowrap rounded-full bg-card px-3 py-1 text-xs font-semibold text-card-foreground shadow-glow"
            >
              Lien copié
            </span>
          )}
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
    </section>
  );
}
