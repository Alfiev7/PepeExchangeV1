import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pepe Exchange",
  description: "A simple cryptocurrency trading simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="icons/StocksPepe.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
