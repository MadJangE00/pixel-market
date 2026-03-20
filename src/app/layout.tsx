import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pixel Market - 이미지 마켓",
  description: "포인트로 그림을 사고파는 마켓 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
          Pixel Market © 2026
        </footer>
      </body>
    </html>
  );
}
