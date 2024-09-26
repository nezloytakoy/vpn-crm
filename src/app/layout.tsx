import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import styles from "./page.module.css"
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
      <body className={styles.mybody}>
        <main>{children}</main>
      </body>
    </html>
  );
}
