import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/providers";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata()

const font = DM_Sans({
  weight: "400",
  subsets: ['latin'],
  variable: "--font-dm-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} ${font.variable} overflow-hidden antialiased`}>
        <Script
          defer
          src="https://dashboard-sigma-akb.vercel.app/script.js"
          data-project-id="proxy"
          data-session-replay="true"
          data-replay-sample-rate="0.50"
          data-replay-mask-level="strict"
        ></Script>
        <Provider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </Provider>
      </body>
    </html>
  );
}
