"use client";
// PAGE LAYOUT

import { PropsWithChildren } from "react";
import dynamic from "next/dynamic";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/utils/cn";
import "@/styles/globals.css";
import { NaviWrapper } from "@/components/NaviAssistant";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => mod.Analytics),
  { ssr: false }
);

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat-alternates",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans antialiased",
          montserrat.variable,
          montserratAlternates.variable
        )}
      >
        <div className="">
          <main className="">
            <div className="">
              <NaviWrapper>
                {children}
                {/* <ScreenLocationOverlay /> */}
              </NaviWrapper>
            </div>
          </main>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
