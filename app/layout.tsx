import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Il-Quran bil-Malti",
  description: "Aqra l-Quran bil-Malti f'qarrej nadif u sempliċi.",
  metadataBase: new URL("https://maltiquran.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mt">
      <body>{children}</body>
    </html>
  );
}
