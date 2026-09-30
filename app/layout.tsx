import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const shippori = Shippori_Mincho({
  weight: ["500", "800"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-shippori",
});

const zen = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-zen",
});

export const metadata: Metadata = {
  title: "Cursed Mission Board",
  description: "Campus quests, rank and profile.",
};

export const viewport: Viewport = {
  themeColor: "#110D22",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased", shippori.variable, zen.variable)}>
      <body className="min-h-full">
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <filter id="brush">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="5" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
