import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lingeria.fasheone.com"),
  title: { default: "Lingeria by Fasheone - AI Moda Stüdyosu", template: "%s · Lingeria" },
  description: "Fiziksel numunaları e-ticaret görsellerine dönüştüren AI destekli moda stüdyosu",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lingeria by Fasheone - AI Moda Stüdyosu",
    description: "Fiziksel numunaları e-ticaret görsellerine dönüştüren AI destekli moda stüdyosu",
    url: "/",
    siteName: "Lingeria by Fasheone",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/favicon.ico", alt: "Lingeria by Fasheone" }],
  },
  twitter: { card: "summary_large_image", title: "Lingeria by Fasheone", description: "AI destekli moda görsel stüdyosu" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        {children}
      </body>
    </html>
  );
}
