"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleArchiveLike } from "@/lib/actions/archive";
import { Reveal } from "@/components/app/reveal";
import { cn } from "@/lib/utils";
import type { ArchivePostView } from "@/lib/queries/archive";

/** One washi-paper print in the gallery grid, with an optimistic like toggle. */
export function ArchivePrint({ post, index }: { post: ArchivePostView; index: number }) {
  const [server, setServer] = useState({ liked: post.liked, likes: post.likes });
  const [view, setOptimistic] = useOptimistic(server, (cur) => ({
    liked: !cur.liked,
    likes: cur.likes + (cur.liked ? -1 : 1),
  }));
  const [, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle() {
    setError(false);
    startTransition(async () => {
      setOptimistic(undefined);
      const res = await toggleArchiveLike(post.id);
      if (res.ok) setServer(res.data);
      else setError(true);
    });
  }

  return (
    <Reveal index={index % 6}>
      <figure className="flex flex-col gap-2.5 rounded-md bg-washi-100 p-2.5 pb-3 text-sumi-900 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)]">
        {/* Signed storage URL; next/image would need a remote pattern for a rotating host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={post.caption || `Campus photo by ${post.author}`}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-[3px] bg-sumi-900 object-cover"
        />
        <figcaption className="flex flex-col gap-1 px-0.5">
          {post.caption && <p className="text-[14px] leading-snug">{post.caption}</p>}
          <div className="flex items-end justify-between gap-2">
            <p className="min-w-0 text-[12px] leading-tight text-sumi-600">
              <span className="font-bold text-sumi-900">{post.author}</span>
              {post.location && <span> &middot; {post.location}</span>}
            </p>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={view.liked}
              aria-label={view.liked ? "Remove like" : "Like this photo"}
              className={cn(
                "-mb-1 -mr-1 flex h-9 min-w-11 flex-none items-center justify-center gap-1 rounded-full px-2 text-[13px] font-bold transition-transform active:scale-90",
                view.liked ? "text-seal-600" : "text-sumi-600 hover:text-sumi-900",
              )}
            >
              <Heart className="size-[18px]" fill={view.liked ? "currentColor" : "none"} />
              <span className="tabular-nums">{view.likes}</span>
            </button>
          </div>
          {error && <p className="text-[12px] text-seal-600">Could not save your like.</p>}
        </figcaption>
      </figure>
    </Reveal>
  );
}
