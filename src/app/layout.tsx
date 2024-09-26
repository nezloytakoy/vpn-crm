import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import styles from "./page.module.css"


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
