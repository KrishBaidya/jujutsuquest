import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, JetBrains_Mono, Yuji_Syuku, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const dela = Dela_Gothic_One({ weight: "400", subsets: ["latin"], preload: false, variable: "--font-dela" });
const yuji = Yuji_Syuku({ weight: "400", subsets: ["latin"], preload: false, variable: "--font-yuji" });
const zen = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], preload: false, variable: "--font-zen" });
const jet = JetBrains_Mono({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-jet" });

export const metadata: Metadata = {
  title: { default: "呪 Cursed Mission Board", template: "%s · 呪 Cursed Mission Board" },
  description: "Jujutsu High, Chandigarh branch. Exorcise campus curses, climb the grades.",
};

export const viewport: Viewport = {
  themeColor: "#060608",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("antialiased", dela.variable, yuji.variable, zen.variable, jet.variable)}>
      <body>
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            {/* Rough ink edge for seals and brush shapes. */}
            <filter id="rough">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="2.2" />
            </filter>
            {/* Wobbling cursed flame for auras. */}
            <filter id="curse">
              <feTurbulence type="turbulence" baseFrequency="0.02 0.06" numOctaves="2" seed="3">
                <animate attributeName="seed" values="1;9;3;7;1" dur="3s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" scale="12" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
