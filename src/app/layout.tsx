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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <Providers>
          <NavBar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
            {children}
          </main>
          <footer className="text-center text-xs text-gray-400 py-4 border-t">
            データ出典:{" "}
            <a
              href="https://gbf.wiki/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Granblue Fantasy Wiki
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
