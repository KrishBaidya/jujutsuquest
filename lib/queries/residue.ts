import "server-only";
import { sql } from "@/lib/db";
import { photoUrl } from "@/lib/storage";

export type ResidueView = {
  id: string;
  imageUrl: string;
  caption: string;
  author: string;
  authorUid: string;
  mine: boolean;
  likes: number;
  liked: boolean;
  createdAt: string;
};

export type ResidueThumb = { locationId: string; count: number; covers: string[] };

/** Visible photos at one location, newest first. */
export async function listResidue(locationId: string, viewerId: string | null, limit = 60): Promise<ResidueView[]> {
  const rows = await sql`
    select p.id, p.image_key, p.caption, p.created_at, p.user_id, u.name as author, u.uid as author_uid,
           (select count(*)::int from archive_likes k where k.post_id = p.id) as likes,
           exists (
             select 1 from archive_likes k where k.post_id = p.id and k.user_id = ${viewerId}::uuid
           ) as liked
      from archive_posts p
      join users u on u.id = p.user_id
     where p.status = 'visible' and p.location_id = ${locationId}
     order by p.created_at desc
     limit ${limit}`;

  return Promise.all(
    rows.map(async (r) => ({
      id: r.id as string,
      imageUrl: await photoUrl(r.image_key as string),
      caption: r.caption as string,
      author: r.author as string,
      authorUid: r.author_uid as string,
      mine: r.user_id === viewerId,
      likes: r.likes as number,
      liked: r.liked as boolean,
      createdAt: new Date(r.created_at as string).toISOString(),
    })),
  );
}

/** Photo count and the newest few thumbnails per location, for the map. */
export async function residueByLocation(perLocation = 4): Promise<Record<string, ResidueThumb>> {
  const rows = await sql`
    select location_id, total, keys from (
      select location_id, count(*)::int as total,
             (array_agg(image_key order by created_at desc))[1:${perLocation}] as keys
        from archive_posts
       where status = 'visible' and location_id is not null
       group by location_id
    ) t`;
  const out: Record<string, ResidueThumb> = {};
  await Promise.all(
    rows.map(async (r) => {
      const keys = (r.keys as string[]) ?? [];
      out[r.location_id as string] = {
        locationId: r.location_id as string,
        count: r.total as number,
        covers: await Promise.all(keys.map((k) => photoUrl(k))),
      };
    }),
  );
  return out;
}

/** How many photos a student has left, across all locations. */
export async function residueCount(userId: string): Promise<number> {
  const [row] = await sql`select count(*)::int as n from archive_posts where user_id = ${userId} and status = 'visible'`;
  return (row?.n as number) ?? 0;
}
