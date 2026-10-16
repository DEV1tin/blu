import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

import { AppProviders } from "../components/AppProviders";

export const viewport: Viewport = {
  themeColor: "#121826",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Blu.",
  description: "Acompanhamento Psiquiátrico Amigável",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blu",
  },
  icons: {
    icon: "/mascote.jpg",
    apple: "/mascote.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${nunito.variable} h-full antialiased bg-background text-foreground`}
    >
      <body className="min-h-full flex flex-col items-center">
        <div className="w-full max-w-md bg-surface min-h-screen shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col font-inter">
          <AppProviders>
            {children}
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
