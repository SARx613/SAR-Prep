import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import PWAProvider from "@/components/PWAProvider";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SAR Prep — GRE preparation", template: "%s · SAR Prep" },
  description: "Free GRE preparation: official-syllabus lessons and practice questions in the real test formats.",
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
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b0f1a" }, { media: "(prefers-color-scheme: light)", color: "#f5f6fa" }],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply a saved theme before first paint so there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('sar-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
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
