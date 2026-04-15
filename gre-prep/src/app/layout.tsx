import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRE Mastery — Vocabulary Builder",
  description: "Learn 1000 GRE vocabulary words with spaced repetition. Multiple choice, typing, and flashcard modes.",
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
      <body>{children}</body>
    </html>
  );
}
