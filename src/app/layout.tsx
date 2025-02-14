import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryClientLayout from "@/layouts/QueryClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextJS/React Sandbox",
  description: "the lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientLayout>
          <main className="max-w-3xl mx-auto mt-16 pl-4 pr-4 font-[family-name:var(--font-geist-sans)]">
            {children}
          </main>
          <ReactQueryDevtools />
        </QueryClientLayout>
      </body>
    </html>
  );
}
