import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanton Hotel V.I.P — Home out of Home",
  description:
    "Reserve a room and your meals at Kanton Hotel V.I.P, Krammer Avenue, Kumba. Free unlimited internet and a smart TV in every room.",
  // src/app/icon.png and src/app/apple-icon.png are picked up automatically;
  // these entries make the tab icon explicit for older browsers too.
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  openGraph: {
    title: "Kanton Hotel V.I.P — Home out of Home",
    description: "Rooms, meals and Mobile Money booking on Krammer Avenue, Kumba.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#A80F22" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1826" },
  ],
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
