import type { Metadata } from "next";
import "./globals.css";
import styles from "./page.module.css"
import Script from 'next/script';


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
      <head>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      </head>
      <body className={styles.mybody}>
        <main>{children}</main>
      </body>
    </html>
  );
}
