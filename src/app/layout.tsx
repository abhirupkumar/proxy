import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/providers";

export const metadata: Metadata = {
  title: "Proxy",
  description: "One stop solution for building full stack web apps",
};

const font = Roboto_Mono({
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
