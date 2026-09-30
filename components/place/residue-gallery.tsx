"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleResidueLike } from "@/lib/actions/residue";
import type { ResidueView } from "@/lib/queries/residue";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

/** Masonry of photos left at a place, with likes and a lightbox. */
export function ResidueGallery({ placeId, posts: initial }: { placeId: string; posts: ResidueView[] }) {
  const [posts, setPosts] = useState(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [, start] = useTransition();

  const like = (id: string) => {
    // Optimistic, then settle on the server's count.
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)));
    start(async () => {
      const res = await toggleResidueLike(id);
      if (res.ok) setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, ...res.data } : p)));
    });
  };

  if (posts.length === 0) {
    return (
      <Link
        href={`/places/${placeId}/residue`}
        className="group flex flex-col items-center gap-3 border border-dashed border-blood/50 bg-blood/5 px-6 py-12 text-center transition-colors hover:bg-blood/10"
      >
        <span className="flex size-14 items-center justify-center rounded-full border border-blood text-blood transition-transform group-hover:scale-110">
          <Camera className="size-6" aria-hidden />
        </span>
        <span className="font-display text-[16px]">No residue yet</span>
        <span className="max-w-xs text-[13px] text-fg-muted">Be the first to leave a photo of this place.</span>
      </Link>
    );
  }

  return (
    <>
      <div className="columns-2 gap-2.5 sm:columns-3 [&>*]:mb-2.5">
        <Link
          href={`/places/${placeId}/residue`}
          className="group flex aspect-[4/5] break-inside-avoid flex-col items-center justify-center gap-2 border border-dashed border-blood/60 bg-blood/5 text-blood transition-colors hover:bg-blood/15"
        >
          <Camera className="size-7 transition-transform group-hover:scale-110" aria-hidden />
          <span className="font-display text-[13px] tracking-wide">Add yours</span>
        </Link>
        {posts.map((p, i) => (
          <figure key={p.id} className="rise group relative break-inside-avoid overflow-hidden bg-ink-800" style={{ ["--i" as string]: i }}>
            <button type="button" onClick={() => setOpen(i)} className="block w-full" aria-label={`Open photo by ${p.author}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- signed bucket URLs */}
              <img src={p.imageUrl} alt={p.caption || `Photo by ${p.author}`} loading="lazy" className="w-full transition-transform duration-700 group-hover:scale-105" />
            </button>
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 via-void/50 to-transparent p-2.5 pt-8">
              {p.caption && <p className="line-clamp-2 text-[12px] leading-snug">{p.caption}</p>}
              <p className="mt-1 flex items-center justify-between text-[11px] text-fg-muted">
                <span className="truncate">{p.author}</span>
                <span className="font-mono">{ago(p.createdAt)}</span>
              </p>
            </figcaption>
            <LikeButton post={p} onLike={like} className="absolute right-1.5 top-1.5" />
          </figure>
        ))}
      </div>

      {open !== null && posts[open] && (
        <Lightbox
          post={posts[open]}
          onClose={() => setOpen(null)}
          onPrev={open > 0 ? () => setOpen(open - 1) : undefined}
          onNext={open < posts.length - 1 ? () => setOpen(open + 1) : undefined}
          onLike={like}
        />
      )}
    </>
  );
}

function LikeButton({ post, onLike, className }: { post: ResidueView; onLike: (id: string) => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onLike(post.id)}
      aria-pressed={post.liked}
      aria-label={post.liked ? "Unlike" : "Like"}
      className={cn(
        "flex h-8 items-center gap-1 bg-void/70 px-2 text-[12px] font-bold backdrop-blur transition-colors",
        post.liked ? "text-blood-bright" : "text-fg hover:text-blood-bright",
        className,
      )}
    >
      <Heart className={cn("size-4", post.liked && "fill-current")} aria-hidden />
      {post.likes > 0 && post.likes}
    </button>
  );
}

function Lightbox({
  post,
  onClose,
  onPrev,
  onNext,
  onLike,
}: {
  post: ResidueView;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onLike: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      className="m-auto max-h-dvh max-w-[min(960px,100vw)] bg-transparent p-3 text-fg backdrop:bg-void/90 backdrop:backdrop-blur-sm"
    >
      <div className="relative flex flex-col bg-ink-900">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed bucket URLs */}
        <img src={post.imageUrl} alt={post.caption || `Photo by ${post.author}`} className="max-h-[75dvh] w-full object-contain" />
        <div className="flex items-center gap-3 border-t border-ink-600 p-3.5">
          <div className="min-w-0 flex-1">
            {post.caption && <p className="text-[15px]">{post.caption}</p>}
            <p className="text-[12px] text-fg-muted">
              {post.author} · <span className="font-mono">{post.authorUid}</span> · {ago(post.createdAt)}
            </p>
          </div>
          <LikeButton post={post} onLike={onLike} />
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="absolute right-2 top-2 flex size-10 items-center justify-center bg-void/70 backdrop-blur hover:bg-void"
        >
          <X className="size-5" />
        </button>
        {onPrev && (
          <button type="button" onClick={onPrev} aria-label="Previous photo" className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-void/70 backdrop-blur">
            <ChevronLeft className="size-5" />
          </button>
        )}
        {onNext && (
          <button type="button" onClick={onNext} aria-label="Next photo" className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-void/70 backdrop-blur">
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </dialog>
  );
}
