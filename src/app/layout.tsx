import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        <header className="bg-white border-b border-gray-200">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-purple-600">
              🎨 Pixel Market
            </a>
            <div className="flex items-center gap-4">
              <a href="/market" className="text-gray-600 hover:text-gray-900">
                마켓
              </a>
              <a href="/sell" className="text-gray-600 hover:text-gray-900">
                판매하기
              </a>
              <a href="/my-gallery" className="text-gray-600 hover:text-gray-900">
                내 갤러리
              </a>
              <div id="auth-buttons" className="flex items-center gap-2">
                {/* 클라이언트에서 렌더링 */}
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
          Pixel Market © 2026
        </footer>
      </body>
    </html>
  );
}
