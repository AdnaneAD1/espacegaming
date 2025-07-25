import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import NotificationPermission from "@/components/NotificationPermission";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tournoi COD Mobile - Espace Gaming CODM",
  description: "Tournoi Call of Duty Mobile Battle Royale Squad organisé par Espace Gaming CODM. Récompense de 4000 CP par joueur gagnant.",
  keywords: "Call of Duty Mobile, tournoi, Battle Royale, CODM, gaming, esport",
  authors: [{ name: "Espace Gaming CODM" }],
  openGraph: {
    title: "Tournoi COD Mobile - Espace Gaming CODM",
    description: "Tournoi Call of Duty Mobile Battle Royale Squad avec 4000 CP de récompense par joueur",
    type: "website",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script async src="https://www.tiktok.com/embed.js"></script>
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-900 text-white min-h-screen`}>
        {children}
        <NotificationPermission />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
          }}
        />
      </body>
    </html>
  );
}
