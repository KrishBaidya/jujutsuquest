import type { Metadata } from "next";
import Image from "next/image";
import { listHostels } from "@/lib/queries/session";
import { EnrolForm } from "@/components/onboarding/enrol-form";

export const metadata: Metadata = { title: "Enrol" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const hostels = await listHostels();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Art side */}
      <section className="relative isolate flex min-h-[46dvh] flex-col justify-end overflow-hidden px-6 pb-8 pt-16 lg:min-h-dvh lg:px-14 lg:pb-14">
        <Image
          src="/locations/fountain-plaza.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/60 to-void/10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_20%,transparent,rgb(6_6_8/0.7))]" />

        <p
          aria-hidden
          className="kanji absolute right-4 top-6 text-[50px] leading-[1.02] text-bone/90 [writing-mode:vertical-rl] [text-shadow:0_0_30px_rgb(215_38_46/0.6)] lg:right-12 lg:top-12 lg:text-[104px]"
        >
          呪術高専
        </p>

        <p className="kicker mb-3 text-fg-muted">Chandigarh University · Branch campus</p>
        <h1 className="max-w-[12ch] font-display text-[44px] leading-[0.92] tracking-tight lg:text-[76px]">
          Cursed Mission Board
        </h1>
        <p className="mt-4 max-w-md text-[15px] text-fg-muted lg:text-[17px]">
          Curses gather where students do. Take missions across campus, exorcise them on site and rise from{" "}
          <span className="kanji text-grade-4">四級</span> to <span className="kanji text-grade-special">特級</span>.
        </p>
      </section>

      {/* Form side */}
      <section className="relative flex items-center justify-center px-5 py-10 lg:px-14">
        <EnrolForm hostels={hostels} />
      </section>
    </div>
  );
}
