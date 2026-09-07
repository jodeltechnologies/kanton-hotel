import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanton Hotel V.I.P — Kumba",
  description:
    "Reserve a room and your meals at Kanton Hotel V.I.P, Krammer Avenue, Kumba. Free unlimited internet and a smart TV in every room.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;500;600;700&family=Karla:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
