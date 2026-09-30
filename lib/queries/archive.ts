import "server-only";
import { asc } from "drizzle-orm";
import { db, sql } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { photoUrl } from "@/lib/storage";

export type ArchivePostView = {
  id: string;
  imageUrl: string;
  caption: string;
  author: string;
  location: string | null;
  likes: number;
  liked: boolean;
};

const PAGE_SIZE = 60;

/** Visible posts, newest first, with like counts and whether the viewer liked each. */
export async function listArchivePosts(viewerId: string | null): Promise<ArchivePostView[]> {
  const rows = await sql`
    select p.id, p.image_key, p.caption, u.name as author, l.name as location,
           (select count(*)::int from archive_likes k where k.post_id = p.id) as likes,
           exists (
             select 1 from archive_likes k
              where k.post_id = p.id and k.user_id = ${viewerId}::uuid
           ) as liked
      from archive_posts p
      join users u on u.id = p.user_id
      left join locations l on l.id = p.location_id
     where p.status = 'visible'
     order by p.created_at desc
     limit ${PAGE_SIZE}`;

  return Promise.all(
    rows.map(async (r) => ({
      id: r.id as string,
      imageUrl: await photoUrl(r.image_key as string),
      caption: r.caption as string,
      author: r.author as string,
      location: (r.location as string | null) ?? null,
      likes: r.likes as number,
      liked: r.liked as boolean,
    })),
  );
}

/** Id and name only: the server-only location columns must not reach the form. */
export function listLocationOptions() {
  return db.select({ id: locations.id, name: locations.name }).from(locations).orderBy(asc(locations.name));
}
