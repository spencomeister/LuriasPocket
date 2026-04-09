import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "GBF Checker – グラブル所持チェッカー",
  description: "グランブルーファンタジーのキャラクター・召喚石・武器の所持チェッカー",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0b0f1a] text-gray-100 font-sans">
        {/* subtle radial glow background */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_60%)]" />
        <Providers>
          <NavBar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
            {children}
          </main>
          <footer className="text-center text-xs text-gray-500 py-4 border-t border-white/5">
            データ出典:{" "}
            <a
              href="https://gbf.wiki/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-300 transition-colors"
            >
              Granblue Fantasy Wiki
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
