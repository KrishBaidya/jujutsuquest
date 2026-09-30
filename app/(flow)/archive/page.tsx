import { Camera } from "lucide-react";
import { Action, Kanji, PageHeader } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { ArchivePrint } from "@/components/archive/archive-print";
import { getCurrentUser } from "@/lib/session";
import { listArchivePosts } from "@/lib/queries/archive";

export const metadata = { title: "Cursed Archive" };

export default async function ArchivePage() {
  const user = await getCurrentUser();
  const posts = await listArchivePosts(user?.id ?? null);

  return (
    <Page className="flex flex-col gap-5 pb-24 lg:pb-12">
      <PageHeader kanji="録" title="Cursed Archive" subtitle="Campus, seen through ink" />
      <div className="px-5 lg:px-0">
        <Action href="/archive/new" size="md" className="w-full lg:w-auto lg:px-8">
          <Camera className="size-5" /> Share a photo
        </Action>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
          <Kanji className="text-6xl text-cursed-300">空</Kanji>
          <p className="font-display text-xl font-extrabold">The archive is empty</p>
          <p className="max-w-[320px] text-[15px] leading-[1.6] text-mist-300">
            Take a photo somewhere on campus and it will be inked into the archive.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 px-5 min-[560px]:grid-cols-2 lg:grid-cols-3 lg:gap-6 lg:px-0">
          {posts.map((p, i) => (
            <li key={p.id}>
              <ArchivePrint post={p} index={i} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
