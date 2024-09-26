import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "../components/Navigation/Navigation";

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
  title: "VPN service",
  description: "Made by https://t.me/gn0blin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} overflow-hidden`}>
        <div className="min-h-screen bg-gray-0 flex flex-col justify-between relative">
          <main className="flex-grow mb-[80px]">{children}</main>
          <Navigation />
        </div>
      </body>
    </html>
  );
}
