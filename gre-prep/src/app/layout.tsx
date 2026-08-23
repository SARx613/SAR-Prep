import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import PWAProvider from "@/components/PWAProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAR Prep — Vocabulary Builder",
  description: "Learn 1000 GRE vocabulary words with spaced repetition. Multiple choice, typing, and flashcard modes.",
  applicationName: "SAR Prep",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SAR Prep",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#080b14",
  // Paint under the notch when installed; block pinch-zoom jitter on answer taps
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SessionProvider>
          <PWAProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
