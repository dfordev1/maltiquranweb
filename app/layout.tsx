import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Il-Quran bil-Malti",
  description: "A clean Maltese Quran reader with real surah pages and classic minimal UI.",
  metadataBase: new URL("https://maltiquran.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
