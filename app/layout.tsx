import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loan CRM — Maple X Business Funding",
  description: "Loan application management for Maple X Business Funding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.65), rgba(255,255,255,0.65)), url('/bg.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>{children}</body>
    </html>
  );
}
