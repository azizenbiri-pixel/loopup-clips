import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Music2, Play } from "lucide-react";
import { formatCount, type VideoItem } from "@/lib/feed-data";
import { CommentsSheet } from "@/components/CommentsSheet";

export function VideoCard({ video }: { video: VideoItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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
      v.play().catch(() => undefined);
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const likeCount = video.likes + (liked ? 1 : 0);

  return (
    <section
      ref={containerRef}
      className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        src={video.src}
        loop
        muted
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
        <img
          src={video.avatar}
          alt={`Photo de profil de ${video.author}`}
          className="size-12 rounded-full border-2 border-foreground/90 bg-card object-cover"
          loading="lazy"
        />

        <button
          onClick={() => setLiked((l) => !l)}
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
          onClick={() => setCommentsOpen(true)}
          aria-label="Commentaires"
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <MessageCircle className="size-9 text-foreground" strokeWidth={1.8} />
          <span className="text-xs font-semibold text-foreground text-shadow-soft">
            {formatCount(video.comments.length)}
          </span>
        </button>
      </div>

      {/* Caption */}
      <div className="absolute bottom-28 left-4 z-10 max-w-[70%] space-y-2">
        <p className="text-base font-bold text-foreground text-shadow-soft">@{video.author}</p>
        <p className="text-sm text-foreground/90 text-shadow-soft">{video.caption}</p>
        <p className="flex items-center gap-2 text-xs text-foreground/80 text-shadow-soft">
          <Music2 className="size-3.5" /> Son original — {video.author}
        </p>
      </div>

      <CommentsSheet video={video} open={commentsOpen} onOpenChange={setCommentsOpen} />
    </section>
  );
}
