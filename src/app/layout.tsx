import type { Metadata } from "next";
import { Geist, Geist_Mono, Nova_Square, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import Header from "@/components/custom/header";
import Layout from "@/components/custom/layout";

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
        className={``}
      >
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
