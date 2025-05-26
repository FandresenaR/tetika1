import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
  title: "Tetika - Interface IA Futuriste",
  description: "Interface de chat IA futuriste et sécurisée avec OpenRouter, NotDiamond et SERPAPI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <header className="border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <span className="text-cyan-500 font-bold text-xl">Tetika</span>
                  </div>
                  <nav className="hidden md:ml-6 md:flex md:space-x-4">
                    <a href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white">
                      Chat IA
                    </a>
                    <a href="/web-scraper" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Web Scraper
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
