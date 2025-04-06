import type { Metadata } from "next";
import { DM_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/providers";
// import { SandpackCSS } from "@/components/custom/sandpackcss";

export const metadata: Metadata = {
  title: "Proxy",
  description: "One stop solution for building full stack web apps",
};

const font = DM_Sans({
  weight: "400",
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head> <SandpackCSS /></head> */}
      <body
        className={`${font.className} overflow-hidden`}
      >
        <Provider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange>
          {children}
        </Provider>
      </body>
    </html>
  );
}
